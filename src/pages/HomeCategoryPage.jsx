import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { properties as demoProperties } from '../data/properties'
import { listingsList } from '../lib/api'
import { mapApiListingToProperty } from '../utils/listingAdapters'

const sectionConfig = {
  featured: {
    title: 'Featured Listings',
    subtitle: 'Premium curated properties from TrustedHome.',
    pick: (items) => items.filter((p) => p.isFeatured),
  },
  nearby: {
    title: 'Nearby Listings',
    subtitle: 'Properties around high-demand locations.',
    pick: (items) => items.filter((p) => p.isNearby),
  },
  'recently-added': {
    title: 'Recently Added Listings',
    subtitle: 'Latest listings recently added to the marketplace.',
    pick: (items) =>
      [...items].sort((a, b) => {
        const at = a?.createdAt ? new Date(a.createdAt).getTime() : 0
        const bt = b?.createdAt ? new Date(b.createdAt).getTime() : 0
        if (at !== bt) return bt - at
        if (a?.isNew !== b?.isNew) return a?.isNew ? -1 : 1
        return 0
      }),
  },
  'best-pricing': {
    title: 'Best Pricing',
    subtitle: 'Value-first homes with competitive pricing.',
    pick: (items) => [...items].sort((a, b) => a.price - b.price),
  },
  handpicked: {
    title: 'Handpicked by TrustedHome',
    subtitle: 'Homes selected by our internal property team.',
    pick: (items) => items.filter((p) => p.isFeatured || p.isRecommended),
  },
  'distress-sale': {
    title: 'Distress Sale',
    subtitle: 'Urgent sale homes and high-value opportunities.',
    pick: (items) => items.filter((p) => p.isDistressSale || p.purpose === 'Sale').sort((a, b) => a.price - b.price),
  },
  investment: {
    title: 'Investment Properties',
    subtitle: 'Listings selected for yield and long-term growth.',
    pick: (items) =>
      items
        .filter((p) => p.isInvestmentProperty || (p.isRecommended && (p.purpose === 'Sale' || p.purpose === 'Lease')))
        .sort((a, b) => b.rating - a.rating),
  },
  'popular-locations': {
    title: 'Popular Locations',
    subtitle: 'Top location-driven listings.',
    pick: (items) => [...items].sort((a, b) => a.location.localeCompare(b.location)),
  },
}

export default function HomeCategoryPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [remoteProperties, setRemoteProperties] = useState([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const out = await listingsList({ status: 'APPROVED', take: 120, skip: 0 })
        const incoming = Array.isArray(out?.listings) ? out.listings.map((item, idx) => mapApiListingToProperty(item, idx)) : []
        if (!cancelled) setRemoteProperties(incoming)
      } catch {
        if (!cancelled) setRemoteProperties([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const config = sectionConfig[slug] || sectionConfig.featured
  const merged = useMemo(() => {
    const dedup = new Set()
    return [...remoteProperties, ...demoProperties].filter((item) => {
      if (dedup.has(item.id)) return false
      dedup.add(item.id)
      return true
    })
  }, [remoteProperties])
  const rows = useMemo(() => config.pick(merged).slice(0, 60), [config, merged])

  return (
    <section className="space-y-4 pb-8 text-slate-800">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">{config.title}</h1>
        <p className="mt-1 text-sm text-slate-500">{config.subtitle}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {rows.map((item) => (
          <article
            key={item.id}
            onClick={() => navigate(`/property/${item.id}`)}
            className="cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <img src={item.image} alt={item.title} className="h-40 w-full object-cover" />
            <div className="space-y-1.5 p-3">
              <p className="truncate text-sm font-semibold text-slate-800">{item.title}</p>
              <p className="text-xs text-slate-500">{item.location}</p>
              <p className="text-sm font-semibold text-blue-700">N{item.price.toLocaleString()}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
