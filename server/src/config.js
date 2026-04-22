import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

/** Browsers send Origin without a trailing slash; normalize so CORS matches. */
function normalizeOriginUrl(raw) {
  return String(raw || '').trim().replace(/\/+$/, '')
}

/** Comma-separated: production + preview, e.g. `https://app.vercel.app,https://app-git-main-xxx.vercel.app` */
function parseClientOrigins(raw) {
  const list = String(raw || '')
    .split(',')
    .map(normalizeOriginUrl)
    .filter(Boolean)
  return list.length ? list : ['http://localhost:5173']
}

function required(name, { allowEmpty = false } = {}) {
  const v = process.env[name]
  if (v == null || (!allowEmpty && String(v).trim() === '')) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return v
}

export const config = {
  port: Number(process.env.PORT || 4000),
  /** Allowed browser origins for CORS (comma-separated in `CLIENT_ORIGIN`). */
  clientOrigins: parseClientOrigins(process.env.CLIENT_ORIGIN),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || '',
  otpPepper: process.env.OTP_PEPPER || '',
  paystackSecret: process.env.PAYSTACK_SECRET_KEY || '',
  paystackPublic: process.env.PAYSTACK_PUBLIC_KEY || '',
  adminBootstrapEmail: (process.env.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase(),
  adminBootstrapPassword: process.env.ADMIN_BOOTSTRAP_PASSWORD || '',
  /** Prefer over plain ADMIN_BOOTSTRAP_PASSWORD: full bcrypt hash of bootstrap password. */
  adminBootstrapPasswordBcrypt: (process.env.ADMIN_BOOTSTRAP_PASSWORD_BCRYPT || '').trim(),
  googleClientId: (process.env.GOOGLE_CLIENT_ID || '').trim(),
  smtpHost: (process.env.SMTP_HOST || '').trim(),
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: (process.env.SMTP_USER || '').trim(),
  /** Gmail “app passwords” are shown with spaces; SMTP expects one continuous string. */
  smtpPass: String(process.env.SMTP_PASS || '').replace(/\s+/g, ''),
  smtpSecure: process.env.SMTP_SECURE === '1' || process.env.SMTP_SECURE === 'true',
  mailFrom: (process.env.MAIL_FROM || '').trim(),
}

export function assertConfig() {
  required('DATABASE_URL', { allowEmpty: false })
  required('JWT_SECRET', { allowEmpty: false })
}
