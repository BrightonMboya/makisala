'use client'

import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Textarea } from '@repo/ui/textarea'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient, updateClient, deleteClient } from './actions'
import { toast } from '@repo/ui/toast'

interface ClientFormProps {
  client?: {
    id: string
    name: string
    email: string | null
    phone: string | null
    countryOfResidence: string | null
    notes: string | null
  }
}

export function ClientForm({ client }: ClientFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isEditing = !!client

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      countryOfResidence: formData.get('countryOfResidence') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    }

    try {
      if (isEditing) {
        await updateClient(client.id, data)
        toast({ title: 'Client updated successfully' })
      } else {
        await createClient(data)
        toast({ title: 'Client created successfully' })
      }
      router.push('/clients')
    } catch (error) {
      toast({ title: 'Something went wrong', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!client || !confirm('Are you sure you want to delete this client?')) return

    setIsDeleting(true)
    try {
      await deleteClient(client.id)
      toast({ title: 'Client deleted successfully' })
      router.push('/clients')
    } catch (error) {
      toast({ title: 'Failed to delete client', variant: 'destructive' })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={client?.name || ''}
            required
            placeholder="John Doe"
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={client?.email || ''}
            placeholder="john@example.com"
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={client?.phone || ''}
            placeholder="+1 234 567 8900"
          />
        </div>

        <div>
          <Label htmlFor="countryOfResidence">Country of Residence</Label>
          <Input
            id="countryOfResidence"
            name="countryOfResidence"
            defaultValue={client?.countryOfResidence || ''}
            placeholder="United States"
          />
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={client?.notes || ''}
            placeholder="Any additional notes about this client..."
            rows={4}
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          {isEditing && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Client'}
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/clients')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Client' : 'Create Client'}
          </Button>
        </div>
      </div>
    </form>
  )
}
