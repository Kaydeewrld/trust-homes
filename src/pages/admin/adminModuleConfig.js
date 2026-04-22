import {
  adminAgents,
  adminAuctions,
  adminListings,
  adminLoans,
  adminPromotions,
  adminPayouts,
  adminTickets,
  adminTransactions,
  adminUsers,
} from '../../data/adminSeed'

/** path segment -> table module */
export const adminTableModules = {
  users: {
    title: 'Users',
    subtitle: 'Manage accounts, roles, and access status.',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'role', label: 'Role' },
      { key: 'status', label: 'Status' },
      { key: 'joined', label: 'Joined' },
    ],
    rows: adminUsers,
  },
  agents: {
    title: 'Agents',
    subtitle: 'Verification pipeline and performance.',
    columns: [
      { key: 'name', label: 'Agent' },
      { key: 'verify', label: 'Verification' },
      { key: 'listings', label: 'Listings' },
      { key: 'commission', label: 'Commission' },
      { key: 'health', label: 'Health' },
    ],
    rows: adminAgents,
  },
  listings: {
    title: 'Listings',
    subtitle: 'Moderate listings before they go live.',
    columns: [
      { key: 'title', label: 'Listing' },
      { key: 'location', label: 'Location' },
      { key: 'type', label: 'Type' },
      { key: 'agent', label: 'Agent' },
      { key: 'status', label: 'Status' },
    ],
    rows: adminListings,
  },
  promotions: {
    title: 'Promotions',
    subtitle: 'Campaigns, budgets, and lead performance.',
    columns: [
      { key: 'listing', label: 'Listing' },
      { key: 'owner', label: 'Owner' },
      { key: 'budget', label: 'Budget' },
      { key: 'duration', label: 'Duration' },
      { key: 'leads', label: 'Leads' },
      { key: 'status', label: 'Status' },
    ],
    rows: adminPromotions,
  },
  transactions: {
    title: 'Transactions',
    subtitle: 'Payments, platform fee (10%), and net amounts.',
    columns: [
      { key: 'party', label: 'Party' },
      { key: 'total', label: 'Total' },
      { key: 'fee', label: 'Fee (10%)' },
      { key: 'net', label: 'Net' },
      { key: 'status', label: 'Status' },
      { key: 'date', label: 'Date' },
    ],
    rows: adminTransactions,
  },
  payouts: {
    title: 'Payouts',
    subtitle: 'Payout requests and wallet balances.',
    columns: [
      { key: 'agent', label: 'Agent' },
      { key: 'requested', label: 'Requested' },
      { key: 'wallet', label: 'Wallet' },
      { key: 'history', label: 'History' },
      { key: 'status', label: 'Status' },
    ],
    rows: adminPayouts,
  },
  auctions: {
    title: 'Auctions',
    subtitle: 'Live auctions and bid activity.',
    columns: [
      { key: 'listing', label: 'Listing' },
      { key: 'bid', label: 'High bid' },
      { key: 'bidders', label: 'Bidders' },
      { key: 'ends', label: 'Time left' },
      { key: 'status', label: 'Status' },
    ],
    rows: adminAuctions,
  },
  'home-loans': {
    title: 'Home loans',
    subtitle: 'Applications and underwriting queue.',
    columns: [
      { key: 'applicant', label: 'Applicant' },
      { key: 'amount', label: 'Requested' },
      { key: 'income', label: 'Income' },
      { key: 'status', label: 'Status' },
    ],
    rows: adminLoans,
  },
  support: {
    title: 'Support & tickets',
    subtitle: 'Inbound issues from users and agents.',
    columns: [
      { key: 'from', label: 'From' },
      { key: 'subject', label: 'Subject' },
      { key: 'status', label: 'Status' },
      { key: 'updated', label: 'Updated' },
    ],
    rows: adminTickets,
  },
}
