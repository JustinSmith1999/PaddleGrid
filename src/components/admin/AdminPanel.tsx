import { useState, useEffect, lazy, Suspense } from 'react';
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
import SmartAnalytics from './SmartAnalytics';
import MembershipsPage from './MembershipsPage';
import CampaignsPage from './CampaignsPage';
import DynamicPricing from './DynamicPricing';
import SmartFill from './SmartFill';
import EngagementScoring from './EngagementScoring';
import ChurnAlerts from './ChurnAlerts';
import WaitlistManager from './WaitlistManager';
import NotificationTemplates from './NotificationTemplates';
import RevenueCharts from './RevenueCharts';
import AdminSponsors from './AdminSponsors';
import AdminGroupBlast from './AdminGroupBlast';
import AdminPartnerships from './AdminPartnerships';
import AdminIntegrations from './AdminIntegrations';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

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

  const LoadingFallback = () => (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
      <p className="text-sm text-slate-500">Loading...</p>
    </div>
  );

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
        return facilityId ? <TransactionsSync facilityId={facilityId} /> : <LoadingFallback />;
      case 'podplay':
        return <PodPlaySync />;
      case 'waivers':
        return <SignedWaiversPanel />;
      case 'notifications':
        return <NotificationTemplates />;
      case 'achievements':
        return facilityId ? <ClubAchievementsManager facilityId={facilityId} /> : <LoadingFallback />;
      case 'analytics':
        return <SmartAnalytics facilityId={facilityId} />;
      case 'revenue':
        return <RevenueCharts facilityId={facilityId} />;
      case 'reporting':
        return <AdminReporting />;
      case 'settings':
        return <AdminSettings />;
      case 'memberships':
        return <MembershipsPage />;
      case 'campaigns':
        return <CampaignsPage />;
      case 'dynamic-pricing':
        return <DynamicPricing facilityId={facilityId} />;
      case 'smart-fill':
        return <SmartFill />;
      case 'engagement':
        return <EngagementScoring facilityId={facilityId} />;
      case 'churn-alerts':
        return <ChurnAlerts />;
      case 'waitlist':
        return <WaitlistManager />;
      case 'sponsors':
        return <AdminSponsors facilityId={facilityId} />;
      case 'group-blast':
        return <AdminGroupBlast facilityId={facilityId} />;
      case 'partnerships':
        return <AdminPartnerships facilityId={facilityId} />;
      case 'integrations':
        return <AdminIntegrations facilityId={facilityId} />;
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
