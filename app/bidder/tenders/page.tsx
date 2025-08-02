"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Search, Filter, Calendar, MapPin, DollarSign, Users, Eye, Plus } from "lucide-react"
import Link from "next/link"

export default function TendersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [tenders, setTenders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [budgetFilter, setBudgetFilter] = useState("all")

  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    if (!user || user.userType !== "bidder") {
      router.push("/auth/signin")
      return
    }

    // Fetch user profile first
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/user/profile')
        const data = await response.json()
        setUserProfile(data.profile)
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }

    fetchUserProfile()
    fetchTenders()
  }, [user, router])

  useEffect(() => {
    if (tenders.length > 0 && userProfile) {
      // Filter tenders based on user's bidder type
      const filteredTenders = filterTendersByBidderType(
        tenders,
        userProfile.bidderType,
        userProfile.experience?.years
      )
      setTenders(filteredTenders)
    }
  }, [userProfile])

  const fetchTenders = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const response = await fetch("/api/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTenders(data.projects || [])
      }
    } catch (error) {
      console.error("Error fetching tenders:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800"
      case "active":
        return "bg-blue-100 text-blue-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      case "awarded":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredTenders = tenders.filter((tender: any) => {
    const matchesSearch = tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tender.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || tender.category === categoryFilter
    
    let matchesBudget = true
    if (budgetFilter !== "all") {
      const budget = tender.budget || 0
      switch (budgetFilter) {
        case "small":
          matchesBudget = budget < 10000
          break
        case "medium":
          matchesBudget = budget >= 10000 && budget < 100000
          break
        case "large":
          matchesBudget = budget >= 100000
          break
      }
    }
    
    return matchesSearch && matchesCategory && matchesBudget
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Available Tenders</h1>
              <p className="text-sm text-muted-foreground">Browse and bid on available projects</p>
            </div>
          </div>
          <Link href="/bidder/dashboard">
            <Button variant="outline">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search tenders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="construction">Construction</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="services">Services</SelectItem>
              <SelectItem value="supplies">Supplies</SelectItem>
            </SelectContent>
          </Select>
          <Select value={budgetFilter} onValueChange={setBudgetFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by budget" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Budgets</SelectItem>
              <SelectItem value="small">Small (&lt;$10k)</SelectItem>
              <SelectItem value="medium">Medium ($10k-$100k)</SelectItem>
              <SelectItem value="large">Large (&gt;$100k)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tenders Grid */}
        {filteredTenders.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tenders found</h3>
            <p className="text-gray-500 mb-4">
              {tenders.length === 0 
                ? "No tenders are currently available." 
                : "No tenders match your current filters."}
            </p>
            <p className="text-sm text-gray-400">Check back later for new opportunities.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTenders.map((tender: any) => (
              <Card key={tender._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{tender.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {tender.description.substring(0, 100)}
                        {tender.description.length > 100 && "..."}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(tender.status)}>
                      {tender.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Budget: ${tender.budget?.toLocaleString() || "Not specified"}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {tender.location || "Location not specified"}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Deadline: {new Date(tender.deadline).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      {tender.bidCount || 0} bids submitted
                    </div>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <Link href={`/bidder/tenders/${tender._id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/bidder/tenders/${tender._id}/submit-bid`} className="flex-1">
                      <Button className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Submit Bid
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 