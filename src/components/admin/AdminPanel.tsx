import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { AdminReporting } from './AdminReporting';
import { AdminBookings } from './AdminBookings';
import CourtScheduleView from './CourtScheduleView';
import MemberSearch from './MemberSearch';
import AdminSettings from './AdminSettings';
import FacilityManagement from './FacilityManagement';
import SeriesManagement from './SeriesManagement';
import SeriesEditor from './SeriesEditor';
import SeriesDetails from './SeriesDetails';
import SeriesCalendar from './SeriesCalendar';
import { CourtAvailabilityManagement } from './CourtAvailabilityManagement';
import { OperatingHours } from './OperatingHours';
import PreRegisteredUsers from './PreRegisteredUsers';
import TransactionsSync from './TransactionsSync';
import BookingNotificationTest from './BookingNotificationTest';
import SignedWaiversPanel from './SignedWaiversPanel';
import ClubAchievementsManager from './ClubAchievementsManager';
import PodPlaySync from './PodPlaySync';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export function AdminPanel() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [seriesView, setSeriesView] = useState<'list' | 'calendar' | 'edit' | 'details'>('list');
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [facilityId, setFacilityId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadUserFacility();
  }, [user]);

  const loadUserFacility = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('facility_users')
      .select('facility_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setFacilityId(data.facility_id);
    }
  };

  const renderSeriesView = () => {
    switch (seriesView) {
      case 'list':
        return (
          <SeriesManagement
            onCreateNew={() => {
              setSelectedSeriesId(null);
              setSeriesView('edit');
            }}
            onEdit={(seriesId) => {
              setSelectedSeriesId(seriesId);
              setSeriesView('edit');
            }}
            onViewDetails={(seriesId) => {
              setSelectedSeriesId(seriesId);
              setSeriesView('details');
            }}
          />
        );
      case 'calendar':
        return (
          <SeriesCalendar
            onOccurrenceClick={(occurrenceId, seriesId) => {
              setSelectedSeriesId(seriesId);
              setSeriesView('details');
            }}
          />
        );
      case 'edit':
        return (
          <SeriesEditor
            seriesId={selectedSeriesId || undefined}
            onSave={() => {
              setSeriesView('list');
              setSelectedSeriesId(null);
            }}
            onCancel={() => {
              setSeriesView('list');
              setSelectedSeriesId(null);
            }}
          />
        );
      case 'details':
        return selectedSeriesId ? (
          <SeriesDetails
            seriesId={selectedSeriesId}
            onBack={() => setSeriesView('list')}
            onEdit={() => setSeriesView('edit')}
          />
        ) : null;
      default:
        return null;
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <AdminDashboard onViewChange={setCurrentView} />;
      case 'facilities':
        return <FacilityManagement />;
      case 'hours':
        return <OperatingHours />;
      case 'schedule':
        return <CourtScheduleView />;
      case 'availability':
        return <CourtAvailabilityManagement />;
      case 'bookings':
        return <AdminBookings />;
      case 'series':
        return renderSeriesView();
      case 'members':
        return <MemberSearch />;
      case 'pre-registered':
        return <PreRegisteredUsers />;
      case 'transactions':
        return facilityId ? <TransactionsSync facilityId={facilityId} /> : <div className="p-8 text-center text-stone-600">Loading facility...</div>;
      case 'podplay':
        return <PodPlaySync />;
      case 'waivers':
        return <SignedWaiversPanel />;
      case 'notifications':
        return <BookingNotificationTest />;
      case 'achievements':
        return facilityId ? <ClubAchievementsManager facilityId={facilityId} /> : <div className="p-8 text-center text-gray-600">Loading facility...</div>;
      case 'analytics':
        return <AdminReporting />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <AdminDashboard onViewChange={setCurrentView} />;
    }
  };

  return (
    <AdminLayout currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </AdminLayout>
  );
}
