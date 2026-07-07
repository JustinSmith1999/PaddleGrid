import { useState, useEffect, lazy, Suspense } from 'react';
import AdminLayout from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
const AdminReporting = lazy(() => import('./AdminReporting').then(m => ({ default: m.AdminReporting })));
const AdminBookings = lazy(() => import('./AdminBookings').then(m => ({ default: m.AdminBookings })));
const CourtScheduleView = lazy(() => import('./CourtScheduleView'));
const MemberSearch = lazy(() => import('./MemberSearch'));
const AdminSettings = lazy(() => import('./AdminSettings'));
const FacilityManagement = lazy(() => import('./FacilityManagement'));
const SeriesManagement = lazy(() => import('./SeriesManagement'));
const SeriesEditor = lazy(() => import('./SeriesEditor'));
const SeriesDetails = lazy(() => import('./SeriesDetails'));
const SeriesCalendar = lazy(() => import('./SeriesCalendar'));
import { CourtAvailabilityManagement } from './CourtAvailabilityManagement';
import { OperatingHours } from './OperatingHours';
const PreRegisteredUsers = lazy(() => import('./PreRegisteredUsers'));
const TransactionsSync = lazy(() => import('./TransactionsSync'));
const BookingNotificationTest = lazy(() => import('./BookingNotificationTest'));
const SignedWaiversPanel = lazy(() => import('./SignedWaiversPanel'));
const ClubAchievementsManager = lazy(() => import('./ClubAchievementsManager'));
const PodPlaySync = lazy(() => import('./PodPlaySync'));
const SmartAnalytics = lazy(() => import('./SmartAnalytics'));
const MembershipsPage = lazy(() => import('./MembershipsPage'));
const CampaignsPage = lazy(() => import('./CampaignsPage'));
const DynamicPricing = lazy(() => import('./DynamicPricing'));
const SmartFill = lazy(() => import('./SmartFill'));
const EngagementScoring = lazy(() => import('./EngagementScoring'));
const ChurnAlerts = lazy(() => import('./ChurnAlerts'));
const WaitlistManager = lazy(() => import('./WaitlistManager'));
const NotificationTemplates = lazy(() => import('./NotificationTemplates'));
const RevenueCharts = lazy(() => import('./RevenueCharts'));
const AdminSponsors = lazy(() => import('./AdminSponsors'));
const AdminGroupBlast = lazy(() => import('./AdminGroupBlast'));
const AdminPartnerships = lazy(() => import('./AdminPartnerships'));
const AdminIntegrations = lazy(() => import('./AdminIntegrations'));
const AdminAmenities = lazy(() => import('./AdminAmenities'));
const AdminPushBlast = lazy(() => import('./AdminPushBlast'));
const AdminAdAnalytics = lazy(() => import('./AdminAdAnalytics'));
const AdminProLive = lazy(() => import('./AdminProLive'));
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

export function AdminPanel() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [seriesView, setSeriesView] = useState<'list' | 'calendar' | 'edit' | 'details'>('list');
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [facilityId, setFacilityId] = useState<string | null>(null);
  const [facilityLoading, setFacilityLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadUserFacility();
  }, [user]);

  const loadUserFacility = async () => {
    if (!user) { setFacilityLoading(false); return; }

    try {
      const { data } = await supabase
        .from('facility_users')
        .select('facility_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setFacilityId(data.facility_id);
      }
    } finally {
      setFacilityLoading(false);
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
      case 'amenities':
        return <AdminAmenities facilityId={facilityId} />;
      case 'push-blast':
        return <AdminPushBlast facilityId={facilityId} />;
      case 'pro-live':
        return <AdminProLive />;
      case 'ad-analytics':
        return <AdminAdAnalytics facilityId={facilityId} />;
      default:
        return <AdminDashboard onViewChange={setCurrentView} />;
    }
  };

  // QA: friendly not-authorized state instead of blank page for non-admin users
  if (facilityLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-6 h-6 text-emerald-700 animate-spin" />
        <p className="text-sm text-slate-500">Loading admin…</p>
      </div>
    );
  }
  if (!facilityId) {
    return (
      <div className="px-6 py-24 text-center max-w-md mx-auto">
        <p className="text-base font-semibold text-slate-800 mb-1" style={{ fontFamily: "'Cinzel','Trajan Pro',serif" }}>Not authorized</p>
        <p className="text-sm text-slate-500">Sign in as a facility admin to access this page. If you think you should have access, contact your facility owner.</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-emerald-700"/></div>}>
      <AdminLayout currentView={currentView} onViewChange={setCurrentView}>
        {renderView()}
      </AdminLayout>
    </Suspense>
  );
}
