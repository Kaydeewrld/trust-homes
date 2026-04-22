import { Navigate, useParams } from 'react-router-dom'
import { adminTableModules } from './adminModuleConfig'
import AdminAdminsPage from './AdminAdminsPage'
import AdminUsersPage from './AdminUsersPage'
import AdminAgentsPage from './AdminAgentsPage'
import AdminListingsPage from './AdminListingsPage'
import AdminPromotionsPage from './AdminPromotionsPage'
import AdminTransactionsPage from './AdminTransactionsPage'
import AdminPayoutsPage from './AdminPayoutsPage'
import AdminAuctionsPage from './AdminAuctionsPage'
import AdminHomeLoansPage from './AdminHomeLoansPage'
import AdminSupportPage from './AdminSupportPage'
import AdminAnalyticsPage from './AdminAnalyticsPage'
import AdminSettingsPage from './AdminSettingsPage'
import AdminTableModuleView from './AdminTableModuleView'

export default function AdminDynamicPage() {
  const { module } = useParams()
  if (module === 'admins') return <AdminAdminsPage />
  if (module === 'users') return <AdminUsersPage />
  if (module === 'agents') return <AdminAgentsPage />
  if (module === 'listings') return <AdminListingsPage />
  if (module === 'promotions') return <AdminPromotionsPage />
  if (module === 'transactions') return <AdminTransactionsPage />
  if (module === 'payouts') return <AdminPayoutsPage />
  if (module === 'auctions') return <AdminAuctionsPage />
  if (module === 'home-loans') return <AdminHomeLoansPage />
  if (module === 'support') return <AdminSupportPage />
  if (module === 'analytics') return <AdminAnalyticsPage />
  if (module === 'settings') return <AdminSettingsPage />
  const config = adminTableModules[module]
  if (!config) return <Navigate to="/admin" replace />
  return <AdminTableModuleView config={config} />
}
