import nodemailer from 'nodemailer'
import { config } from '../config.js'

let transporter

function getTransporter() {
  if (!config.smtpHost) return null
  if (!transporter) {
    const isGmail = /gmail\.com$/i.test(config.smtpHost)
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      requireTLS: !config.smtpSecure && config.smtpPort === 587,
      tls: isGmail ? { minVersion: 'TLSv1.2' } : undefined,
      auth:
        config.smtpUser && config.smtpPass
          ? { user: config.smtpUser, pass: config.smtpPass }
          : undefined,
    })
  }
  return transporter
}

/**
 * @param {{ to: string, subject: string, text: string, html?: string }} opts
 */
export async function sendMail({ to, subject, text, html }) {
  const from = config.mailFrom || config.smtpUser
  if (!from) {
    console.warn('[mail] MAIL_FROM / SMTP_USER not set; logging body only')
    console.warn('[mail]', { to, subject, text })
    return { sent: false, reason: 'no_from' }
  }
  const tx = getTransporter()
  if (!tx) {
    console.warn('[mail] SMTP_HOST not set; logging body only')
    console.warn('[mail]', { to, subject, text })
    return { sent: false, reason: 'no_smtp' }
  }
  await tx.sendMail({ from, to, subject, text, html: html || text })
  return { sent: true }
}
