import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ExplorePage from './pages/ExplorePage'
import AuctionsPage from './pages/AuctionsPage'
import PropertyDetailsPage from './pages/PropertyDetailsPage'
import SavedPage from './pages/SavedPage'
import MessagesPage from './pages/MessagesPage'
import ProfilePage from './pages/ProfilePage'
import AddListingPage from './pages/AddListingPage'
import ListingPreviewPage from './pages/ListingPreviewPage'
import SignUpPage from './pages/SignUpPage'
import LoginPage from './pages/LoginPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import AgentDashboardLayout from './layouts/AgentDashboardLayout'
import AgentOverviewPage from './pages/agent/AgentOverviewPage'
import AgentSettingsPage from './pages/agent/AgentSettingsPage'
import AgentTransactionsPage from './pages/agent/AgentTransactionsPage'
import AgentProfilePage from './pages/agent/AgentProfilePage'
import AgentLeadsMessagesPage from './pages/agent/AgentLeadsMessagesPage'
import AgentEarningsPayoutsPage from './pages/agent/AgentEarningsPayoutsPage'
import AgentAddListingPage from './pages/agent/AgentAddListingPage'
import AgentPromoteListingsPage from './pages/agent/AgentPromoteListingsPage'
import AgentPromotionPerformancePage from './pages/agent/AgentPromotionPerformancePage'
import AgentViewPerformancePage from './pages/agent/AgentViewPerformancePage'
import AgentListingsPage from './pages/agent/AgentListingsPage'
import AgentEditListingPage from './pages/agent/AgentEditListingPage'
import AdminLayout from './layouts/AdminLayout'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminOverviewPage from './pages/admin/AdminOverviewPage'
import AdminDynamicPage from './pages/admin/AdminDynamicPage'
import AdminAdminsPage from './pages/admin/AdminAdminsPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminAgentsPage from './pages/admin/AdminAgentsPage'
import AdminListingsPage from './pages/admin/AdminListingsPage'
import AdminPromotionsPage from './pages/admin/AdminPromotionsPage'
import AdminTransactionsPage from './pages/admin/AdminTransactionsPage'
import AdminPayoutsPage from './pages/admin/AdminPayoutsPage'
import AdminAuctionsPage from './pages/admin/AdminAuctionsPage'
import AdminHomeLoansPage from './pages/admin/AdminHomeLoansPage'
import AdminSupportPage from './pages/admin/AdminSupportPage'
import SiteHeader from './components/SiteHeader'
import SiteFooter from './components/SiteFooter'

