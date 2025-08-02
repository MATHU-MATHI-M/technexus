"use client"

import { useState, useEffect } from 'react'
import { Bell, BellRing, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: Date
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    fetchNotifications()
    // Poll for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      const notificationsData = data.notifications || []
      setNotifications(notificationsData)
      setUnreadCount(notificationsData.filter((n: Notification) => !n.read).length)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      // Set empty array as fallback to prevent undefined errors
      setNotifications([])
      setUnreadCount(0)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      })
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <DropdownMenuItem
      className={`flex flex-col items-start p-4 space-y-1 ${
        !notification.read ? 'bg-blue-50' : ''
      }`}
    >
      <div className="flex items-center justify-between w-full">
        <span className="font-semibold text-sm">{notification.title}</span>
        <div className="flex items-center space-x-2">
          {!notification.read && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                markAsRead(notification.id)
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Check className="h-4 w-4 text-green-500" />
            </button>
          )}
          <span className="text-xs text-gray-500">
            {new Date(notification.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-600">{notification.message}</p>
    </DropdownMenuItem>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative p-2">
          {unreadCount > 0 ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="max-h-96 overflow-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No notifications
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
