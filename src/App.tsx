import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { AuthModal } from './components/AuthModal';
import { NotFound } from './components/NotFound';
import { Loader2 } from 'lucide-react';
import InstallPWA from './components/InstallPWA';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App as CapacitorApp } from '@capacitor/app';

const SalesPage = lazy(() => import('./components/SalesPage').then(m => ({ default: m.SalesPage })));
const BrowseCourts = lazy(() => import('./components/BrowseCourts').then(m => ({ default: m.BrowseCourts })));
const UserBookings = lazy(() => import('./components/UserBookings').then(m => ({ default: m.UserBookings })));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel').then(m => ({ default: m.AdminPanel })));
const PlayerProfile = lazy(() => import('./components/PlayerProfile').then(m => ({ default: m.PlayerProfile })));
const PublicPlayerProfile = lazy(() => import('./components/PublicPlayerProfile').then(m => ({ default: m.PublicPlayerProfile })));
const SeriesBrowser = lazy(() => import('./components/SeriesBrowser'));
const SeriesDetail = lazy(() => import('./components/SeriesDetail'));
const SeriesRegistration = lazy(() => import('./components/SeriesRegistration'));
const MySeries = lazy(() => import('./components/MySeries'));
const CommunityHub = lazy(() => import('./components/CommunityHub'));
const PostDetail = lazy(() => import('./components/social/PostDetail'));
const ClubPage = lazy(() => import('./components/ClubPage'));
const PlayerDiscovery = lazy(() => import('./components/social/PlayerDiscovery'));
const Messages = lazy(() => import('./components/social/Messages'));
const PrivacyPolicy = lazy(() => import('./components/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/TermsOfService'));
const Support = lazy(() => import('./components/Support'));
const WaitlistManagement = lazy(() => import('./components/WaitlistManagement'));
const PartnerFinder = lazy(() => import('./components/PartnerFinder'));
const LoyaltyRewards = lazy(() => import('./components/LoyaltyRewards'));

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AppContent() {
  const { loading, isAdmin, user, profile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'facility'>('login');
  const navigate = useNavigate();
  const location = useLocation();
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (isNative) {
      StatusBar.setStyle({ style: Style.Light });
      StatusBar.setBackgroundColor({ color: '#10B981' });

      CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          CapacitorApp.exitApp();
        }
      });

      return () => {
        CapacitorApp.removeAllListeners();
      };
    }
  }, [isNative]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading PaddleGrid...</p>
        </div>
      </div>
    );
  }

  const handleViewChange = (view: string) => {
    switch (view) {
      case 'sales':
        navigate('/sales');
        break;
      case 'browse':
        navigate('/browse');
        break;
      case 'bookings':
        navigate('/bookings');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'admin':
        navigate('/admin');
        break;
      case 'series':
        navigate('/series');
        break;
      case 'my-series':
        navigate('/my-series');
        break;
      case 'discover':
        navigate('/discover');
        break;
      case 'messages':
        navigate('/messages');
        break;
      case 'waitlist':
        navigate('/waitlist');
        break;
      case 'partners':
        navigate('/partners');
        break;
      case 'rewards':
        navigate('/rewards');
        break;
      case 'community':
      default:
        navigate('/');
        break;
    }
  };

  const LoadingFallback = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <ScrollToTop />
      <Navbar
        onAuthClick={() => {
          setAuthMode('login');
          setShowAuthModal(true);
        }}
        onViewChange={handleViewChange}
      />

      <Suspense fallback={<LoadingFallback />}>
        <Routes>
        <Route path="/" element={
          <CommunityHub
            onAuthRequired={(mode = 'login') => {
              setAuthMode(mode);
              setShowAuthModal(true);
            }}
          />
        } />

        <Route path="/sales" element={
          <SalesPage
            onAuthRequired={(mode = 'login') => {
              setAuthMode(mode);
              setShowAuthModal(true);
            }}
          />
        } />

        <Route path="/club/:slug" element={<ClubPageRoute />} />
        <Route path="/post/:postId" element={<PostDetailRoute />} />
        <Route path="/player/:userId" element={<PublicPlayerProfileRoute />} />

        <Route path="/discover" element={
          user ? (
            <div className="min-h-screen bg-gray-50 pb-20">
              <div className="max-w-2xl mx-auto">
                <PlayerDiscovery
                  onProfileClick={(userId) => navigate(`/player/${userId}`)}
                />
              </div>
            </div>
          ) : <div className="min-h-screen bg-gray-50 pb-20" />
        } />

        <Route path="/messages" element={
          user ? (
            <div className="min-h-screen bg-gray-50 pb-20">
              <div className="max-w-4xl mx-auto">
                <Messages />
              </div>
            </div>
          ) : <div className="min-h-screen bg-gray-50 pb-20" />
        } />

        <Route path="/browse" element={
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 py-8 pb-24">
            <BrowseCourts />
          </div>
        } />

        <Route path="/bookings" element={
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 py-8 pb-24">
            <UserBookings />
          </div>
        } />

        <Route path="/profile" element={
          <div className="pb-20">
            <PlayerProfile />
          </div>
        } />

        <Route path="/admin" element={
          isAdmin ? (
            <div className="pb-20">
              <AdminPanel />
            </div>
          ) : <div className="min-h-screen bg-gray-50 pb-20" />
        } />

        <Route path="/series" element={<SeriesBrowserRoute />} />
        <Route path="/series/:seriesId" element={<SeriesDetailRoute />} />
        <Route path="/series/:seriesId/register" element={<SeriesRegistrationRoute />} />
        <Route path="/my-series" element={<MySeriesRoute />} />

        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/support" element={<Support />} />

        <Route path="/waitlist" element={
          user ? (
            <div className="min-h-screen bg-gray-50 py-8 pb-24">
              <WaitlistManagement />
            </div>
          ) : <div className="min-h-screen bg-gray-50 pb-20" />
        } />

        <Route path="/partners" element={
          user ? (
            <div className="min-h-screen bg-gray-50 py-8 pb-24">
              <PartnerFinder />
            </div>
          ) : <div className="min-h-screen bg-gray-50 pb-20" />
        } />

        <Route path="/rewards" element={
          user ? (
            <div className="min-h-screen bg-gray-50 py-8 pb-24">
              <LoyaltyRewards />
            </div>
          ) : <div className="min-h-screen bg-gray-50 pb-20" />
        } />

        <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>

      <BottomNav onViewChange={handleViewChange} />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
      />

      {!isNative && <InstallPWA />}
    </div>
  );
}

