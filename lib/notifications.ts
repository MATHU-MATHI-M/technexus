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
