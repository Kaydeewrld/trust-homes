import { useLocation } from 'react-router-dom'

const pageTitles = {
  '/': 'Discover your next property',
  '/explore': 'Search by location, price & type',
  '/saved': 'Your favorite listings',
  '/profile': 'Your account',
}

function Header() {
  const { pathname } = useLocation()
  const title =
    pathname.startsWith('/property/') ? 'Property details and insights' : pageTitles[pathname] || ''

  return (
    <header className="sticky top-0 z-20 border-b border-white/15 bg-blue-900/30 px-6 py-3 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-blue-100/90">Hi, Ademola</p>
          <p className="text-xs text-blue-200/90">{title}</p>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/30 bg-blue-500/45 text-xs font-semibold text-white">
          AD
        </div>
      </div>
    </header>
  )
}

export default Header
