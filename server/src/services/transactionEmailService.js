import { query } from '../db.js'
import { config } from '../config.js'
import { sendMail } from './mailService.js'

const BRAND = '#4F46E5'

export function esc(v) {
  return String(v || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function fmtNgn(n) {
  const x = Math.floor(Number(n) || 0)
  return `₦${x.toLocaleString('en-NG')}`
}

function kindLabel(kind) {
  if (kind === 'wallet_topup') return 'Wallet top-up'
  if (kind === 'listing_purchase') return 'Property payment'
  return String(kind || 'Transaction').replace(/_/g, ' ')
}

function hrefAttr(url) {
  return String(url || '').replace(/&/g, '&amp;')
}

function estimateRegionalRanges(location, purpose, propertyType) {
  const loc = String(location || '').toLowerCase()
  if (loc.includes('ikoyi') || loc.includes('victoria island')) {
    return purpose === 'Rent'
      ? { average: '₦12,000,000 - ₦35,000,000 / year', guidance: 'High-demand premium zone with strong rental liquidity.' }
      : { average: '₦180,000,000 - ₦900,000,000', guidance: 'Premium resale market; prices hold strongly over time.' }
  }
  if (loc.includes('lekki')) {
    return purpose === 'Rent'
      ? { average: '₦4,500,000 - ₦18,000,000 / year', guidance: 'Balanced demand with good rental turnover.' }
      : { average: '₦75,000,000 - ₦420,000,000', guidance: 'Growth corridor with active buyer interest.' }
  }
  if (loc.includes('abuja') || loc.includes('wuse') || loc.includes('gwarinpa')) {
    return purpose === 'Rent'
      ? { average: '₦3,500,000 - ₦14,000,000 / year', guidance: 'Stable market with steady executive demand.' }
      : { average: '₦60,000,000 - ₦350,000,000', guidance: 'Consistent value appreciation in prime districts.' }
  }
  if (String(propertyType || '').toLowerCase().includes('hotel')) {
    return { average: 'Occupancy and ADR vary by district', guidance: 'Hotel performance depends heavily on demand season and access routes.' }
  }
  return purpose === 'Rent'
    ? { average: '₦1,800,000 - ₦9,500,000 / year', guidance: 'Moderate demand zone; evaluate access, infrastructure, and security.' }
    : { average: '₦35,000,000 - ₦220,000,000', guidance: 'Mixed-price district; negotiate based on title quality and finishing.' }
}

function buildAiInsight({ location, purpose, propertyType, priceNgn }) {
  const p = String(purpose || 'Sale')
  const t = String(propertyType || 'Property')
  const price = Math.floor(Number(priceNgn) || 0)
  const ranges = estimateRegionalRanges(location, p, t)
  const marketFit = p === 'Rent'
    ? price <= 9_000_000 ? 'appears competitive for many urban rental segments' : 'is on the premium side and should be compared with newer comps'
    : price <= 120_000_000 ? 'may be attractive if title and finishing are solid' : 'sits in an upper bracket; due diligence is very important'
  return {
    averageRange: ranges.average,
    narrative: `AI insight: This ${t.toLowerCase()} in ${location} ${marketFit}. Typical ${p.toLowerCase()} pricing in this zone is around ${ranges.average}. ${ranges.guidance}`,
  }
}

function shellHtml({ eyebrow, title, bodyHtml, ctaLabel, ctaUrl }) {
  const safeEyebrow = esc(eyebrow)
  const safeTitle = esc(title)
  const ctaBlock =
    ctaUrl && ctaLabel
      ? `<a href="${hrefAttr(ctaUrl)}" style="display:inline-block;margin-top:20px;padding:14px 28px;border-radius:999px;background:${BRAND};color:#ffffff;font-size:15px;font-weight:700;text-decoration:none">${esc(ctaLabel)}</a>`
      : ''
  return `
  <div style="margin:0;padding:28px 16px;background:#0f172a;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;border-radius:20px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(15,23,42,0.45)">
      <tr>
        <td style="padding:28px 32px;background:linear-gradient(135deg,#312e81 0%,#1d4ed8 48%,#4338ca 100%);color:#ffffff">
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;opacity:0.92">${safeEyebrow}</div>
          <div style="margin-top:10px;font-size:26px;font-weight:800;line-height:1.2;letter-spacing:-0.02em">${safeTitle}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:32px;background:#ffffff">
          ${bodyHtml}
          ${ctaBlock}
          <p style="margin:28px 0 0;font-size:12px;line-height:1.6;color:#94a3b8">TrustedHome &mdash; secure property payments on-platform.</p>
        </td>
      </tr>
    </table>
  </div>`
}

/**
 * After a successful Paystack settlement (first-time fulfill only).
 * @param {{ userId: string, kind: string, amountNgn: number, reference: string, listingId: string | null, metadata?: any }} p
 */
export async function sendPaymentSuccessEmails({ userId, kind, amountNgn, reference, listingId, metadata }) {
  const { rows: ur } = await query(`SELECT email, "displayName" AS dn FROM "User" WHERE id = $1 LIMIT 1`, [userId])
  const user = ur[0]
  const userEmail = user?.email ? String(user.email).toLowerCase() : ''
  const displayName = String(user?.dn || '').trim() || 'there'

  let listingTitle = ''
  let listingOwnerEmail = ''
  let listingOwnerName = ''
  if (listingId) {
    const { rows: lr } = await query(
      `SELECT l.title, u.email AS "ownerEmail", COALESCE(u."displayName", '') AS "ownerName"
       FROM "Listing" l
       JOIN "User" u ON u.id = l."ownerId"
       WHERE l.id = $1
       LIMIT 1`,
      [listingId],
    )
    listingTitle = lr[0]?.title ? String(lr[0].title) : ''
    listingOwnerEmail = lr[0]?.ownerEmail ? String(lr[0].ownerEmail).toLowerCase() : ''
    listingOwnerName = lr[0]?.ownerName ? String(lr[0].ownerName).trim() : ''
  }

  const kLabel = kindLabel(kind)
  const amt = fmtNgn(amountNgn)
  const safeRef = esc(reference)
  const appUrl = String(config.appPublicUrl || '').replace(/\/+$/, '')
  const exploreUrl = appUrl ? `${appUrl}/explore` : ''
  const userBody = `
    <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#334155">Hi ${esc(displayName)},</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#475569">
      We received your payment successfully. Your receipt is below &mdash; keep this email for your records.
    </p>
    <div style="margin:0 0 8px;padding:20px 22px;border-radius:16px;background:linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%);border:1px solid #e2e8f0">
      <table role="presentation" width="100%" style="font-size:14px;color:#334155">
        <tr><td style="padding:6px 0;color:#64748b">Type</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0f172a">${esc(kLabel)}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Amount</td><td style="padding:6px 0;text-align:right;font-weight:800;font-size:18px;color:${BRAND}">${esc(amt)}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Reference</td><td style="padding:6px 0;text-align:right;font-family:ui-monospace,monospace;font-size:12px">${safeRef}</td></tr>
        ${listingTitle ? `<tr><td style="padding:6px 0;color:#64748b">Property</td><td style="padding:6px 0;text-align:right;font-weight:600">${esc(listingTitle)}</td></tr>` : ''}
      </table>
    </div>
    <p style="margin:18px 0 0;font-size:13px;line-height:1.6;color:#64748b">
      Payments on TrustedHome are processed via Paystack. Funds for listings are held on the platform &mdash; agents are not paid off-platform from this checkout.
    </p>`

  const userHtml = shellHtml({
    eyebrow: 'Receipt',
    title: 'Payment confirmed',
    bodyHtml: userBody,
    ctaLabel: kind === 'wallet_topup' ? 'View listings' : 'Continue on TrustedHome',
    ctaUrl: exploreUrl || appUrl,
  })

  const userText = [
    `Hi ${displayName},`,
    '',
    `Your ${kLabel} of ${amt} was successful.`,
    `Reference: ${reference}`,
    listingTitle ? `Property: ${listingTitle}` : '',
    '',
    'TrustedHome',
  ]
    .filter(Boolean)
    .join('\n')

  const opsBody = `
    <p style="margin:0 0 14px;font-size:14px;color:#334155"><strong>New successful payment</strong> on TrustedHome.</p>
    <div style="padding:16px 18px;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;line-height:1.65;color:#334155">
      <div><span style="color:#64748b">User ID</span> &nbsp; <code style="background:#fff;padding:2px 6px;border-radius:6px">${esc(userId)}</code></div>
      <div style="margin-top:8px"><span style="color:#64748b">Email</span> &nbsp; ${esc(userEmail || '—')}</div>
      <div style="margin-top:8px"><span style="color:#64748b">Type</span> &nbsp; ${esc(kLabel)}</div>
      <div style="margin-top:8px"><span style="color:#64748b">Amount</span> &nbsp; <strong style="color:${BRAND}">${esc(amt)}</strong></div>
      <div style="margin-top:8px"><span style="color:#64748b">Reference</span> &nbsp; <code style="background:#fff;padding:2px 6px;border-radius:6px">${safeRef}</code></div>
      ${listingTitle ? `<div style="margin-top:8px"><span style="color:#64748b">Listing</span> &nbsp; ${esc(listingTitle)}</div>` : ''}
    </div>`

  const opsHtml = shellHtml({
    eyebrow: 'Operations',
    title: 'Payment received',
    bodyHtml: opsBody,
    ctaLabel: '',
    ctaUrl: '',
  })

  const opsText = [
    'New successful payment',
    `User: ${userEmail || userId}`,
    `Type: ${kLabel}`,
    `Amount: ${amt}`,
    `Reference: ${reference}`,
    listingTitle ? `Listing: ${listingTitle}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const tasks = []
  if (userEmail) {
    tasks.push(
      sendMail({
        to: userEmail,
        subject: `TrustedHome — payment confirmed (${amt})`,
        text: userText,
        html: userHtml,
      }),
    )
  }
  for (const addr of config.opsNotifyEmails) {
    tasks.push(
      sendMail({
        to: addr,
        subject: `[TrustedHome Ops] ${kLabel} — ${amt} — ${reference}`,
        text: opsText,
        html: opsHtml,
      }),
    )
  }
  if (kind === 'hotel_reservation' && listingOwnerEmail) {
    const nights = Math.max(1, Math.floor(Number(metadata?.nights) || 1))
    const ownerBody = `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#334155">Hi ${esc(listingOwnerName || 'Agent')},</p>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.65;color:#475569">
        A hotel reservation payment has been completed for your listing${listingTitle ? ` <strong>${esc(listingTitle)}</strong>` : ''}.
      </p>
      <div style="padding:16px 18px;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;line-height:1.65;color:#334155">
        <div><span style="color:#64748b">Reservation nights</span> &nbsp; <strong>${nights}</strong></div>
        <div style="margin-top:8px"><span style="color:#64748b">Amount paid</span> &nbsp; <strong style="color:${BRAND}">${esc(amt)}</strong></div>
        <div style="margin-top:8px"><span style="color:#64748b">Reference</span> &nbsp; <code style="background:#fff;padding:2px 6px;border-radius:6px">${safeRef}</code></div>
      </div>`
    const ownerHtml = shellHtml({
      eyebrow: 'Reservation',
      title: 'New hotel reservation payment',
      bodyHtml: ownerBody,
      ctaLabel: 'Open dashboard',
      ctaUrl: appUrl ? `${appUrl}/agent` : appUrl,
    })
    const ownerText = [
      `Hi ${listingOwnerName || 'Agent'},`,
      '',
      `A reservation payment has been completed for ${listingTitle || 'your hotel listing'}.`,
      `Nights: ${nights}`,
      `Amount: ${amt}`,
      `Reference: ${reference}`,
      '',
      'TrustedHome',
    ].join('\n')
    tasks.push(
      sendMail({
        to: listingOwnerEmail,
        subject: `TrustedHome — hotel reservation paid (${amt})`,
        text: ownerText,
        html: ownerHtml,
      }),
    )
  }
  await Promise.all(tasks)
}

export async function sendPropertyInfoRequestEmail({ requesterName, requesterEmail, requesterPhone, note, listing }) {
  const purpose = String(listing?.purpose || 'Sale')
  const propertyType = String(listing?.propertyType || 'Property')
  const insight = buildAiInsight({
    location: listing?.location || 'this area',
    purpose,
    propertyType,
    priceNgn: listing?.priceNgn,
  })
  const amount = fmtNgn(listing?.priceNgn)
  const supportPhone = config.supportPhone
  const appUrl = String(config.appPublicUrl || '').replace(/\/+$/, '')
  const cta = appUrl ? `${appUrl}/property/${encodeURIComponent(String(listing?.id || ''))}` : ''
  const requesterBody = `
    <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#334155">Hi ${esc(requesterName)},</p>
    <p style="margin:0 0 14px;font-size:14px;line-height:1.65;color:#475569">
      We received your property information request. Our team can be reached on <strong>${esc(supportPhone)}</strong>.
    </p>
    <div style="padding:16px 18px;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0;font-size:13px;line-height:1.65;color:#334155">
      <div><span style="color:#64748b">Property</span> &nbsp; <strong>${esc(listing?.title)}</strong></div>
      <div style="margin-top:8px"><span style="color:#64748b">Location</span> &nbsp; ${esc(listing?.location)}</div>
      <div style="margin-top:8px"><span style="color:#64748b">Type</span> &nbsp; ${esc(propertyType)} (${esc(purpose)})</div>
      <div style="margin-top:8px"><span style="color:#64748b">Price</span> &nbsp; <strong style="color:${BRAND}">${esc(amount)}</strong></div>
      <div style="margin-top:8px"><span style="color:#64748b">Beds / Baths</span> &nbsp; ${esc(String(listing?.bedrooms ?? 0))} / ${esc(String(listing?.bathrooms ?? 0))}</div>
      <div style="margin-top:8px"><span style="color:#64748b">Area</span> &nbsp; ${esc(String(listing?.areaSqm ?? 0))} sqm</div>
    </div>
    <div style="margin-top:14px;padding:16px 18px;border-radius:14px;background:#eef2ff;border:1px solid #c7d2fe;font-size:13px;line-height:1.65;color:#312e81">
      <strong>AI Market Insight</strong><br/>
      ${esc(insight.narrative)}
    </div>
    ${note ? `<p style="margin:14px 0 0;font-size:12px;color:#64748b"><strong>Your note:</strong> ${esc(note)}</p>` : ''}
  `
  const requesterHtml = shellHtml({
    eyebrow: 'Request received',
    title: 'Property details and insight',
    bodyHtml: requesterBody,
    ctaLabel: cta ? 'View property' : '',
    ctaUrl: cta,
  })
  const requesterText = [
    `Hi ${requesterName},`,
    '',
    'We received your request for more information.',
    `Support: ${supportPhone}`,
    `Property: ${listing?.title}`,
    `Location: ${listing?.location}`,
    `Type: ${propertyType} (${purpose})`,
    `Price: ${amount}`,
    `Beds/Baths: ${listing?.bedrooms ?? 0}/${listing?.bathrooms ?? 0}`,
    `Area: ${listing?.areaSqm ?? 0} sqm`,
    '',
    `AI insight: ${insight.narrative}`,
    '',
    'TrustedHome',
  ].join('\n')

  const opsSummary = [
    `Property info request`,
    `Name: ${requesterName}`,
    `Email: ${requesterEmail}`,
    requesterPhone ? `Phone: ${requesterPhone}` : '',
    `Listing: ${listing?.title} (${listing?.id})`,
    `Location: ${listing?.location}`,
    note ? `Note: ${note}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  await sendMail({
    to: requesterEmail,
    subject: `TrustedHome — Request received for ${String(listing?.title || 'property')}`,
    text: requesterText,
    html: requesterHtml,
  })
  if (config.opsNotifyEmails.length) {
    await Promise.all(
      config.opsNotifyEmails.map((addr) =>
        sendMail({
          to: addr,
          subject: `[TrustedHome Ops] Property info request — ${String(listing?.id || '')}`,
          text: opsSummary,
        }),
      ),
    )
  }
}

function toIsoStampLocal(dateStr, timeStr) {
  return `${String(dateStr)}T${String(timeStr)}:00`
}

function ymdHmsCompact(d) {
  return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}T${String(d.getUTCHours()).padStart(2, '0')}${String(d.getUTCMinutes()).padStart(2, '0')}${String(d.getUTCSeconds()).padStart(2, '0')}Z`
}

function buildCalendarLinks({ title, description, location, visitDate, visitTime }) {
  const start = new Date(toIsoStampLocal(visitDate, visitTime))
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  const startUtc = ymdHmsCompact(start)
  const endUtc = ymdHmsCompact(end)
  const text = encodeURIComponent(title)
  const details = encodeURIComponent(description)
  const loc = encodeURIComponent(location || '')
  const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${startUtc}%2F${endUtc}&details=${details}&location=${loc}`
  const outlook = `https://outlook.live.com/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&subject=${text}&startdt=${encodeURIComponent(start.toISOString())}&enddt=${encodeURIComponent(end.toISOString())}&body=${details}&location=${loc}`
  return { google, outlook }
}

export async function sendScheduledVisitEmails({ listing, requester, agent, visitDate, visitTime }) {
  const appUrl = String(config.appPublicUrl || '').replace(/\/+$/, '')
  const title = `Property visit: ${listing?.title || 'Listing'}`
  const whenText = `${visitDate} ${visitTime}`
  const desc = `Scheduled property visit for ${listing?.title || 'listing'} at ${listing?.location || 'TrustedHome listing location'}.`
  const links = buildCalendarLinks({
    title,
    description: desc,
    location: listing?.location || '',
    visitDate,
    visitTime,
  })
  const requesterName = String(requester?.name || 'there')
  const agentName = String(agent?.name || 'Agent')
  const listingTitle = String(listing?.title || 'Property')
  const listingLocation = String(listing?.location || 'Listing location')

  const reqBody = `
    <p style="margin:0 0 12px;font-size:15px;color:#334155">Hi ${esc(requesterName)}, your visit request has been sent.</p>
    <div style="padding:16px;border:1px solid #e2e8f0;border-radius:14px;background:#f8fafc">
      <p style="margin:0 0 6px"><strong>Property:</strong> ${esc(listingTitle)}</p>
      <p style="margin:0 0 6px"><strong>Location:</strong> ${esc(listingLocation)}</p>
      <p style="margin:0 0 6px"><strong>Date & time:</strong> ${esc(whenText)}</p>
      <p style="margin:0"><strong>Agent:</strong> ${esc(agentName)} ${agent?.phone ? `(${esc(agent.phone)})` : ''}</p>
    </div>
    <p style="margin:14px 0 0;font-size:13px;color:#475569">Add this visit to your calendar:</p>
    <p style="margin:8px 0 0"><a href="${hrefAttr(links.google)}">Add to Google Calendar</a> &nbsp;|&nbsp; <a href="${hrefAttr(links.outlook)}">Add to Outlook</a></p>`

  const agBody = `
    <p style="margin:0 0 12px;font-size:15px;color:#334155">Hi ${esc(agentName)}, a new property visit was scheduled.</p>
    <div style="padding:16px;border:1px solid #e2e8f0;border-radius:14px;background:#f8fafc">
      <p style="margin:0 0 6px"><strong>Property:</strong> ${esc(listingTitle)}</p>
      <p style="margin:0 0 6px"><strong>Location:</strong> ${esc(listingLocation)}</p>
      <p style="margin:0 0 6px"><strong>Date & time:</strong> ${esc(whenText)}</p>
      <p style="margin:0"><strong>Visitor:</strong> ${esc(requesterName)} ${requester?.phone ? `(${esc(requester.phone)})` : ''}</p>
    </div>
    <p style="margin:14px 0 0;font-size:13px;color:#475569">Calendar links:</p>
    <p style="margin:8px 0 0"><a href="${hrefAttr(links.google)}">Google Calendar</a> &nbsp;|&nbsp; <a href="${hrefAttr(links.outlook)}">Outlook</a></p>`

  const reqHtml = shellHtml({
    eyebrow: 'Visits',
    title: 'Visit request submitted',
    bodyHtml: reqBody,
    ctaLabel: 'Open messages',
    ctaUrl: appUrl ? `${appUrl}/messages` : '',
  })
  const agHtml = shellHtml({
    eyebrow: 'Visits',
    title: 'New scheduled visit',
    bodyHtml: agBody,
    ctaLabel: 'Open messages',
    ctaUrl: appUrl ? `${appUrl}/messages` : '',
  })

  const tasks = []
  if (requester?.email) tasks.push(sendMail({ to: requester.email, subject: `TrustedHome visit booked — ${listingTitle}`, text: `Visit scheduled: ${listingTitle} on ${whenText}`, html: reqHtml }))
  if (agent?.email) tasks.push(sendMail({ to: agent.email, subject: `TrustedHome new visit request — ${listingTitle}`, text: `New visit request for ${listingTitle} on ${whenText}`, html: agHtml }))
  await Promise.all(tasks)
}

/**
 * Generic account activity email (user + ops). Use for future server-side transactions.
 * @param {{ title: string, summaryHtml: string, summaryText: string, userEmail?: string, userDisplayName?: string }} p
 */
export async function sendTransactionAlertEmails({ title, summaryHtml, summaryText, userEmail, userDisplayName }) {
  const name = String(userDisplayName || '').trim() || 'Member'
  const userBody = `
    <p style="margin:0 0 14px;font-size:16px;line-height:1.65;color:#334155">Hi ${esc(name)},</p>
    <div style="padding:18px 20px;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0;font-size:14px;line-height:1.65;color:#334155">
      ${summaryHtml}
    </div>`
  const userHtml = shellHtml({
    eyebrow: 'Account activity',
    title,
    bodyHtml: userBody,
    ctaLabel: 'Open TrustedHome',
    ctaUrl: String(config.appPublicUrl || '').replace(/\/+$/, '') || undefined,
  })

  const opsHtml = shellHtml({
    eyebrow: 'Operations',
    title,
    bodyHtml: `<div style="font-size:14px;line-height:1.65;color:#334155">${summaryHtml}</div>`,
    ctaLabel: '',
    ctaUrl: '',
  })

  const tasks = []
  const ue = String(userEmail || '').trim().toLowerCase()
  if (ue) {
    tasks.push(
      sendMail({
        to: ue,
        subject: `TrustedHome — ${title}`,
        text: `Hi ${name},\n\n${summaryText}\n\nTrustedHome`,
        html: userHtml,
      }),
    )
  }
  for (const addr of config.opsNotifyEmails) {
    tasks.push(
      sendMail({
        to: addr,
        subject: `[TrustedHome Ops] ${title}`,
        text: summaryText,
        html: opsHtml,
      }),
    )
  }
  if (tasks.length) await Promise.all(tasks)
}
