import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useFavorites } from '../context/FavoritesContext'
import { properties } from '../data/properties'
import { createUserCollection, getUserCollections } from '../utils/collections'
import { getRecentlyViewedProperties } from '../utils/recentlyViewed'
import { listingsGetById, messagesConversations, visitsMine, walletPayments, walletPayoutsMine } from '../lib/api'
import { mapApiListingToProperty } from '../utils/listingAdapters'

const tabItems = ['Overview', 'Saved Properties', 'Collections', 'Purchased', 'Transactions', 'Inquiries', 'Scheduled Visits', 'Bids', 'Settings']

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('Unable to read selected image.'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Unable to process selected image.'))
    img.src = src
  })
}

async function compressImageFile(file) {
  const dataUrl = await fileToDataUrl(file)
  if (!dataUrl) return ''
  const img = await loadImage(dataUrl)
  const maxSide = 900
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl
  ctx.drawImage(img, 0, 0, width, height)
  const compressed = canvas.toDataURL('image/jpeg', 0.78)
  return compressed || dataUrl
}

function TinyIcon({ kind, className = 'h-4 w-4' }) {
  if (kind === 'overview') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
        <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" strokeWidth="1.8" />
      </svg>
    )
  }
  if (kind === 'heart') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="1.8" />
      </svg>
    )
  }
  if (kind === 'chat') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" strokeWidth="1.8" />
      </svg>
    )
  }
  if (kind === 'cal') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
        <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.8" />
        <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }
  if (kind === 'settings') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeWidth="1.8" />
    </svg>
  )
}

function ProfilePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const fileInputRef = useRef(null)
  const { user, token, logout, updateProfile } = useAuth()
  const { favoriteIds } = useFavorites()
  const displayName = user?.displayName ?? 'Kaydee Wisdom'
  const emailDisplay = user?.email ?? 'kaydeewrld@gmail.com'
  const avatarSrc = user?.avatarUrl || ''

  const [viewed, setViewed] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [visits, setVisits] = useState([])
  const [loadingVisits, setLoadingVisits] = useState(false)
  const bids = []
  const fallbackHeroImage =
    properties[0]?.image ||
    'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1800&q=80'
  const [heroImage, setHeroImage] = useState(fallbackHeroImage)
  const [activeTab, setActiveTab] = useState('Overview')
  const [editingProfile, setEditingProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileName, setProfileName] = useState(displayName)
  const [profileBio, setProfileBio] = useState(user?.bio || '')
  const [profilePhone, setProfilePhone] = useState(user?.phone || '')
  const [profileAvatar, setProfileAvatar] = useState(avatarSrc)
  const [collections, setCollections] = useState([])
  const [newCollectionName, setNewCollectionName] = useState('')
  const [purchasedProperties, setPurchasedProperties] = useState([])
  const [loadingPurchased, setLoadingPurchased] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const filteredActivity = useMemo(() => {
    const txActivity = transactions.slice(0, 3).map((row) => ({
      id: `tx-${row.id}`,
      text: `${row.type} — ₦${Number(row.amountNgn || 0).toLocaleString('en-NG')} (${row.status})`,
      time: row.createdAt ? new Date(row.createdAt).toLocaleString('en-NG') : '—',
      kind: 'chat',
      createdAt: row.createdAt ? new Date(row.createdAt).getTime() : 0,
    }))
    const visitActivity = visits.slice(0, 3).map((v) => ({
      id: `visit-${v.id}`,
      text: `Visit scheduled: ${v.property?.title || 'Property'} (${v.day} ${v.time})`,
      time: v.day && v.time ? `${v.day}, ${v.time}` : '—',
      kind: 'cal',
      createdAt: 0,
    }))
    return [...txActivity, ...visitActivity]
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 6)
  }, [transactions, visits])
  const statItems = useMemo(
    () => [
      { label: 'Saved Properties', value: favoriteIds.length, tone: 'bg-blue-100 text-blue-600', icon: 'heart' },
      { label: 'Inquiries', value: inquiries.length, tone: 'bg-indigo-100 text-indigo-600', icon: 'chat' },
      { label: 'Scheduled Visits', value: visits.length, tone: 'bg-emerald-100 text-emerald-600', icon: 'cal' },
      { label: 'Active Bids', value: bids.length, tone: 'bg-amber-100 text-amber-600', icon: 'bid' },
    ],
    [favoriteIds.length, inquiries.length, visits.length, bids.length],
  )
  const showViewed = activeTab === 'Overview' || activeTab === 'Saved Properties'
  const showActivity = activeTab === 'Overview'
  const showAccount = activeTab === 'Overview'
  const showCta = activeTab === 'Overview'
  const isSplitLayout = activeTab === 'Overview'
  const initials = (displayName || 'U')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  useEffect(() => {
    if (!user?.id) {
      setCollections([])
      return
    }
    setCollections(getUserCollections(user.id))
  }, [user?.id])

  useEffect(() => {
    setViewed(getRecentlyViewedProperties(16))
  }, [activeTab, user?.id])

  useEffect(() => {
    if (!token || !user?.id) {
      setInquiries([])
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const out = await messagesConversations(token)
        const rows = Array.isArray(out?.conversations) ? out.conversations : []
        const mapped = rows
          .filter((c) => c?.listingPreview && !c?.isSystem)
          .slice(0, 24)
          .map((c) => {
            const lp = c.listingPreview || {}
            const lastAt = c.updatedAt || null
            const replied = String(c.lastSenderUserId || '') !== String(user.id)
            return {
              id: String(c.id),
              property: {
                id: String(lp.id || ''),
                title: String(lp.title || 'Property'),
                location: String(lp.location || ''),
                image:
                  properties.find((p) => String(p.id) === String(lp.id))?.image ||
                  'https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=1000&q=80',
              },
              text: String(c.lastMessage || 'Inquiry conversation'),
              status: replied ? 'Agent replied' : 'Awaiting reply',
              time: lastAt ? new Date(lastAt).toLocaleString('en-NG') : '—',
              conversationId: String(c.id),
            }
          })
        if (!cancelled) setInquiries(mapped)
      } catch {
        if (!cancelled) setInquiries([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, user?.id])

  useEffect(() => {
    if (!user?.id || !token) {
      setPurchasedProperties([])
      return
    }
    let cancelled = false
    setLoadingPurchased(true)
    ;(async () => {
      try {
        const out = await walletPayments(token, 60)
        const rows = Array.isArray(out?.payments) ? out.payments : []
        const paid = rows.filter((p) => String(p?.status || '').toUpperCase() === 'SUCCESS')
        const items = await Promise.all(
          paid.map(async (payment, index) => {
            const kind = String(payment?.kind || '')
            const listingId = payment?.listingId ? String(payment.listingId) : ''
            if (listingId) {
              try {
                const listingOut = await listingsGetById(listingId)
                const mapped = listingOut?.listing ? mapApiListingToProperty(listingOut.listing, index) : null
                if (mapped) {
                  return {
                    id: `pay-${payment.id}`,
                    title: mapped.title,
                    location: mapped.location,
                    image: mapped.image,
                    amountNgn: Number(payment.amountNgn || 0),
                    reference: payment.reference,
                    createdAt: payment.createdAt,
                    route: `/property/${listingId}`,
                    kind,
                  }
                }
              } catch {
                // fallback below
              }
            }
            const kindLabel =
              kind === 'hotel_reservation'
                ? 'Hotel Reservation'
                : kind === 'listing_purchase'
                  ? 'Property Purchase'
                  : kind === 'property_payment'
                    ? 'Property Payment'
                    : 'Payment'
            return {
              id: `pay-${payment.id}`,
              title: `${kindLabel} (${payment.reference})`,
              location: 'TrustedHome platform',
              image:
                properties[index % properties.length]?.image ||
                'https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=1000&q=80',
              amountNgn: Number(payment.amountNgn || 0),
              reference: payment.reference,
              createdAt: payment.createdAt,
              route: null,
              kind,
            }
          }),
        )
        if (!cancelled) setPurchasedProperties(items)
      } catch {
        if (!cancelled) setPurchasedProperties([])
      } finally {
        if (!cancelled) setLoadingPurchased(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, user?.id, properties])

  useEffect(() => {
    if (!user?.id || !token) {
      setVisits([])
      return
    }
    let cancelled = false
    setLoadingVisits(true)
    ;(async () => {
      try {
        const out = await visitsMine(token, { take: 120 })
        const rows = Array.isArray(out?.visits) ? out.visits : []
        const mapped = rows.map((v) => ({
          id: String(v.id),
          property: {
            id: String(v?.listing?.id || ''),
            title: String(v?.listing?.title || 'Property'),
            location: String(v?.listing?.location || ''),
            image:
              properties.find((p) => String(p.id) === String(v?.listing?.id))?.image ||
              'https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=1000&q=80',
          },
          day: v.visitDate ? new Date(`${v.visitDate}T00:00:00`).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' }) : '—',
          time: String(v.visitTime || '—'),
          status: String(v.status || 'REQUESTED').toUpperCase() === 'REQUESTED' ? 'Pending' : String(v.status || 'Pending'),
        }))
        if (!cancelled) setVisits(mapped)
      } catch {
        if (!cancelled) setVisits([])
      } finally {
        if (!cancelled) setLoadingVisits(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, user?.id])

  useEffect(() => {
    if (!user?.id || !token) {
      setTransactions([])
      return
    }
    let cancelled = false
    setLoadingTransactions(true)
    ;(async () => {
      try {
        const [paymentsOut, payoutsOut] = await Promise.all([
          walletPayments(token, 80),
          walletPayoutsMine(token, { take: 80 }),
        ])
        const payments = Array.isArray(paymentsOut?.payments) ? paymentsOut.payments : []
        const payouts = Array.isArray(payoutsOut?.payouts) ? payoutsOut.payouts : []

        const paymentRows = payments.map((p) => {
          const kind = String(p?.kind || '')
          const status = String(p?.status || '').toUpperCase()
          const kindLabel =
            kind === 'wallet_topup'
              ? 'Wallet top-up'
              : kind === 'listing_purchase'
                ? 'Property purchase'
                : kind === 'hotel_reservation'
                  ? 'Hotel reservation'
                  : kind === 'property_payment'
                    ? 'Property payment'
                    : 'Payment'
          const statusLabel = status === 'SUCCESS' ? 'Completed' : status === 'FAILED' ? 'Failed' : 'Pending'
          return {
            id: `pay-${p.id}`,
            reference: p.reference || p.id,
            type: kindLabel,
            amountNgn: Number(p?.amountNgn || 0),
            status: statusLabel,
            statusTone:
              statusLabel === 'Completed'
                ? 'bg-emerald-50 text-emerald-700'
                : statusLabel === 'Failed'
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-amber-50 text-amber-700',
            createdAt: p?.createdAt || null,
          }
        })

        const payoutRows = payouts.map((p) => {
          const status = String(p?.status || '').toUpperCase()
          const statusLabel = status === 'COMPLETED' ? 'Completed' : status === 'REJECTED' ? 'Rejected' : 'Pending approval'
          return {
            id: `payout-${p.id}`,
            reference: `WP-${String(p?.id || '').slice(0, 8)}`,
            type: 'Payout withdrawal',
            amountNgn: Number(p?.amountNgn || 0),
            status: statusLabel,
            statusTone:
              statusLabel === 'Completed'
                ? 'bg-emerald-50 text-emerald-700'
                : statusLabel === 'Rejected'
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-indigo-50 text-indigo-700',
            createdAt: p?.createdAt || null,
          }
        })

        const merged = [...paymentRows, ...payoutRows].sort((a, b) => {
          const at = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return bt - at
        })
        if (!cancelled) setTransactions(merged)
      } catch {
        if (!cancelled) setTransactions([])
      } finally {
        if (!cancelled) setLoadingTransactions(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, user?.id])

  useEffect(() => {
    if (!editingProfile) {
      setProfileName(displayName)
      setProfileBio(user?.bio || '')
      setProfilePhone(user?.phone || '')
      setProfileAvatar(avatarSrc || '')
    }
  }, [avatarSrc, displayName, editingProfile, user?.bio, user?.phone])

  const onPickProfileImage = () => {
    fileInputRef.current?.click()
  }

  const onProfileImageChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file', 'Please choose an image file.')
      return
    }
    try {
      const result = await compressImageFile(file)
      if (!result) return
      if (result.length > 7_500_000) {
        toast.error('Image too large', 'Please choose a smaller image.')
        return
      }
      setProfileAvatar(result)
    } catch (error) {
      toast.error('Image failed', error?.message || 'Unable to process selected image.')
    }
  }

  const onSaveProfile = async () => {
    try {
      setSavingProfile(true)
      await updateProfile({
        displayName: profileName,
        bio: profileBio,
        phone: profilePhone,
        avatarUrl: profileAvatar,
      })
      setEditingProfile(false)
      toast.success('Profile updated', 'Your profile changes were saved.')
    } catch (error) {
      toast.error('Save failed', error?.message || 'Unable to update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  const onCreateCollection = () => {
    if (!user?.id) {
      toast.warning('Login required', 'Please log in first.')
      return
    }
    try {
      const created = createUserCollection(user.id, newCollectionName)
      setCollections((current) => [created, ...current])
      setNewCollectionName('')
      setActiveTab('Collections')
      toast.success('Collection created', `"${created.name}" is ready.`)
    } catch (error) {
      toast.error('Could not create collection', error?.message || 'Please try again.')
    }
  }

  return (
    <section className="w-full bg-[#f6f7fb] px-0 pb-8 pt-2 text-slate-900">
      <div className="mx-auto w-full max-w-[1500px] space-y-3">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-40 overflow-hidden bg-slate-200 md:h-44">
            <img
              src={heroImage}
              alt=""
              className="block h-full w-full object-cover object-center"
              onError={() =>
                setHeroImage(
                  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=80',
                )
              }
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white/94 via-white/70 to-white/18" />

            <div className="absolute inset-0 flex items-start justify-between p-4 md:p-5">
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="" className="h-16 w-16 rounded-full border-2 border-white object-cover shadow-sm md:h-20 md:w-20" />
                  ) : (
                    <div className="grid h-16 w-16 place-items-center rounded-full border-2 border-white bg-slate-200 text-sm font-semibold text-slate-700 shadow-sm md:h-20 md:w-20 md:text-base">
                      {initials}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 grid h-5 w-5 place-items-center rounded-full bg-blue-600 ring-2 ring-white">
                    <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </span>
                </div>
                <div className="pt-0.5">
                  <h1 className="flex items-center gap-1 text-lg font-semibold leading-tight text-slate-900 md:text-2xl">
                    {displayName}
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-blue-600 md:h-5 md:w-5" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </h1>
                  <p className="mt-0.5 text-xs text-slate-600 md:text-sm">{emailDisplay}</p>
                  <p className="mt-1 line-clamp-1 max-w-xl text-xs text-slate-600 md:line-clamp-none md:text-sm">
                    {user?.bio || 'Set your profile bio from Edit Profile.'}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 md:mt-2 md:text-xs">
                    {user?.location ? (
                      <span className="inline-flex items-center gap-1">
                        <TinyIcon kind="overview" className="h-3.5 w-3.5" />
                        {user.location}
                      </span>
                    ) : null}
                    {user?.createdAt ? (
                      <span className="inline-flex items-center gap-1">
                        <TinyIcon kind="cal" className="h-3.5 w-3.5" />
                        Joined {new Date(user.createdAt).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                {user && (
                  <button
                    type="button"
                    onClick={() => {
                      logout()
                      navigate('/')
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 md:px-4 md:py-2 md:text-sm"
                  >
                    Log out
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setProfileName(displayName)
                    setProfileBio(user?.bio || '')
                    setProfilePhone(user?.phone || '')
                    setProfileAvatar(avatarSrc || '')
                    setEditingProfile(true)
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 md:px-4 md:py-2 md:text-sm"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 md:grid-cols-4 md:divide-y-0">
            {statItems.map((item) => (
              <article key={item.label} className="flex items-center gap-2.5 p-3">
                <span className={`grid h-9 w-9 place-items-center rounded-lg ${item.tone}`}>
                  <TinyIcon kind={item.icon} className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-xl font-semibold leading-none text-slate-900">{item.value}</p>
                  <p className="mt-0.5 text-xs text-slate-600">{item.label}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-3 shadow-sm">
          <div className="thin-scroll flex items-center gap-2 overflow-x-auto py-2">
            {tabItems.map((tab, index) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm ${
                  activeTab === tab ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <TinyIcon kind={index === 0 ? 'overview' : index === 1 ? 'heart' : index === 2 ? 'chat' : index === 3 ? 'cal' : index === 4 ? 'bid' : 'settings'} className="h-3.5 w-3.5" />
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className={`grid gap-4 ${isSplitLayout ? 'lg:grid-cols-[1.8fr_1fr]' : 'grid-cols-1'}`}>
          <div className="space-y-4">
            {showViewed && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">{activeTab === 'Saved Properties' ? 'Saved Properties' : 'Recently Viewed'}</h3>
                <Link to="/saved" className="text-sm font-medium text-blue-600 hover:underline">
                  View all
                </Link>
              </div>
              {(activeTab === 'Saved Properties' ? favoriteIds : viewed.map((v) => v.id)).length === 0 ? (
                <p className="text-sm text-slate-500">{activeTab === 'Saved Properties' ? 'No saved properties yet.' : 'No recently viewed properties yet.'}</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {(activeTab === 'Saved Properties'
                    ? properties.filter((p) => favoriteIds.includes(p.id)).slice(0, 12)
                    : viewed.slice(0, 8)
                  ).map((p) => (
                    <Link key={p.id} to={`/property/${p.id}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow">
                      <div className="relative">
                        <img src={p.image} alt={p.title} className="h-28 w-full object-cover" />
                        <span className="absolute left-2 top-2 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                          {p.purpose === 'Sale' ? 'For Sale' : p.purpose === 'Rent' ? 'For Rent' : p.purpose}
                        </span>
                      </div>
                      <div className="space-y-1.5 p-2.5">
                        <p className="line-clamp-1 text-sm font-medium text-slate-900">{p.title}</p>
                        <p className="line-clamp-1 text-xs text-slate-500">{p.location}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
            )}

            {showActivity && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Recent Activity</h3>
                <Link to="/messages" className="text-sm font-medium text-blue-600 hover:underline">
                  View all
                </Link>
              </div>
              {filteredActivity.length === 0 ? (
                <p className="text-sm text-slate-500">No recent activity yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {filteredActivity.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 py-3">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-50">
                        <TinyIcon kind={item.kind} className="h-4 w-4 text-blue-600" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-700">{item.text}</p>
                        <p className="text-xs text-slate-400">{item.time}</p>
                      </div>
                      <span className="text-slate-300">›</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            )}

            {activeTab === 'Inquiries' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Inquiries</h3>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">{inquiries.length} open</span>
              </div>
              {inquiries.length === 0 ? (
                <p className="text-sm text-slate-500">No inquiries yet.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {inquiries.map((item) => (
                    <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      <img src={item.property.image} alt={item.property.title} className="h-28 w-full object-cover" />
                      <div className="space-y-2 p-3">
                        <p className="line-clamp-1 text-sm font-semibold text-slate-900">{item.property.title}</p>
                        <p className="line-clamp-1 text-xs text-slate-500">{item.property.location}</p>
                        <p className="line-clamp-2 rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-slate-600">{item.text}</p>
                        <div className="flex items-center justify-between">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${item.status.includes('replied') ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            {item.status}
                          </span>
                          <span className="text-[11px] text-slate-400">{item.time}</span>
                        </div>
                        <Link to={`/messages?conversation=${encodeURIComponent(item.conversationId)}`} className="inline-flex rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                          Open chat
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
            )}

            {activeTab === 'Collections' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-slate-900">Collections</h3>
                <div className="flex items-center gap-2">
                  <input
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="Collection name"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={onCreateCollection}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500"
                  >
                    Create
                  </button>
                </div>
              </div>
              {collections.length === 0 ? (
                <p className="text-sm text-slate-500">No collections yet. Create one and start adding properties.</p>
              ) : (
                <div className="space-y-3">
                  {collections.map((collection) => (
                    <article key={collection.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-800">{collection.name}</h4>
                        <span className="text-xs text-slate-500">{collection.properties.length} properties</span>
                      </div>
                      {collection.properties.length ? (
                        <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                          {collection.properties.slice(0, 6).map((p) => (
                            <Link key={`${collection.id}-${p.id}`} to={`/property/${p.id}`} className="flex items-center gap-2 rounded-lg border border-slate-100 p-2 hover:bg-slate-50">
                              <img src={p.image} alt={p.title} className="h-11 w-14 rounded object-cover" />
                              <div className="min-w-0">
                                <p className="truncate text-xs font-medium text-slate-700">{p.title}</p>
                                <p className="truncate text-[11px] text-slate-500">{p.location}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-slate-500">No properties added yet.</p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
            )}

            {activeTab === 'Purchased' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Purchased Properties</h3>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  {purchasedProperties.length} paid
                </span>
              </div>
              {loadingPurchased ? (
                <p className="text-sm text-slate-500">Loading purchases...</p>
              ) : purchasedProperties.length === 0 ? (
                <p className="text-sm text-slate-500">No paid properties yet.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {purchasedProperties.map((item) => {
                    const CardTag = item.route ? Link : 'article'
                    const cardProps = item.route ? { to: item.route } : {}
                    return (
                      <CardTag
                        key={item.id}
                        {...cardProps}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow"
                      >
                        <img src={item.image} alt={item.title} className="h-28 w-full object-cover" />
                        <div className="space-y-1.5 p-2.5">
                          <p className="line-clamp-1 text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="line-clamp-1 text-xs text-slate-500">{item.location}</p>
                          <p className="text-xs font-semibold text-emerald-700">Paid: ₦{item.amountNgn.toLocaleString('en-NG')}</p>
                          <p className="text-[11px] text-slate-400">Ref: {item.reference}</p>
                        </div>
                      </CardTag>
                    )
                  })}
                </div>
              )}
            </section>
            )}

            {activeTab === 'Transactions' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Transactions</h3>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {transactions.length} entries
                </span>
              </div>
              {loadingTransactions ? (
                <p className="text-sm text-slate-500">Loading transactions...</p>
              ) : transactions.length === 0 ? (
                <p className="text-sm text-slate-500">No transactions yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[640px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Type</th>
                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Reference</th>
                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                        <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((row) => (
                        <tr key={row.id}>
                          <td className="px-3 py-2.5 text-sm font-medium text-slate-800">{row.type}</td>
                          <td className="px-3 py-2.5 font-mono text-xs text-slate-600">{row.reference}</td>
                          <td className="px-3 py-2.5 text-sm font-semibold text-slate-900">₦{row.amountNgn.toLocaleString('en-NG')}</td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${row.statusTone}`}>{row.status}</span>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-slate-500">
                            {row.createdAt ? new Date(row.createdAt).toLocaleString('en-NG') : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
            )}

            {activeTab === 'Scheduled Visits' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Scheduled Visits</h3>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">{visits.length} visits</span>
              </div>
              {loadingVisits ? (
                <p className="text-sm text-slate-500">Loading scheduled visits...</p>
              ) : visits.length === 0 ? (
                <p className="text-sm text-slate-500">No scheduled visits yet.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {visits.map((item) => (
                    <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                      <img src={item.property.image} alt={item.property.title} className="h-28 w-full object-cover" />
                      <div className="space-y-2 p-3">
                        <p className="line-clamp-1 text-sm font-semibold text-slate-900">{item.property.title}</p>
                        <p className="line-clamp-1 text-xs text-slate-500">{item.property.location}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">{item.day}</span>
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">{item.time}</span>
                          <span className={`rounded-md px-2 py-1 font-medium ${item.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
            )}

            {activeTab === 'Bids' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Your Bids</h3>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">{bids.length} active</span>
              </div>
              <p className="text-sm text-slate-500">No bids found.</p>
            </section>
            )}

            {activeTab === 'Settings' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Settings</h3>
                <button type="button" className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500">
                  Save Changes
                </button>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <article className="rounded-xl border border-slate-200 p-3">
                  <h4 className="text-sm font-semibold text-slate-800">Account Preferences</h4>
                  <ul className="mt-3 divide-y divide-slate-100">
                    {[
                      'Personal Information',
                      'Change Password',
                      'Connected Accounts',
                      'Privacy & Security',
                    ].map((label) => (
                      <li key={label}>
                        <button type="button" className="flex w-full items-center justify-between py-2.5 text-left text-sm text-slate-700 hover:text-blue-600">
                          <span>{label}</span>
                          <span className="text-slate-300">›</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="rounded-xl border border-slate-200 p-3">
                  <h4 className="text-sm font-semibold text-slate-800">Notifications</h4>
                  <div className="mt-3 space-y-2">
                    {[
                      ['Price drop alerts', true],
                      ['New property matches', true],
                      ['Visit reminders', true],
                      ['Bid updates', false],
                    ].map(([label, on]) => (
                      <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-sm text-slate-700">{label}</p>
                        <span className={`inline-flex h-5 w-9 items-center rounded-full p-0.5 ${on ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'}`}>
                          <span className="h-4 w-4 rounded-full bg-white" />
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </section>
            )}
          </div>

          {isSplitLayout && <div className="space-y-4">
            {showAccount && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Account Information</h3>
              <div className="mt-3 divide-y divide-slate-100 text-sm">
                {[
                  ['Full Name', displayName || '—'],
                  ['Email', emailDisplay || '—'],
                  ['Phone', user?.phone || '—'],
                  ['Location', user?.location || '—'],
                  ['Member Since', user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' }) : '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-2.5">
                    <p className="text-slate-500">{k}</p>
                    <p className="font-medium text-slate-700">{v}</p>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2.5">
                  <p className="text-slate-500">Account Status</p>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Active</span>
                </div>
              </div>
            </section>
            )}

            {showCta && (
            <section className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-100 p-5 shadow-sm">
              <h3 className="text-3xl font-semibold tracking-tight text-slate-900">List your property</h3>
              <p className="mt-2 text-sm text-slate-600">Reach thousands of verified buyers and renters today.</p>
              <Link to="/add-listing" className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
                List Property
              </Link>
            </section>
            )}
          </div>}
        </div>
      </div>
      {editingProfile && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Edit Profile</h3>
              <button type="button" onClick={() => setEditingProfile(false)} className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600">
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">Display Name</span>
                <input value={profileName} onChange={(e) => setProfileName(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">Phone</span>
                <input value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </label>
              <label className="space-y-1">
                <span className="text-xs font-medium text-slate-600">Bio</span>
                <textarea value={profileBio} onChange={(e) => setProfileBio(e.target.value)} rows={4} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </label>
              <div className="space-y-2">
                <span className="text-xs font-medium text-slate-600">Profile Image</span>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={onProfileImageChange} className="hidden" />
                <div className="flex items-center gap-3">
                  {profileAvatar ? <img src={profileAvatar} alt="" className="h-12 w-12 rounded-full object-cover" /> : <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">{initials}</div>}
                  <button type="button" onClick={onPickProfileImage} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700">
                    Choose image
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                disabled={savingProfile}
                onClick={onSaveProfile}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default ProfilePage
