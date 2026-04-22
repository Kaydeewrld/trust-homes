import fs from 'fs'
import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config({ path: 'c:/Users/MTECH COMPUTERS/trusted-home/server/.env' })

const sql = fs.readFileSync('c:/Users/MTECH COMPUTERS/trusted-home/server/db/schema.sql', 'utf8')
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

await client.connect()
await client.query(sql)
const check = await client.query(`
  SELECT
    to_regclass('"User"') AS user_tbl,
    to_regclass('"Wallet"') AS wallet_tbl,
    to_regclass('"OtpCode"') AS otp_tbl,
    to_regclass('"StaffAdmin"') AS staff_tbl,
    to_regclass('"Listing"') AS listing_tbl
`)
console.log(check.rows[0])
await client.end()
