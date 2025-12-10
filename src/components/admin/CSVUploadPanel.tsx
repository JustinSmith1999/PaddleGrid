import { useState, useRef } from 'react';
import { Upload, File, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { parseReservationCSV, ParsedBlock } from '../../lib/csvParser';

const FACILITY_ID = 'bfb8aa81-fca9-48d9-b697-d13bba78430e';

export function CSVUploadPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedBlock[]>([]);
  const [courtMapping, setCourtMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a valid CSV file');
      return;
    }

    setFile(selectedFile);
    setError('');
    await parseCSV(selectedFile);
  };

  const parseCSV = async (file: File) => {
    setLoading(true);

    try {
      const text = await file.text();
      const blocks = parseReservationCSV(text);

      setParsedData(blocks);

      const { data: courts } = await supabase
        .from('courts')
        .select('id, name')
        .eq('facility_id', FACILITY_ID);

      if (courts) {
        const mapping: Record<string, string> = {};
        const uniqueCourts = [...new Set(blocks.map((b) => b.courtName))];

        uniqueCourts.forEach((courtName) => {
          const match = courts.find(
            (c) => c.name.toLowerCase() === courtName.toLowerCase()
          );
          if (match) {
            mapping[courtName] = match.id;
          }
        });

        setCourtMapping(mapping);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    const validRows = parsedData.filter((r) => r.valid && courtMapping[r.courtName]);

    if (validRows.length === 0) {
      setError('No valid rows to import');
      return;
    }

    setImporting(true);
    setError('');
    setSuccess(false);

    try {
      const blocksToInsert = validRows.map((row) => ({
        facility_id: FACILITY_ID,
        court_id: courtMapping[row.courtName],
        block_date: row.date,
        start_time: row.startTime,
        end_time: row.endTime,
        block_type: row.blockType,
        notes: row.notes,
        player_count: row.playerCount,
      }));

      // Process in batches of 500 to avoid large transaction issues
      const BATCH_SIZE = 500;
      let successfulInserts = 0;
      let failedInserts = 0;

      for (let i = 0; i < blocksToInsert.length; i += BATCH_SIZE) {
        const batch = blocksToInsert.slice(i, i + BATCH_SIZE);

        const { data, error: insertError } = await supabase
          .from('court_availability_blocks')
          .insert(batch)
          .select('id');

        if (insertError) {
          failedInserts += batch.length;
          console.error('Batch insert error:', insertError);
        } else {
          successfulInserts += data?.length || 0;
        }
      }

      if (successfulInserts > 0) {
        setSuccess(true);
        setSuccessCount(successfulInserts);
      }

      if (failedInserts > 0) {
        setError(`Imported ${successfulInserts} blocks, but ${failedInserts} failed to insert. Check console for details.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsedData.filter((r) => r.valid && courtMapping[r.courtName]).length;
  const invalidCount = parsedData.length - validCount;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">CSV Format Requirements</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Expected format:</strong> <code className="bg-blue-100 px-1 rounded">Reservation,Date,Time,Courts,Ball Machine,Players</code></p>
          <p><strong>Date format:</strong> "Mon, Dec 8th" (day name, month, day)</p>
          <p><strong>Time format:</strong> "7a - 9a" or "10:30a - 12p" (start - end with am/pm)</p>
          <p><strong>Multiple courts:</strong> Separate with commas (e.g., "Court #1, Court #2")</p>
          <p className="text-xs mt-2 text-blue-700">Each row with multiple courts will create separate availability blocks for each court.</p>
        </div>
      </div>

      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-1">Click to upload CSV file</p>
          <p className="text-sm text-gray-500">or drag and drop</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <File className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-600">{parsedData.length} rows</p>
              </div>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setParsedData([]);
                setSuccess(false);
                setError('');
              }}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Parsing CSV file...</span>
            </div>
          )}

          {!loading && parsedData.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Total Rows</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{parsedData.length}</div>
                </div>
                <div className="bg-white border border-green-200 rounded-lg p-4">
                  <div className="text-sm text-green-600">Valid</div>
                  <div className="text-2xl font-bold text-green-600 mt-1">{validCount}</div>
                </div>
                <div className="bg-white border border-red-200 rounded-lg p-4">
                  <div className="text-sm text-red-600">Invalid</div>
                  <div className="text-2xl font-bold text-red-600 mt-1">{invalidCount}</div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Court</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {parsedData.map((row, idx) => (
                      <tr key={idx} className={!row.valid || !courtMapping[row.courtName] ? 'bg-red-50' : ''}>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.courtName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.date}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {row.startTime} - {row.endTime}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{row.blockType}</td>
                        <td className="px-4 py-3">
                          {row.valid && courtMapping[row.courtName] ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-red-600" />
                              <span className="text-xs text-red-600">
                                {row.errors.join(', ') || 'Court not found'}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {success ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-green-900">Import Successful!</h4>
                      <p className="text-sm text-green-800 mt-1">
                        Successfully imported {successCount} availability blocks from CSV file.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleImport}
                  disabled={importing || validCount === 0}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Import {validCount} Valid Rows
                    </>
                  )}
                </button>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
