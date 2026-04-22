import pg from 'pg'
import { config } from './config.js'

const { Pool } = pg

function sslOption() {
  const u = config.databaseUrl || ''
  if (u.includes('sslmode=require') || u.includes('ssl=true')) {
    return { rejectUnauthorized: false }
  }
  return undefined
}

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: sslOption(),
})

/**
 * @param {string} text
 * @param {unknown[]} [params]
 */
export async function query(text, params = []) {
  return pool.query(text, params)
}
