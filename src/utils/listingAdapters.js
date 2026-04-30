const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=1000&q=80'

function pickType(rawType) {
  const value = String(rawType || '').toLowerCase()
  if (value.includes('hotel')) return 'Hotel'
  if (value.includes('office')) return 'Office'
  if (value.includes('commercial')) return 'Commercial'
  if (value.includes('apartment')) return 'Apartment'
  return 'House'
}

export function mapApiListingToProperty(listing, index = 0) {
  const purposeRaw = String(listing?.purpose || 'Sale')
  const purpose = purposeRaw.charAt(0).toUpperCase() + purposeRaw.slice(1).toLowerCase()
  const createdAt = listing?.createdAt ? String(listing.createdAt) : null
  const videoCount = Number(listing?.videoCount || 0)
  const firstMediaUrl = Array.isArray(listing?.media)
    ? String(listing.media.find((m) => String(m?.url || '').trim())?.url || '')
    : ''
  const isVerifiedListing = Boolean(listing?.verificationBadge)
  const listingStatus = String(listing?.status || '').toUpperCase()
  return {
    id: String(listing?.id || `api-${index}`),
    ownerId: listing?.ownerId ? String(listing.ownerId) : null,
    title: String(listing?.title || 'Untitled Listing'),
    location: String(listing?.location || 'Lagos, Nigeria'),
    type: pickType(listing?.propertyType),
    purpose,
    price: Number(listing?.priceNgn || 0),
    bedrooms: Number(listing?.bedrooms || 0),
    bathrooms: Number(listing?.bathrooms || 0),
    area: Number(listing?.areaSqm || 0),
    rating: 4.6,
    image: String(listing?.previewMediaUrl || firstMediaUrl || FALLBACK_IMAGE),
    isFeatured: index < 4,
    isNew: index < 6,
    isNearby: index % 2 === 0,
    isRecommended: isVerifiedListing || index < 8,
    isVerifiedListing,
    verificationBadge: isVerifiedListing,
    ownerAgentVerified: Boolean(listing?.ownerAgentVerified),
    isDistressSale: Boolean(listing?.isDistressSale),
    isInvestmentProperty: Boolean(listing?.isInvestmentProperty),
    hasVideo: videoCount > 0,
    ownerRole: String(listing?.ownerRole || ''),
    ownerDisplayName: listing?.ownerDisplayName ? String(listing.ownerDisplayName) : '',
    ownerPhone: listing?.ownerPhone ? String(listing.ownerPhone) : '',
    ownerOnline: Boolean(listing?.ownerOnline),
    ownerSoldListings: Number(listing?.ownerSoldListings || 0),
    ownerReviewCount: Number(listing?.ownerReviewCount || 0),
    listingStatus,
    latitude: listing?.latitude != null ? Number(listing.latitude) : null,
    longitude: listing?.longitude != null ? Number(listing.longitude) : null,
    features: [],
    agent: {
      name: listing?.ownerDisplayName ? String(listing.ownerDisplayName) : isVerifiedListing ? 'Verified Agent' : 'Property Owner',
      role: String(listing?.ownerRole || '').toUpperCase() === 'AGENT' ? 'Agent' : 'Property Owner',
      phone: listing?.ownerPhone ? String(listing.ownerPhone) : '',
      online: Boolean(listing?.ownerOnline),
      soldListings: Number(listing?.ownerSoldListings || 0),
      reviews: Number(listing?.ownerReviewCount || 0),
    },
    description: String(listing?.description || ''),
    createdAt,
  }
}

