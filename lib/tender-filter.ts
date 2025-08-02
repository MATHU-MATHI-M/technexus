import { BidderType } from './user-profile'

export interface Tender {
  id: string
  title: string
  description: string
  sector: string
  categories: string[]
  budget: {
    min: number
    max: number
    currency: string
  }
  deadline: Date
  requirements: {
    experience?: number
    certification?: string[]
    location?: string
  }
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'AWARDED'
  createdAt: Date
  updatedAt: Date
}

export function filterTendersByBidderType(
  tenders: Tender[],
  bidderType: BidderType,
  userExperience?: number
): Tender[] {
  if (bidderType === 'BUYER') {
    return tenders // Buyers can see all tenders
  }

  const sectorMap: Record<BidderType, string[]> = {
    CONTRACTOR: ['Construction', 'Infrastructure', 'Renovation', 'Maintenance'],
    DEVELOPER: ['Software Development', 'IT Services', 'Digital Solutions', 'Technology'],
    SUPPLIER: ['Equipment', 'Materials', 'Goods', 'Supply Chain'],
    CONSULTANT: ['Professional Services', 'Advisory', 'Design', 'Consulting'],
    BUYER: ['All']
  }

  const relevantSectors = sectorMap[bidderType] || []

  return tenders.filter(tender => {
    // Filter by sector
    const sectorMatch = relevantSectors.some(sector => 
      tender.sector.toLowerCase().includes(sector.toLowerCase()) ||
      tender.categories.some(cat => cat.toLowerCase().includes(sector.toLowerCase()))
    )

    // Filter by experience if specified
    const experienceMatch = !tender.requirements.experience || 
      !userExperience || 
      userExperience >= tender.requirements.experience

    return sectorMatch && experienceMatch
  })
}

export function getTenderRecommendations(
  tenders: Tender[],
  userProfile: {
    bidderType: BidderType
    experience?: { years: number, sectors: string[] }
  }
): Tender[] {
  const filteredTenders = filterTendersByBidderType(
    tenders,
    userProfile.bidderType,
    userProfile.experience?.years
  )

  // Score each tender based on relevance
  const scoredTenders = filteredTenders.map(tender => {
    let score = 0

    // Sector match score
    if (userProfile.experience?.sectors.some(sector => 
      tender.sector.toLowerCase().includes(sector.toLowerCase())
    )) {
      score += 3
    }

    // Experience match score
    if (tender.requirements.experience && userProfile.experience?.years) {
      const experienceDiff = userProfile.experience.years - tender.requirements.experience
      if (experienceDiff >= 2) score += 2
      else if (experienceDiff >= 0) score += 1
    }

    // Deadline proximity score
    const daysUntilDeadline = Math.ceil(
      (new Date(tender.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysUntilDeadline <= 7) score += 2
    else if (daysUntilDeadline <= 14) score += 1

    return { ...tender, score }
  })

  // Sort by score and return top matches
  return scoredTenders
    .sort((a, b) => b.score - a.score)
    .map(({ score, ...tender }) => tender)
}
