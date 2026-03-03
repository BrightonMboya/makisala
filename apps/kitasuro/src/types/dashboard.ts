export type AssignedUser = {
  id: string
  name: string
  image: string | null
}

export type ProposalStatus = 'draft' | 'shared' | 'accepted' | 'completed'

export type RequestItem = {
  id: string
  client: string
  travelers: number
  country: string
  title: string
  startDate: string
  received: string
  source: string
  status: ProposalStatus
  assignees: AssignedUser[]
  dayCount: number
}