function ClubPageRoute() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [facilityId, setFacilityId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFacility = async () => {
      if (!slug) return;
      const { supabase } = await import('./lib/supabase');
      const { data } = await supabase
        .from('facilities')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (data) {
        setFacilityId(data.id);
      }
    };
    fetchFacility();
  }, [slug]);

  if (!facilityId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return <ClubPage facilityId={facilityId} onBack={() => navigate('/')} />;
}

function PostDetailRoute() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  if (!postId) return null;

  return (
    <PostDetail
      postId={postId}
      onBack={() => navigate('/')}
      onProfileClick={(userId) => navigate(`/player/${userId}`)}
      onClubClick={(slug) => navigate(`/club/${slug}`)}
    />
  );
}

function PublicPlayerProfileRoute() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  if (!userId) return null;

  return <PublicPlayerProfile userId={userId} onBack={() => navigate('/')} />;
}

function SeriesBrowserRoute() {
  const navigate = useNavigate();
  return <SeriesBrowser onSeriesClick={(seriesId) => navigate(`/series/${seriesId}`)} />;
}

function SeriesDetailRoute() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  if (!seriesId) return null;

  const handleRegister = async (sid: string, selectedOccurrences: string[]) => {
    setSearchParams({ occurrences: selectedOccurrences.join(',') });
    navigate(`/series/${sid}/register?occurrences=${selectedOccurrences.join(',')}`);
  };

  return (
    <SeriesDetail
      seriesId={seriesId}
      onBack={() => navigate('/series')}
      onRegister={handleRegister}
    />
  );
}

function SeriesRegistrationRoute() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [registrationData, setRegistrationData] = useState<{
    seriesId: string;
    seriesTitle: string;
    occurrenceIds: string[];
    occurrences: any[];
    pricePerSession: number;
    discountPercentage: number;
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!seriesId) return;

      const occurrenceIds = searchParams.get('occurrences')?.split(',') || [];
      if (occurrenceIds.length === 0) {
        navigate(`/series/${seriesId}`);
        return;
      }

      const { supabase } = await import('./lib/supabase');

      const { data: series } = await supabase
        .from('event_series')
        .select('title, price_per_session, series_discount_percentage')
        .eq('id', seriesId)
        .maybeSingle();

      const { data: occurrences } = await supabase
        .from('event_series_occurrences')
        .select('*, courts(name)')
        .in('id', occurrenceIds);

      if (series && occurrences) {
        setRegistrationData({
          seriesId,
          seriesTitle: series.title,
          occurrenceIds,
          occurrences,
          pricePerSession: series.price_per_session,
          discountPercentage: occurrenceIds.length === occurrences.length
            ? series.series_discount_percentage
            : 0
        });
      }
    };
    loadData();
  }, [seriesId, searchParams, navigate]);

  if (!registrationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <SeriesRegistration
      {...registrationData}
      onComplete={() => navigate('/my-series')}
      onCancel={() => navigate(`/series/${seriesId}`)}
    />
  );
}

function MySeriesRoute() {
  const navigate = useNavigate();
  return <MySeries onSeriesClick={(seriesId) => navigate(`/series/${seriesId}`)} />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
