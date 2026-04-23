import { Router } from 'express'
import * as authController from '../controllers/authController.js'
import * as adminAuthController from '../controllers/adminAuthController.js'
import * as listingController from '../controllers/listingController.js'
import * as paymentController from '../controllers/paymentController.js'
import * as walletController from '../controllers/walletController.js'
import * as agentVerificationController from '../controllers/agentVerificationController.js'
import { requireAppAuth } from '../middlewares/appAuth.js'
import { requireStaffAuth } from '../middlewares/staffAuth.js'

const r = Router()

r.get('/health', (_req, res) => res.json({ ok: true, service: 'trustedhome-api' }))

r.post('/auth/register', authController.register)
r.post('/auth/login', authController.login)
r.post('/auth/verify-email', authController.verifyEmail)
r.post('/auth/otp/resend-verify', authController.resendVerifyEmail)
r.post('/auth/google', authController.googleLogin)
r.post('/auth/forgot-password', authController.forgotPasswordRequest)
r.post('/auth/forgot-password/reset', authController.forgotPasswordReset)
r.post('/auth/otp/password-change', requireAppAuth, authController.requestPasswordChangeOtp)
r.put('/auth/password', requireAppAuth, authController.changePassword)
r.get('/auth/me', requireAppAuth, authController.me)
r.get('/agent/verification-status', requireAppAuth, agentVerificationController.myStatus)
r.post('/agent/verification-request', requireAppAuth, agentVerificationController.submitMyRequest)

r.post('/admin/auth/login', adminAuthController.staffLogin)
r.get('/admin/auth/me', adminAuthController.staffMe)
r.get('/admin/staff', requireStaffAuth, adminAuthController.listStaff)
r.post('/admin/staff', requireStaffAuth, adminAuthController.createStaff)
r.get('/admin/agents/verification/pending', requireStaffAuth, agentVerificationController.listPending)
r.patch('/admin/agents/:userId/verification', requireStaffAuth, agentVerificationController.setStatus)

r.post('/listings', requireAppAuth, listingController.create)
r.get('/listings', listingController.list)
r.get('/listings/:id', listingController.getOne)
r.put('/listings/:id', requireAppAuth, listingController.update)
r.delete('/listings/:id', requireAppAuth, listingController.remove)

r.post('/payments/initialize', requireAppAuth, paymentController.initializePayment)
r.post('/payments/listing/init', requireAppAuth, paymentController.initListingPayment)
r.get('/payments/status/:reference', requireAppAuth, paymentController.verifyPaymentStatus)

r.get('/wallet', requireAppAuth, walletController.getWallet)
r.get('/wallet/payments', requireAppAuth, walletController.listWalletPayments)
r.post('/wallet/fund', requireAppAuth, walletController.fundWallet)

export const apiRouter = r
