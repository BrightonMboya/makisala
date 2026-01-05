'use server'

import { db, clients } from '@repo/db'
import { and, desc, eq, ilike, sql } from 'drizzle-orm'
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
  if (!session?.user?.organizationId) return { clients: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }

  const page = options?.page || 1
  const limit = options?.limit || 10
  const offset = (page - 1) * limit

  const conditions = [eq(clients.organizationId, session.user.organizationId)]
  if (options?.query) {
    conditions.push(ilike(clients.name, `%${options.query}%`))
  }

  const whereClause = and(...conditions)

  const [data, total] = await Promise.all([
    db
      .select()
      .from(clients)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(clients.createdAt)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(whereClause)
      .then(res => Number(res[0]?.count || 0)),
  ])

  return {
    clients: data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
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

  const [newClient] = await db
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
