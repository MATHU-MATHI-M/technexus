"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  companyName: string
  userType: "tender" | "bidder"
  token: string  // Add token field
  contactNumber?: string
  address?: string
  bio?: string
  website?: string
  specializations?: string[]
  // Company verification fields
  gstNumber?: string
  panNumber?: string
  cinNumber?: string
  registrationNumber?: string
  industry?: string
  companySize?: string
  establishedYear?: string
  registeredAddress?: string
  bankAccountNumber?: string
  bankIFSC?: string
  bankName?: string
  directorName?: string
  directorPAN?: string
  // Verification status
  verificationStatus?: {
    gst?: 'pending' | 'verified' | 'failed'
    pan?: 'pending' | 'verified' | 'failed'
    cin?: 'pending' | 'verified' | 'failed'
    bank?: 'pending' | 'verified' | 'failed'
    overall?: number // percentage
  }
  // Document uploads
  documents?: {
    gstCertificate?: string
    panCard?: string
    incorporationCertificate?: string
    bankStatement?: string
    auditedFinancials?: string
  }
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, userData: User) => void
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for stored auth data on mount
    const storedToken = localStorage.getItem("auth_token")
    const storedUser = localStorage.getItem("auth_user")

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setToken(storedToken)
        setUser(userData)

        // Verify token is still valid by fetching user profile
        fetchUserProfile(storedToken)
      } catch (error) {
        console.error("Error parsing stored user data:", error)
        logout()
      }
    }

    setIsLoading(false)
  }, [])

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser({
          ...data.user,
          id: data.user._id,
          token: authToken,
          email: data.user.email,
          companyName: data.user.companyName,
          userType: data.user.userType,
          contactNumber: data.user.contactNumber,
          address: data.user.address,
          bio: data.user.bio,
          website: data.user.website,
          specializations: data.user.specializations || [],
          // Company verification fields
          gstNumber: data.user.gstNumber,
          panNumber: data.user.panNumber,
          cinNumber: data.user.cinNumber,
          registrationNumber: data.user.registrationNumber,
          industry: data.user.industry,
          companySize: data.user.companySize,
          establishedYear: data.user.establishedYear,
          registeredAddress: data.user.registeredAddress,
          bankAccountNumber: data.user.bankAccountNumber,
          bankIFSC: data.user.bankIFSC,
          bankName: data.user.bankName,
          directorName: data.user.directorName,
          directorPAN: data.user.directorPAN,
          verificationStatus: data.user.verificationStatus,
          documents: data.user.documents,
        })
      } else {
        // Token is invalid
        logout()
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      logout()
    }
  }

  const login = (token: string, userData: User) => {
    const userWithToken = { ...userData, token }
    setToken(token)
    setUser(userWithToken)
    localStorage.setItem("auth_token", token)
    localStorage.setItem("auth_user", JSON.stringify(userWithToken))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_user")
    router.push("/auth/signin")
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
      localStorage.setItem("auth_user", JSON.stringify(updatedUser))
    }
  }

  const value = {
    user,
    token,
    login,
    logout,
    updateUser,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
