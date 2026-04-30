import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { paymentHotelReservationInit, paymentPropertyInit } from '../lib/api.js'

function formatNaira(value) {
  return `₦${new Intl.NumberFormat('en-NG').format(value)}`
}

/**
 * @param {{ hotel: { id: string, name: string, fromPerNight: number, listingId?: string } | null, onClose: () => void }} props
 */
export default function HotelBookingModal({ hotel, onClose }) {
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const toast = useToast()
  const [nights, setNights] = useState(1)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    if (hotel) setNights(1)
  }, [hotel?.id, hotel?.listingId])

  if (!hotel) return null

  const handleConfirmReservation = async () => {
    if (!user || !token) {
      toast.warning('Login required', 'Please log in to continue with reservation payment.')
      navigate(`/login?next=${encodeURIComponent('/hotels')}`)
      return
    }
    const safeNights = Math.max(1, Math.min(365, Math.floor(Number(nights) || 1)))
    setPaying(true)
    try {
      const callbackUrl = `${window.location.origin}/payments/callback`
      const data = hotel.listingId
        ? await paymentHotelReservationInit(token, {
            listingId: hotel.listingId,
            nights: safeNights,
            perNightNgn: hotel.fromPerNight,
            callbackUrl,
          })
        : await paymentPropertyInit(token, {
            amountNgn: hotel.fromPerNight * safeNights,
            title: `Hotel reservation: ${hotel.name}`,
            callbackUrl,
          })
      const checkoutUrl = data?.authorization_url
      if (!checkoutUrl) {
        toast.error('Payment could not start', 'No checkout URL returned from server.')
        return
      }
      window.location.assign(checkoutUrl)
    } catch (err) {
      toast.error('Reservation payment failed', err.message || 'Unable to start Paystack checkout.')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-slate-950/80 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hotel-book-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-300/20 bg-slate-900 p-4 text-slate-100 shadow-2xl">
        <h3 id="hotel-book-title" className="text-lg font-semibold">
          Book {hotel.name}
        </h3>
        <p className="mt-1 text-xs text-slate-300">Select reservation days and continue to secure Paystack payment.</p>
        <label className="mt-3 block text-xs text-slate-300">
          Number of days
          <input
            type="number"
            min={1}
            max={365}
            value={nights}
            onChange={(e) => setNights(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
          />
        </label>
        <div className="mt-3 rounded-lg bg-slate-800 p-3 text-sm">
          <p className="text-slate-300">Total</p>
          <p className="font-semibold text-emerald-300">
            {formatNaira(hotel.fromPerNight * Math.max(1, Number(nights) || 1))}
          </p>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleConfirmReservation}
            disabled={paying}
            className="flex-1 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {paying ? 'Redirecting…' : 'Pay with Paystack'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={paying}
            className="flex-1 rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-slate-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
