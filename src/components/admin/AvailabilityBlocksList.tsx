import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { supabase, fetchAllRows } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface AvailabilityBlock {
  id: string;
  court_id: string;
  block_date: string;
  start_time: string;
  end_time: string;
  block_type: string;
  notes: string | null;
  player_count: number | null;
  court?: {
    name: string;
  };
}

interface Court {
  id: string;
  name: string;
}

const BLOCK_TYPES = [
  { value: 'reservation', label: 'Court Reservation', color: 'blue' },
  { value: 'maintenance', label: 'Maintenance', color: 'yellow' },
  { value: 'private_event', label: 'Private Event', color: 'purple' },
  { value: 'clinic', label: 'Clinic', color: 'green' },
  { value: 'tournament', label: 'Tournament', color: 'red' },
  { value: 'league', label: 'League', color: 'indigo' },
  { value: 'staff_block', label: 'Staff Block', color: 'gray' },
  { value: 'other', label: 'Other', color: 'gray' },
];

export function AvailabilityBlocksList() {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourt, setFilterCourt] = useState('');
  const [filterType, setFilterType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<AvailabilityBlock | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchCourts();
    fetchBlocks();
  }, []);

  const fetchCourts = async () => {
    const { data, error } = await supabase
      .from('courts')
      .select('id, name')
      .order('name');

    if (!error && data) {
      setCourts(data);
    }
  };

  const fetchBlocks = async () => {
    setLoading(true);
    const buildQuery = () => {
      let query = supabase
        .from('court_availability_blocks')
        .select(`
          *,
          court:courts(name)
        `)
        .order('block_date', { ascending: false })
        .order('start_time');

      if (filterCourt) {
        query = query.eq('court_id', filterCourt);
      }

      if (filterType) {
        query = query.eq('block_type', filterType);
      }

      if (dateFrom) {
        query = query.gte('block_date', dateFrom);
      }

      if (dateTo) {
        query = query.lte('block_date', dateTo);
      }

      return query;
    };

    const data = await fetchAllRows<AvailabilityBlock>(buildQuery);
    setBlocks(data);

    setLoading(false);
  };

  useEffect(() => {
    fetchBlocks();
  }, [filterCourt, filterType, dateFrom, dateTo]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('court_availability_blocks')
      .delete()
      .eq('id', id);

    if (!error) {
      setBlocks(blocks.filter((b) => b.id !== id));
      setDeleteConfirm(null);
    }
  };

  const filteredBlocks = blocks.filter((block) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      block.court?.name.toLowerCase().includes(searchLower) ||
      block.block_type.toLowerCase().includes(searchLower) ||
      block.notes?.toLowerCase().includes(searchLower)
    );
  });

  const getBlockTypeColor = (type: string) => {
    const blockType = BLOCK_TYPES.find((t) => t.value === type);
    return blockType?.color || 'gray';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Availability Blocks</h2>
          <p className="text-sm text-gray-600">Total: {filteredBlocks.length.toLocaleString()} blocks</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Block
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={filterCourt}
          onChange={(e) => setFilterCourt(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Courts</option>
          {courts.map((court) => (
            <option key={court.id} value={court.id}>
              {court.name}
            </option>
          ))}
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Types</option>
          {BLOCK_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          placeholder="From Date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <input
          type="date"
          placeholder="To Date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filteredBlocks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No availability blocks found</p>
          <p className="text-sm text-gray-500 mt-1">Add your first block to get started</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Court</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Players</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBlocks.map((block) => (
                <tr key={block.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {block.court?.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(block.block_date + 'T00:00:00').toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {block.start_time.slice(0, 5)} - {block.end_time.slice(0, 5)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full bg-${getBlockTypeColor(
                        block.block_type
                      )}-100 text-${getBlockTypeColor(block.block_type)}-800`}
                    >
                      {BLOCK_TYPES.find((t) => t.value === block.block_type)?.label || block.block_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {block.notes || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {block.player_count || '—'}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {deleteConfirm === block.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDelete(block.id)}
                          className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingBlock(block)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(block.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
