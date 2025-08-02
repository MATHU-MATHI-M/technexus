import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"
import { createNotification } from "@/lib/notifications"

export async function POST(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Parse request body
    const { tenderId, bidAmount, documents = [] } = await request.json()

    if (!tenderId || !bidAmount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const bidsCollection = db.collection("bids")
    const tendersCollection = db.collection("tenders")

    // Check if tender exists and is still open
    const tender = await tendersCollection.findOne({
      _id: new ObjectId(tenderId),
      status: "OPEN",
      deadline: { $gt: new Date() }
    })

    if (!tender) {
      return NextResponse.json({ error: "Tender not found or closed" }, { status: 404 })
    }

    // Check if user has already submitted a bid
    const existingBid = await bidsCollection.findOne({
      tenderId: new ObjectId(tenderId),
      bidderId: new ObjectId(payload.userId)
    })

    if (existingBid) {
      return NextResponse.json({ error: "You have already submitted a bid for this tender" }, { status: 400 })
    }

    // Create the bid
    const bid = {
      tenderId: new ObjectId(tenderId),
      bidderId: new ObjectId(payload.userId),
      bidAmount: parseFloat(bidAmount),
      documents,
      status: "PENDING",
      submittedAt: new Date(),
      updatedAt: new Date()
    }

    const result = await bidsCollection.insertOne(bid)

    // Notify tender owner
    await createNotification(
      tender.ownerId.toString(),
      'BID_SUBMITTED',
      'New Bid Received',
      `A new bid has been submitted for your tender "${tender.title}"`,
      {
        tenderId: tender._id.toString(),
        bidId: result.insertedId.toString()
      }
    )

    return NextResponse.json({
      success: true,
      message: "Bid submitted successfully",
      bidId: result.insertedId
    })

  } catch (error) {
    console.error("Error submitting bid:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
