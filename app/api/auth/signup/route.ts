import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { hashPassword, generateVerificationToken } from "@/lib/auth"
import { sendVerificationEmail } from "@/lib/email"
import { createNotification } from "@/lib/notifications"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, companyName, userType, bidderType } = body

    // Validate input
    if (!email || !password || !companyName || !userType) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (!["tender", "bidder"].includes(userType)) {
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 })
    }

    // Validate bidder type if user is a bidder
    if (userType === "bidder" && !bidderType) {
      return NextResponse.json({ error: "Bidder type is required for bidder accounts" }, { status: 400 })
    }

    const validBidderTypes = ['CONTRACTOR', 'DEVELOPER', 'SUPPLIER', 'CONSULTANT', 'BUYER']
    if (userType === "bidder" && !validBidderTypes.includes(bidderType)) {
      return NextResponse.json({ error: "Invalid bidder type" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Generate verification token
    const verificationToken = generateVerificationToken()
    
    console.log("🎫 Generated verification token:");
    console.log(`    Token (first 20 chars): ${verificationToken.substring(0, 20)}...`);
    console.log(`    Token (last 20 chars): ...${verificationToken.substring(verificationToken.length - 20)}`);
    console.log(`    Token length: ${verificationToken.length}`);

    // Create user
    const newUser = {
      email,
      password: hashedPassword,
      companyName,
      userType,
      bidderType: userType === "bidder" ? bidderType : undefined,
      isVerified: false,
      verificationToken,
      verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      notificationPreferences: {
        email: true,
        inApp: true,
        push: false
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const insertResult = await usersCollection.insertOne(newUser)
    console.log("📝 User inserted with ID:", insertResult.insertedId);
    
    // Verify the token was stored correctly
    const storedUser = await usersCollection.findOne({ _id: insertResult.insertedId });
    console.log("✅ Verification - stored token matches generated:", storedUser?.verificationToken === verificationToken);

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken, companyName)
      console.log("✅ User created and verification email sent successfully")
      
      // Create welcome notification
      await createNotification(
        insertResult.insertedId.toString(),
        'SIGNUP_COMPLETE',
        'Welcome to TenderChain!',
        `Welcome ${companyName}! Your account has been created successfully. Please verify your email to get started.`,
        {
          profileId: insertResult.insertedId.toString()
        }
      )
      
      return NextResponse.json({
        message: "User created successfully. Please check your email for verification.",
        emailSent: true
      })
    } catch (emailError) {
      console.error("❌ User created but email failed to send:", emailError)
      
      // User is created but email failed - still return success but with warning
      return NextResponse.json({
        message: "User created successfully, but there was an issue sending the verification email. You can request a new verification email from the login page.",
        emailSent: false,
        warning: "Email delivery failed"
      })
    }
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
