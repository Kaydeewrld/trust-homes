import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Home', icon: 'M3 10.5 12 3l9 7.5M6 9v11h12V9' },
  {
    to: '/explore',
    label: 'Explore',
    icon: 'M11 4a7 7 0 1 0 4.95 11.95L20 20',
  },
  { to: '/saved', label: 'Saved', icon: 'M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.45A4 4 0 0 1 19 11c0 5.65-7 10-7 10Z' },
  { to: '/profile', label: 'Profile', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0' },
]

function BottomNav() {
  return (
    <nav className="absolute bottom-0 left-0 right-0 border-t border-white/20 bg-blue-950/45 px-2 py-2 backdrop-blur-xl md:hidden">
      <ul className="flex items-center justify-around">
        {tabs.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              className={({ isActive }) =>
                `flex min-w-16 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs transition active:scale-95 ${
                  isActive
                    ? 'animate-softPulse bg-blue-500/35 text-white shadow-lg shadow-blue-900/40'
                    : 'text-blue-100/75 hover:bg-white/10'
                }`
              }
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d={tab.icon} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default BottomNav
