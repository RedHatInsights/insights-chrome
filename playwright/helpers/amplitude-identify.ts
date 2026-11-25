type AmplitudeEvent = {
  event_type?: string;
  user_id?: unknown;
  user_properties?: { $set?: Record<string, unknown> };
};

/** Read a snapshot of the captured batches. Only app activation is a wait condition, not payload correctness. */
export function getAppIdentifyEvent(requestBodies: readonly unknown[]): AmplitudeEvent {
  let identifyCount = 0;
  for (const body of requestBodies) {
    const events = (body as { events?: AmplitudeEvent[] } | null)?.events;
    if (!Array.isArray(events)) {
      continue;
    }
    for (const event of events) {
      if (event?.event_type !== '$identify') {
        continue;
      }
      identifyCount++;
      const app = event.user_properties?.$set?.current_app;
      if (typeof app === 'string' && app.trim() !== '') {
        return event;
      }
    }
  }

  if (identifyCount === 0) {
    throw new Error('No Amplitude $identify events captured');
  }
  throw new Error(`Captured ${identifyCount} Amplitude $identify event(s), but none had a nonempty $set.current_app`);
}
