import { Router } from 'express'
import * as authController from '../controllers/authController.js'
import * as adminAuthController from '../controllers/adminAuthController.js'
import * as listingController from '../controllers/listingController.js'
import * as paymentController from '../controllers/paymentController.js'
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

r.post('/admin/auth/login', adminAuthController.staffLogin)
r.get('/admin/auth/me', adminAuthController.staffMe)
r.get('/admin/staff', requireStaffAuth, adminAuthController.listStaff)
r.post('/admin/staff', requireStaffAuth, adminAuthController.createStaff)

r.post('/listings', requireAppAuth, listingController.create)
r.get('/listings', listingController.list)
r.get('/listings/:id', listingController.getOne)
r.put('/listings/:id', requireAppAuth, listingController.update)
r.delete('/listings/:id', requireAppAuth, listingController.remove)

r.post('/payments/initialize', requireAppAuth, paymentController.initializePayment)

export const apiRouter = r
