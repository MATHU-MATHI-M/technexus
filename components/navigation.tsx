"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import { NotificationBell } from "@/components/notifications/notification-bell"
import {
  Building2,
  Plus,
  Settings,
  User,
  BarChart3,
  FileText,
  Users,
  Home
} from "lucide-react"

export function Navigation() {
  const { user } = useAuth()
  const pathname = usePathname()

  // Don't show navigation on auth pages or landing page
  if (!user || pathname?.startsWith('/auth') || pathname === '/') return null

  const isTender = user.userType === "tender"
  const dashboardPath = isTender ? "/tender/dashboard" : "/bidder/dashboard"
  const settingsPath = isTender ? "/tender/settings" : "/bidder/settings"

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <Link href={dashboardPath} className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">TenderChain</h1>
              <p className="text-xs text-muted-foreground">{user.companyName}</p>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-4">
            <Link href={dashboardPath}>
              <Button variant="ghost" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            
            {isTender ? (
              <>
                <Link href="/tender/projects">
                  <Button variant="ghost" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Projects
                  </Button>
                </Link>
                <Link href="/tender/bids">
                  <Button variant="ghost" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Bids
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/bidder/tenders">
                  <Button variant="ghost" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Tenders
                  </Button>
                </Link>
                <Link href="/bidder/bids">
                  <Button variant="ghost" size="sm">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    My Bids
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center space-x-2">
          <NotificationBell />
          <Link href="/profile/edit">
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
          </Link>
          {isTender && (
            <Link href="/tender/projects/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </Link>
          )}
          <Link href={settingsPath}>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}