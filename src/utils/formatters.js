export function formatPrice(amount, purpose) {
  const value = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)

  if (purpose === 'Rent') return `${value}/mo`
  if (purpose === 'Lease') return `${value}/yr`
  return value
}
