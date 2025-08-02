import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { approveVerification } from "@/lib/verification-service"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization token required" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { companyId, field, action } = body

    if (!companyId || !field || !action) {
      return NextResponse.json({ 
        error: "Company ID, field, and action are required" 
      }, { status: 400 })
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")
    
    // Check if user is admin
    const adminUser = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) })
    if (!adminUser || adminUser.userType !== 'admin') {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Find the company
    const company = await usersCollection.findOne({ _id: new ObjectId(companyId) })
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    // Update verification status
    const newStatus = action === 'approve' ? 'verified' : 'failed'
    const updateData: any = {
      [`verificationStatus.${field}`]: newStatus,
      updatedAt: new Date()
    }

    await usersCollection.updateOne(
      { _id: new ObjectId(companyId) },
      { $set: updateData }
    )

    // Recalculate overall verification percentage
    const updatedCompany = await usersCollection.findOne({ _id: new ObjectId(companyId) })
    const overallPercentage = VerificationService.calculateVerificationPercentage(
      updatedCompany?.verificationStatus
    )
    
    await usersCollection.updateOne(
      { _id: new ObjectId(companyId) },
      { $set: { 'verificationStatus.overall': overallPercentage } }
    )

    // Log admin action for audit trail
    const auditCollection = db.collection("admin_audit")
    await auditCollection.insertOne({
      adminId: decoded.userId,
      adminEmail: adminUser.email,
      action: `${action}_verification`,
      targetCompanyId: companyId,
      targetCompanyName: company.companyName,
      field,
      previousStatus: company.verificationStatus?.[field] || 'unknown',
      newStatus,
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
    })

    return NextResponse.json({
      success: true,
      message: `${field.toUpperCase()} verification ${action}d successfully`,
      newStatus,
      overallPercentage
    })

  } catch (error) {
    console.error("Admin verification approval error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}