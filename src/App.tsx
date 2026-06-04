import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { AuthModal } from './components/AuthModal';
import { NotFound } from './components/NotFound';
import LoadingScreen from './components/LoadingScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { A11yAnnouncerProvider } from './components/A11yAnnouncer';
import InstallPWA from './components/InstallPWA';
import AchievementCelebrationModal from './components/AchievementCelebrationModal';
import { useAchievementNotifications } from './hooks/useAchievementNotifications';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App as CapacitorApp } from '@capacitor/app';
import { supabase } from './lib/supabase';

const HomePage = lazy(() => import('./components/HomePage').then(m => ({ default: m.HomePage })));
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
const AccountDeletion = lazy(() => import('./components/AccountDeletion'));
const WaitlistManagement = lazy(() => import('./components/WaitlistManagement'));
const PartnerFinder = lazy(() => import('./components/PartnerFinder'));
const LoyaltyRewards = lazy(() => import('./components/LoyaltyRewards'));
const MerchShop = lazy(() => import('./components/MerchShop'));
const GroupsList = lazy(() => import('./components/groups/GroupsList'));
const GroupDetail = lazy(() => import('./components/groups/GroupDetail'));
const MatchRequestsBoard = lazy(() => import('./components/social/MatchRequestsBoard'));

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
  const { currentAchievement, dismissAchievement } = useAchievementNotifications();

  useEffect(() => {
    if (isNative) {
      StatusBar.setStyle({ style: Style.Light });
      StatusBar.setBackgroundColor({ color: '#1B2A4A' });

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
    return <LoadingScreen message="Initializing app..." />;
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
      case 'groups':
        navigate('/groups');
        break;
      case 'match-requests':
        navigate('/match-requests');
        break;
      case 'community':
      default:
        navigate('/');
        break;
    }
  };

  const LoadingFallback = () => <LoadingScreen message="Loading content..." timeout={15000} />;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg focus:text-green-700 focus:font-semibold"
        >
          Skip to content
        </a>
        <ScrollToTop />
        <Navbar
          onAuthClick={() => {
            setAuthMode('login');
            setShowAuthModal(true);
          }}
          onViewChange={handleViewChange}
        />

        <main id="main-content">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
        <Route path="/" element={
          user ? (
            <CommunityHub
              onAuthRequired={(mode = 'login') => {
                setAuthMode(mode);
                setShowAuthModal(true);
              }}
            />
          ) : (
            <HomePage
              onAuthRequired={(mode = 'login') => {
                setAuthMode(mode);
                setShowAuthModal(true);
              }}
            />
          )
        } />

        <Route path="/community" element={
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
                                <a href="/groups" className="block mb-3 rounded-2xl bg-white border border-slate-200/60 px-4 py-3.5 shadow-sm hover:border-emerald-300 hover:shadow-md transition group">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold">My Groups</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">Thursday Night Crew, Drill Squad, and more →</div>
                    </div>
                    <div className="hidden sm:block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">Open</div>
                  </div>
                </a>
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
                          <a href="/match-requests" className="block mb-3 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-white px-4 py-3.5 shadow-sm hover:shadow-md transition group">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wider text-white/70 font-bold">Looking for someone to play with?</div>
                    <div className="text-sm font-bold mt-0.5">Browse open match requests →</div>
                  </div>
                  <div className="hidden sm:block px-3 py-1 rounded-full bg-white/95 text-emerald-900 text-xs font-bold">Open court board</div>
                </div>
              </a>
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
        <Route path="/account/delete" element={<AccountDeletion />} />

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

        <Route path="/merch" element={<MerchShop />} />

        
        <Route path="/groups" element={
          user ? (
            <div className="min-h-screen bg-gray-50 pb-24">
              <div className="max-w-3xl mx-auto">
                <GroupsList onOpenGroup={(id) => navigate('/groups/' + id)} />
              </div>
            </div>
          ) : <div className="min-h-screen bg-gray-50 pb-20" />
        } />

        <Route path="/groups/:groupId" element={<GroupDetailRoute />} />

        <Route path="/match-requests" element={
          user ? (
            <div className="min-h-screen bg-gray-50 pb-24">
              <div className="max-w-3xl mx-auto">
                <MatchRequestsBoard />
              </div>
            </div>
          ) : <div className="min-h-screen bg-gray-50 pb-20" />
        } />

        <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      </main>

      <BottomNav onViewChange={handleViewChange} />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
      />

      <AchievementCelebrationModal
        achievement={currentAchievement}
        onClose={dismissAchievement}
        onShare={async () => {
          if (!currentAchievement || !user) return;

          try {
            const { data: facility } = await supabase
              .from('facility_users')
              .select('facility_id')
              .eq('user_id', user.id)
              .maybeSingle();

            await supabase
              .from('social_posts')
              .insert({
                user_id: user.id,
                facility_id: facility?.facility_id || null,
                content: `Just unlocked the "${currentAchievement.name}" achievement! ${currentAchievement.rarity === 'legendary' ? '🏆' : currentAchievement.rarity === 'epic' ? '⭐' : '✨'}`,
                metadata: {
                  achievement_id: currentAchievement.id,
                  achievement_name: currentAchievement.name,
                  achievement_icon: currentAchievement.icon,
                  achievement_rarity: currentAchievement.rarity,
                  achievement_points: currentAchievement.points,
                  post_type: 'achievement'
                }
              });

            dismissAchievement();
            navigate('/');
          } catch (error) {
            console.error('Error sharing achievement:', error);
          }
        }}
      />

      {!isNative && <InstallPWA />}
      </div>
    </ErrorBoundary>
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

  if (!postId) {
    return <NotFound />;
  }

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

  if (!userId) {
    return <NotFound />;
  }

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

  const handleRegister = async (sid: string, selectedOccurrences: string[]) => {
    setSearchParams({ occurrences: selectedOccurrences.join(',') });
    navigate(`/series/${sid}/register?occurrences=${selectedOccurrences.join(',')}`);
  };

  if (!seriesId) {
    return <NotFound />;
  }

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


function GroupDetailRoute() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  if (!groupId) return <NotFound />;
  return <GroupDetail groupId={groupId} onBack={() => navigate('/groups')} />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <A11yAnnouncerProvider>
          <AppContent />
        </A11yAnnouncerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
