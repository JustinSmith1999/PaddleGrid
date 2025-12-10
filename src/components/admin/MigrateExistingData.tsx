import { useState } from 'react';
import { Database, Loader2, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { existingReservations } from '../../lib/reservationData';
import CourtReserveSync from './CourtReserveSync';
import CourtReserveEventSync from './CourtReserveEventSync';

const FACILITY_ID = 'bfb8aa81-fca9-48d9-b697-d13bba78430e';

const COURT_NAME_TO_ID: Record<string, string> = {
  'Championship Court #1': '73df00e9-f614-4952-bad2-68e2c459cbe0',
  'Court #10': '8233bd81-c3b1-4bbe-a3a1-781ee8f46a72',
  'Court #11': 'e954f880-bb5d-4a85-b58d-5e5a5110b1e4',
  'Court #12': '088a8b78-2cd1-42ab-8af7-c11d4acebabe',
  'Court #13': '3e1d3a6c-ac22-431d-99f2-0131356ff751',
  'Court #14': 'bdf6e7b2-673d-471e-814c-3715e5d1a14b',
  'Court #15': 'e59242d7-57a0-44f2-979d-e6074055e84d',
  'Court #16 (Championship)': 'cdce47d8-4b4e-4885-bb9c-10f0b6077d5c',
  'Court #2': 'c359066e-3322-466b-b13f-fb4b390eda5b',
  'Court #3': '0152c2a0-c5b9-4302-bd2e-ff34f3ef1de7',
  'Court #4': '8f5692a6-0137-4668-8b81-ed74d1e4f3db',
  'Court #5': '66262756-bea7-46eb-95fc-e3f32cf52776',
  'Court #6 Pickleball or Backyard Games': 'f1fcc789-a101-4bdd-a4a7-dbc5740d4f88',
  'Court #7': '2c75cfd5-9cba-4187-8517-630d2be4e88e',
  'Court #8': '2072d095-9354-4ef1-a4b7-2eb9991399a7',
  'Court #9': '3916b981-f4c5-4536-a044-31a8f0881865',
};

function mapReservationType(type: string): string {
  const typeLower = type.toLowerCase();
  if (typeLower.includes('tournament')) return 'tournament';
  if (typeLower.includes('league')) return 'league';
  if (typeLower.includes('clinic')) return 'clinic';
  if (typeLower.includes('private')) return 'private_event';
  if (typeLower.includes('open play')) return 'other';
  if (typeLower.includes('lesson')) return 'clinic';
  return 'reservation';
}

export function MigrateExistingData() {
  const [isImporting, setIsImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalReservations: existingReservations.length,
    totalBlocks: 0,
    inserted: 0,
    skipped: 0,
    failed: 0,
  });
  const [existingCount, setExistingCount] = useState<number | null>(null);

  const checkExistingData = async () => {
    const { count, error } = await supabase
      .from('court_availability_blocks')
      .select('*', { count: 'exact', head: true })
      .eq('facility_id', FACILITY_ID);

    if (!error && count !== null) {
      setExistingCount(count);
    }
  };

  useState(() => {
    checkExistingData();
  });

  const handleImport = async () => {
    setIsImporting(true);
    setError('');
    setImportComplete(false);

    try {
      const blocksToInsert = [];
      let skippedCount = 0;

      for (const reservation of existingReservations) {
        const { type, date, startTime, endTime, courts, players } = reservation;

        for (const courtName of courts) {
          const courtId = COURT_NAME_TO_ID[courtName];

          if (!courtId) {
            console.warn(`Unknown court name: "${courtName}" - skipping`);
            skippedCount++;
            continue;
          }

          blocksToInsert.push({
            facility_id: FACILITY_ID,
            court_id: courtId,
            block_date: date,
            start_time: startTime,
            end_time: endTime,
            block_type: mapReservationType(type),
            notes: type,
            player_count: players || null,
          });
        }
      }

      const BATCH_SIZE = 100;
      let insertedCount = 0;
      let failedCount = 0;

      for (let i = 0; i < blocksToInsert.length; i += BATCH_SIZE) {
        const batch = blocksToInsert.slice(i, i + BATCH_SIZE);

        const { error: insertError } = await supabase
          .from('court_availability_blocks')
          .insert(batch);

        if (insertError) {
          console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, insertError);
          failedCount += batch.length;
        } else {
          insertedCount += batch.length;
        }

        setStats({
          totalReservations: existingReservations.length,
          totalBlocks: blocksToInsert.length,
          inserted: insertedCount,
          skipped: skippedCount,
          failed: failedCount,
        });
      }

      if (failedCount === 0) {
        setImportComplete(true);
        await checkExistingData();
      } else {
        setError(`Import completed with errors: ${failedCount} blocks failed to insert`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <CourtReserveSync facilityId={FACILITY_ID} />

      <CourtReserveEventSync facilityId={FACILITY_ID} />

      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-600 rounded-lg">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Import Existing Reservations</h3>
            <p className="text-sm text-gray-600 mt-1">
              Import {existingReservations.length} existing reservations from your TypeScript data file into the database.
              This is a one-time operation to migrate your hardcoded reservation data.
            </p>
          </div>
        </div>
      </div>

      {existingCount !== null && existingCount > 0 && !importComplete && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-yellow-900">Data Already Exists</h4>
              <p className="text-sm text-yellow-800 mt-1">
                There are already {existingCount} availability blocks in the database for Pickleball Heaven.
                Importing will add more blocks (duplicates may occur).
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Reservations</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.totalReservations}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Total Blocks</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.totalBlocks || '—'}</div>
          <div className="text-xs text-gray-500 mt-1">Including multi-court bookings</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Inserted</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.inserted}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Skipped/Failed</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.skipped + stats.failed}</div>
        </div>
      </div>

      {importComplete && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-green-900">Import Successful!</h4>
              <p className="text-sm text-green-800 mt-1">
                Successfully imported {stats.inserted} availability blocks into the database.
                The booking system will now use this data to check court availability in real-time.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-red-900">Import Error</h4>
              <p className="text-sm text-red-800 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleImport}
          disabled={isImporting || importComplete}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isImporting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Importing...
            </>
          ) : importComplete ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Import Complete
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Start Import
            </>
          )}
        </button>

        {importComplete && (
          <button
            onClick={() => {
              setImportComplete(false);
              setStats({
                totalReservations: existingReservations.length,
                totalBlocks: 0,
                inserted: 0,
                skipped: 0,
                failed: 0,
              });
            }}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">What happens during import?</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Reads all {existingReservations.length} reservations from reservationData.ts</li>
          <li>• Maps court names to database court IDs</li>
          <li>• Converts reservation types to block types (tournament, clinic, etc.)</li>
          <li>• Inserts availability blocks in batches of 100</li>
          <li>• Updates real-time statistics during the import process</li>
        </ul>
      </div>
    </div>
  );
}
