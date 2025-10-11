import { NextRequest, NextResponse } from 'next/server';
import { 
  enqueueWebhookProcessing,
  addThreadEvent
} from '@hitl/ai';
import { 
  WebhookPayloadSchema
} from '@hitl/ai/schemas';
import {
  verifyWebhookSignature,
  createErrorResponse,
  getWebhookConfig
} from '@/lib/webhook';

export async function POST(request: NextRequest) {
  try {
    console.log('Human response webhook received:', {
      method: request.method,
      url: request.url,
    });

    // Get and verify webhook signature
    const rawBody = await request.text();
    if (!verifyWebhookSignature(request, rawBody)) {
      return createErrorResponse('Invalid webhook signature', 'signature_verification_failed', 400);
    }

    // Parse and validate payload
    const body = JSON.parse(rawBody);
    const validationResult = WebhookPayloadSchema.safeParse(body);
    
    const userId = body.userId;
    
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error);
      return createErrorResponse(
        'Invalid request data - must be a valid webhook payload',
        'validation_error',
        400,
        validationResult.error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      );
    }

    const webhookPayload = validationResult.data;
    console.log('Enqueuing webhook payload for processing:', { type: webhookPayload.type });

    // Get thread state ID from payload for tracking
    let threadStateId: string | undefined;
    if (webhookPayload.type === 'function_call.completed') {
      threadStateId = webhookPayload.event.spec.state?.stateId;
    } else if (webhookPayload.type === 'human_contact.completed') {
      threadStateId = webhookPayload.event.state?.stateId;
    }

    const jobId = await enqueueWebhookProcessing(webhookPayload, threadStateId, userId);
    
    if (threadStateId) {
      addThreadEvent(threadStateId, {
        type: 'webhook_received',
        data: { 
          payloadType: webhookPayload.type,
          receivedAt: new Date().toISOString(),
          jobId
        }
      }, undefined, userId);
    }
    
    return NextResponse.json({
      message: 'Webhook payload enqueued for processing',
      timestamp: new Date().toISOString(),
      status: 'accepted',
      payloadType: webhookPayload.type,
      jobId,
      threadStateId
    }, { status: 202 });
  } catch (error) {
    console.error('Human response webhook error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('QStash')) {
        return createErrorResponse(error.message, 'queue_error', 500);
      }
    }
    
    return createErrorResponse(
      'Error enqueuing webhook processing',
      error instanceof Error ? error.message : 'Unknown error',
      500
    );
  }
}

export async function GET(_request: NextRequest) {
  const config = getWebhookConfig();
  
  return NextResponse.json({
    message: 'Human Response Webhook endpoint',
    description: 'This endpoint enqueues human responses and function call completions for AI agent processing',
    method: 'POST',
    webhookVerification: {
      enabled: config.webhookSecret,
      requiredHeaders: config.requiredHeaders,
      environmentVariables: config.environmentVariables
    },
    supportedPayloads: [
      {
        type: 'human_contact.completed',
        description: 'Human contact completion webhook',
        example: {
          type: 'human_contact.completed',
          event: { 
            status: { response: 'User response message' },
            state: { stateId: 'thread-state-id' }
          }
        }
      },
      {
        type: 'function_call.completed',
        description: 'Function call completion webhook',
        example: {
          type: 'function_call.completed',
          event: {
            spec: {
              fn: 'promote_vercel_deployment',
              kwargs: { new_deployment: 'deployment-id' },
              state: { stateId: 'thread-state-id' }
            },
            status: { approved: true, comment: 'Approved by user' }
          }
        }
      }
    ],
    timestamp: new Date().toISOString(),
    status: 'success'
  });
}
