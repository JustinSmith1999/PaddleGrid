import { useState } from 'react';
import { Calendar, Upload, List, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { AvailabilityBlocksList } from './AvailabilityBlocksList';
import { AvailabilityCalendarView } from './AvailabilityCalendarView';
import { CSVUploadPanel } from './CSVUploadPanel';
import { MigrateExistingData } from './MigrateExistingData';

type Tab = 'list' | 'calendar' | 'upload' | 'migrate';

export function CourtAvailabilityManagement() {
  const [activeTab, setActiveTab] = useState<Tab>('list');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Court Availability Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage court blocks, existing reservations, and availability
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900">About Availability Blocks</h3>
            <p className="text-sm text-blue-800 mt-1">
              Availability blocks prevent users from booking courts during specific times. Use this for existing reservations,
              maintenance periods, private events, tournaments, or any other time when courts should be unavailable.
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('list')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'list'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <List className="w-4 h-4" />
              <span>Manage Blocks</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'calendar'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Calendar View</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'upload'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span>Upload CSV</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('migrate')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'migrate'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Import Existing Data</span>
            </div>
          </button>
        </nav>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === 'list' && <AvailabilityBlocksList />}
        {activeTab === 'calendar' && <AvailabilityCalendarView />}
        {activeTab === 'upload' && <CSVUploadPanel />}
        {activeTab === 'migrate' && <MigrateExistingData />}
      </div>
    </div>
  );
}
