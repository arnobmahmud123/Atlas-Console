export function captureException(error: unknown, context?: Record<string, unknown>) {
  // Placeholder for Sentry SDK integration.
  console.error('[monitoring] exception', { error, context });
}

export function captureMessage(message: string, context?: Record<string, unknown>) {
  // Placeholder for Sentry SDK integration.
  console.info('[monitoring] message', { message, context });
}

export async function withMonitoring<T>(fn: () => Promise<T>, context?: Record<string, unknown>) {
  try {
    return await fn();
  } catch (error) {
    captureException(error, context);
    throw error;
  }
}
