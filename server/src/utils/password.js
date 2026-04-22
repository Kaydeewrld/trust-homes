import bcrypt from 'bcryptjs'

const ROUNDS = 11

export async function hashPassword(plain) {
  return bcrypt.hash(plain, ROUNDS)
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash)
}
