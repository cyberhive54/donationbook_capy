'use client';

import { X, AlertCircle, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Festival, OutOfRangeTransactions } from '@/types';

interface EditFestivalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  festival: Festival | null;
}

export default function EditFestivalModal({ isOpen, onClose, onSuccess, festival }: EditFestivalModalProps) {
  const [formData, setFormData] = useState({
    event_name: '',
    organiser: '',
    mentor: '',
    guide: '',
    location: '',
    event_start_date: '',
    event_end_date: '',
    ce_start_date: '',
    ce_end_date: '',
    requires_password: true,
    user_password: '',
    admin_password: '',
    super_admin_password: '',
    style: {
      title_size: 'md',
      title_weight: 'bold',
      title_align: 'center',
      title_color: 'default',
    },
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordWarning, setShowPasswordWarning] = useState(false);
  const [outOfRangeWarning, setOutOfRangeWarning] = useState<OutOfRangeTransactions | null>(null);
  const [checkingDateRange, setCheckingDateRange] = useState(false);

  useEffect(() => {
    if (festival) {
      const style = ((festival.other_data as any) || {});
      setFormData({
        event_name: festival.event_name || '',
        organiser: festival.organiser || '',
        mentor: festival.mentor || '',
        guide: festival.guide || '',
        location: festival.location || '',
        event_start_date: festival.event_start_date || '',
        event_end_date: festival.event_end_date || '',
        ce_start_date: festival.ce_start_date || '',
        ce_end_date: festival.ce_end_date || '',
        requires_password: festival.requires_password ?? true,
        user_password: festival.user_password || '',
        admin_password: festival.admin_password || '',
        super_admin_password: festival.super_admin_password || '',
        style: {
          title_size: style.title_size || 'md',
          title_weight: style.title_weight || 'bold',
          title_align: style.title_align || 'center',
          title_color: style.title_color || 'default',
        },
      });
    }
  }, [festival]);

  // Check for out-of-range transactions when CE dates change
  const checkOutOfRangeTransactions = async (ceStartDate: string, ceEndDate: string) => {
    if (!festival?.id || !ceStartDate || !ceEndDate) return;

    setCheckingDateRange(true);
    try {
      const { data, error } = await supabase.rpc('get_out_of_range_transactions', {
        p_festival_id: festival.id,
        p_new_ce_start_date: ceStartDate,
        p_new_ce_end_date: ceEndDate,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0];
        if (result.collections_out_of_range > 0 || result.expenses_out_of_range > 0) {
          setOutOfRangeWarning(result);
        } else {
          setOutOfRangeWarning(null);
        }
      }
    } catch (error) {
      console.error('Error checking date range:', error);
    } finally {
      setCheckingDateRange(false);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.event_name.trim()) {
      newErrors.event_name = 'Festival name is required';
    }

    if (!formData.ce_start_date) {
      newErrors.ce_start_date = 'Collection/Expense start date is required';
    }

    if (!formData.ce_end_date) {
      newErrors.ce_end_date = 'Collection/Expense end date is required';
    }

    // Date validations
    if (formData.ce_start_date && formData.ce_end_date) {
      const ceStart = new Date(formData.ce_start_date);
      const ceEnd = new Date(formData.ce_end_date);

      if (ceStart > ceEnd) {
        newErrors.ce_end_date = 'End date must be after start date';
      }

      // Festival dates validation (if provided)
      if (formData.event_start_date) {
        const eventStart = new Date(formData.event_start_date);
        if (eventStart < ceStart) {
          newErrors.event_start_date = 'Festival start date must be within Collection/Expense date range';
        }
      }

      if (formData.event_end_date) {
        const eventEnd = new Date(formData.event_end_date);
        if (eventEnd > ceEnd) {
          newErrors.event_end_date = 'Festival end date must be within Collection/Expense date range';
        }
      }

      if (formData.event_start_date && formData.event_end_date) {
        const eventStart = new Date(formData.event_start_date);
        const eventEnd = new Date(formData.event_end_date);
        if (eventStart > eventEnd) {
          newErrors.event_end_date = 'Festival end date must be after start date';
        }
      }
    }

    // Password validations (if requires_password is true)
    if (formData.requires_password) {
      if (!formData.user_password.trim()) {
        newErrors.user_password = 'User password is required';
      }
      if (!formData.admin_password.trim()) {
        newErrors.admin_password = 'Admin password is required';
      }
      if (!formData.super_admin_password.trim()) {
        newErrors.super_admin_password = 'Super Admin password is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle password checkbox change
  const handlePasswordToggle = (checked: boolean) => {
    if (!checked) {
      setShowPasswordWarning(true);
    } else {
      setFormData({ ...formData, requires_password: true });
      setShowPasswordWarning(false);
    }
  };

  // Handle "I Understand" button
  const handleUnderstandWarning = () => {
    setFormData({ ...formData, requires_password: false });
    setShowPasswordWarning(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    // Warn about out-of-range transactions
    if (outOfRangeWarning && (outOfRangeWarning.collections_out_of_range > 0 || outOfRangeWarning.expenses_out_of_range > 0)) {
      const confirmed = window.confirm(
        `Warning: ${outOfRangeWarning.collections_out_of_range} collection(s) and ${outOfRangeWarning.expenses_out_of_range} expense(s) will be outside the new date range. Do you want to continue?`
      );
      if (!confirmed) return;
    }

    setIsLoading(true);

    try {
      if (festival?.id) {
        const { error } = await supabase
          .from('festivals')
          .update({
            event_name: formData.event_name.trim(),
            organiser: formData.organiser.trim() || null,
            mentor: formData.mentor.trim() || null,
            guide: formData.guide.trim() || null,
            location: formData.location.trim() || null,
            event_start_date: formData.event_start_date || null,
            event_end_date: formData.event_end_date || null,
            ce_start_date: formData.ce_start_date,
            ce_end_date: formData.ce_end_date,
            requires_password: formData.requires_password,
            requires_user_password: formData.requires_password, // Legacy field
            user_password: formData.requires_password ? formData.user_password.trim() : null,
            admin_password: formData.requires_password ? formData.admin_password.trim() : null,
            super_admin_password: formData.requires_password ? formData.super_admin_password.trim() : null,
            other_data: {
              title_size: formData.style.title_size,
              title_weight: formData.style.title_weight,
              title_align: formData.style.title_align,
              title_color: formData.style.title_color,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', festival.id);

        if (error) throw error;
      }

      toast.success('Festival information updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating festival info:', error);
      toast.error(error.message || 'Failed to update festival information');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Edit Festival Information</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[75vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event/Festival Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.event_name}
                  onChange={(e) => {
                    setFormData({ ...formData, event_name: e.target.value });
                    if (errors.event_name) setErrors({ ...errors, event_name: '' });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.event_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.event_name && <p className="text-red-500 text-xs mt-1">{errors.event_name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organiser</label>
                  <input
                    type="text"
                    value={formData.organiser}
                    onChange={(e) => setFormData({ ...formData, organiser: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guide</label>
                  <input
                    type="text"
                    value={formData.guide}
                    onChange={(e) => setFormData({ ...formData, guide: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mentor</label>
                  <input
                    type="text"
                    value={formData.mentor}
                    onChange={(e) => setFormData({ ...formData, mentor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Collection/Expense Date Range */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Collection/Expense Date Range</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  This defines the valid date range for adding collections and expenses. All transactions must fall within this range.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.ce_start_date}
                    onChange={(e) => {
                      setFormData({ ...formData, ce_start_date: e.target.value });
                      if (errors.ce_start_date) setErrors({ ...errors, ce_start_date: '' });
                      if (e.target.value && formData.ce_end_date) {
                        checkOutOfRangeTransactions(e.target.value, formData.ce_end_date);
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.ce_start_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.ce_start_date && <p className="text-red-500 text-xs mt-1">{errors.ce_start_date}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.ce_end_date}
                    onChange={(e) => {
                      setFormData({ ...formData, ce_end_date: e.target.value });
                      if (errors.ce_end_date) setErrors({ ...errors, ce_end_date: '' });
                      if (formData.ce_start_date && e.target.value) {
                        checkOutOfRangeTransactions(formData.ce_start_date, e.target.value);
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.ce_end_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.ce_end_date && <p className="text-red-500 text-xs mt-1">{errors.ce_end_date}</p>}
                </div>
              </div>

              {checkingDateRange && (
                <p className="text-sm text-gray-600">Checking for out-of-range transactions...</p>
              )}

              {outOfRangeWarning && (outOfRangeWarning.collections_out_of_range > 0 || outOfRangeWarning.expenses_out_of_range > 0) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Warning: Transactions outside date range</p>
                    <ul className="list-disc list-inside space-y-1">
                      {outOfRangeWarning.collections_out_of_range > 0 && (
                        <li>{outOfRangeWarning.collections_out_of_range} collection(s) will be outside the new range</li>
                      )}
                      {outOfRangeWarning.expenses_out_of_range > 0 && (
                        <li>{outOfRangeWarning.expenses_out_of_range} expense(s) will be outside the new range</li>
                      )}
                    </ul>
                    <p className="mt-2">Date range: {outOfRangeWarning.earliest_collection_date || 'N/A'} to {outOfRangeWarning.latest_expense_date || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Festival Event Dates */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Festival Event Dates (Optional)</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-start gap-2">
                <Info className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  If provided, festival dates must be within the Collection/Expense date range above.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Festival Start Date</label>
                  <input
                    type="date"
                    value={formData.event_start_date}
                    onChange={(e) => {
                      setFormData({ ...formData, event_start_date: e.target.value });
                      if (errors.event_start_date) setErrors({ ...errors, event_start_date: '' });
                    }}
                    min={formData.ce_start_date}
                    max={formData.ce_end_date}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.event_start_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.event_start_date && <p className="text-red-500 text-xs mt-1">{errors.event_start_date}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Festival End Date</label>
                  <input
                    type="date"
                    value={formData.event_end_date}
                    onChange={(e) => {
                      setFormData({ ...formData, event_end_date: e.target.value });
                      if (errors.event_end_date) setErrors({ ...errors, event_end_date: '' });
                    }}
                    min={formData.ce_start_date}
                    max={formData.ce_end_date}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.event_end_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.event_end_date && <p className="text-red-500 text-xs mt-1">{errors.event_end_date}</p>}
                </div>
              </div>
            </div>

            {/* Password Protection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Password Protection</h3>
              
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.requires_password} 
                    onChange={(e) => handlePasswordToggle(e.target.checked)}
                    className="w-4 h-4"
                  />
                  Requires password to view pages
                </label>
              </div>

              {formData.requires_password && (
                <div className="space-y-4 pl-6 border-l-2 border-blue-500">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        User Password <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        value={formData.user_password}
                        onChange={(e) => {
                          setFormData({ ...formData, user_password: e.target.value });
                          if (errors.user_password) setErrors({ ...errors, user_password: '' });
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.user_password ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.user_password && <p className="text-red-500 text-xs mt-1">{errors.user_password}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Admin Password <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        value={formData.admin_password}
                        onChange={(e) => {
                          setFormData({ ...formData, admin_password: e.target.value });
                          if (errors.admin_password) setErrors({ ...errors, admin_password: '' });
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.admin_password ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.admin_password && <p className="text-red-500 text-xs mt-1">{errors.admin_password}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Super Admin Password <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text"
                        value={formData.super_admin_password}
                        onChange={(e) => {
                          setFormData({ ...formData, super_admin_password: e.target.value });
                          if (errors.super_admin_password) setErrors({ ...errors, super_admin_password: '' });
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.super_admin_password ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.super_admin_password && <p className="text-red-500 text-xs mt-1">{errors.super_admin_password}</p>}
                      <p className="text-xs text-gray-500 mt-1">For future advanced features</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Title Styling */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Title Styling</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                  <select
                    value={formData.style.title_size}
                    onChange={(e) => setFormData({ ...formData, style: { ...formData.style, title_size: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                  <select
                    value={formData.style.title_weight}
                    onChange={(e) => setFormData({ ...formData, style: { ...formData.style, title_weight: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="extrabold">Extra Bold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Align</label>
                  <select
                    value={formData.style.title_align}
                    onChange={(e) => setFormData({ ...formData, style: { ...formData.style, title_align: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <select
                    value={formData.style.title_color}
                    onChange={(e) => setFormData({ ...formData, style: { ...formData.style, title_color: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="default">Default</option>
                    <option value="blue">Blue</option>
                    <option value="indigo">Indigo</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Password Warning Modal */}
      {showPasswordWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-yellow-100 rounded-full p-2">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Warning: No Password Protection</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Anyone with the festival code can view festival data, and you can't view the visitors analytics.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> Without password protection, visitor tracking and analytics will not be available.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleUnderstandWarning}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
              >
                I Understand
              </button>
              <button
                onClick={() => {
                  setShowPasswordWarning(false);
                  setFormData({ ...formData, requires_password: true });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
