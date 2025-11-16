'use client';

import PasswordGate from '@/components/PasswordGate';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Album, MediaItem } from '@/types';
import BottomNav from '@/components/BottomNav';

export default function ShowcasePage() {
  const params = useParams<{ code: string }>();
  const code = (params?.code as string) || '';

  const [albums, setAlbums] = useState<Album[]>([]);
  const [active, setActive] = useState<Album | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [filter, setFilter] = useState<'all'|'image'|'video'|'audio'|'pdf'|'other'>('all');

  useEffect(() => {
    const fetchAlbums = async () => {
      const { data: fest } = await supabase.from('festivals').select('id').eq('code', code).maybeSingle();
      if (!fest) return;
      const { data } = await supabase.from('albums').select('*').eq('festival_id', fest.id).order('year', { ascending: false });
      setAlbums((data as any) || []);
    };
    if (code) fetchAlbums();
  }, [code]);

  useEffect(() => {
    const fetchItems = async () => {
      if (!active) return;
      const { data } = await supabase.from('media_items').select('*').eq('album_id', active.id).order('created_at', { ascending: false });
      setItems((data as any) || []);
    };
    fetchItems();
  }, [active]);

  const filtered = useMemo(() => items.filter(i => filter === 'all' ? true : i.type === filter), [items, filter]);

  return (
    <PasswordGate code={code}>
      <div className="min-h-screen bg-gray-50 p-4 pb-24">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Showcase</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {albums.map(a => (
              <button key={a.id} onClick={() => setActive(a)} className={`border rounded-lg p-3 text-left ${active?.id === a.id ? 'border-blue-600' : 'border-gray-200'}`}>
                <div className="font-semibold text-gray-800 truncate">{a.title}</div>
                <div className="text-xs text-gray-500">{a.year || 'Year N/A'}</div>
                <div className="text-sm text-gray-600 mt-1 line-clamp-2">{a.description}</div>
              </button>
            ))}
          </div>

          {active ? (
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-lg font-semibold text-gray-900">{active.title}</div>
                  <div className="text-xs text-gray-500">{active.year || ''}</div>
                </div>
                <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="px-3 py-2 border rounded-lg">
                  <option value="all">All</option>
                  <option value="image">Images</option>
                  <option value="video">Videos</option>
                  <option value="audio">Audio</option>
                  <option value="pdf">PDF</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {filtered.map(item => (
                  <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="border rounded-lg overflow-hidden">
                    {item.type === 'image' ? (
                      <img src={item.url} alt={item.title || ''} className="w-full h-36 object-cover" />
                    ) : (
                      <div className="h-36 flex items-center justify-center bg-gray-100 text-sm text-gray-600">{item.type.toUpperCase()}</div>
                    )}
                    <div className="p-2 truncate text-sm" title={item.title || ''}>{item.title || ''}</div>
                  </a>
                ))}
                {filtered.length === 0 && (
                  <div className="text-sm text-gray-600">No media found for this filter.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-600">Select an album to view media.</div>
          )}
        </div>
        <BottomNav code={code} />
      </div>
    </PasswordGate>
  );
}
