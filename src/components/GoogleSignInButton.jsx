import { GoogleLogin } from '@react-oauth/google'
import { useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authGoogleLogin } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

/**
 * @param {{ intent: 'USER' | 'AGENT', className?: string, ux?: 'login' | 'signup' }} props
 */
function safeNextPath(raw) {
  if (!raw || typeof raw !== 'string') return null
  const s = raw.trim()
  if (!s.startsWith('/') || s.startsWith('//')) return null
  return s
}

export default function GoogleSignInButton({ intent, className = '', ux = 'login' }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { applySession } = useAuth()
  const toast = useToast()

  const onSuccess = useCallback(
    async (credentialResponse) => {
      const idToken = credentialResponse?.credential
      if (!idToken) {
        toast.error('Google sign-in failed', 'No credential returned.')
        return
      }
      try {
        const data = await authGoogleLogin({ idToken, intent })
        applySession({ token: data.token, user: data.user })
        toast.success('Signed in', 'Welcome to TrustedHome.')
        const next = safeNextPath(searchParams.get('next'))
        navigate(next || (data.user?.role === 'AGENT' ? '/agent' : '/explore'))
      } catch (e) {
        toast.error('Google sign-in failed', e.message || 'Try again or use email.')
      }
    },
    [applySession, intent, navigate, searchParams, toast],
  )

  if (!googleClientId) return null

  return (
    <div className={className}>
      <GoogleLogin
        text={ux === 'signup' ? 'signup_with' : 'continue_with'}
        shape="rectangular"
        size="large"
        width="100%"
        locale="en"
        onSuccess={onSuccess}
        onError={() => toast.error('Google sign-in failed', 'Popup closed or blocked.')}
      />
    </div>
  )
}
