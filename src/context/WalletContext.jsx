import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import AgentFundWalletModal from '../components/agent/AgentFundWalletModal'

export const BID_PLACEMENT_FEE_NGN = 2000

const WalletContext = createContext(null)

function FundWalletModalHost() {
  const { fundWalletOpen, closeFundWallet, addFunds, balance } = useWallet()
  return <AgentFundWalletModal open={fundWalletOpen} onClose={closeFundWallet} balance={balance} onFunded={addFunds} />
}

export function WalletProvider({ children }) {
  const balanceRef = useRef(246800)
  const [balance, setBalance] = useState(246800)
  const [fundWalletOpen, setFundWalletOpen] = useState(false)

  const openFundWallet = useCallback(() => setFundWalletOpen(true), [])
  const closeFundWallet = useCallback(() => setFundWalletOpen(false), [])

  const addFunds = useCallback((amountNgn) => {
    const n = Math.floor(Number(amountNgn) || 0)
    if (n <= 0) return
    balanceRef.current += n
    setBalance(balanceRef.current)
  }, [])

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
      addFunds,
      fundWalletOpen,
      openFundWallet,
      closeFundWallet,
    }),
    [balance, deductBidFee, addFunds, fundWalletOpen, openFundWallet, closeFundWallet],
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
