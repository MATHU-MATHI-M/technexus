import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const { db } = await getDatabase();
    const user = await db.collection('users').findOne({
      _id: new ObjectId(decoded.userId),
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }
}
