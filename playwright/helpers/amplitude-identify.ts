export type AmplitudeEvent = {
  event_type?: string;
  user_id?: unknown;
  user_properties?: { $set?: Record<string, unknown> };
};

/** In a `toPass` wait, return the first identify with any app so a wrong app fails the caller's assertion. */
export function requireAppIdentifyEvent(requestBodies: readonly unknown[]): AmplitudeEvent {
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
