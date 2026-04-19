export const LISTING_DRAFT_KEY = 'trustedhome_listing_draft_v1'

/** @param {Record<string, unknown>} data */
export function saveListingDraft(data) {
  try {
    sessionStorage.setItem(LISTING_DRAFT_KEY, JSON.stringify(data))
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadListingDraft() {
  try {
    const raw = sessionStorage.getItem(LISTING_DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearListingDraft() {
  try {
    sessionStorage.removeItem(LISTING_DRAFT_KEY)
  } catch {
    /* ignore */
  }
}
