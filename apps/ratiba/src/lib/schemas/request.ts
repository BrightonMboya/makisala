import { z } from 'zod'

export const requestSchema = z.object({
  clientId: z.string().optional(),
  email: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  tourTitle: z.string().min(1, 'Tour title is required'),
  tourType: z.string().min(1, 'Tour type is required'),
  startDate: z.date(),
  travelers: z.number().min(1, 'At least 1 traveler is required'),
  selectedTourId: z.string().min(1, 'Please select a tour template'),
}).refine(data => data.clientId || data.lastName, {
  message: 'Either select an existing client or enter client details',
  path: ['clientId'],
})

export type RequestFormValues = z.infer<typeof requestSchema>
