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
import AgentDashboardLayout from './layouts/AgentDashboardLayout'
import AgentOverviewPage from './pages/agent/AgentOverviewPage'
import AgentSectionPlaceholder from './pages/agent/AgentSectionPlaceholder'
import AgentAddListingPage from './pages/agent/AgentAddListingPage'
import AgentPromoteListingsPage from './pages/agent/AgentPromoteListingsPage'
import AgentListingsPage from './pages/agent/AgentListingsPage'
import AgentEditListingPage from './pages/agent/AgentEditListingPage'
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
  const isAgent = location.pathname.startsWith('/agent')

  return (
    <div
      className={
        isAgent
          ? 'flex min-h-screen flex-col bg-[#F9FAFB] text-slate-900 overflow-x-hidden'
          : isHome
            ? 'min-h-screen bg-[#111317] text-slate-100'
            : isLogin
              ? 'relative flex h-svh max-h-svh min-h-0 flex-col overflow-hidden bg-[#f6f7fb] text-slate-900'
              : isSignUp || isVerifyEmail
                ? 'relative flex h-svh max-h-svh min-h-0 flex-col overflow-hidden bg-[#f6f7fb] text-slate-900'
                : isAddListing
                  ? 'relative flex min-h-screen flex-col overflow-hidden bg-[#f4f2fb] text-slate-900'
                  : isProfile
                    ? 'relative flex min-h-screen flex-col overflow-hidden bg-[#f6f7fb] text-slate-900'
                    : 'relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-blue-950 via-blue-800 to-slate-100 text-slate-100'
      }
    >
      {!isAgent && !isHome && !isProfile && !isAddListing && !isSignUp && !isLogin && !isVerifyEmail && (
        <>
          <div className="pointer-events-none absolute -top-16 -left-10 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="pointer-events-none absolute right-0 bottom-0 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />
        </>
      )}

      <div className={`relative z-10 flex w-full flex-1 flex-col ${isHome ? '' : 'min-h-0'}`}>
        {!isAgent && !isHome && !isSignUp && !isLogin && !isVerifyEmail && <SiteHeader />}
        <main
          className={
            isAgent
              ? 'flex min-h-0 flex-1 flex-col overflow-hidden p-0'
              : isHome
                ? 'px-0 pb-8 pt-4'
                : isSignUp || isLogin || isVerifyEmail
                  ? 'flex w-full flex-1 flex-col'
                  : isAddListing
                    ? 'flex min-h-0 flex-1 flex-col'
                    : isProfile
                      ? 'flex min-h-0 flex-1 flex-col border-y border-slate-200 bg-[#f6f7fb] px-4 pb-4 pt-4 md:px-6'
                      : `flex min-h-0 flex-1 flex-col border-y border-white/20 bg-white/10 px-4 pb-4 pt-4 backdrop-blur-xl md:px-6${isMessages ? ' items-start min-w-0' : ''}`
          }
        >
          <div
            key={location.pathname}
            className={
              isAgent
                ? 'flex min-h-0 flex-1 flex-col'
                : isHome
                  ? 'animate-rise'
                  : isSignUp || isLogin || isVerifyEmail
                    ? 'animate-rise flex min-h-0 w-full flex-1 flex-col'
                    : `animate-rise flex min-h-0 flex-1 flex-col${isMessages || isProfile || isAddListing ? ' w-full min-w-0' : ''}`
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
              <Route path="/login" element={<LoginPage />} />
              <Route path="/add-listing/preview" element={<ListingPreviewPage />} />
              <Route path="/add-listing" element={<AddListingPage />} />
              <Route path="/agent" element={<AgentDashboardLayout />}>
                <Route index element={<AgentOverviewPage />} />
                <Route path="listings/edit/:listingId" element={<AgentEditListingPage />} />
                <Route path="listings" element={<AgentListingsPage />} />
                <Route path="add-listing" element={<AgentAddListingPage />} />
                <Route path="promotions" element={<AgentPromoteListingsPage />} />
                <Route path="leads" element={<AgentSectionPlaceholder title="Leads & Messages" />} />
                <Route path="earnings" element={<AgentSectionPlaceholder title="Earnings & Payouts" />} />
                <Route path="analytics" element={<AgentSectionPlaceholder title="Analytics" />} />
                <Route path="transactions" element={<AgentSectionPlaceholder title="Transactions" />} />
                <Route path="profile" element={<AgentSectionPlaceholder title="Profile" />} />
                <Route path="settings" element={<AgentSectionPlaceholder title="Settings" />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
        {!isAgent && !isSignUp && !isLogin && !isVerifyEmail && <SiteFooter />}
      </div>
    </div>
  )
}

export default App
