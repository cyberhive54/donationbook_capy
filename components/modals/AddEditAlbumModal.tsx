'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { Album } from '@/types';

interface AddEditAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  festivalId: string;
  initial?: Album | null;
}

export default function AddEditAlbumModal({ isOpen, onClose, onSuccess, festivalId, initial }: AddEditAlbumModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initial) {
        setTitle(initial.title || '');
        setDescription(initial.description || '');
        setYear(initial.year || '');
      } else {
        setTitle('');
        setDescription('');
        setYear('');
      }
    }
  }, [isOpen, initial]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setIsLoading(true);
    try {
      if (initial?.id) {
        const { error } = await supabase.from('albums').update({
          title: title.trim(),
          description: description.trim() || null,
          year: year === '' ? null : Number(year),
          updated_at: new Date().toISOString(),
        }).eq('id', initial.id);
        if (error) throw error;
        toast.success('Album updated');
      } else {
        const { error } = await supabase.from('albums').insert({
          festival_id: festivalId,
          title: title.trim(),
          description: description.trim() || null,
          year: year === '' ? null : Number(year),
        });
        if (error) throw error;
        toast.success('Album created');
      }
      onSuccess();
      onClose();
    } catch (e) {
      toast.error('Failed to save album');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">{initial ? 'Edit Album' : 'Add Album'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-lg" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <input type="number" value={year} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg">{isLoading ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
