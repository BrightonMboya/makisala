'use server'

import { db, clients } from '@repo/db'
import { and, desc, eq, ilike } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  })
}

export async function getClients(options?: {
  query?: string
  page?: number
  limit?: number
}) {
  const session = await getSession()
  if (!session?.user?.organizationId) return { clients: [], pagination: { page: 1, limit: 10, hasNextPage: false } }

  const page = options?.page || 1
  const limit = options?.limit || 10
  const offset = (page - 1) * limit

  const conditions = [eq(clients.organizationId, session.user.organizationId)]

  // Validate and sanitize search input
  const query = options?.query?.trim().slice(0, 100)
  if (query && query.length >= 2) {
    conditions.push(ilike(clients.name, `%${query}%`))
  }

  const whereClause = and(...conditions)

  // Fetch one extra record to determine if there's a next page
  const data = await db
    .select()
    .from(clients)
    .where(whereClause)
    .limit(limit + 1)
    .offset(offset)
    .orderBy(desc(clients.createdAt))

  const hasNextPage = data.length > limit
  const clientsData = hasNextPage ? data.slice(0, limit) : data

  return {
    clients: clientsData,
    pagination: {
      page,
      limit,
      hasNextPage,
    },
  }
}

export async function getClientById(id: string) {
  const session = await getSession()
  if (!session?.user?.organizationId) return null

  const [client] = await db
    .select()
    .from(clients)
    .where(and(
      eq(clients.id, id),
      eq(clients.organizationId, session.user.organizationId)
    ))
    .limit(1)

  return client || null
}

export async function createClient(data: {
  name: string
  email?: string
  phone?: string
  countryOfResidence?: string
  notes?: string
}) {
  const session = await getSession()
  if (!session?.user?.organizationId) {
    throw new Error('Unauthorized')
  }

  const result = await db
    .insert(clients)
    .values({
      organizationId: session.user.organizationId,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      countryOfResidence: data.countryOfResidence || null,
      notes: data.notes || null,
    })
    .returning()

  const newClient = result[0]
  if (!newClient) {
    throw new Error('Failed to create client')
  }

  revalidatePath('/clients')
  return { success: true, id: newClient.id }
}

export async function updateClient(
  id: string,
  data: {
    name: string
    email?: string
    phone?: string
    countryOfResidence?: string
    notes?: string
  }
) {
  const session = await getSession()
  if (!session?.user?.organizationId) {
    throw new Error('Unauthorized')
  }

  await db
    .update(clients)
    .set({
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      countryOfResidence: data.countryOfResidence || null,
      notes: data.notes || null,
      updatedAt: new Date(),
    })
    .where(and(
      eq(clients.id, id),
      eq(clients.organizationId, session.user.organizationId)
    ))

  revalidatePath('/clients')
  revalidatePath(`/clients/${id}/edit`)
  return { success: true }
}

export async function deleteClient(id: string) {
  const session = await getSession()
  if (!session?.user?.organizationId) {
    throw new Error('Unauthorized')
  }

  await db
    .delete(clients)
    .where(and(
      eq(clients.id, id),
      eq(clients.organizationId, session.user.organizationId)
    ))

  revalidatePath('/clients')
  return { success: true }
}

export async function getAllClients() {
  const session = await getSession()
  if (!session?.user?.organizationId) return []

  const data = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .where(eq(clients.organizationId, session.user.organizationId))
    .orderBy(clients.name)

  return data
}
