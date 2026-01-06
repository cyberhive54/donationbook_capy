'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Collection } from '@/types';

interface CollectionForm {
  name: string;
  amount: string;
  group_name: string;
  mode: string;
  note: string;
  date: string;
  time_hour: string;
  time_minute: string;
}

interface AddCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  groups: string[];
  modes: string[];
  editData?: Collection | null;
  festivalId: string;
  festivalStartDate?: string;
  festivalEndDate?: string;
}

export default function AddCollectionModal({
  isOpen,
  onClose,
  onSuccess,
  groups,
  modes,
  editData,
  festivalId,
  festivalStartDate,
  festivalEndDate,
}: AddCollectionModalProps) {
  const today = new Date().toISOString().split('T')[0];
  
  const now = new Date();
  const currentHour = now.getHours().toString();
  const currentMinute = now.getMinutes().toString();
  
  const emptyForm: CollectionForm = {
    name: '',
    amount: '',
    group_name: groups[0] || '',
    mode: modes[0] || '',
    note: '',
    date: today,
    time_hour: currentHour,
    time_minute: currentMinute,
  };

  const [forms, setForms] = useState<CollectionForm[]>([emptyForm]);
  const [isLoading, setIsLoading] = useState(false);

  // Reset forms when modal opens or editData changes
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setForms([{
          name: editData.name,
          amount: editData.amount.toString(),
          group_name: editData.group_name,
          mode: editData.mode,
          note: editData.note || '',
          date: editData.date,
          time_hour: editData.time_hour?.toString() || '0',
          time_minute: editData.time_minute?.toString() || '0',
        }]);
      } else {
        setForms([emptyForm]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editData]);

  const addForm = () => {
    if (forms.length < 5) {
      setForms([...forms, { ...emptyForm }]);
    }
  };

  const removeForm = (index: number) => {
    if (forms.length > 1) {
      setForms(forms.filter((_, i) => i !== index));
    }
  };

  const updateForm = (index: number, field: keyof CollectionForm, value: string) => {
    const newForms = [...forms];
    newForms[index] = { ...newForms[index], [field]: value };
    setForms(newForms);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      if (!form.name.trim() || !form.amount || !form.group_name || !form.mode || !form.date) {
        toast.error(`Form ${i + 1}: Please fill all required fields`);
        return;
      }
      if (isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
        toast.error(`Form ${i + 1}: Please enter a valid amount`);
        return;
      }

      // Validate date is within festival range
      const formDate = new Date(form.date);
      if (festivalStartDate && formDate < new Date(festivalStartDate)) {
        toast.error(`Form ${i + 1}: Date cannot be before festival start date`);
        return;
      }
      if (festivalEndDate && formDate > new Date(festivalEndDate)) {
        toast.error(`Form ${i + 1}: Date cannot be after festival end date`);
        return;
      }
    }

    setIsLoading(true);

    try {
      if (editData) {
        const { error } = await supabase
          .from('collections')
          .update({
            name: forms[0].name.trim(),
            amount: Number(forms[0].amount),
            group_name: forms[0].group_name,
            mode: forms[0].mode,
            note: forms[0].note.trim() || null,
            date: forms[0].date,
          time_hour: parseInt(forms[0].time_hour) || 0,
          time_minute: parseInt(forms[0].time_minute) || 0,
          })
          .eq('id', editData.id);

        if (error) throw error;
        toast.success('Collection updated successfully');
      } else {
        const insertData = forms.map((form) => ({
          festival_id: festivalId,
          name: form.name.trim(),
          amount: Number(form.amount),
          group_name: form.group_name,
          mode: form.mode,
          note: form.note.trim() || null,
          date: form.date,
        }));

        const { error } = await supabase.from('collections').insert(insertData);

        if (error) throw error;
        toast.success('Collection(s) added successfully');
      }

      onSuccess();
      onClose();
      setForms([emptyForm]);
    } catch (error) {
      console.error('Error saving collection:', error);
      toast.error('Failed to save collection(s)');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            {editData ? 'Edit Collection' : 'Add Collection'}
          </h2>
          <div className="flex items-center gap-2">
            {!editData && forms.length < 5 && (
              <button
                onClick={addForm}
                className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add More
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[70vh] overflow-y-auto">
          {forms.map((form, index) => (
            <div
              key={index}
              className="mb-6 p-4 border border-gray-200 rounded-lg relative"
            >
              {forms.length > 1 && !editData && (
                <button
                  type="button"
                  onClick={() => removeForm(index)}
                  className="absolute top-2 right-2 p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <h3 className="font-semibold text-gray-700 mb-3">
                {forms.length > 1 ? `Collection ${index + 1}` : 'Collection Details'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateForm(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => updateForm(index, 'amount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.group_name}
                    onChange={(e) => updateForm(index, 'group_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {groups.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mode <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.mode}
                    onChange={(e) => updateForm(index, 'mode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {modes.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => updateForm(index, 'date', e.target.value)}
                    min={festivalStartDate || ''}
                    max={festivalEndDate || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hour <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={form.time_hour}
                    onChange={(e) => updateForm(index, 'time_hour', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minute <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={form.time_minute}
                    onChange={(e) => updateForm(index, 'time_minute', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note
                  </label>
                  <textarea
                    value={form.note}
                    onChange={(e) => updateForm(index, 'note', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ))}

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
