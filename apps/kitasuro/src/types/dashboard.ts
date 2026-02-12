export type AssignedUser = {
  id: string
  name: string
  image: string | null
}

export type RequestItem = {
  id: string
  client: string
  travelers: number
  country: string
  title: string
  startDate: string
  received: string
  source: string
  status: 'new' | 'working' | 'draft' | 'shared'
  assignees: AssignedUser[]
}
