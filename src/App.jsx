import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ExplorePage from './pages/ExplorePage'
import AuctionsPage from './pages/AuctionsPage'
import PropertyDetailsPage from './pages/PropertyDetailsPage'
import SavedPage from './pages/SavedPage'
import MessagesPage from './pages/MessagesPage'
import ProfilePage from './pages/ProfilePage'
import SiteHeader from './components/SiteHeader'
import SiteFooter from './components/SiteFooter'

function App() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isMessages = location.pathname === '/messages'

  return (
    <div
      className={
        isHome
          ? 'min-h-screen bg-[#111317] text-slate-100'
          : 'relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-blue-950 via-blue-800 to-slate-100 text-slate-100'
      }
    >
      {!isHome && (
        <>
          <div className="pointer-events-none absolute -top-16 -left-10 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="pointer-events-none absolute right-0 bottom-0 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />
        </>
      )}

      <div className={`relative z-10 flex w-full flex-1 flex-col ${isHome ? '' : 'min-h-0'}`}>
        {!isHome && <SiteHeader />}
        <main
          className={
            isHome
              ? 'px-0 pb-8 pt-4'
              : `flex min-h-0 flex-1 flex-col border-y border-white/20 bg-white/10 px-4 pb-4 pt-4 backdrop-blur-xl md:px-6${isMessages ? ' items-start min-w-0' : ''}`
          }
        >
          <div
            key={location.pathname}
            className={
              isHome
                ? 'animate-rise'
                : `animate-rise flex min-h-0 flex-1 flex-col${isMessages ? ' w-full min-w-0' : ''}`
            }
          >
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/auctions" element={<AuctionsPage />} />
              <Route path="/property/:propertyId" element={<PropertyDetailsPage />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
        <SiteFooter />
      </div>
    </div>
  )
}

export default App
