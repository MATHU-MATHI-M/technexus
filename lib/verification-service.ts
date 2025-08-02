import { connectToDatabase } from './mongodb';

export async function approveVerification(userId: string, field: string) {
  try {
    const { db } = await connectToDatabase();
    
    // Update the verification status for the specified field
    await db.collection('users').updateOne(
      { _id: userId },
      {
        $set: {
          [`verificationStatus.${field}`]: 'verified'
        }
      }
    );

    // Calculate overall verification percentage
    const user = await db.collection('users').findOne({ _id: userId });
    const verificationFields = ['gst', 'pan', 'cin', 'bank'];
    const verifiedCount = verificationFields.filter(
      f => user.verificationStatus?.[f] === 'verified'
    ).length;
    
    const overallPercentage = Math.round((verifiedCount / verificationFields.length) * 100);

    // Update overall verification percentage
    await db.collection('users').updateOne(
      { _id: userId },
      {
        $set: {
          'verificationStatus.overall': overallPercentage
        }
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Error in approveVerification:', error);
    return { success: false, error: 'Failed to approve verification' };
  }
}

export async function rejectVerification(userId: string, field: string) {
  try {
    const { db } = await connectToDatabase();
    
    // Update the verification status for the specified field
    await db.collection('users').updateOne(
      { _id: userId },
      {
        $set: {
          [`verificationStatus.${field}`]: 'failed'
        }
      }
    );

    // Recalculate overall verification percentage
    const user = await db.collection('users').findOne({ _id: userId });
    const verificationFields = ['gst', 'pan', 'cin', 'bank'];
    const verifiedCount = verificationFields.filter(
      f => user.verificationStatus?.[f] === 'verified'
    ).length;
    
    const overallPercentage = Math.round((verifiedCount / verificationFields.length) * 100);

    // Update overall verification percentage
    await db.collection('users').updateOne(
      { _id: userId },
      {
        $set: {
          'verificationStatus.overall': overallPercentage
        }
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Error in rejectVerification:', error);
    return { success: false, error: 'Failed to reject verification' };
  }
}

export async function getVerificationStatus(userId: string) {
  try {
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne(
      { _id: userId },
      { projection: { verificationStatus: 1 } }
    );
    return user?.verificationStatus || {
      gst: 'pending',
      pan: 'pending',
      cin: 'pending',
      bank: 'pending',
      overall: 0
    };
  } catch (error) {
    console.error('Error in getVerificationStatus:', error);
    return null;
  }
}

export async function submitVerification(userId: string, field: string, documentUrl: string) {
  try {
    const { db } = await connectToDatabase();
    
    // Update the document URL and set verification status to pending
    await db.collection('users').updateOne(
      { _id: userId },
      {
        $set: {
          [`documents.${field}`]: documentUrl,
          [`verificationStatus.${field}`]: 'pending'
        }
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Error in submitVerification:', error);
    return { success: false, error: 'Failed to submit verification' };
  }
}
