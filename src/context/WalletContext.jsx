import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

export const BID_PLACEMENT_FEE_NGN = 2000

const WalletContext = createContext(null)

export function WalletProvider({ children }) {
  const balanceRef = useRef(500000)
  const [balance, setBalance] = useState(500000)

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
    }),
    [balance, deductBidFee],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within WalletProvider')
  return ctx
}
