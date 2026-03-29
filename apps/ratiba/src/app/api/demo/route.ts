import { NextResponse } from 'next/server';
import { sendDemoRequestEmail } from '@repo/resend';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, company, role } = body;

    if (!fullName || !email || !company || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 },
      );
    }

    const result = await sendDemoRequestEmail({
      fullName,
      email,
      company,
      role,
    });

    if (!result.success) {
      console.error('Failed to send demo request email:', result.error);
      return NextResponse.json(
        { error: 'Failed to send notification' },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Demo request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
