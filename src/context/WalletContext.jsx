import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import AgentFundWalletModal from '../components/agent/AgentFundWalletModal'
import { useAuth } from './AuthContext.jsx'
import { walletGet } from '../lib/api.js'

export const BID_PLACEMENT_FEE_NGN = 2000

const WalletContext = createContext(null)

function FundWalletModalHost() {
  const { fundWalletOpen, closeFundWallet, balance } = useWallet()
  return <AgentFundWalletModal open={fundWalletOpen} onClose={closeFundWallet} balance={balance} />
}

export function WalletProvider({ children }) {
  const { token, bootstrapping } = useAuth()
  const balanceRef = useRef(0)
  const [balance, setBalance] = useState(0)
  const [fundWalletOpen, setFundWalletOpen] = useState(false)

  const openFundWallet = useCallback(() => setFundWalletOpen(true), [])
  const closeFundWallet = useCallback(() => setFundWalletOpen(false), [])

  const refreshWallet = useCallback(async () => {
    const t =
      token || (typeof localStorage !== 'undefined' ? localStorage.getItem('th_app_token') : null)
    if (!t) return
    try {
      const data = await walletGet(t)
      const b = Math.floor(Number(data.balanceNgn) || 0)
      balanceRef.current = b
      setBalance(b)
    } catch {
      /* keep last known balance on transient errors */
    }
  }, [token])

  useEffect(() => {
    if (bootstrapping) return
    if (!token) {
      balanceRef.current = 0
      setBalance(0)
      return
    }
    refreshWallet()
  }, [bootstrapping, token, refreshWallet])

  const deductBidFee = useCallback(() => {
    if (balanceRef.current < BID_PLACEMENT_FEE_NGN) return false
    balanceRef.current -= BID_PLACEMENT_FEE_NGN
    setBalance(balanceRef.current)
    return true
  }, [])

  const value = useMemo(
    () => ({
      balance,
      deductBidFee,
      refreshWallet,
      fundWalletOpen,
      openFundWallet,
      closeFundWallet,
    }),
    [balance, deductBidFee, refreshWallet, fundWalletOpen, openFundWallet, closeFundWallet],
  )

  return (
    <WalletContext.Provider value={value}>
      {children}
      <FundWalletModalHost />
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
