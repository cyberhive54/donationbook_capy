'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AccessLog, VisitorStats } from '@/types';
import { useAdminAuth } from '@/lib/hooks/useAdminAuth';
import { RefreshCw, Users, TrendingUp, User, Clock, Search, Filter, ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function AnalyticsPage() {
  const params = useParams<{ code: string }>();
  const code = params?.code || '';
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAdminAuth(code);

  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 25;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all'); // 'today', 'week', 'month', 'all'
  const [accessMethod, setAccessMethod] = useState('all'); // 'all', 'password_modal', 'direct_link'

  // Sorting
  const [sortColumn, setSortColumn] = useState<keyof AccessLog>('accessed_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (code) fetchData();
  }, [code]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get festival ID
      const { data: festival } = await supabase
        .from('festivals')
        .select('id')
        .eq('code', code)
        .single();

      if (!festival) {
        toast.error('Festival not found');
        return;
      }

      // Fetch visitor stats
      const { data: statsData } = await supabase
        .from('festival_visitor_stats')
        .select('*')
        .eq('festival_id', festival.id)
        .single();

      setStats(statsData);

      // Fetch access logs
      const { data: logsData, error: logsError } = await supabase
        .from('access_logs')
        .select('*')
        .eq('festival_id', festival.id)
        .order('accessed_at', { ascending: false });

      if (logsError) throw logsError;
      setLogs(logsData || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('Data refreshed');
  };

  // Filter logs
  const filteredLogs = useMemo(() => {
    let filtered = [...logs];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.visitor_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(log => {
        const logDate = new Date(log.accessed_at);
        if (dateRange === 'today') return logDate >= startOfToday;
        if (dateRange === 'week') return logDate >= startOfWeek;
        if (dateRange === 'month') return logDate >= startOfMonth;
        return true;
      });
    }

    // Access method filter
    if (accessMethod !== 'all') {
      filtered = filtered.filter(log => log.access_method === accessMethod);
    }

    return filtered;
  }, [logs, searchTerm, dateRange, accessMethod]);

  // Sort logs
  const sortedLogs = useMemo(() => {
    const sorted = [...filteredLogs];
    sorted.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    return sorted;
  }, [filteredLogs, sortColumn, sortDirection]);

  // Paginate logs
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * logsPerPage;
    return sortedLogs.slice(startIndex, startIndex + logsPerPage);
  }, [sortedLogs, currentPage]);

  const totalPages = Math.ceil(sortedLogs.length / logsPerPage);

  const handleSort = (column: keyof AccessLog) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setDateRange('all');
    setAccessMethod('all');
    setCurrentPage(1);
  };

  // Calculate chart data
  const accessMethodData = useMemo(() => {
    const modalCount = filteredLogs.filter(l => l.access_method === 'password_modal').length;
    const linkCount = filteredLogs.filter(l => l.access_method === 'direct_link').length;
    return [
      { name: 'Password Modal', value: modalCount, color: '#3b82f6' },
      { name: 'Direct Link', value: linkCount, color: '#10b981' },
    ];
  }, [filteredLogs]);

  const topVisitors = useMemo(() => {
    const visitorCounts: Record<string, number> = {};
    filteredLogs.forEach(log => {
      visitorCounts[log.visitor_name] = (visitorCounts[log.visitor_name] || 0) + 1;
    });
    return Object.entries(visitorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }, [filteredLogs]);

  // Redirect to admin page if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.error('Admin access required');
      router.push(`/f/${code}/admin`);
    }
  }, [isAuthenticated, isLoading, router, code]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 rounded-full p-4">
              <ShieldAlert className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Admin Access Required</h2>
          <p className="text-gray-600 mb-4">Redirecting to admin login...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Visitor Analytics</h1>
              <p className="text-gray-600 mt-1">Track and analyze festival visitors</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Unique Visitors</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {stats?.unique_visitors || 0}
                  </p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Visits</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {stats?.total_visits || 0}
                  </p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Last Visitor</p>
                  <p className="text-lg font-semibold text-purple-600 mt-2 truncate">
                    {stats?.last_visitor_name || 'N/A'}
                  </p>
                </div>
                <div className="bg-purple-100 rounded-full p-3">
                  <User className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Last Visit</p>
                  <p className="text-sm font-semibold text-orange-600 mt-2">
                    {stats?.last_visit
                      ? formatDistanceToNow(new Date(stats.last_visit), { addSuffix: true })
                      : 'N/A'}
                  </p>
                </div>
                <div className="bg-orange-100 rounded-full p-3">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Access Method Breakdown */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Access Method Breakdown</h3>
              <div className="space-y-4">
                {accessMethodData.map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{item.name}</span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="h-3 rounded-full transition-all"
                        style={{
                          width: `${(item.value / filteredLogs.length) * 100 || 0}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Visitors */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Top 10 Visitors</h3>
              <div className="space-y-3">
                {topVisitors.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No visitors yet</p>
                ) : (
                  topVisitors.map((visitor, index) => (
                    <div key={visitor.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-500 w-6">
                          #{index + 1}
                        </span>
                        <span className="text-sm text-gray-900">{visitor.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-blue-600">
                        {visitor.count} visits
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search by Name
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search visitor..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Method
                </label>
                <select
                  value={accessMethod}
                  onChange={(e) => setAccessMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Methods</option>
                  <option value="password_modal">Password Modal</option>
                  <option value="direct_link">Direct Link</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Reset Filters
                </button>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              Showing {sortedLogs.length} of {logs.length} total logs
            </div>
          </div>

          {/* Access Logs Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Access Logs</h3>
            </div>
            
            {paginatedLogs.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No visitors yet</h3>
                <p className="text-gray-600">
                  Share the festival link to get started!
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          onClick={() => handleSort('visitor_name')}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                        >
                          Visitor Name {sortColumn === 'visitor_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th
                          onClick={() => handleSort('access_method')}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                        >
                          Method {sortColumn === 'access_method' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          Password Used
                        </th>
                        <th
                          onClick={() => handleSort('accessed_at')}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer hover:bg-gray-100"
                        >
                          Date & Time {sortColumn === 'accessed_at' && (sortDirection === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          Session ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          User Agent
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                          IP Address
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                            {log.visitor_name}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                log.access_method === 'password_modal'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {log.access_method === 'password_modal' ? 'Password Modal' : 'Direct Link'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                            {log.password_used || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(log.accessed_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                            {log.session_id ? log.session_id.substring(0, 12) + '...' : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                            {log.user_agent || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {log.ip_address || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
  );
}
