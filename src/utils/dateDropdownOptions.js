/** Labels for month dropdowns (value = zero-padded month). */
export const MONTH_OPTIONS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

const pad2 = (n) => String(n).padStart(2, '0')

export function daysInMonth(yearStr, monthStr) {
  const y = Number(yearStr)
  const m = Number(monthStr)
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return 31
  return new Date(y, m, 0).getDate()
}

/** @returns {{ value: string, label: string }[]} */
export function dayOptionsFor(yearStr, monthStr) {
  const dim = daysInMonth(yearStr, monthStr)
  return Array.from({ length: dim }, (_, i) => {
    const v = pad2(i + 1)
    return { value: v, label: String(i + 1) }
  })
}

export function composeIsoDate(yearStr, monthStr, dayStr) {
  const dim = daysInMonth(yearStr, monthStr)
  let d = Number(dayStr)
  if (!Number.isFinite(d) || d < 1) d = 1
  if (d > dim) d = dim
  return `${yearStr}-${monthStr}-${pad2(d)}`
}

export function parseIsoDateParts(iso) {
  const m = typeof iso === 'string' && iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return { y: m[1], mo: m[2], d: m[3] }
  const t = new Date()
  return { y: String(t.getFullYear()), mo: pad2(t.getMonth() + 1), d: pad2(t.getDate()) }
}

export const listingYearOptions = () => {
  const y0 = new Date().getFullYear()
  return Array.from({ length: 9 }, (_, i) => {
    const y = String(y0 + i - 1)
    return { value: y, label: y }
  })
}
