import { randomUUID } from 'crypto'

/** Text primary keys (compatible with prior Prisma `cuid()`-style ids). */
export function createId() {
  return randomUUID()
}
