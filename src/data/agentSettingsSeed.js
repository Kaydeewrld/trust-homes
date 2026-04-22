export const agentSettingsProfile = {
  fullName: 'John Doe',
  email: 'john.doe@email.com',
  phone: '+234 803 123 4567',
  businessName: 'Doe Properties Ltd.',
  businessAddress: '15 Admiralty Way, Lekki Phase 1, Lagos',
  timeZone: 'Africa/Lagos',
}

export const timeZoneOptions = [
  { value: 'Africa/Lagos', label: 'West Africa Time (WAT) · Lagos' },
  { value: 'Africa/Nairobi', label: 'East Africa Time · Nairobi' },
  { value: 'Europe/London', label: 'GMT · London' },
]

export const privacyVisibilityOptions = [
  { value: 'public', label: 'Public — visible to all users' },
  { value: 'clients', label: 'Clients only' },
  { value: 'private', label: 'Private' },
]

export const phoneVisibilityOptions = [
  { value: 'show', label: 'Show on profile' },
  { value: 'hide', label: 'Hide from profile' },
  { value: 'leads', label: 'Show only after lead contact' },
]
