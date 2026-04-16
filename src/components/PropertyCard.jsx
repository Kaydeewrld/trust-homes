import { Link } from 'react-router-dom'
import { useFavorites } from '../context/FavoritesContext'
import { formatPrice } from '../utils/formatters'

function PropertyCard({ property, compact = false, className = '' }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const favorited = isFavorite(property.id)

  return (
    <article
      className={`animate-rise group flex h-full flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-lg shadow-blue-950/20 transition duration-300 hover:-translate-y-1 hover:bg-white/15 hover:shadow-xl hover:shadow-blue-900/35 ${className}`}
    >
      <div className="relative">
        <img
          src={property.image}
          alt={property.title}
          className={`${compact ? 'h-40' : 'h-56'} w-full object-cover transition duration-500 group-hover:scale-105`}
        />
        <button
          aria-label="Save listing"
          onClick={() => toggleFavorite(property.id)}
          className={`absolute right-3 top-3 rounded-full p-2 transition active:scale-90 ${
            favorited ? 'animate-softPulse bg-blue-500 text-white' : 'bg-white/80 text-blue-600 hover:bg-white'
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill={favorited ? 'currentColor' : 'none'} stroke="currentColor">
            <path
              d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.45A4 4 0 0 1 19 11c0 5.65-7 10-7 10Z"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className={`flex flex-1 flex-col justify-between space-y-3 p-4 text-white ${compact ? 'p-3' : ''}`}>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm text-blue-100/80">{property.location}</p>
              <h3 className={`${compact ? 'text-sm' : 'text-base'} font-semibold`}>{property.title}</h3>
            </div>
            <span className="rounded-full bg-blue-500/35 px-2 py-1 text-xs">{property.type}</span>
          </div>

          <div className={`${compact ? 'text-xs' : 'text-sm'} flex items-center justify-between text-blue-100/90`}>
            <span>{property.bedrooms ? `${property.bedrooms} Beds` : 'Open Plan'}</span>
            <span>{property.bathrooms} Baths</span>
            <span>{property.area.toLocaleString()} sqft</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className={`${compact ? 'text-base' : 'text-lg'} font-semibold tracking-wide text-cyan-100`}>
            {formatPrice(property.price, property.purpose)}
          </p>
          <Link
            to={`/property/${property.id}`}
            className={`rounded-xl border border-white/30 bg-white/15 ${compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'} font-medium transition hover:bg-white/25 active:scale-95`}
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  )
}

export default PropertyCard