function App() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isMessages = location.pathname === '/messages'
  const isProfile = location.pathname === '/profile'
  const isAddListing = location.pathname.startsWith('/add-listing')
  const isSignUp = location.pathname === '/signup'
  const isLogin = location.pathname === '/login'
  const isVerifyEmail = location.pathname === '/verify-email'
  const isForgotPassword = location.pathname === '/forgot-password'
  const isAuthShell = isLogin || isSignUp || isVerifyEmail || isForgotPassword
  const isAgent = location.pathname.startsWith('/agent')
  const isAdmin = location.pathname.startsWith('/admin')
  const isAdminLogin = location.pathname === '/admin/login'
  const isAdminApp = isAdmin && !isAdminLogin

  /** Avoid remounting the whole <Routes> tree on every in-shell navigation (prevents blank flashes on /admin/* and /agent/*). */
  const routesWrapperKey = isAgent || isAdmin ? 'dashboard-shell' : location.pathname

  return (
    <div
      className={
        isAgent
          ? 'flex min-h-screen w-full flex-1 flex-col bg-[#F9FAFB] text-slate-900'
          : isAdminApp
            ? 'flex h-svh max-h-[100dvh] min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#F9FAFB] text-slate-900'
            : isAdminLogin
              ? 'flex min-h-svh flex-col overflow-x-hidden bg-[#F9FAFB] text-slate-900'
              : isHome
                ? 'min-h-screen bg-[#f4fbff] text-slate-900'
                : isLogin || isForgotPassword
                  ? 'relative flex h-svh max-h-svh min-h-0 flex-col overflow-hidden bg-[#f6f7fb] text-slate-900'
                  : isSignUp || isVerifyEmail
                    ? 'relative flex h-svh max-h-svh min-h-0 flex-col overflow-hidden bg-[#f6f7fb] text-slate-900'
                    : isAddListing
                      ? 'relative flex w-full flex-1 flex-col min-h-0 bg-[#f4f2fb] text-slate-900'
                      : isProfile
                        ? 'relative flex w-full flex-1 flex-col min-h-0 bg-[#f6f7fb] text-slate-900'
                        : 'relative flex min-h-screen w-full flex-1 flex-col bg-gradient-to-b from-blue-950 via-blue-800 to-slate-100 text-slate-100'
      }
    >
      {!isAgent && !isAdmin && !isHome && !isProfile && !isAddListing && !isAuthShell && (
        <>
          <div className="pointer-events-none absolute -top-16 -left-10 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="pointer-events-none absolute right-0 bottom-0 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />
        </>
      )}

      <div
        className={`relative z-10 flex w-full flex-1 flex-col ${isHome ? '' : 'min-h-0'} ${isAdminApp ? 'h-full min-h-0 overflow-hidden' : ''}`}
      >
        {!isAgent && !isAdmin && !isHome && !isAuthShell && <SiteHeader />}
        <main
          className={
            isAgent || isAdmin
              ? 'flex h-full min-h-0 flex-1 flex-col overflow-hidden p-0'
              : isHome
                ? 'px-0'
                : isAuthShell
                  ? 'flex w-full flex-1 flex-col'
                : isAddListing
                    ? 'flex w-full flex-1 flex-col'
                : isProfile
                      ? 'flex w-full flex-1 flex-col border-y border-slate-200 bg-[#f6f7fb] px-4 pb-4 pt-4 md:px-6'
                      : `flex w-full flex-1 flex-col border-y border-white/20 bg-white/10 px-4 pb-4 pt-4 backdrop-blur-xl md:px-6${isMessages ? ' min-w-0' : ''}`
          }
        >
          <div
            key={routesWrapperKey}
            className={
              isAgent || isAdmin
                ? `flex h-full min-h-0 flex-1 flex-col${isAdminApp ? ' overflow-hidden' : ''}`
                : isHome
                  ? 'animate-rise'
                  : isAuthShell
                    ? 'animate-rise flex min-h-0 w-full flex-1 flex-col'
                    : `animate-rise flex min-h-0 w-full min-w-0 flex-1 flex-col`
            }
          >
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/auctions" element={<AuctionsPage />} />
              <Route path="/property/:id" element={<PropertyDetailsPage />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/add-listing/preview" element={<ListingPreviewPage />} />
              <Route path="/add-listing" element={<AddListingPage />} />
              <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="overview" element={<AdminOverviewPage />} />
                <Route path="admins" element={<AdminAdminsPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="agents" element={<AdminAgentsPage />} />
                <Route path="listings" element={<AdminListingsPage />} />
                <Route path="promotions" element={<AdminPromotionsPage />} />
                <Route path="transactions" element={<AdminTransactionsPage />} />
                <Route path="payouts" element={<AdminPayoutsPage />} />
                <Route path="auctions" element={<AdminAuctionsPage />} />
                <Route path="home-loans" element={<AdminHomeLoansPage />} />
                <Route path="support" element={<AdminSupportPage />} />
                <Route path=":module" element={<AdminDynamicPage />} />
              </Route>
              <Route path="/internal-dashboard/*" element={<Navigate to="/admin" replace />} />
              <Route path="/agent" element={<AgentDashboardLayout />}>
                <Route index element={<AgentOverviewPage />} />
                <Route path="listings/edit/:listingId" element={<AgentEditListingPage />} />
                <Route path="listings" element={<AgentListingsPage />} />
                <Route path="add-listing" element={<AgentAddListingPage />} />
                <Route path="view-performance" element={<AgentViewPerformancePage />} />
                <Route path="promotions/performance/:promotionId" element={<AgentPromotionPerformancePage />} />
                <Route path="promotions" element={<AgentPromoteListingsPage />} />
                <Route path="leads" element={<AgentLeadsMessagesPage />} />
                <Route path="earnings" element={<AgentEarningsPayoutsPage />} />
                <Route path="transactions" element={<AgentTransactionsPage />} />
                <Route path="profile" element={<AgentProfilePage />} />
                <Route path="settings" element={<AgentSettingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
        {!isAgent && !isAdmin && !isAuthShell && <SiteFooter />}
      </div>
    </div>
  )
}

export default App
