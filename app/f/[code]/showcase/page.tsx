'use client';

import PasswordGate from '@/components/PasswordGate';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Album, MediaItem, Festival } from '@/types';
import BottomNav from '@/components/BottomNav';
import { getThemeStyles, getThemeClasses } from '@/lib/theme';

export default function ShowcasePage() {
  const params = useParams<{ code: string }>();
  const code = (params?.code as string) || '';

  const [festival, setFestival] = useState<Festival | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [active, setActive] = useState<Album | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [filter, setFilter] = useState<'all'|'image'|'video'|'audio'|'pdf'|'other'>('all');

  useEffect(() => {
    const fetchAlbums = async () => {
      const { data: fest } = await supabase.from('festivals').select('*').eq('code', code).maybeSingle();
      if (!fest) return;
      setFestival(fest);
      const { data } = await supabase.from('albums').select('*').eq('festival_id', fest.id).order('year', { ascending: false });
      setAlbums((data as Album[]) || []);
    };
    if (code) fetchAlbums();
  }, [code]);

  useEffect(() => {
    const fetchItems = async () => {
      if (!active) return;
      const { data } = await supabase.from('media_items').select('*').eq('album_id', active.id).order('created_at', { ascending: false });
      setItems((data as MediaItem[]) || []);
    };
    fetchItems();
  }, [active]);

  const filtered = useMemo(() => items.filter(i => filter === 'all' ? true : i.type === filter), [items, filter]);

  const bgStyle: React.CSSProperties = festival?.theme_bg_image_url
    ? { backgroundImage: `url(${festival.theme_bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: festival?.theme_bg_color || '#f8fafc' };

  const themeStyles = getThemeStyles(festival);
  const themeClasses = getThemeClasses(festival);

  return (
    <PasswordGate code={code}>
      <div className={`min-h-screen p-4 pb-24 ${themeClasses}`} style={{ ...bgStyle, ...themeStyles }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold theme-text mb-4">Showcase</h1>
          
          {albums.length === 0 ? (
            <div className="theme-card rounded-lg shadow-md p-6 mb-6">
              <p className="text-center theme-text">No albums created yet. Contact admin to add showcase albums.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {albums.map(a => (
                <button key={a.id} onClick={() => setActive(a)} className={`theme-card border rounded-lg p-3 text-left transition-all ${active?.id === a.id ? 'border-blue-600 ring-2 ring-blue-300' : ''}`}>
                  <div className="font-semibold theme-text truncate">{a.title}</div>
                  <div className="text-xs opacity-70 theme-text">{a.year || 'Year N/A'}</div>
                  <div className="text-sm opacity-80 theme-text mt-1 line-clamp-2">{a.description}</div>
                </button>
              ))}
            </div>
          )}

          {active ? (
            <div className="theme-card rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-lg font-semibold theme-text">{active.title}</div>
                  <div className="text-xs opacity-70 theme-text">{active.year || ''}</div>
                </div>
                <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="px-3 py-2 border rounded-lg theme-text">
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
                  <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="theme-card border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    {item.type === 'image' ? (
                      <img src={item.url} alt={item.title || ''} className="w-full h-36 object-cover" />
                    ) : (
                      <div className="h-36 flex items-center justify-center opacity-60 theme-text text-sm font-semibold">{item.type.toUpperCase()}</div>
                    )}
                    <div className="p-2 truncate text-sm theme-text" title={item.title || ''}>{item.title || ''}</div>
                  </a>
                ))}
                {filtered.length === 0 && (
                  <div className="text-sm theme-text opacity-70">No media found for this filter.</div>
                )}
              </div>
            </div>
          ) : albums.length > 0 && (
            <div className="theme-card rounded-lg shadow-md p-6">
              <p className="theme-text opacity-80">Select an album to view media.</p>
            </div>
          )}
        </div>
        <BottomNav code={code} />
      </div>
    </PasswordGate>
  );
}
