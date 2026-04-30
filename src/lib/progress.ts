// /home/z/my-project/opusclip-clone/src/lib/progress.ts

export interface ProgressState {
  videoId: string;
  percentage: number;
  stage: string;
  message: string;
  completed: boolean;
  error: boolean;
  result?: {
    videoId: string;
    clipCount: number;
  };
}

// In-memory progress store (resets on server restart)
const progressStore = new Map<string, ProgressState>();

// Listeners for SSE
const listeners = new Map<string, Set<(state: ProgressState) => void>>();

export function updateProgress(
  videoId: string,
  percentage: number,
  stage: string,
  message: string
) {
  const state: ProgressState = {
    videoId,
    percentage: Math.min(100, Math.max(0, percentage)),
    stage,
    message,
    completed: false,
    error: false,
  };
  progressStore.set(videoId, state);
  notifyListeners(videoId, state);
}

export function completeProgress(
  videoId: string,
  result: { videoId: string; clipCount: number }
) {
  const state: ProgressState = {
    videoId,
    percentage: 100,
    stage: "completed",
    message: "Processing complete!",
    completed: true,
    error: false,
    result,
  };
  progressStore.set(videoId, state);
  notifyListeners(videoId, state);

  // Clean up after 5 minutes
  setTimeout(() => {
    progressStore.delete(videoId);
    listeners.delete(videoId);
  }, 5 * 60 * 1000);
}

export function errorProgress(videoId: string, message: string) {
  const state: ProgressState = {
    videoId,
    percentage: 0,
    stage: "error",
    message,
    completed: true,
    error: true,
  };
  progressStore.set(videoId, state);
  notifyListeners(videoId, state);

  // Clean up after 5 minutes
  setTimeout(() => {
    progressStore.delete(videoId);
    listeners.delete(videoId);
  }, 5 * 60 * 1000);
}

export function getProgress(videoId: string): ProgressState | undefined {
  return progressStore.get(videoId);
}

export function addListener(
  videoId: string,
  callback: (state: ProgressState) => void
): () => void {
  if (!listeners.has(videoId)) {
    listeners.set(videoId, new Set());
  }
  listeners.get(videoId)!.add(callback);

  // Return unsubscribe function
  return () => {
    listeners.get(videoId)?.delete(callback);
    if (listeners.get(videoId)?.size === 0) {
      listeners.delete(videoId);
    }
  };
}

function notifyListeners(videoId: string, state: ProgressState) {
  listeners.get(videoId)?.forEach((cb) => {
    try {
      cb(state);
    } catch {
      // Silently ignore listener errors (e.g. closed stream)
    }
  });
}
