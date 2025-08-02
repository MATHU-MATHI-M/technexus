import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

// Define return types for better type safety
interface NotificationResponse {
  notifications: any[]
  unreadCount: number
  total: number
}

export async function GET(request: NextRequest): Promise<NextResponse<NotificationResponse | { error: string }>> {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "20")
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    const db = await getDatabase()
    const notificationsCollection = db.collection("notifications")

    const query: any = { userId: payload.userId }
    if (unreadOnly) {
      query.read = false
    }

    try {
      const userNotifications = await notificationsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray()

      const unreadCount = await notificationsCollection.countDocuments({
        userId: payload.userId,
        read: false
      })

      return NextResponse.json({
        notifications: userNotifications || [],
        unreadCount: unreadCount || 0,
        total: userNotifications?.length || 0
      })
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

  } catch (error) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { notificationIds, markAsRead } = body

    const db = await getDatabase()
    const notificationsCollection = db.collection("notifications")

    if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications
      await notificationsCollection.updateMany(
        { 
          _id: { $in: notificationIds.map((id: string) => new ObjectId(id)) },
          userId: payload.userId 
        },
        { $set: { read: markAsRead, updatedAt: new Date() } }
      )
    } else {
      // Mark all notifications for user
      await notificationsCollection.updateMany(
        { userId: payload.userId },
        { $set: { read: markAsRead, updatedAt: new Date() } }
      )
    }

    return NextResponse.json({
      message: `Notifications marked as ${markAsRead ? 'read' : 'unread'}`,
      updated: notificationIds?.length || "all"
    })

  } catch (error) {
    console.error("Error updating notifications:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}