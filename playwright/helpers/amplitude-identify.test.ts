import { requireAppIdentifyEvent } from './amplitude-identify';

const partial = { event_type: '$identify', user_properties: { $set: { internal: false, current_bundle: 'insights' } } };
const dashboard = { event_type: '$identify', user_properties: { $set: { ...partial.user_properties.$set, current_app: 'dashboard' } } };

describe('requireAppIdentifyEvent', () => {
  it('selects the dashboard identify when it arrives after the initial identify', () => {
    const batches = [{ events: [partial] }];
    expect(() => requireAppIdentifyEvent(batches)).toThrow('none had a nonempty $set.current_app');
    batches.push({ events: [dashboard] });
    expect(requireAppIdentifyEvent(batches)).toBe(dashboard);
  });

  it('takes the first app identify in a batch, leaving identity validation to the caller', () => {
    const missingIdentity = { event_type: '$identify', user_properties: { $set: { current_app: 'dashboard' } } };
    expect(requireAppIdentifyEvent([{ events: [partial, missingIdentity, dashboard] }])).toBe(missingIdentity);
  });

  it('does not skip a wrong app in favor of a later dashboard identify', () => {
    const landing = { ...dashboard, user_properties: { $set: { ...dashboard.user_properties.$set, current_app: 'landing' } } };
    expect(requireAppIdentifyEvent([{ events: [partial, landing, dashboard] }])).toBe(landing);
  });

  it('reports no identifies even if another event carries app context', () => {
    expect(() => requireAppIdentifyEvent([{ events: [{ ...dashboard, event_type: 'page_view' }] }])).toThrow('No Amplitude $identify events captured');
  });

  it.each(['', '  ', false])('does not accept current_app = %j', (current_app) => {
    const event = { event_type: '$identify', user_properties: { $set: { current_app } } };
    expect(() => requireAppIdentifyEvent([{ events: [event] }])).toThrow('none had a nonempty $set.current_app');
  });
});
