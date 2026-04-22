import jwt from 'jsonwebtoken'
import { config } from '../config.js'

const ISS = 'trustedhome-api'

export function signAppToken(payload) {
  return jwt.sign(
    { typ: 'app', ...payload },
    config.jwtSecret,
    { expiresIn: '7d', issuer: ISS },
  )
}

export function signStaffToken(payload) {
  return jwt.sign(
    { typ: 'staff', ...payload },
    config.jwtSecret,
    { expiresIn: '8h', issuer: ISS },
  )
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret, { issuer: ISS })
}
