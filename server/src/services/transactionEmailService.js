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
 * @param {{ userId: string, kind: string, amountNgn: number, reference: string, listingId: string | null }} p
 */
export async function sendPaymentSuccessEmails({ userId, kind, amountNgn, reference, listingId }) {
  const { rows: ur } = await query(`SELECT email, "displayName" AS dn FROM "User" WHERE id = $1 LIMIT 1`, [userId])
  const user = ur[0]
  const userEmail = user?.email ? String(user.email).toLowerCase() : ''
  const displayName = String(user?.dn || '').trim() || 'there'

  let listingTitle = ''
  if (listingId) {
    const { rows: lr } = await query(`SELECT title FROM "Listing" WHERE id = $1 LIMIT 1`, [listingId])
    listingTitle = lr[0]?.title ? String(lr[0].title) : ''
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
