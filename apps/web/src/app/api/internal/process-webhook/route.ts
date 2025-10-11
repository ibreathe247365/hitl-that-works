import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { 
  handleHumanResponse,
  addThreadEvent
} from '@hitl/ai';
import { 
  WebhookPayloadSchema,
  type WebhookPayload
} from '@hitl/ai/schemas';
import {
  getThreadFromPayload
} from '@/lib/webhook';

interface QueueJobData {
  webhookPayload: WebhookPayload;
  threadStateId?: string;
  userId?: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Processing queued webhook job:', {
      method: request.method,
      url: request.url,
    });

    // Verify the request comes from QStash
    const body = await request.text();
    const jobData: QueueJobData = JSON.parse(body);

    // Validate the webhook payload
    const validationResult = WebhookPayloadSchema.safeParse(jobData.webhookPayload);
    
    if (!validationResult.success) {
      console.error('Invalid webhook payload in queue job:', validationResult.error);
      return NextResponse.json(
        { 
          error: 'Invalid webhook payload',
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const webhookPayload = validationResult.data;
    console.log('Processing queued webhook payload:', { 
      type: webhookPayload.type,
      threadStateId: jobData.threadStateId 
    });

    // Get thread from payload using the existing utility
    const thread = await getThreadFromPayload(webhookPayload);

    await handleHumanResponse(thread, webhookPayload);
    
    // Add UI event to Convex
    if (jobData.threadStateId) {
      addThreadEvent(jobData.threadStateId, {
        type: 'webhook_processed',
        data: {
          payloadType: webhookPayload.type,
          processedAt: new Date().toISOString()
        }
      }, undefined, jobData.userId);
    }
    
    console.log('Successfully processed queued webhook job:', {
      payloadType: webhookPayload.type,
      threadStateId: jobData.threadStateId
    });

    return NextResponse.json({
      message: 'Webhook job processed successfully',
      timestamp: new Date().toISOString(),
      status: 'success',
      payloadType: webhookPayload.type
    });

  } catch (error) {
    console.error('Error processing queued webhook job:', error);
    
    // Return error response that QStash can retry
    return NextResponse.json(
      {
        error: 'Failed to process webhook job',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Export the handler with QStash signature verification
export const POST_VERIFIED = verifySignatureAppRouter(POST);
