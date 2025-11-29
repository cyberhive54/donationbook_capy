'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { MediaItem } from '@/types';

interface ManageAlbumMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  albumId: string | null;
  festivalCode: string;
}

type FilterType = 'all' | 'image' | 'video' | 'audio' | 'pdf' | 'other';

export default function ManageAlbumMediaModal({ isOpen, onClose, albumId, festivalCode }: ManageAlbumMediaModalProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [uploading, setUploading] = useState(false);

  const fetchItems = async () => {
    if (!albumId) return;
    const { data, error } = await supabase.from('media_items').select('*').eq('album_id', albumId).order('created_at', { ascending: false });
    if (error) {
      console.error('Fetch media items error:', error);
    } else {
      setItems(data as MediaItem[]);
    }
  };

  useEffect(() => { if (isOpen) fetchItems(); }, [isOpen, albumId]);

  const detectType = (mime: string): FilterType => {
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime === 'application/pdf') return 'pdf';
    return 'other';
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!albumId) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const path = `${festivalCode}/${albumId}/${Date.now()}-${file.name}`;
        
        console.log('Uploading to storage:', path);
        const { error: upErr } = await supabase.storage.from('showcase').upload(path, file, { upsert: false });
        if (upErr) {
          console.error('Storage upload error:', upErr);
          throw new Error(`Storage upload failed: ${upErr.message}`);
        }
        
        const { data: pub } = supabase.storage.from('showcase').getPublicUrl(path);
        const url = pub?.publicUrl || '';
        const type = detectType(file.type);
        
        console.log('Inserting media item:', { album_id: albumId, type, title: file.name, url });
        const { error: insErr } = await supabase.from('media_items').insert({
          album_id: albumId,
          type,
          title: file.name,
          url,
          mime_type: file.type,
          size_bytes: file.size,
        });
        
        if (insErr) {
          console.error('Media item insert error:', insErr);
          throw new Error(`Database insert failed: ${insErr.message}`);
        }
      }
      toast.success('Uploaded successfully');
      fetchItems();
    } catch (e: any) {
      console.error('Upload error:', e);
      toast.error(e.message || 'Upload failed');
    } finally {
      setUploading(false);
      (e.target as HTMLInputElement).value = '';
    }
  };

  const filtered = useMemo(() => items.filter(i => filter === 'all' ? true : i.type === filter), [items, filter]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('media_items').delete().eq('id', id);
    if (!error) {
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Deleted');
    } else {
      console.error('Delete media item error:', error);
      toast.error(`Failed to delete: ${error.message}`);
    }
  };

  if (!isOpen || !albumId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Manage Media</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="px-3 py-2 border rounded-lg cursor-pointer flex items-center gap-2">
                <Upload className="w-4 h-4" /> Upload Files
                <input type="file" multiple accept="image/*,video/*,audio/*,application/pdf" onChange={handleUpload} className="hidden" disabled={uploading} />
              </label>
              <select value={filter} onChange={(e) => setFilter(e.target.value as FilterType)} className="px-3 py-2 border rounded-lg">
                <option value="all">All</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
                <option value="pdf">PDF</option>
                <option value="other">Other</option>
              </select>
            </div>
            {uploading && <span className="text-sm text-blue-600">Uploading...</span>}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filtered.map(item => (
              <div key={item.id} className="border rounded-lg overflow-hidden">
                {item.type === 'image' ? (
                  <img src={item.url} alt={item.title || ''} className="w-full h-36 object-cover" />
                ) : (
                  <div className="h-36 flex items-center justify-center bg-gray-100 text-sm text-gray-600">{item.type.toUpperCase()}</div>
                )}
                <div className="p-2 flex items-center justify-between">
                  <div className="truncate text-sm" title={item.title}>{item.title}</div>
                  <button onClick={() => handleDelete(item.id)} className="p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4 text-red-600" /></button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center text-gray-500 py-8">
                No media found. Upload files to get started.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
