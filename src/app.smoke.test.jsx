import { StrictMode } from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { ToastProvider } from './context/ToastContext'
import { WalletProvider } from './context/WalletContext'

function Tree({ initialPath = '/' }) {
  return (
    <StrictMode>
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <AdminAuthProvider>
            <FavoritesProvider>
              <ToastProvider>
                <WalletProvider>
                  <App />
                </WalletProvider>
              </ToastProvider>
            </FavoritesProvider>
          </AdminAuthProvider>
        </AuthProvider>
      </MemoryRouter>
    </StrictMode>
  )
}

describe('App smoke', () => {
  it('renders home without throwing', () => {
    render(<Tree initialPath="/" />)
    expect(screen.getAllByText(/^TrustedHome$/i).length).toBeGreaterThan(0)
  })

  it('renders admin login', () => {
    render(<Tree initialPath="/admin/login" />)
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeTruthy()
  })

  it('renders admin management when session present', () => {
    localStorage.setItem('th_admin_session', '1')
    localStorage.setItem('th_admin_email', 'ops@trustedhome.com')
    render(<Tree initialPath="/admin/admins" />)
    expect(screen.getByRole('heading', { name: /admin management/i })).toBeTruthy()
  })

  it('renders admin users when session present', () => {
    localStorage.setItem('th_admin_session', '1')
    localStorage.setItem('th_admin_email', 'ops@trustedhome.com')
    render(<Tree initialPath="/admin/users" />)
    expect(screen.getByRole('heading', { name: /^Users$/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /member directory/i })).toBeTruthy()
  })

  it('renders admin agents when session present', () => {
    localStorage.setItem('th_admin_session', '1')
    localStorage.setItem('th_admin_email', 'ops@trustedhome.com')
    render(<Tree initialPath="/admin/agents" />)
    expect(screen.getByRole('heading', { name: /^Agents$/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /agent directory/i })).toBeTruthy()
  })

  it('renders admin listings when session present', () => {
    localStorage.setItem('th_admin_session', '1')
    localStorage.setItem('th_admin_email', 'ops@trustedhome.com')
    render(<Tree initialPath="/admin/listings" />)
    expect(screen.getByRole('heading', { name: /^Listings$/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /catalogue queue/i })).toBeTruthy()
  })

  it('renders admin promotions when session present', () => {
    localStorage.setItem('th_admin_session', '1')
    localStorage.setItem('th_admin_email', 'ops@trustedhome.com')
    render(<Tree initialPath="/admin/promotions" />)
    expect(screen.getByRole('heading', { name: /^Promotions$/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /campaign queue/i })).toBeTruthy()
  })

  it('renders admin transactions when session present', () => {
    localStorage.setItem('th_admin_session', '1')
    localStorage.setItem('th_admin_email', 'ops@trustedhome.com')
    render(<Tree initialPath="/admin/transactions" />)
    expect(screen.getByRole('heading', { name: /^Transactions$/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /^Ledger$/i })).toBeTruthy()
  })

  it('renders admin payouts when session present', () => {
    localStorage.setItem('th_admin_session', '1')
    localStorage.setItem('th_admin_email', 'ops@trustedhome.com')
    render(<Tree initialPath="/admin/payouts" />)
    expect(screen.getByRole('heading', { name: /^Payouts$/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /^Settlement queue$/i })).toBeTruthy()
  })

  it('renders admin auctions when session present', () => {
    localStorage.setItem('th_admin_session', '1')
    localStorage.setItem('th_admin_email', 'ops@trustedhome.com')
    render(<Tree initialPath="/admin/auctions" />)
    expect(screen.getByRole('heading', { name: /^Auctions$/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /^Live catalogue$/i })).toBeTruthy()
  })

  it('renders admin home loans when session present', () => {
    localStorage.setItem('th_admin_session', '1')
    localStorage.setItem('th_admin_email', 'ops@trustedhome.com')
    render(<Tree initialPath="/admin/home-loans" />)
    expect(screen.getByRole('heading', { name: /^Home loans$/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /^Underwriting queue$/i })).toBeTruthy()
  })

  it('renders admin support when session present', () => {
    localStorage.setItem('th_admin_session', '1')
    localStorage.setItem('th_admin_email', 'ops@trustedhome.com')
    render(<Tree initialPath="/admin/support" />)
    expect(screen.getByRole('heading', { name: /^Support$/i })).toBeTruthy()
    expect(screen.getByRole('heading', { name: /^Ticket desk$/i })).toBeTruthy()
  })
})
