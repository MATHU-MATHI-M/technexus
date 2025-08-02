"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  companyName: string
  userType: "tender" | "bidder"
  token: string
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

  const validateToken = useCallback(async (authToken: string) => {
    try {
      const response = await fetch("/api/auth/validate", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      return response.ok
    } catch (error) {
      console.error("Token validation error:", error)
      return false
    }
  }, [])

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem("auth_token")
        const storedUser = localStorage.getItem("auth_user")

        if (!storedToken || !storedUser) {
          setIsLoading(false)
          return
        }

        // Validate token first
        const isValidToken = await validateToken(storedToken)
        if (!isValidToken) {
          clearAuth()
          setIsLoading(false)
          router.push("/auth/signin")
          return
        }

        const userData = JSON.parse(storedUser)
        setUser(userData)
        setToken(storedToken)

        const response = await fetch("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to verify token")
        }

        const data = await response.json()
        if (!data.user) {
          throw new Error("No user data received")
        }

        const updatedUserData = {
          ...data.user,
          id: data.user._id,
          token: storedToken,
        }
        
        setUser(updatedUserData)
        localStorage.setItem("auth_user", JSON.stringify(updatedUserData))
      } catch (error) {
        console.error("Auth error:", error)
        logout()
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (token: string, userData: User) => {
    try {
      const userWithToken = { ...userData, token }
      setToken(token) 
      setUser(userWithToken)
      localStorage.setItem("auth_token", token)
      localStorage.setItem("auth_user", JSON.stringify(userWithToken))

      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to verify token")
      }

      const data = await response.json()
      if (!data.user) {
        throw new Error("No user data received") 
      }

      const updatedUserData = {
        ...data.user,
        id: data.user._id,
        token,
      }

      setUser(updatedUserData)
      localStorage.setItem("auth_user", JSON.stringify(updatedUserData))
    } catch (error) {
      console.error("Login error:", error)
      logout()
      throw error
    }
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
