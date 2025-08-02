"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Search, Filter, Calendar, Building2, DollarSign, Eye, TrendingUp, FileText } from "lucide-react"
import Link from "next/link"

export default function BidderBidsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    if (!user || user.userType !== "bidder") {
      router.push("/auth/signin")
      return
    }

    fetchMyBids()
  }, [user, router])

  const fetchMyBids = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/bids/my-bids", {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch bids")
      }

      const data = await response.json()
      console.log("Fetched bids:", data)  // Debug log
      setBids(data.bids || [])
    } catch (error) {
      console.error("Error fetching bids:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyBids = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/bids/my-bids", {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch bids")
      }

      const data = await response.json()
      console.log("Fetched bids:", data)  // Debug log
      setBids(data.bids || [])
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const response = await fetch("/api/bids/my-bids", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setBids(data.bids || [])
      }
    } catch (error) {
      console.error("Error fetching my bids:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-100 text-blue-800"
      case "under_review":
        return "bg-yellow-100 text-yellow-800"
      case "shortlisted":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      case "awarded":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredBids = bids.filter((bid: any) => {
    const matchesSearch = bid.projectTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bid.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || bid.status === statusFilter
    
    return matchesSearch && matchesStatus
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
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">My Bids</h1>
              <p className="text-sm text-muted-foreground">Track your submitted bids and their status</p>
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
                placeholder="Search bids..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="shortlisted">Shortlisted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="awarded">Awarded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bids Grid */}
        {filteredBids.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bids found</h3>
            <p className="text-gray-500 mb-4">
              {bids.length === 0 
                ? "You haven't submitted any bids yet." 
                : "No bids match your current filters."}
            </p>
            {bids.length === 0 && (
              <Link href="/bidder/dashboard">
                <Button>
                  <Building2 className="h-4 w-4 mr-2" />
                  Browse Available Tenders
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBids.map((bid: any) => (
              <Card key={bid._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{bid.projectTitle || "Project Title"}</CardTitle>
                      <CardDescription className="mt-2">
                        {bid.proposal?.substring(0, 100) || "No proposal details"}
                        {bid.proposal && bid.proposal.length > 100 && "..."}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(bid.status)}>
                      {bid.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Building2 className="h-4 w-4 mr-2" />
                      {bid.companyName || "Company Name"}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Bid Amount: ${bid.bidAmount?.toLocaleString() || "Not specified"}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Submitted: {new Date(bid.createdAt).toLocaleDateString()}
                    </div>
                    {bid.rank && (
                      <div className="flex items-center text-sm text-gray-600">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Rank: #{bid.rank} of {bid.totalBids || "?"}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <Link href={`/bidder/bids/${bid._id}`} className="flex-1">
                      <Button className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/bidder/tenders/${bid.projectId}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Building2 className="h-4 w-4 mr-2" />
                        View Project
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