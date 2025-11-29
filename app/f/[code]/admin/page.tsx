'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Festival, Collection, Expense, Stats, Album, MediaItem } from '@/types';
import { calculateStats, calculateStorageStats, formatFileSize } from '@/lib/utils';
import AdminPasswordGate from '@/components/AdminPasswordGate';
import BasicInfo from '@/components/BasicInfo';
import StatsCards from '@/components/StatsCards';
import BottomNav from '@/components/BottomNav';
import CollectionTable from '@/components/tables/CollectionTable';
import ExpenseTable from '@/components/tables/ExpenseTable';
import AddCollectionModal from '@/components/modals/AddCollectionModal';
import AddExpenseModal from '@/components/modals/AddExpenseModal';
import EditFestivalModal from '@/components/modals/EditFestivalModal';
import AddEditAlbumModal from '@/components/modals/AddEditAlbumModal';
import ManageAlbumMediaModal from '@/components/modals/ManageAlbumMediaModal';
import StorageStatsModal from '@/components/modals/StorageStatsModal';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';
import { InfoSkeleton, CardSkeleton, TableSkeleton } from '@/components/Loader';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Eye, EyeOff, Palette, HardDrive } from 'lucide-react';

function AdminPageContent() {
  const params = useParams<{ code: string }>();
  const code = (params?.code as string) || '';

  const [festival, setFestival] = useState<Festival | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<Stats>({ totalCollection: 0, totalExpense: 0, numDonators: 0, balance: 0 });
  const [groups, setGroups] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [collectionModes, setCollectionModes] = useState<string[]>([]);
  const [expenseModes, setExpenseModes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [isFestivalModalOpen, setIsFestivalModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [allMediaItems, setAllMediaItems] = useState<MediaItem[]>([]);
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [isStorageStatsOpen, setIsStorageStatsOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [isManageMediaOpen, setIsManageMediaOpen] = useState(false);
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  const [isImportCollectionsOpen, setIsImportCollectionsOpen] = useState(false);
  const [isImportExpensesOpen, setIsImportExpensesOpen] = useState(false);
  const [isDeleteFestivalOpen, setIsDeleteFestivalOpen] = useState(false);
  const [deleteFestivalDownload, setDeleteFestivalDownload] = useState(true);
  const [deleteFestivalAdminPass, setDeleteFestivalAdminPass] = useState('');
  const [importText, setImportText] = useState('');
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'collection' | 'expense'; id: string } | null>(null);

  const [newGroup, setNewGroup] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newCollectionMode, setNewCollectionMode] = useState('');
  const [newExpenseMode, setNewExpenseMode] = useState('');
  
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [editingUserPassword, setEditingUserPassword] = useState(false);
  const [newUserPassword, setNewUserPassword] = useState('');

  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [editingAdminPassword, setEditingAdminPassword] = useState(false);
  const [newAdminPassword, setNewAdminPassword] = useState('');

  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [themeForm, setThemeForm] = useState({
    theme_primary_color: '#2563eb',
    theme_secondary_color: '#1f2937',
    theme_bg_color: '#f8fafc',
    theme_bg_image_url: '',
    theme_text_color: '#111827',
    theme_border_color: '#d1d5db',
    theme_table_bg: '#ffffff',
    theme_card_bg: '#ffffff',
    theme_dark: false,
  });

  useEffect(() => {
    if (code) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: fest, error: festErr } = await supabase
        .from('festivals')
        .select('*')
        .eq('code', code)
        .single();
      if (festErr) throw festErr;

      const [collectionsRes, expensesRes, groupsRes, categoriesRes, collectionModesRes, expenseModesRes, albumsRes] =
        await Promise.all([
          supabase.from('collections').select('*').eq('festival_id', fest.id).order('date', { ascending: false }),
          supabase.from('expenses').select('*').eq('festival_id', fest.id).order('date', { ascending: false }),
          supabase.from('groups').select('*').eq('festival_id', fest.id).order('name'),
          supabase.from('categories').select('*').eq('festival_id', fest.id).order('name'),
          supabase.from('collection_modes').select('*').eq('festival_id', fest.id).order('name'),
          supabase.from('expense_modes').select('*').eq('festival_id', fest.id).order('name'),
          supabase.from('albums').select('*').eq('festival_id', fest.id).order('year', { ascending: false }),
        ]);

      const fetchedCollections = collectionsRes.data || [];
      const fetchedExpenses = expensesRes.data || [];
      const fetchedGroups = groupsRes.data?.map((g) => g.name) || [];
      const fetchedCategories = categoriesRes.data?.map((c) => c.name) || [];
      const fetchedCollectionModes = collectionModesRes.data?.map((m) => m.name) || [];
      const fetchedExpenseModes = expenseModesRes.data?.map((m) => m.name) || [];

      setFestival(fest);
      setCollections(fetchedCollections);
      setExpenses(fetchedExpenses);
      setGroups(fetchedGroups);
      setCategories(fetchedCategories);
      setCollectionModes(fetchedCollectionModes);
      setExpenseModes(fetchedExpenseModes);
      setAlbums(albumsRes.data || []);
      
      const albumIds = (albumsRes.data || []).map((a: Album) => a.id);
      if (albumIds.length > 0) {
        const { data: mediaData } = await supabase.from('media_items').select('*').in('album_id', albumIds);
        setAllMediaItems((mediaData as MediaItem[]) || []);
      } else {
        setAllMediaItems([]);
      }

      setThemeForm({
        theme_primary_color: fest.theme_primary_color || '#2563eb',
        theme_secondary_color: fest.theme_secondary_color || '#1f2937',
        theme_bg_color: fest.theme_bg_color || '#f8fafc',
        theme_bg_image_url: fest.theme_bg_image_url || '',
        theme_text_color: fest.theme_text_color || '#111827',
        theme_border_color: fest.theme_border_color || '#d1d5db',
        theme_table_bg: fest.theme_table_bg || '#ffffff',
        theme_card_bg: fest.theme_card_bg || '#ffffff',
        theme_dark: fest.theme_dark || false,
      });

      const calculatedStats = calculateStats(fetchedCollections, fetchedExpenses);
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection);
    setIsCollectionModalOpen(true);
  };

  const handleDeleteCollection = (collection: Collection) => {
    setDeleteTarget({ type: 'collection', id: collection.id });
    setIsDeleteModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleDeleteExpense = (expense: Expense) => {
    setDeleteTarget({ type: 'expense', id: expense.id });
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const tableName = deleteTarget.type === 'collection' ? 'collections' : 'expenses';
      const { error } = await supabase.from(tableName).delete().eq('id', deleteTarget.id);

      if (error) throw error;

      toast.success(`${deleteTarget.type === 'collection' ? 'Collection' : 'Expense'} deleted successfully`);
      fetchData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleAddGroup = async () => {
    if (!newGroup.trim() || !festival) return;
    try {
      const { error } = await supabase.from('groups').insert({ name: newGroup.trim(), festival_id: festival.id });
      if (error) throw error;
      toast.success('Group added');
      setNewGroup('');
      fetchData();
    } catch (error: any) {
      if (error.code === '23505') toast.error('Group already exists');
      else toast.error('Failed to add group');
    }
  };

  const handleDeleteGroup = async (groupName: string) => {
    if (!festival) return;
    try {
      const { error } = await supabase.from('groups').delete().eq('name', groupName).eq('festival_id', festival.id);
      if (error) throw error;
      toast.success('Group deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete group');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim() || !festival) return;
    try {
      const { error } = await supabase.from('categories').insert({ name: newCategory.trim(), festival_id: festival.id });
      if (error) throw error;
      toast.success('Category added');
      setNewCategory('');
      fetchData();
    } catch (error: any) {
      if (error.code === '23505') toast.error('Category already exists');
      else toast.error('Failed to add category');
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    if (!festival) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('name', categoryName).eq('festival_id', festival.id);
      if (error) throw error;
      toast.success('Category deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const handleAddCollectionMode = async () => {
    if (!newCollectionMode.trim() || !festival) return;
    try {
      const { error } = await supabase.from('collection_modes').insert({ name: newCollectionMode.trim(), festival_id: festival.id });
      if (error) throw error;
      toast.success('Collection mode added');
      setNewCollectionMode('');
      fetchData();
    } catch (error: any) {
      if (error.code === '23505') toast.error('Mode already exists');
      else toast.error('Failed to add mode');
    }
  };

  const handleDeleteCollectionMode = async (modeName: string) => {
    if (!festival) return;
    try {
      const { error } = await supabase.from('collection_modes').delete().eq('name', modeName).eq('festival_id', festival.id);
      if (error) throw error;
      toast.success('Mode deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete mode');
    }
  };

  const handleAddExpenseMode = async () => {
    if (!newExpenseMode.trim() || !festival) return;
    try {
      const { error } = await supabase.from('expense_modes').insert({ name: newExpenseMode.trim(), festival_id: festival.id });
      if (error) throw error;
      toast.success('Expense mode added');
      setNewExpenseMode('');
      fetchData();
    } catch (error: any) {
      if (error.code === '23505') toast.error('Mode already exists');
      else toast.error('Failed to add mode');
    }
  };

  const handleDeleteExpenseMode = async (modeName: string) => {
    if (!festival) return;
    try {
      const { error } = await supabase.from('expense_modes').delete().eq('name', modeName).eq('festival_id', festival.id);
      if (error) throw error;
      toast.success('Mode deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete mode');
    }
  };

  const handleUpdateUserPassword = async () => {
    if (!newUserPassword.trim() || !festival) return;
    try {
      const { error } = await supabase
        .from('festivals')
        .update({
          user_password: newUserPassword.trim(),
          user_password_updated_at: new Date().toISOString(),
        })
        .eq('id', festival.id);
      if (error) throw error;
      toast.success('User password updated');
      setNewUserPassword('');
      setEditingUserPassword(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to update password');
    }
  };

  const handleUpdateAdminPassword = async () => {
    if (!newAdminPassword.trim() || !festival) return;
    try {
      const { error } = await supabase
        .from('festivals')
        .update({
          admin_password: newAdminPassword.trim(),
          admin_password_updated_at: new Date().toISOString(),
        })
        .eq('id', festival.id);
      if (error) throw error;
      toast.success('Admin password updated');
      setNewAdminPassword('');
      setEditingAdminPassword(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to update password');
    }
  };

  const handleUpdateTheme = async () => {
    if (!festival) return;
    try {
      const { error } = await supabase
        .from('festivals')
        .update({
          theme_primary_color: themeForm.theme_primary_color,
          theme_secondary_color: themeForm.theme_secondary_color,
          theme_bg_color: themeForm.theme_bg_color,
          theme_bg_image_url: themeForm.theme_bg_image_url || null,
          theme_text_color: themeForm.theme_text_color,
          theme_border_color: themeForm.theme_border_color,
          theme_table_bg: themeForm.theme_table_bg,
          theme_card_bg: themeForm.theme_card_bg,
          theme_dark: themeForm.theme_dark,
          updated_at: new Date().toISOString(),
        })
        .eq('id', festival.id);
      if (error) throw error;
      toast.success('Theme updated successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to update theme');
    }
  };

  const bgStyle: React.CSSProperties = festival?.theme_bg_image_url
    ? { backgroundImage: `url(${festival.theme_bg_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: festival?.theme_bg_color || '#f8fafc' };

  const themeStyles = getThemeStyles(festival);
  const themeClasses = getThemeClasses(festival);

  const normalize = (s: string) => s?.trim().toLowerCase();

  const downloadJSON = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCollections = () => {
    downloadJSON(collections, `${festival?.code || 'fest'}-collections.json`);
  };
  const handleExportCollectionsImportFmt = () => {
    const data = collections.map(c => ({
      name: c.name,
      amount: Number(c.amount),
      group_name: c.group_name,
      mode: c.mode,
      note: c.note || '',
      date: c.date,
    }));
    downloadJSON(data, `${festival?.code || 'fest'}-collections-import.json`);
  };
  const handleExportExpenses = () => {
    downloadJSON(expenses, `${festival?.code || 'fest'}-expenses.json`);
  };
  const handleExportExpensesImportFmt = () => {
    const data = expenses.map(e => ({
      item: e.item,
      pieces: Number(e.pieces),
      price_per_piece: Number(e.price_per_piece),
      total_amount: Number(e.total_amount),
      category: e.category,
      mode: e.mode,
      note: e.note || '',
      date: e.date,
    }));
    downloadJSON(data, `${festival?.code || 'fest'}-expenses-import.json`);
  };

  const exampleCollections = [
    { name: 'John Doe', amount: 500, group_name: 'Group A', mode: 'Cash', note: 'Blessings', date: '2025-10-21' },
    { name: 'Jane', amount: 1000, group_name: 'Group B', mode: 'UPI', note: '', date: '2025-10-22' },
  ];
  const exampleExpenses = [
    { item: 'Flowers', pieces: 5, price_per_piece: 50, total_amount: 250, category: 'Decoration', mode: 'Cash', note: '', date: '2025-10-21' },
    { item: 'Lights', pieces: 2, price_per_piece: 300, total_amount: 600, category: 'Decoration', mode: 'UPI', note: 'extra cable', date: '2025-10-22' },
  ];

  const handleImportCollections = async () => {
    if (!festival) return;
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) throw new Error('JSON should be an array');
      const groupMap = new Map(groups.map(g => [normalize(g), g]));
      const modeMap = new Map(collectionModes.map(m => [normalize(m), m]));

      const rows = parsed.map((c: any, idx: number) => {
        const name = String(c.name || '').trim();
        const amount = Number(c.amount);
        const groupKey = normalize(String(c.group_name || ''));
        const modeKey = normalize(String(c.mode || ''));
        const date = String(c.date || '').trim();
        const note = c.note != null ? String(c.note).trim() : null;

        if (!name || !amount || !groupKey || !modeKey || !date) {
          throw new Error(`Row ${idx + 1}: Missing required fields (name, amount, group_name, mode, date)`);
        }
        const group_name = groupMap.get(groupKey);
        if (!group_name) throw new Error(`Row ${idx + 1}: Unknown group '${c.group_name}'. Ensure group exists or check spelling.`);
        const mode = modeMap.get(modeKey);
        if (!mode) throw new Error(`Row ${idx + 1}: Unknown mode '${c.mode}'. Ensure mode exists or check spelling.`);
        if (isNaN(Date.parse(date))) throw new Error(`Row ${idx + 1}: Invalid date '${date}'. Use YYYY-MM-DD.`);

        return {
          festival_id: festival.id,
          name,
          amount,
          group_name,
          mode,
          note,
          date,
        };
      });

      const { error } = await supabase.from('collections').insert(rows);
      if (error) throw error;
      toast.success('Collections imported');
      setIsImportCollectionsOpen(false);
      setImportText('');
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to import');
    }
  };

  const handleImportExpenses = async () => {
    if (!festival) return;
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) throw new Error('JSON should be an array');
      const categoryMap = new Map(categories.map(c => [normalize(c), c]));
      const modeMap = new Map(expenseModes.map(m => [normalize(m), m]));

      const rows = parsed.map((x: any, idx: number) => {
        const item = String(x.item || '').trim();
        const pieces = Number(x.pieces);
        const price_per_piece = Number(x.price_per_piece);
        const total_amount = Number(x.total_amount);
        const categoryKey = normalize(String(x.category || ''));
        const modeKey = normalize(String(x.mode || ''));
        const date = String(x.date || '').trim();
        const note = x.note != null ? String(x.note).trim() : null;

        if (!item || !pieces || pieces <= 0 || total_amount <= 0 || !categoryKey || !modeKey || !date) {
          throw new Error(`Row ${idx + 1}: Missing/invalid required fields (item, pieces, total_amount, category, mode, date)`);
        }
        const category = categoryMap.get(categoryKey);
        if (!category) throw new Error(`Row ${idx + 1}: Unknown category '${x.category}'. Ensure category exists or check spelling.`);
        const mode = modeMap.get(modeKey);
        if (!mode) throw new Error(`Row ${idx + 1}: Unknown mode '${x.mode}'. Ensure mode exists or check spelling.`);
        if (isNaN(Date.parse(date))) throw new Error(`Row ${idx + 1}: Invalid date '${date}'. Use YYYY-MM-DD.`);

        return {
          festival_id: festival.id,
          item,
          pieces,
          price_per_piece,
          total_amount,
          category,
          mode,
          note,
          date,
        };
      });

      const { error } = await supabase.from('expenses').insert(rows);
      if (error) throw error;
      toast.success('Expenses imported');
      setIsImportExpensesOpen(false);
      setImportText('');
      fetchData();
    } catch (e: any) {
      toast.error(e.message || 'Failed to import');
    }
  };

  const handleDeleteFestival = async () => {
    if (!festival) return;
    try {
      // verify admin password client-side minimal (optional if hook already protects)
      if (!deleteFestivalAdminPass.trim()) {
        toast.error('Enter admin password');
        return;
      }
      // export first if chosen
      if (deleteFestivalDownload) {
        downloadJSON(collections, `${festival.code}-collections.json`);
        downloadJSON(expenses, `${festival.code}-expenses.json`);
        // also download import-format
        const collImp = collections.map(c => ({ name: c.name, amount: Number(c.amount), group_name: c.group_name, mode: c.mode, note: c.note || '', date: c.date }));
        const expImp = expenses.map(e => ({ item: e.item, pieces: Number(e.pieces), price_per_piece: Number(e.price_per_piece), total_amount: Number(e.total_amount), category: e.category, mode: e.mode, note: e.note || '', date: e.date }));
        downloadJSON(collImp, `${festival.code}-collections-import.json`);
        downloadJSON(expImp, `${festival.code}-expenses-import.json`);
      }
      // delete child tables then festival
      await supabase.from('collections').delete().eq('festival_id', festival.id);
      await supabase.from('expenses').delete().eq('festival_id', festival.id);
      await supabase.from('groups').delete().eq('festival_id', festival.id);
      await supabase.from('categories').delete().eq('festival_id', festival.id);
      await supabase.from('collection_modes').delete().eq('festival_id', festival.id);
      await supabase.from('expense_modes').delete().eq('festival_id', festival.id);
      const { error } = await supabase.from('festivals').delete().eq('id', festival.id);
      if (error) throw error;
      toast.success('Festival permanently deleted');
      window.location.href = '/';
    } catch (e) {
      toast.error('Failed to delete festival');
    }
  };

  return (
    <div className={`min-h-screen pb-24 ${themeClasses}`} style={{ ...bgStyle, ...themeStyles }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <>
            <InfoSkeleton />
            <CardSkeleton />
            <TableSkeleton rows={5} />
          </>
        ) : !festival ? (
          <div className="theme-card bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-700">Festival not found.</p>
          </div>
        ) : (
          <>
            <div className="theme-card bg-white rounded-lg shadow-md p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Festival Code</p>
                  <p className="text-xl font-bold text-gray-900">{festival.code}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/f/${festival.code}`);
                    toast.success('Festival URL copied!');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Copy URL
                </button>
              </div>
            </div>

            <BasicInfo
              basicInfo={{
                id: festival.id,
                event_name: festival.event_name,
                organiser: festival.organiser || '',
                mentor: festival.mentor || '',
                guide: festival.guide || '',
                event_start_date: festival.event_start_date,
                event_end_date: festival.event_end_date,
                location: festival.location,
                other_data: festival.other_data,
              } as any}
              showEditButton
              onEdit={() => setIsFestivalModalOpen(true)}
            />
            <StatsCards stats={stats} />

            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Collections</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingCollection(null);
                        setIsCollectionModalOpen(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                    <Plus className="w-5 h-5" />
                      Add Collection
                    </button>
                    <button
                      onClick={handleExportCollections}
                      className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Export JSON
                    </button>
                    <button
                      onClick={handleExportCollectionsImportFmt}
                      className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Export (Import Format)
                    </button>
                    <button
                      onClick={() => { setIsImportCollectionsOpen(true); setImportText(''); }}
                      className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Import JSON
                    </button>
                  </div>
                </div>
                <CollectionTable
                  collections={collections}
                  groups={groups}
                  modes={collectionModes}
                  onEdit={handleEditCollection}
                  onDelete={handleDeleteCollection}
                  isAdmin
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Expenses</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingExpense(null);
                        setIsExpenseModalOpen(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                    <Plus className="w-5 h-5" />
                      Add Expense
                    </button>
                    <button
                      onClick={handleExportExpenses}
                      className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Export JSON
                    </button>
                    <button
                      onClick={handleExportExpensesImportFmt}
                      className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Export (Import Format)
                    </button>
                    <button
                      onClick={() => { setIsImportExpensesOpen(true); setImportText(''); }}
                      className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Import JSON
                    </button>
                  </div>
                </div>
                <ExpenseTable
                  expenses={expenses}
                  categories={categories}
                  modes={expenseModes}
                  onEdit={handleEditExpense}
                  onDelete={handleDeleteExpense}
                  isAdmin
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="theme-card bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Collection Settings</h3>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 mb-2">Groups</h4>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newGroup}
                        onChange={(e) => setNewGroup(e.target.value)}
                        placeholder="Add new group"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddGroup()}
                      />
                      <button
                        onClick={handleAddGroup}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {groups.map((group) => (
                        <div key={group} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
                          <span className="text-sm text-gray-700">{group}</span>
                          <button
                            onClick={() => handleDeleteGroup(group)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Collection Modes</h4>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newCollectionMode}
                        onChange={(e) => setNewCollectionMode(e.target.value)}
                        placeholder="Add new mode"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCollectionMode()}
                      />
                      <button
                        onClick={handleAddCollectionMode}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {collectionModes.map((mode) => (
                        <div key={mode} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
                          <span className="text-sm text-gray-700">{mode}</span>
                          <button
                            onClick={() => handleDeleteCollectionMode(mode)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="theme-card bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Expense Settings</h3>

                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 mb-2">Categories</h4>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Add new category"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                      />
                      <button
                        onClick={handleAddCategory}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <div key={category} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
                          <span className="text-sm text-gray-700">{category}</span>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Expense Modes</h4>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newExpenseMode}
                        onChange={(e) => setNewExpenseMode(e.target.value)}
                        placeholder="Add new mode"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddExpenseMode()}
                      />
                      <button
                        onClick={handleAddExpenseMode}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {expenseModes.map((mode) => (
                        <div key={mode} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded">
                          <span className="text-sm text-gray-700">{mode}</span>
                          <button
                            onClick={() => handleDeleteExpenseMode(mode)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="theme-card bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">User Password</h3>
                {editingUserPassword ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleUpdateUserPassword}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingUserPassword(false);
                        setNewUserPassword('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 px-4 py-2 bg-gray-50 rounded-lg font-mono">
                      {showUserPassword ? festival.user_password : '•'.repeat(festival.user_password?.length || 0)}
                    </div>
                    <button
                      onClick={() => setShowUserPassword(!showUserPassword)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {showUserPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setEditingUserPassword(true)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="theme-card bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Admin Password</h3>
                {editingAdminPassword ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      placeholder="Enter new admin password"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleUpdateAdminPassword}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingAdminPassword(false);
                        setNewAdminPassword('');
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 px-4 py-2 bg-gray-50 rounded-lg font-mono">
                      {showAdminPassword ? festival.admin_password : '•'.repeat(festival.admin_password?.length || 0)}
                    </div>
                    <button
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {showAdminPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setEditingAdminPassword(true)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="theme-card bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Theme & Appearance</h3>
                  <button
                    onClick={() => setShowThemeEditor(!showThemeEditor)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                  >
                    <Palette className="w-4 h-4" />
                    {showThemeEditor ? 'Hide' : 'Edit Theme'}
                  </button>
                </div>

                {showThemeEditor && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                        <input
                          type="color"
                          value={themeForm.theme_primary_color}
                          onChange={(e) => setThemeForm({ ...themeForm, theme_primary_color: e.target.value })}
                          className="w-full h-10 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                        <input
                          type="color"
                          value={themeForm.theme_secondary_color}
                          onChange={(e) => setThemeForm({ ...themeForm, theme_secondary_color: e.target.value })}
                          className="w-full h-10 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                        <input
                          type="color"
                          value={themeForm.theme_bg_color}
                          onChange={(e) => setThemeForm({ ...themeForm, theme_bg_color: e.target.value })}
                          className="w-full h-10 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                        <input
                          type="color"
                          value={themeForm.theme_text_color}
                          onChange={(e) => setThemeForm({ ...themeForm, theme_text_color: e.target.value })}
                          className="w-full h-10 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Border Color</label>
                        <input
                          type="color"
                          value={themeForm.theme_border_color}
                          onChange={(e) => setThemeForm({ ...themeForm, theme_border_color: e.target.value })}
                          className="w-full h-10 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Table Background</label>
                        <input
                          type="color"
                          value={themeForm.theme_table_bg}
                          onChange={(e) => setThemeForm({ ...themeForm, theme_table_bg: e.target.value })}
                          className="w-full h-10 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Card Background</label>
                        <input
                          type="color"
                          value={themeForm.theme_card_bg}
                          onChange={(e) => setThemeForm({ ...themeForm, theme_card_bg: e.target.value })}
                          className="w-full h-10 border rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Background Image URL</label>
                      <input
                        type="text"
                        value={themeForm.theme_bg_image_url}
                        onChange={(e) => setThemeForm({ ...themeForm, theme_bg_image_url: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">If set, this will override background color</p>
                    </div>

                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={themeForm.theme_dark}
                        onChange={(e) => setThemeForm({ ...themeForm, theme_dark: e.target.checked })}
                      />
                      Enable dark theme
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <button
                        onClick={handleUpdateTheme}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Save Theme
                      </button>
                      <button
                        onClick={async () => {
                          if (!festival) return;
                          const defaults = {
                            theme_primary_color: '#2563eb',
                            theme_secondary_color: '#1f2937',
                            theme_bg_color: '#f8fafc',
                            theme_bg_image_url: null as string | null,
                            theme_text_color: '#111827',
                            theme_border_color: '#d1d5db',
                            theme_table_bg: '#ffffff',
                            theme_card_bg: '#ffffff',
                            theme_dark: false,
                          };
                          setThemeForm({
                            theme_primary_color: defaults.theme_primary_color,
                            theme_secondary_color: defaults.theme_secondary_color,
                            theme_bg_color: defaults.theme_bg_color,
                            theme_bg_image_url: '',
                            theme_text_color: defaults.theme_text_color,
                            theme_border_color: defaults.theme_border_color,
                            theme_table_bg: defaults.theme_table_bg,
                            theme_card_bg: defaults.theme_card_bg,
                            theme_dark: defaults.theme_dark,
                          });
                          try {
                            const { error } = await supabase
                              .from('festivals')
                              .update({
                                ...defaults,
                                updated_at: new Date().toISOString(),
                              })
                              .eq('id', festival.id);
                            if (error) throw error;
                            toast.success('Theme restored to defaults');
                            fetchData();
                          } catch (e) {
                            toast.error('Failed to restore defaults');
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Restore Defaults
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="theme-card bg-white rounded-lg shadow-md p-6 mt-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Showcase</h3>
                {allMediaItems.length > 0 && (() => {
                  const storageStats = calculateStorageStats(allMediaItems);
                  return (
                    <div 
                      className="mb-4 cursor-pointer hover:bg-gray-50 p-4 rounded-lg border transition-colors" 
                      onClick={() => setIsStorageStatsOpen(true)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-5 h-5 text-gray-600" />
                          <span className="text-sm font-medium text-gray-800">Storage Usage</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {formatFileSize(storageStats.totalBytes)} / {formatFileSize(storageStats.maxBytes)}
                          <span className="ml-2 text-xs">({storageStats.percentage.toFixed(1)}%)</span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            storageStats.percentage > 90 ? 'bg-red-500' : 
                            storageStats.percentage > 75 ? 'bg-yellow-500' : 
                            'bg-blue-500'
                          }`}
                          style={{ width: `${storageStats.percentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Click to view detailed storage breakdown</div>
                    </div>
                  );
                })()}
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600">Create albums and upload photos, videos, audio, and PDFs. Users can view under Showcase.</p>
                  <button
                    onClick={() => { setEditingAlbum(null); setIsAlbumModalOpen(true); }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Add Album
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {albums.map(a => (
                    <div key={a.id} className="border rounded-lg overflow-hidden bg-white">
                      {a.cover_url && (
                        <img src={a.cover_url} alt={a.title} className="w-full h-32 object-cover" />
                      )}
                      <div className="p-3">
                        <div className="font-semibold text-gray-800 truncate">{a.title}</div>
                        <div className="text-xs text-gray-500">{a.year || 'Year N/A'}</div>
                        <div className="text-sm text-gray-600 mt-1 line-clamp-2">{a.description}</div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => { setEditingAlbum(a); setIsAlbumModalOpen(true); }} className="px-3 py-1 border rounded text-sm hover:bg-gray-50">Edit</button>
                          <button onClick={async () => { await supabase.from('albums').delete().eq('id', a.id); toast.success('Album deleted'); fetchData(); }} className="px-3 py-1 border rounded text-sm hover:bg-gray-50">Delete</button>
                          <button onClick={() => { setActiveAlbumId(a.id); setIsManageMediaOpen(true); }} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Manage Media</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {albums.length === 0 && (
                    <div className="text-sm text-gray-600">No albums yet.</div>
                  )}
                </div>
              </div>

              <div className="mt-10">
                <button
                  onClick={() => setIsDeleteFestivalOpen(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Permanently Delete Festival
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav code={code} />

      <EditFestivalModal
        isOpen={isFestivalModalOpen}
        onClose={() => setIsFestivalModalOpen(false)}
        onSuccess={fetchData}
        festival={festival}
      />

      <AddEditAlbumModal
        isOpen={isAlbumModalOpen}
        onClose={() => setIsAlbumModalOpen(false)}
        onSuccess={fetchData}
        festivalId={festival?.id || ''}
        festivalCode={festival?.code || ''}
        initial={editingAlbum}
      />

      <ManageAlbumMediaModal
        isOpen={isManageMediaOpen}
        onClose={() => setIsManageMediaOpen(false)}
        albumId={activeAlbumId}
        festivalCode={festival?.code || ''}
      />
      
      <StorageStatsModal
        isOpen={isStorageStatsOpen}
        onClose={() => setIsStorageStatsOpen(false)}
        allMediaItems={allMediaItems}
        albums={albums}
      />

      <AddCollectionModal
        isOpen={isCollectionModalOpen}
        onClose={() => {
          setIsCollectionModalOpen(false);
          setEditingCollection(null);
        }}
        onSuccess={fetchData}
        groups={groups}
        modes={collectionModes}
        editData={editingCollection}
        festivalId={festival?.id || ''}
        festivalStartDate={festival?.event_start_date}
        festivalEndDate={festival?.event_end_date}
      />

      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSuccess={fetchData}
        categories={categories}
        modes={expenseModes}
        editData={editingExpense}
        festivalId={festival?.id || ''}
        festivalStartDate={festival?.event_start_date}
        festivalEndDate={festival?.event_end_date}
      />

      {/* Import Collections Modal */}
      {isImportCollectionsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Import Collections (JSON)</h3>
            <p className="text-sm text-gray-600 mb-2">Paste JSON array. Required: name, amount, group_name, mode, date. Note optional. Group & Mode will be matched case-insensitively and trimmed to existing values.</p>
            <p className="text-xs text-gray-500 mb-2">If a group/mode does not exist, import will fail. Create them first in settings.</p>
            <p className="text-xs text-gray-500 mb-2">Dates must be in YYYY-MM-DD.</p>
            <p className="text-xs text-gray-500 mb-2">You can paste multiple rows.</p>
            <div className="bg-gray-50 p-3 rounded border text-xs mb-3">
{`[
  { "name": "John Doe", "amount": 500, "group_name": "Group A", "mode": "Cash", "note": "Blessings", "date": "2025-10-21" },
  { "name": "Jane", "amount": 1000, "group_name": "Group B", "mode": "UPI", "note": "", "date": "2025-10-22" }
]`}
            </div>
            <textarea value={importText} onChange={(e) => setImportText(e.target.value)} className="w-full border rounded p-2 h-40" />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setImportText(JSON.stringify(exampleCollections, null, 2))} className="px-3 py-2 border rounded">Copy Example</button>
              <button onClick={() => setIsImportCollectionsOpen(false)} className="px-3 py-2 border rounded">Cancel</button>
              <button onClick={handleImportCollections} className="px-3 py-2 bg-blue-600 text-white rounded">Import</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Expenses Modal */}
      {isImportExpensesOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Import Expenses (JSON)</h3>
            <p className="text-sm text-gray-600 mb-2">Paste JSON array. Required: item, pieces, price_per_piece, total_amount, category, mode, date. Note optional. Category & Mode will be matched case-insensitively and trimmed to existing values.</p>
            <p className="text-xs text-gray-500 mb-2">If a category/mode does not exist, import will fail. Create them first in settings.</p>
            <p className="text-xs text-gray-500 mb-2">Dates must be in YYYY-MM-DD.</p>
            <p className="text-xs text-gray-500 mb-2">You can paste multiple rows.</p>
            <div className="bg-gray-50 p-3 rounded border text-xs mb-3">
{`[
  { "item": "Flowers", "pieces": 5, "price_per_piece": 50, "total_amount": 250, "category": "Decoration", "mode": "Cash", "note": "", "date": "2025-10-21" },
  { "item": "Lights", "pieces": 2, "price_per_piece": 300, "total_amount": 600, "category": "Decoration", "mode": "UPI", "note": "extra cable", "date": "2025-10-22" }
]`}
            </div>
            <textarea value={importText} onChange={(e) => setImportText(e.target.value)} className="w-full border rounded p-2 h-40" />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => setImportText(JSON.stringify(exampleExpenses, null, 2))} className="px-3 py-2 border rounded">Copy Example</button>
              <button onClick={() => setIsImportExpensesOpen(false)} className="px-3 py-2 border rounded">Cancel</button>
              <button onClick={handleImportExpenses} className="px-3 py-2 bg-blue-600 text-white rounded">Import</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Festival Modal */}
      {isDeleteFestivalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Permanently Delete Festival</h3>
            <p className="text-sm text-red-600 mb-2">Warning: This cannot be undone. Download data before deleting.</p>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={deleteFestivalDownload} onChange={(e) => setDeleteFestivalDownload(e.target.checked)} /> Download data (JSON) before delete</label>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Admin Password</label>
              <input type="password" value={deleteFestivalAdminPass} onChange={(e) => setDeleteFestivalAdminPass(e.target.value)} className="w-full border rounded px-3 py-2" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setIsDeleteFestivalOpen(false)} className="px-3 py-2 border rounded">Cancel</button>
              <button onClick={handleDeleteFestival} className="px-3 py-2 bg-red-600 text-white rounded">Delete Permanently</button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Confirm Delete"
        message={`Are you sure you want to delete this ${deleteTarget?.type}?`}
      />
    </div>
  );
}

export default function AdminPage() {
  const params = useParams<{ code: string }>();
  const code = (params?.code as string) || '';

  return (
    <AdminPasswordGate code={code}>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }
      >
        <AdminPageContent />
      </Suspense>
    </AdminPasswordGate>
  );
}
