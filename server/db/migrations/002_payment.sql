-- Platform payments (Paystack). Run once on existing DBs:
--   psql "$DATABASE_URL" -f server/db/migrations/002_payment.sql

CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "reference" TEXT NOT NULL UNIQUE,
  "amountNgn" INTEGER NOT NULL,
  "kind" TEXT NOT NULL,
  "listingId" TEXT REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "paystackAccessCode" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Payment_userId_idx" ON "Payment" ("userId");
CREATE INDEX IF NOT EXISTS "Payment_listingId_idx" ON "Payment" ("listingId");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment" ("status");
