import React, { useState, useEffect } from 'react';
import { DollarSign, Download, RefreshCw, Calendar, Filter, CheckCircle2, XCircle, Clock, TrendingUp, Users } from 'lucide-react';
import { supabase, fetchAllRows } from '../../lib/supabase';

interface Transaction {
  id: string;
  transaction_date: string;
  transaction_type: string;
  amount: number;
  payment_type: string;
  payment_status: string;
  customer_name: string;
  customer_email: string;
  description: string;
  event_name: string;
  revenue_category: string;
  created_at: string;
}

interface SyncLog {
  id: string;
  status: string;
  sync_started_at: string;
  sync_completed_at: string;
  transactions_synced: number;
  transactions_updated: number;
  transactions_skipped: number;
  error_message?: string;
  filters_used?: any;
}

interface TransactionsSyncProps {
  facilityId: string;
}

export default function TransactionsSync({ facilityId }: TransactionsSyncProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [view, setView] = useState<'transactions' | 'logs'>('transactions');

  const [filters, setFilters] = useState({
    transactionStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    transactionEndDate: new Date().toISOString().split('T')[0],
    transactionTypes: '',
    paymentTypes: '',
    showOnlyPaidTransactions: false,
    showOnlyUnpaidTransactions: false,
  });

  const [stats, setStats] = useState({
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    transactionCount: 0,
  });

  useEffect(() => {
    loadTransactions();
    loadSyncLogs();
  }, [facilityId]);

  useEffect(() => {
    calculateStats();
  }, [transactions]);

  const calculateStats = () => {
    const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const paidAmount = transactions
      .filter(t => t.payment_status === 'paid')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const unpaidAmount = transactions
      .filter(t => t.payment_status === 'unpaid')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    setStats({
      totalAmount,
      paidAmount,
      unpaidAmount,
      transactionCount: transactions.length,
    });
  };

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await fetchAllRows(() =>
        supabase.from('courtreserve_transactions')
          .select('*')
          .eq('facility_id', facilityId)
          .order('transaction_date', { ascending: false })
      );
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSyncLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('courtreserve_transaction_sync_logs')
        .select('*')
        .eq('facility_id', facilityId)
        .order('sync_started_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSyncLogs(data || []);
    } catch (error) {
      console.error('Error loading sync logs:', error);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const params = new URLSearchParams({
        facility_id: facilityId,
        transactionStartDate: filters.transactionStartDate,
        transactionEndDate: filters.transactionEndDate,
      });

      if (filters.transactionTypes) params.append('transactionTypes', filters.transactionTypes);
      if (filters.paymentTypes) params.append('paymentTypes', filters.paymentTypes);
      if (filters.showOnlyPaidTransactions) params.append('showOnlyPaidTransactions', 'true');
      if (filters.showOnlyUnpaidTransactions) params.append('showOnlyUnpaidTransactions', 'true');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 55000);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/courtreserve-transactions?${params}`,
          {
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);
        const result = await response.json();

        if (result.success) {
          alert(`Sync completed! ${result.stats.transactions_synced} new, ${result.stats.transactions_updated} updated, ${result.stats.transactions_skipped} skipped`);
          await loadTransactions();
          await loadSyncLogs();
        } else {
          throw new Error(result.error || 'Sync failed');
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          throw new Error('Request timed out. Try a shorter date range (e.g., 1-2 days).');
        }
        throw err;
      }
    } catch (error) {
      console.error('Error syncing transactions:', error);
      alert('Failed to sync transactions: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  const exportTransactions = () => {
    const csv = [
      ['Date', 'Type', 'Amount', 'Payment Type', 'Status', 'Customer', 'Email', 'Description'].join(','),
      ...transactions.map(t => [
        t.transaction_date,
        t.transaction_type,
        t.amount,
        t.payment_type,
        t.payment_status,
        t.customer_name,
        t.customer_email,
        t.description,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900">CourtReserve Transactions</h2>
          <p className="text-sm text-stone-600 mt-1">Sync and manage financial transactions from CourtReserve</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView(view === 'transactions' ? 'logs' : 'transactions')}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
          >
            {view === 'transactions' ? 'View Logs' : 'View Transactions'}
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 sm:p-6 border border-stone-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-stone-600">Total Revenue</p>
              <p className="text-xl sm:text-2xl font-bold text-stone-900 mt-1">${stats.totalAmount.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-6 border border-stone-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-stone-600">Paid</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">${stats.paidAmount.toFixed(2)}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-6 border border-stone-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-stone-600">Unpaid</p>
              <p className="text-xl sm:text-2xl font-bold text-orange-600 mt-1">${stats.unpaidAmount.toFixed(2)}</p>
            </div>
            <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-6 border border-stone-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-stone-600">Transactions</p>
              <p className="text-xl sm:text-2xl font-bold text-stone-900 mt-1">{stats.transactionCount}</p>
            </div>
            <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-stone-200 p-4 sm:p-6">
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs sm:text-sm text-blue-800">
            <strong>Note:</strong> Use shorter date ranges (1-7 days) to avoid timeouts. Large date ranges may take longer to process.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilters({
              ...filters,
              transactionStartDate: new Date().toISOString().split('T')[0],
              transactionEndDate: new Date().toISOString().split('T')[0],
            })}
            className="px-3 py-1.5 text-xs bg-stone-100 text-stone-700 rounded hover:bg-stone-200 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setFilters({
              ...filters,
              transactionStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              transactionEndDate: new Date().toISOString().split('T')[0],
            })}
            className="px-3 py-1.5 text-xs bg-stone-100 text-stone-700 rounded hover:bg-stone-200 transition-colors"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setFilters({
              ...filters,
              transactionStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              transactionEndDate: new Date().toISOString().split('T')[0],
            })}
            className="px-3 py-1.5 text-xs bg-stone-100 text-stone-700 rounded hover:bg-stone-200 transition-colors"
          >
            Last 30 Days
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <Filter className="w-5 h-5 text-stone-600 hidden sm:block" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.transactionStartDate}
                onChange={(e) => setFilters({ ...filters, transactionStartDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">End Date</label>
              <input
                type="date"
                value={filters.transactionEndDate}
                onChange={(e) => setFilters({ ...filters, transactionEndDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Transaction Types</label>
              <input
                type="text"
                placeholder="Fee,Payment,Refund"
                value={filters.transactionTypes}
                onChange={(e) => setFilters({ ...filters, transactionTypes: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">Payment Types</label>
              <input
                type="text"
                placeholder="Cash,Credit Card"
                value={filters.paymentTypes}
                onChange={(e) => setFilters({ ...filters, paymentTypes: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.showOnlyPaidTransactions}
                onChange={(e) => setFilters({ ...filters, showOnlyPaidTransactions: e.target.checked })}
                className="rounded text-emerald-600"
              />
              <span className="text-xs sm:text-sm text-stone-700">Paid Only</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.showOnlyUnpaidTransactions}
                onChange={(e) => setFilters({ ...filters, showOnlyUnpaidTransactions: e.target.checked })}
                className="rounded text-emerald-600"
              />
              <span className="text-xs sm:text-sm text-stone-700">Unpaid Only</span>
            </label>
          </div>
          <button
            onClick={exportTransactions}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {view === 'transactions' ? (
        <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-stone-600">
                      Loading transactions...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-stone-600">
                      No transactions found. Click "Sync Now" to import transactions from CourtReserve.
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-stone-50">
                      <td className="px-4 py-3 text-sm text-stone-900">
                        {new Date(transaction.transaction_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-stone-900">{transaction.customer_name}</div>
                        <div className="text-xs text-stone-600">{transaction.customer_email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-700">{transaction.transaction_type}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-stone-900">
                        ${Number(transaction.amount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-700">{transaction.payment_type}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.payment_status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : transaction.payment_status === 'partial'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-stone-100 text-stone-800'
                          }`}
                        >
                          {transaction.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-600 max-w-xs truncate">
                        {transaction.description || transaction.event_name || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700">Started</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700">Synced</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700">Updated</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700">Skipped</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-700">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {syncLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-stone-600">
                      No sync logs yet
                    </td>
                  </tr>
                ) : (
                  syncLogs.map((log) => {
                    const duration = log.sync_completed_at
                      ? Math.round(
                          (new Date(log.sync_completed_at).getTime() -
                            new Date(log.sync_started_at).getTime()) /
                            1000
                        )
                      : null;

                    return (
                      <tr key={log.id} className="hover:bg-stone-50">
                        <td className="px-4 py-3 text-sm text-stone-900">
                          {new Date(log.sync_started_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              log.status === 'success'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.status === 'error'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {log.status === 'success' && <CheckCircle2 className="w-3 h-3" />}
                            {log.status === 'error' && <XCircle className="w-3 h-3" />}
                            {log.status === 'running' && <Clock className="w-3 h-3" />}
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-emerald-600 font-medium">
                          {log.transactions_synced}
                        </td>
                        <td className="px-4 py-3 text-sm text-blue-600 font-medium">
                          {log.transactions_updated}
                        </td>
                        <td className="px-4 py-3 text-sm text-stone-600">{log.transactions_skipped}</td>
                        <td className="px-4 py-3 text-sm text-stone-600">
                          {duration ? `${duration}s` : '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
