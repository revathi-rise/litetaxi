import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate
    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'Please provide name, email, and message.' },
        { status: 400 }
      );
    }

    const entry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      name,
      email,
      subject: subject || 'Portfolio Inquiry',
      message,
    };

    console.log('[Portfolio Contact Received]:', entry);

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your message has been received successfully.',
      data: entry,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Failed to process inquiry' },
      { status: 500 }
    );
  }
}

