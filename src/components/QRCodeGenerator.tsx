import { useState, useEffect } from 'react';
import { QrCode, Download, Printer, Grid3x3 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sortCourtsByNumber } from '../lib/courtUtils';

interface Court {
  id: string;
  name: string;
  facility_id: string;
  facility_name: string;
}

export function QRCodeGenerator() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    loadCourts();
  }, []);

  useEffect(() => {
    if (selectedCourt) {
      generateQRCode();
    }
  }, [selectedCourt]);

  async function loadCourts() {
    try {
      const { data, error } = await supabase
        .from('courts')
        .select(`
          id,
          name,
          facility_id,
          facilities (
            name
          )
        `);

      if (error) throw error;

      const formattedCourts = data.map((c: any) => ({
        id: c.id,
        name: c.name,
        facility_id: c.facility_id,
        facility_name: c.facilities?.name || 'Unknown Facility'
      }));

      setCourts(sortCourtsByNumber(formattedCourts));
    } catch (error) {
      console.error('Error loading courts:', error);
    } finally {
      setLoading(false);
    }
  }

  function generateQRCode() {
    if (!selectedCourt) return;

    const baseUrl = window.location.origin;
    const reportUrl = `${baseUrl}/report-match?court=${selectedCourt.id}`;

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(reportUrl)}`;
    setQrCodeUrl(qrUrl);
  }

  function downloadQRCode() {
    if (!qrCodeUrl || !selectedCourt) return;

    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qr-code-${selectedCourt.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function printQRCode() {
    if (!qrCodeUrl) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${selectedCourt?.name}</title>
          <style>
            body {
              margin: 0;
              padding: 40px;
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            h1 {
              font-size: 32px;
              margin: 0 0 10px 0;
              color: #10b981;
            }
            .facility {
              font-size: 20px;
              color: #6b7280;
              margin-bottom: 5px;
            }
            .court-name {
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
            }
            .qr-container {
              border: 4px solid #10b981;
              padding: 20px;
              border-radius: 16px;
              background: white;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            img {
              display: block;
              width: 400px;
              height: 400px;
            }
            .instructions {
              margin-top: 30px;
              text-align: center;
              max-width: 500px;
            }
            .instructions h2 {
              font-size: 20px;
              color: #1f2937;
              margin-bottom: 15px;
            }
            .instructions p {
              font-size: 16px;
              color: #6b7280;
              line-height: 1.6;
            }
            @media print {
              body {
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Report Your Match</h1>
            <div class="facility">${selectedCourt?.facility_name}</div>
            <div class="court-name">${selectedCourt?.name}</div>
          </div>

          <div class="qr-container">
            <img src="${qrCodeUrl}" alt="QR Code" />
          </div>

          <div class="instructions">
            <h2>How to Report Your Match</h2>
            <p>
              Scan this QR code with your smartphone camera to quickly report your match results.
              The form will automatically fill in the court information.
            </p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  function downloadAllQRCodes() {
    courts.forEach((court, index) => {
      const baseUrl = window.location.origin;
      const reportUrl = `${baseUrl}/report-match?court=${court.id}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(reportUrl)}`;

      setTimeout(() => {
        const link = document.createElement('a');
        link.href = qrUrl;
        link.download = `qr-code-${court.name.replace(/\s+/g, '-').toLowerCase()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 500);
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <QrCode className="w-6 h-6 text-emerald-600" />
            <h2 className="text-2xl font-bold text-gray-800">QR Code Generator</h2>
          </div>

          {courts.length > 0 && (
            <button
              onClick={downloadAllQRCodes}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download All
            </button>
          )}
        </div>

        <p className="text-gray-600 mb-6">
          Generate QR codes for each court to enable quick match reporting. Players can scan the code with their phones
          to instantly access the match reporting form with the court pre-selected.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Grid3x3 className="w-5 h-5 text-emerald-600" />
              Select a Court
            </h3>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {courts.map((court) => (
                <button
                  key={court.id}
                  onClick={() => setSelectedCourt(court)}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition ${
                    selectedCourt?.id === court.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold text-gray-800">{court.name}</div>
                  <div className="text-sm text-gray-600">{court.facility_name}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            {selectedCourt ? (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">QR Code Preview</h3>

                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border-2 border-emerald-200">
                  <div className="text-center mb-4">
                    <h4 className="text-lg font-bold text-gray-800">{selectedCourt.name}</h4>
                    <p className="text-sm text-gray-600">{selectedCourt.facility_name}</p>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-md inline-block w-full">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="w-full max-w-sm mx-auto"
                    />
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={downloadQRCode}
                      className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Download
                    </button>
                    <button
                      onClick={printQRCode}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                      <Printer className="w-5 h-5" />
                      Print
                    </button>
                  </div>
                </div>

                <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm">Usage Instructions</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Print and display the QR code at the court</li>
                    <li>• Players scan with their phone camera</li>
                    <li>• Match reporting form opens automatically</li>
                    <li>• Court information is pre-filled</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <QrCode className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium">Select a court to generate QR code</p>
                <p className="text-sm text-gray-500 mt-1">
                  Choose a court from the list to see its QR code
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
