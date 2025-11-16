'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { BasicInfo } from '@/types';

interface EditBasicInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  basicInfo: BasicInfo | null;
}

export default function EditBasicInfoModal({
  isOpen,
  onClose,
  onSuccess,
  basicInfo,
}: EditBasicInfoModalProps) {
  const [formData, setFormData] = useState({
    event_name: '',
    organiser: '',
    mentor: '',
    guide: '',
    event_date: '',
    style: {
      title_size: 'md',
      title_weight: 'bold',
      title_align: 'center',
      title_color: 'default',
    },
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (basicInfo) {
      const style = ((basicInfo.other_data as any) || {});
      setFormData({
        event_name: basicInfo.event_name || '',
        organiser: basicInfo.organiser || '',
        mentor: basicInfo.mentor || '',
        guide: basicInfo.guide || '',
        event_date: basicInfo.event_date || '',
        style: {
          title_size: style.title_size || 'md',
          title_weight: style.title_weight || 'bold',
          title_align: style.title_align || 'center',
          title_color: style.title_color || 'default',
        },
      });
    }
  }, [basicInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.event_name.trim()) {
      toast.error('Event name is required');
      return;
    }

    setIsLoading(true);

    try {
      if (basicInfo?.id) {
        const { error } = await supabase
          .from('basic_info')
          .update({
            event_name: formData.event_name.trim(),
            organiser: formData.organiser.trim() || null,
            mentor: formData.mentor.trim() || null,
            guide: formData.guide.trim() || null,
            event_date: formData.event_date || null,
            event_start_date: (formData as any).event_start_date || null,
            event_end_date: (formData as any).event_end_date || null,
            location: (formData as any).location?.trim() || null,
            other_data: {
              title_size: formData.style.title_size,
              title_weight: formData.style.title_weight,
              title_align: formData.style.title_align,
              title_color: formData.style.title_color,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', basicInfo.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('basic_info').insert({
          event_name: formData.event_name.trim(),
          organiser: formData.organiser.trim() || null,
          mentor: formData.mentor.trim() || null,
          guide: formData.guide.trim() || null,
          event_date: formData.event_date || null,
          event_start_date: (formData as any).event_start_date || null,
          event_end_date: (formData as any).event_end_date || null,
          location: (formData as any).location?.trim() || null,
          other_data: {
            title_size: formData.style.title_size,
            title_weight: formData.style.title_weight,
            title_align: formData.style.title_align,
            title_color: formData.style.title_color,
          },
        });

        if (error) throw error;
      }

      toast.success('Event information updated successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating basic info:', error);
      toast.error('Failed to update event information');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Edit Event Information</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event/Festival Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.event_name}
                onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
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
                value={(formData as any).location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value } as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={(formData as any).event_start_date || ''}
                  onChange={(e) => setFormData({ ...formData, event_start_date: e.target.value } as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={(formData as any).event_end_date || ''}
                  onChange={(e) => setFormData({ ...formData, event_end_date: e.target.value } as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title Size</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Title Weight</label>
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title Align</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Title Color</label>
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

          <div className="flex gap-3 mt-6">
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
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
