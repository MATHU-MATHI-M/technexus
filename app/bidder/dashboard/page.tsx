"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LogoutButton } from "@/components/logout-button"
import {
  Building2,
  Search,
  Filter,
  Eye,
  FileText,
  Clock,
  DollarSign,
  TrendingUp,
  Award,
  Settings,
  User,
} from "lucide-react"
import Link from "next/link"
import { NotificationBell } from "@/components/notifications"
import { VerificationStatusCard } from "@/components/verification-status-card"

// Tenders will be fetched from API

// Bids will be fetched from API

export default function BidderDashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("tenders")
  const [tenders, setTenders] = useState([])
  const [loadingTenders, setLoadingTenders] = useState(true)
  const [bids, setBids] = useState([])
  const [loadingBids, setLoadingBids] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bidStatuses, setBidStatuses] = useState({}) // Store bid status for each tender
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")

  useEffect(() => {
    // Wait for authentication to complete
    if (isLoading) {
      return
    }

    // Redirect if no user
    if (!user) {
      router.push("/auth/signin")
      return
    }

    // Check user type
    if (user.userType !== "bidder") {
      setError("Access denied. This page is only for bidders.")
      return
    }

    // Initialize data loading
    const fetchInitialData = async () => {
      try {
        setLoadingTenders(true)
        setLoadingBids(true)
        
        // Fetch tenders
        const token = localStorage.getItem("auth_token")
        if (!token) {
          throw new Error("No auth token found")
        }

        // Fetch tenders with auth
        const response = await fetch("/api/projects", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          if (response.status === 401) {
            // Token expired or invalid
            router.push("/auth/signin")
            return
          }
          throw new Error(`Failed to fetch projects: ${response.statusText}`)
        }
        
        const data = await response.json()
        const projects = data.projects || []
        setTenders(projects)
        await checkBidStatuses(projects)

        // Fetch bids
        const bidsResponse = await fetch("/api/bids/my-bids", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        
        if (!bidsResponse.ok) {
          if (bidsResponse.status === 401) {
            // Token expired or invalid
            router.push("/auth/signin")
            return
          }
          throw new Error(`Failed to fetch bids: ${bidsResponse.statusText}`)
        }
        
        const bidsData = await bidsResponse.json()
        setBids(bidsData.bids || [])
      } catch (error) {
        console.error("Error fetching initial data:", error)
        setError("Failed to load dashboard data. Please try again.")
      } finally {
        setLoadingTenders(false)
        setLoadingBids(false)
      }
    }

    fetchInitialData()
  }, [user, isLoading, router])

  // Check bid status for each project
  const checkBidStatuses = async (projects: any[]) => {
    if (!user) return
    
    const token = localStorage.getItem("auth_token")
    if (!token) return

    const statuses: any = {}
    
    for (const project of projects) {
      try {
        const response = await fetch(`/api/bids?projectId=${project._id}&bidderId=${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.bids && data.bids.length > 0) {
            statuses[project._id] = data.bids[0].status
          }
        }
      } catch (error) {
        console.error(`Error checking bid status for project ${project._id}:`, error)
      }
    }
    
    setBidStatuses(statuses)
  }

  // Remove the duplicate useEffects since we've moved their logic to the main useEffect

  if (isLoading) {
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

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-4">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <div className="mt-4 space-x-4">
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.push("/auth/signin")}>
              Back to Sign In
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!user || user.userType !== "bidder") {
    router.push("/auth/signin")
    return null
  }

  if (!user || user.userType !== "bidder") {
    return null
  }

  const getBidStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-500"
      case "shortlisted":
        return "bg-green-500"
      case "awarded":
        return "bg-purple-500"
      case "rejected":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getBidStatusText = (status: string) => {
    switch (status) {
      case "submitted":
        return "Submitted"
      case "shortlisted":
        return "Shortlisted"
      case "awarded":
        return "Awarded"
      case "rejected":
        return "Rejected"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-500"
      case "closing-soon":
        return "bg-yellow-500"
      case "closed":
        return "bg-red-500"
      case "under-review":
        return "bg-blue-500"
      case "shortlisted":
        return "bg-purple-500"
      case "awarded":
        return "bg-green-600"
      case "rejected":
        return "bg-red-600"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "Open"
      case "closing-soon":
        return "Closing Soon"
      case "closed":
        return "Closed"
      case "under-review":
        return "Under Review"
      case "shortlisted":
        return "Shortlisted"
      case "awarded":
        return "Awarded"
      case "rejected":
        return "Rejected"
      default:
        return status
    }
  }

  // Filter and search functions
  const filteredTenders = (tenders || []).filter((tender: any) => {
    if (!tender) return false
    
    const matchesSearch = searchTerm === "" || 
      (tender.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.tenderCompany?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.location?.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === "all" || tender.category === selectedCategory
    const matchesStatus = selectedStatus === "all" || tender.status === selectedStatus
    
    return matchesSearch && matchesCategory && matchesStatus && 
           (tender.status === "active" || tender.status === "open")
  })

  const filteredBids = (bids || []).filter((bid: any) => {
    if (!bid || !bid.project) return false
    
    const matchesSearch = searchTerm === "" || 
      (bid.project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bid.project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bid.project.category?.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = selectedStatus === "all" || bid.status === selectedStatus
    
    return matchesSearch && matchesStatus
  })

  // Get unique categories from tenders for filter dropdown
  const categories = [...new Set(tenders.map((tender: any) => tender.category).filter(Boolean))]

  // Clear filters when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setSearchTerm("")
    setSelectedCategory("all")
    setSelectedStatus("all")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
    <div className="ml-9 mt-4 mb-2">
  <h1 className="text-2xl font-bold">Welcome, {user?.companyName || "User"}</h1>
  <p className="text-muted-foreground">Welcome to your Bidder Dashboard</p>
</div>


      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Bids</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bids.length}</div>
                <p className="text-xs text-muted-foreground">Currently under review</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Tenders</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tenders.filter((t: any) => t.status === "open" || t.status === "active").length}</div>
                <p className="text-xs text-muted-foreground">Open for bidding</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">68%</div>
                <p className="text-xs text-muted-foreground">Bid success rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$4.1M</div>
                <p className="text-xs text-muted-foreground">Submitted bids value</p>
              </CardContent>
            </Card>
          </div>

          {/* Verification Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <VerificationStatusCard />
            </div>
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Link href="/profile/edit">
                      <Button variant="outline" className="w-full justify-start">
                        <User className="h-4 w-4 mr-2" />
                        Update Profile
                      </Button>
                    </Link>
                    <Link href="/verification-report">
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="h-4 w-4 mr-2" />
                        View Report
                      </Button>
                    </Link>
                    <Link href="/bidder/settings">
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </Link>
                    <Button variant="outline" className="w-full justify-start">
                      <Award className="h-4 w-4 mr-2" />
                      Achievements
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="tenders">Available Tenders</TabsTrigger>
              <TabsTrigger value="bids">My Bids</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="tenders" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Available Tenders</CardTitle>
                      <CardDescription>Browse and bid on available tenders</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search tenders..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-64"
                        />
                      </div>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filter by category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="closing-soon">Closing Soon</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingTenders ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredTenders.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {searchTerm || selectedCategory !== "all" || selectedStatus !== "all" 
                          ? "No tenders match your search criteria." 
                          : "No active tenders available at the moment."}
                      </p>
                      {(searchTerm || selectedCategory !== "all" || selectedStatus !== "all") && (
                        <Button 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => {
                            setSearchTerm("")
                            setSelectedCategory("all")
                            setSelectedStatus("all")
                          }}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredTenders.map((tender: any) => (
                                              <div key={tender._id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">{tender.title}</h3>
                              <p className="text-sm text-muted-foreground">{tender.tenderCompany}</p>
                              <p className="text-sm text-muted-foreground mt-1">{tender.description}</p>
                            </div>
                            <Badge className={getStatusColor(tender.status)}>{getStatusText(tender.status)}</Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium">Budget</p>
                              <p className="text-lg font-bold text-primary">${tender.budget?.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Deadline</p>
                              <p className="text-sm">{new Date(tender.deadline).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Category</p>
                              <p className="text-sm">{tender.category}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Location</p>
                              <p className="text-sm">{tender.location}</p>
                            </div>
                          </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {tender.status === "closing-soon" ? "Closes in 2 days" : "Open for bidding"}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <Link href={`/bidder/tenders/${tender._id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                            </Link>
                            {bidStatuses[tender._id] ? (
                              <Badge className={`${getBidStatusColor(bidStatuses[tender._id])} text-white px-3 py-1`}>
                                {getBidStatusText(bidStatuses[tender._id])}
                              </Badge>
                            ) : (tender.status === "open" || tender.status === "active") ? (
                              <Link href={`/bidder/tenders/${tender._id}/submit-bid`}>
                                <Button size="sm">
                                  <FileText className="h-4 w-4 mr-2" />
                                  Submit Bid
                                </Button>
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bids" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>My Bids</CardTitle>
                      <CardDescription>Track the status of your submitted bids</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search bids..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-64"
                        />
                      </div>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="shortlisted">Shortlisted</SelectItem>
                          <SelectItem value="awarded">Awarded</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingBids ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredBids.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {searchTerm || selectedStatus !== "all" 
                          ? "No bids match your search criteria." 
                          : "No bids submitted yet."}
                      </p>
                      {(searchTerm || selectedStatus !== "all") ? (
                        <Button 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => {
                            setSearchTerm("")
                            setSelectedStatus("all")
                          }}
                        >
                          Clear Filters
                        </Button>
                      ) : (
                        <Link href="/bidder/dashboard">
                          <Button className="mt-4">
                            Browse Tenders
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredBids.map((bid: any) => (
                                              <div key={bid._id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold">{bid.project?.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                Submitted on {new Date(bid.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={getStatusColor(bid.status)}>{getStatusText(bid.status)}</Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium">Bid Amount</p>
                              <p className="text-lg font-bold text-primary">${bid.bidAmount?.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium">AI Score</p>
                              <div className="flex items-center space-x-2">
                                <div className="text-lg font-bold">{bid.aiScore || "Pending"}</div>
                                <div className="text-sm text-muted-foreground">/100</div>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium">Status</p>
                              <p className="text-sm">
                                {bid.status === "shortlisted"
                                  ? "Congratulations! You're shortlisted"
                                  : bid.status === "awarded"
                                  ? "Congratulations! You won the bid"
                                  : bid.status === "rejected"
                                  ? "Bid was not selected"
                                  : bid.status === "submitted"
                                  ? "Under evaluation"
                                  : getBidStatusText(bid.status)}
                              </p>
                            </div>
                          </div>

                        <div className="flex justify-end space-x-2">
                          <Link href={`/bidder/bids/${bid._id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Bid Performance</CardTitle>
                    <CardDescription>Your bidding statistics over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Bids Submitted</span>
                        <span className="font-bold">24</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Successful Bids</span>
                        <span className="font-bold text-green-600">16</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average AI Score</span>
                        <span className="font-bold">84.5</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Success Rate</span>
                        <span className="font-bold text-primary">68%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your latest bidding activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Award className="h-4 w-4 text-green-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Bid shortlisted</p>
                          <p className="text-xs text-muted-foreground">Highway Bridge Renovation</p>
                        </div>
                        <span className="text-xs text-muted-foreground">2 days ago</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Bid submitted</p>
                          <p className="text-xs text-muted-foreground">Office Complex Construction</p>
                        </div>
                        <span className="text-xs text-muted-foreground">5 days ago</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Eye className="h-4 w-4 text-gray-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Tender viewed</p>
                          <p className="text-xs text-muted-foreground">School Building Project</p>
                        </div>
                        <span className="text-xs text-muted-foreground">1 week ago</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
