import { NextRequest, NextResponse } from 'next/server';
import { authComponent } from '@hitl/backend/convex/auth';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@hitl/backend/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stateId, message, userId } = body;

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    // Generate stateId for new threads
    const finalStateId = stateId || `thread_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Call webhook endpoint to trigger AI processing
    const webhookUrl = process.env.WEBHOOK_URL || 'http://localhost:3000/api/webhooks/human-response';
    
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stateId: finalStateId,
        message,
        userId,
      }),
    });

    if (!webhookResponse.ok) {
      throw new Error(`Webhook failed: ${webhookResponse.statusText}`);
    }

    return NextResponse.json({
      stateId: finalStateId,
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
