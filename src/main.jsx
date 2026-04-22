import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { WalletProvider } from './context/WalletContext'
import { ToastProvider } from './context/ToastContext'
import { AdminAuthProvider } from './context/AdminAuthContext'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

const app = (
  <BrowserRouter>
    <AuthProvider>
      <AdminAuthProvider>
        <FavoritesProvider>
          <ToastProvider>
            <WalletProvider>
              <App />
            </WalletProvider>
          </ToastProvider>
        </FavoritesProvider>
      </AdminAuthProvider>
    </AuthProvider>
  </BrowserRouter>
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {googleClientId ? <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider> : app}
  </StrictMode>,
)
