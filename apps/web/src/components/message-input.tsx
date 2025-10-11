"use client";

import { PromptInput, PromptInputBody, PromptInputTextarea, PromptInputSubmit, PromptInputToolbar } from "@/components/ai-elements/prompt-input";
import { useState } from "react";
import { api } from "@hitl/backend/convex/_generated/api";
import { useQuery } from "convex/react";

interface MessageInputProps {
  stateId?: string;
  onMessageSent?: (stateId: string) => void;
}

export function MessageInput({ stateId, onMessageSent }: MessageInputProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const user = useQuery(api.auth.getCurrentUser);

  const handleSubmit = async (message: { text?: string; files?: any[] }, event: React.FormEvent) => {
    if (!message.text?.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/thread/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stateId,
          message: message.text,
          userId: user._id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      onMessageSent?.(result.stateId);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 border-b">
      <PromptInput onSubmit={handleSubmit}>
        <PromptInputBody>
          <PromptInputTextarea placeholder="Type your message..." />
        </PromptInputBody>
        <PromptInputToolbar>
          <PromptInputSubmit 
            status={isSubmitting ? "submitted" : undefined}
            disabled={isSubmitting}
          />
        </PromptInputToolbar>
      </PromptInput>
    </div>
  );
}
