import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Home' },
  { to: '/explore', label: 'Explore' },
  { to: '/saved', label: 'Saved' },
  { to: '/profile', label: 'Profile' },
]

function DesktopNav() {
  return (
    <nav className="hidden md:block">
      <ul className="flex items-center gap-2">
        {tabs.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              className={({ isActive }) =>
                `rounded-xl px-4 py-2 text-sm transition ${
                  isActive ? 'bg-blue-500/40 text-white' : 'text-blue-100/85 hover:bg-white/10'
                }`
              }
            >
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default DesktopNav
