import { getDatabase } from './mongodb'
import { sendEmail } from './email'

export type NotificationType = 
  | 'PROJECT_CREATED'
  | 'PROJECT_PUBLISHED'
  | 'BID_SUBMITTED'
  | 'PROFILE_CREATED'
  | 'BID_ACCEPTED'
  | 'BID_REJECTED'
  | 'TENDER_DEADLINE'
  | 'DOCUMENT_VERIFIED'
  | 'DOCUMENT_UPLOADED'
  | 'TENDER_DOCUMENT_UPLOADED'
  | 'BID_DOCUMENT_UPLOADED'
  | 'PROJECT_STATUS_CHANGED'
  | 'TENDER_UPDATED'
  | 'NEW_TENDER_AVAILABLE'
  | 'SIGNUP_COMPLETE'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  createdAt: Date
  metadata?: {
    projectId?: string
    bidId?: string
    tenderId?: string
    profileId?: string
  }
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Notification['metadata']
) {
  const db = await getDatabase()
  const notificationsCollection = db.collection('notifications')

  const notification = {
    userId,
    type,
    title,
    message,
    read: false,
    createdAt: new Date(),
    metadata
  }

  await notificationsCollection.insertOne(notification)

  // Get user email
  const usersCollection = db.collection('users')
  const user = await usersCollection.findOne({ _id: userId })

  if (user?.email && user?.notificationPreferences?.email !== false) {
    await sendEmail({
      to: user.email,
      subject: title,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">${title}</h2>
          <p>${message}</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            You received this notification from TenderChain. 
            To manage your notification preferences, visit your account settings.
          </p>
        </div>
      `
    })
  }

  return notification
}

export async function getUnreadNotifications(userId: string) {
  const db = await getDatabase()
  const notificationsCollection = db.collection('notifications')

  return await notificationsCollection
    .find({ userId, read: false })
    .sort({ createdAt: -1 })
    .toArray()
}

export async function markNotificationAsRead(notificationId: string) {
  const db = await getDatabase()
  const notificationsCollection = db.collection('notifications')

  await notificationsCollection.updateOne(
    { _id: notificationId },
    { $set: { read: true } }
  )
}

export async function updateNotificationPreferences(userId: string, preferences: {
  email?: boolean
  inApp?: boolean
  push?: boolean
}) {
  const db = await getDatabase()
  const usersCollection = db.collection('users')

  await usersCollection.updateOne(
    { _id: userId },
    { $set: { notificationPreferences: preferences } }
  )
}

// Notify multiple users at once
export async function createBulkNotifications(
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Notification['metadata']
) {
  const db = await getDatabase()
  const notificationsCollection = db.collection('notifications')
  const usersCollection = db.collection('users')

  // Create notifications for all users
  const notifications = userIds.map(userId => ({
    userId,
    type,
    title,
    message,
    read: false,
    createdAt: new Date(),
    metadata
  }))

  await notificationsCollection.insertMany(notifications)

  // Send emails to users who have email notifications enabled
  const users = await usersCollection
    .find({ 
      _id: { $in: userIds },
      'notificationPreferences.email': { $ne: false }
    })
    .toArray()

  for (const user of users) {
    if (user.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">${title}</h2>
              <p>${message}</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">
                You received this notification from TenderChain. 
                To manage your notification preferences, visit your account settings.
              </p>
            </div>
          `
        })
      } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error)
      }
    }
  }

  return notifications
}

// Get all bidders who might be interested in a tender based on their bidder type
export async function getInterestedBidders(tenderCategory: string, tenderSector?: string) {
  const db = await getDatabase()
  const usersCollection = db.collection('users')

  // Map tender categories to bidder types
  const categoryToBidderType: Record<string, string[]> = {
    'Construction': ['CONTRACTOR'],
    'Infrastructure': ['CONTRACTOR'],
    'Renovation': ['CONTRACTOR'],
    'Software Development': ['DEVELOPER'],
    'IT Services': ['DEVELOPER'],
    'Digital Solutions': ['DEVELOPER'],
    'Technology': ['DEVELOPER'],
    'Equipment': ['SUPPLIER'],
    'Materials': ['SUPPLIER'],
    'Goods': ['SUPPLIER'],
    'Supply Chain': ['SUPPLIER'],
    'Professional Services': ['CONSULTANT'],
    'Advisory': ['CONSULTANT'],
    'Design': ['CONSULTANT'],
    'Consulting': ['CONSULTANT']
  }

  let relevantBidderTypes: string[] = []
  
  // Find relevant bidder types based on category
  for (const [category, bidderTypes] of Object.entries(categoryToBidderType)) {
    if (tenderCategory.toLowerCase().includes(category.toLowerCase()) ||
        (tenderSector && tenderSector.toLowerCase().includes(category.toLowerCase()))) {
      relevantBidderTypes.push(...bidderTypes)
    }
  }

  // If no specific match, notify all bidders
  if (relevantBidderTypes.length === 0) {
    relevantBidderTypes = ['CONTRACTOR', 'DEVELOPER', 'SUPPLIER', 'CONSULTANT']
  }

  // Get bidders with matching types
  const bidders = await usersCollection
    .find({ 
      userType: 'bidder',
      bidderType: { $in: relevantBidderTypes },
      isVerified: true
    })
    .toArray()

  return bidders.map(bidder => bidder._id.toString())
}

// Notify when tender uploads a document
export async function notifyTenderDocumentUpload(
  tenderId: string,
  tenderTitle: string,
  documentName: string,
  uploadedBy: string
) {
  const db = await getDatabase()
  const bidsCollection = db.collection('bids')

  // Get all bidders who have submitted bids for this tender
  const bids = await bidsCollection
    .find({ tenderId })
    .toArray()

  const bidderIds = bids.map(bid => bid.bidderId.toString())

  if (bidderIds.length > 0) {
    await createBulkNotifications(
      bidderIds,
      'TENDER_DOCUMENT_UPLOADED',
      'New Document Available',
      `A new document "${documentName}" has been uploaded for tender "${tenderTitle}". Please review it.`,
      {
        tenderId,
        projectId: tenderId
      }
    )
  }
}

// Notify when bidder uploads a document
export async function notifyBidderDocumentUpload(
  tenderId: string,
  tenderTitle: string,
  documentName: string,
  bidderCompany: string,
  tenderOwnerId: string
) {
  await createNotification(
    tenderOwnerId,
    'BID_DOCUMENT_UPLOADED',
    'New Bid Document Received',
    `${bidderCompany} has uploaded a new document "${documentName}" for tender "${tenderTitle}".`,
    {
      tenderId,
      projectId: tenderId
    }
  )
}
