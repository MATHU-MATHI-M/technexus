import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { submitVerification } from "@/lib/verification-service"
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
    const { type, value, additionalData } = body

    if (!type || !value) {
      return NextResponse.json({ error: "Verification type and value are required" }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    let verificationResult
    let updateField = `verificationStatus.${type}`

    // Set status to pending
    await usersCollection.updateOne(
      { _id: new ObjectId(decoded.userId) },
      { 
        $set: { 
          [updateField]: 'pending',
          [`${type}Number`]: value,
          updatedAt: new Date()
        } 
      }
    )

    try {
      // Perform verification based on type
      switch (type) {
        case 'gst':
          verificationResult = await VerificationService.verifyGST(value)
          break
        case 'pan':
          verificationResult = await VerificationService.verifyPAN(value)
          break
        case 'cin':
          verificationResult = await VerificationService.verifyCIN(value)
          break
        case 'bank':
          if (!additionalData?.ifsc) {
            return NextResponse.json({ error: "IFSC code required for bank verification" }, { status: 400 })
          }
          verificationResult = await VerificationService.verifyBankAccount(value, additionalData.ifsc)
          break
        default:
          return NextResponse.json({ error: "Invalid verification type" }, { status: 400 })
      }

      // Update verification status
      const status = verificationResult.success ? 'verified' : 'failed'
      const updateData: any = {
        [updateField]: status,
        updatedAt: new Date()
      }

      // Store verification data if successful
      if (verificationResult.success && verificationResult.data) {
        updateData[`verificationData.${type}`] = verificationResult.data
      }

      // Store error if failed
      if (!verificationResult.success && verificationResult.error) {
        updateData[`verificationErrors.${type}`] = verificationResult.error
      }

      await usersCollection.updateOne(
        { _id: new ObjectId(decoded.userId) },
        { $set: updateData }
      )

      // Calculate overall verification percentage
      const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) })
      const overallPercentage = VerificationService.calculateVerificationPercentage(user?.verificationStatus)
      
      await usersCollection.updateOne(
        { _id: new ObjectId(decoded.userId) },
        { $set: { 'verificationStatus.overall': overallPercentage } }
      )

      return NextResponse.json({
        success: verificationResult.success,
        data: verificationResult.data,
        error: verificationResult.error,
        confidence: verificationResult.confidence,
        overallPercentage
      })

    } catch (verificationError) {
      // Update status to failed
      await usersCollection.updateOne(
        { _id: new ObjectId(decoded.userId) },
        { 
          $set: { 
            [updateField]: 'failed',
            [`verificationErrors.${type}`]: 'Verification service error',
            updatedAt: new Date()
          } 
        }
      )

      return NextResponse.json({
        success: false,
        error: 'Verification service error'
      }, { status: 500 })
    }

  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Batch verification endpoint
export async function PUT(request: NextRequest) {
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
    const { verifications } = body

    if (!verifications || !Array.isArray(verifications)) {
      return NextResponse.json({ error: "Verifications array is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    const results: any = {}

    // Set all to pending first
    const pendingUpdates: any = {}
    verifications.forEach(({ type, value }) => {
      pendingUpdates[`verificationStatus.${type}`] = 'pending'
      pendingUpdates[`${type}Number`] = value
    })
    pendingUpdates.updatedAt = new Date()

    await usersCollection.updateOne(
      { _id: new ObjectId(decoded.userId) },
      { $set: pendingUpdates }
    )

    // Process each verification
    for (const verification of verifications) {
      const { type, value, additionalData } = verification

      try {
        let verificationResult

        switch (type) {
          case 'gst':
            verificationResult = await VerificationService.verifyGST(value)
            break
          case 'pan':
            verificationResult = await VerificationService.verifyPAN(value)
            break
          case 'cin':
            verificationResult = await VerificationService.verifyCIN(value)
            break
          case 'bank':
            if (!additionalData?.ifsc) {
              verificationResult = { success: false, error: "IFSC code required" }
            } else {
              verificationResult = await VerificationService.verifyBankAccount(value, additionalData.ifsc)
            }
            break
          default:
            verificationResult = { success: false, error: "Invalid verification type" }
        }

        results[type] = verificationResult

        // Update individual verification status
        const status = verificationResult.success ? 'verified' : 'failed'
        const updateData: any = {
          [`verificationStatus.${type}`]: status,
          updatedAt: new Date()
        }

        if (verificationResult.success && verificationResult.data) {
          updateData[`verificationData.${type}`] = verificationResult.data
        }

        if (!verificationResult.success && verificationResult.error) {
          updateData[`verificationErrors.${type}`] = verificationResult.error
        }

        await usersCollection.updateOne(
          { _id: new ObjectId(decoded.userId) },
          { $set: updateData }
        )

      } catch (error) {
        results[type] = { success: false, error: 'Verification service error' }
        
        await usersCollection.updateOne(
          { _id: new ObjectId(decoded.userId) },
          { 
            $set: { 
              [`verificationStatus.${type}`]: 'failed',
              [`verificationErrors.${type}`]: 'Verification service error',
              updatedAt: new Date()
            } 
          }
        )
      }
    }

    // Calculate overall verification percentage
    const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) })
    const overallPercentage = VerificationService.calculateVerificationPercentage(user?.verificationStatus)
    
    await usersCollection.updateOne(
      { _id: new ObjectId(decoded.userId) },
      { $set: { 'verificationStatus.overall': overallPercentage } }
    )

    return NextResponse.json({
      success: true,
      results,
      overallPercentage
    })

  } catch (error) {
    console.error("Batch verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}