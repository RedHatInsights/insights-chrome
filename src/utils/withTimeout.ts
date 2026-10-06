/** Bound a best-effort operation without cancelling its eventual completion. */
export async function withTimeout<T>(operation: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([operation, new Promise<T>((resolve) => (timer = setTimeout(() => resolve(fallback), timeoutMs)))]);
  } finally {
    clearTimeout(timer);
  }
}
