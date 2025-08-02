export type BidderType = 
  | 'CONTRACTOR'
  | 'DEVELOPER'
  | 'SUPPLIER'
  | 'CONSULTANT'
  | 'BUYER'

export interface UserProfile {
  userId: string
  bidderType: BidderType
  company: {
    name: string
    registrationNumber?: string
    address?: string
    website?: string
  }
  experience?: {
    years: number
    sectors: string[]
    previousProjects?: number
  }
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'
  documents?: {
    type: string
    url: string
    verified: boolean
  }[]
  notificationPreferences: {
    email: boolean
    inApp: boolean
    push: boolean
  }
  createdAt: Date
  updatedAt: Date
}

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  email: true,
  inApp: true,
  push: false
}

export const BIDDER_TYPES = [
  {
    value: 'CONTRACTOR',
    label: 'Contractor',
    description: 'Construction and infrastructure contractors',
    sectors: ['Construction', 'Infrastructure', 'Renovation']
  },
  {
    value: 'DEVELOPER',
    label: 'Software Developer',
    description: 'Software and IT service providers',
    sectors: ['Software Development', 'IT Services', 'Digital Solutions']
  },
  {
    value: 'SUPPLIER',
    label: 'Supplier',
    description: 'Product and material suppliers',
    sectors: ['Equipment', 'Materials', 'Goods']
  },
  {
    value: 'CONSULTANT',
    label: 'Consultant',
    description: 'Professional services and consultancy',
    sectors: ['Professional Services', 'Advisory', 'Design']
  },
  {
    value: 'BUYER',
    label: 'Tender Issuer / Buyer',
    description: 'Organizations issuing tenders',
    sectors: ['All']
  }
]
