// /home/z/my-project/opusclip-clone/src/app/api/progress/route.ts

import { getProgress, addListener, type ProgressState } from "@/lib/progress";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return new Response("videoId is required", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const safeEnqueue = (data: string) => {
        if (closed) return false;
        try {
          controller.enqueue(encoder.encode(data));
          return true;
        } catch {
          closed = true;
          return false;
        }
      };

      const safeClose = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          // Already closed
        }
      };

      // Send current state immediately
      const currentState = getProgress(videoId);
      if (currentState) {
        if (!safeEnqueue(`data: ${JSON.stringify(currentState)}\n\n`)) {
          return;
        }
        // If already completed/errored, close immediately
        if (currentState.completed) {
          safeClose();
          return;
        }
      }

      // Listen for updates
      const unsubscribe = addListener(videoId, (state: ProgressState) => {
        if (closed) {
          unsubscribe();
          return;
        }

        if (!safeEnqueue(`data: ${JSON.stringify(state)}\n\n`)) {
          unsubscribe();
          clearInterval(keepalive);
          return;
        }

        // Close stream when completed or errored
        if (state.completed) {
          clearInterval(keepalive);
          unsubscribe();
          safeClose();
        }
      });

      // Handle client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(keepalive);
        unsubscribe();
        safeClose();
      });

      // Send keepalive every 15 seconds
      const keepalive = setInterval(() => {
        if (closed) {
          clearInterval(keepalive);
          unsubscribe();
          return;
        }
        if (!safeEnqueue(": keepalive\n\n")) {
          clearInterval(keepalive);
          unsubscribe();
        }
      }, 15000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
