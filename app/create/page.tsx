'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

function genCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let c = '';
  for (let i = 0; i < 8; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

export default function CreateFestival() {
  const [form, setForm] = useState({
    event_name: '',
    organiser: '',
    mentor: '',
    guide: '',
    location: '',
    event_start_date: '',
    event_end_date: '',
    requires_user_password: true,
    user_password: 'Festive@123',
    admin_password: 'admin',
    theme_bg_color: '#f8fafc',
    theme_bg_image_url: '',
    theme_dark: false,
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.event_name.trim()) {
      toast.error('Event/Festival name is required');
      return;
    }
    setLoading(true);
    try {
      let code = genCode();
      // ensure unique
      for (let i = 0; i < 5; i++) {
        const { data } = await supabase.from('festivals').select('id').eq('code', code).maybeSingle();
        if (!data) break;
        code = genCode();
      }
      const { error } = await supabase.from('festivals').insert({
        code,
        event_name: form.event_name.trim(),
        organiser: form.organiser.trim() || null,
        mentor: form.mentor.trim() || null,
        guide: form.guide.trim() || null,
        location: form.location.trim() || null,
        event_start_date: form.event_start_date || null,
        event_end_date: form.event_end_date || null,
        requires_user_password: form.requires_user_password,
        user_password: form.requires_user_password ? form.user_password : null,
        admin_password: form.admin_password || 'admin',
        theme_bg_color: form.theme_bg_color || null,
        theme_bg_image_url: form.theme_bg_image_url || null,
        theme_dark: form.theme_dark,
        other_data: { title_size: 'md', title_weight: 'bold', title_align: 'center', title_color: 'default' },
      });
      if (error) throw error;
      toast.success('Festival created!');
      router.push(`/f/${code}`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to create festival');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-2xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Create a Festival</h1>
        <p className="text-sm text-gray-600 mb-6 text-center">Fill in the details below. A unique 8-letter code will be generated.</p>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Event/Festival Name *</label>
            <input className="w-full px-3 py-2 border rounded-lg" value={form.event_name} onChange={(e) => setForm({ ...form, event_name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organiser</label>
            <input className="w-full px-3 py-2 border rounded-lg" value={form.organiser} onChange={(e) => setForm({ ...form, organiser: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Guide</label>
            <input className="w-full px-3 py-2 border rounded-lg" value={form.guide} onChange={(e) => setForm({ ...form, guide: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mentor</label>
            <input className="w-full px-3 py-2 border rounded-lg" value={form.mentor} onChange={(e) => setForm({ ...form, mentor: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input className="w-full px-3 py-2 border rounded-lg" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" className="w-full px-3 py-2 border rounded-lg" value={form.event_start_date} onChange={(e) => setForm({ ...form, event_start_date: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" className="w-full px-3 py-2 border rounded-lg" value={form.event_end_date} onChange={(e) => setForm({ ...form, event_end_date: e.target.value })} />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <input type="checkbox" checked={form.requires_user_password} onChange={(e) => setForm({ ...form, requires_user_password: e.target.checked })} />
              Requires user password to view pages
            </label>
            {form.requires_user_password && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User Password</label>
                  <input className="w-full px-3 py-2 border rounded-lg" value={form.user_password} onChange={(e) => setForm({ ...form, user_password: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password</label>
                  <input className="w-full px-3 py-2 border rounded-lg" value={form.admin_password} onChange={(e) => setForm({ ...form, admin_password: e.target.value })} />
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
              <input type="color" className="w-full h-10 border rounded-lg" value={form.theme_bg_color} onChange={(e) => setForm({ ...form, theme_bg_color: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Background Image URL</label>
              <input className="w-full px-3 py-2 border rounded-lg" value={form.theme_bg_image_url} onChange={(e) => setForm({ ...form, theme_bg_image_url: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={form.theme_dark} onChange={(e) => setForm({ ...form, theme_dark: e.target.checked })} />
              Enable dark theme
            </label>
          </div>

          <div className="md:col-span-2 mt-4">
            <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400">
              {loading ? 'Creating…' : 'Create Festival'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
