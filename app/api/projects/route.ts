import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { createNotification, createBulkNotifications, getInterestedBidders } from "@/lib/notifications"

// GET - Fetch all projects (for bidders with role-based filtering)
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const projectsCollection = db.collection("projects")

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const limit = parseInt(searchParams.get("limit") || "50")
    const userType = searchParams.get("userType")
    const bidderType = searchParams.get("bidderType")

    // Build filter
    const filter: any = {}
    if (status) filter.status = status
    if (category) filter.category = category

    // Only show active/open projects to bidders
    if (!status) filter.status = { $in: ["open", "active"] }

    // Role-based filtering for bidders
    if (userType === "bidder" && bidderType) {
      const categoryFilters: Record<string, string[]> = {
        'CONTRACTOR': ['Construction', 'Infrastructure', 'Renovation', 'Maintenance', 'Civil Works'],
        'DEVELOPER': ['Software Development', 'IT Services', 'Digital Solutions', 'Technology', 'Web Development'],
        'SUPPLIER': ['Equipment', 'Materials', 'Goods', 'Supply Chain', 'Procurement'],
        'CONSULTANT': ['Professional Services', 'Advisory', 'Design', 'Consulting', 'Management']
      }

      const relevantCategories = categoryFilters[bidderType] || []
      if (relevantCategories.length > 0) {
        filter.$or = [
          { category: { $in: relevantCategories } },
          { category: { $regex: relevantCategories.join('|'), $options: 'i' } },
          { specifications: { $regex: relevantCategories.join('|'), $options: 'i' } }
        ]
      }
    }

    const projects = await projectsCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    return NextResponse.json({ 
      projects,
      filtered: userType === "bidder" && bidderType ? true : false,
      filterType: bidderType || null
    })
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new project (for tenders)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload || payload.userType !== "tender") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      budget,
      location,
      deadline,
      category,
      duration,
      specifications,
      requirements,
      documents,
      hasFiles,
    } = body

    // Validate required fields
    if (!title || !description || !budget || !deadline || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const projectsCollection = db.collection("projects")

    const newProject = {
      title,
      description,
      budget: parseFloat(budget),
      location,
      deadline: new Date(deadline),
      category,
      duration,
      specifications,
      requirements: requirements || [],
      documents: documents || [],
      hasFiles: hasFiles || false,
      status: "open",
      bidCount: 0,
      progress: 0,
      tenderId: payload.userId,
      createdBy: payload.userId, // Add this for consistency with other APIs
      tenderCompany: payload.companyName,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await projectsCollection.insertOne(newProject)

    // Notify the tender creator
    await createNotification(
      payload.userId,
      'PROJECT_CREATED',
      'Project Created Successfully',
      `Your project "${title}" has been created and is now open for bids.`,
      {
        projectId: result.insertedId.toString()
      }
    )

    // Notify interested bidders about the new project
    try {
      const interestedBidders = await getInterestedBidders(category, specifications)
      if (interestedBidders.length > 0) {
        await createBulkNotifications(
          interestedBidders,
          'NEW_TENDER_AVAILABLE',
          'New Tender Available',
          `A new tender "${title}" in ${category} category is now available. Budget: $${budget.toLocaleString()}`,
          {
            projectId: result.insertedId.toString()
          }
        )
      }
    } catch (notificationError) {
      console.error('Error sending notifications to bidders:', notificationError)
      // Don't fail the project creation if notifications fail
    }

    return NextResponse.json({
      message: "Project created successfully",
      projectId: result.insertedId,
    })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 