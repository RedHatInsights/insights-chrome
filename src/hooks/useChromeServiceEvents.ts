import { useEffect, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useFlag } from '@unleash/proxy-client-react';
import { UPDATE_NOTIFICATIONS } from '../redux/action-types';

import { getEncodedToken, setCookie } from '../jwt/jwt';
import { NotificationsPayload } from '../redux/store';

const NOTIFICATION_DRAWER = 'com.redhat.console.notifications.drawer';
const SAMPLE_EVENT = 'sample.type';

const ALL_TYPES = [NOTIFICATION_DRAWER, SAMPLE_EVENT] as const;
type EventTypes = (typeof ALL_TYPES)[number];

type SamplePayload = {
  foo: string;
};

type Payload = NotificationsPayload | SamplePayload;
interface GenericEvent<T extends Payload = Payload> {
  type: EventTypes;
  data: T;
}

function isGenericEvent(event: unknown): event is GenericEvent {
  return typeof event === 'object' && event !== null && ALL_TYPES.includes((event as Record<string, never>).type);
}

const useChromeServiceEvents = () => {
  const connection = useRef<WebSocket | undefined>();
  const dispatch = useDispatch();
  const isNotificationsEnabled = useFlag('platform.chrome.notifications-drawer');

  const handlerMap: { [key in EventTypes]: (payload: GenericEvent<Payload>) => void } = useMemo(
    () => ({
      [NOTIFICATION_DRAWER]: (data: GenericEvent<Payload>) => {
        dispatch({ type: UPDATE_NOTIFICATIONS, payload: data });
      },
      [SAMPLE_EVENT]: (data: GenericEvent<Payload>) => console.log('Received sample payload', data),
    }),
    []
  );

  function handleEvent(type: EventTypes, data: GenericEvent<Payload>): void {
    handlerMap[type](data);
  }

  const createConnection = async () => {
    const token = getEncodedToken();
    if (token) {
      const socketUrl = `${document.location.origin.replace(/^.+:\/\//, 'wss://')}/wss/chrome-service/v1/ws`;
      // ensure the cookie exists before we try to establish connection
      await setCookie(token);

      // create WS URL from current origin
      // ensure to use the cloud events sub protocol
      const socket = new WebSocket(socketUrl, 'cloudevents.json');
      connection.current = socket;

      socket.onmessage = (event) => {
        const { data } = event;
        try {
          const payload = JSON.parse(data);
          if (isGenericEvent(payload)) {
            handleEvent(payload.type, payload);
          } else {
            throw new Error(`Unable to handle event type: ${event.type}. The payload does not have required shape! ${event}`);
          }
        } catch (error) {
          console.error('Handler failed when processing WS payload: ', data, error);
        }
      };
    }
  };

  useEffect(() => {
    try {
      // create only one connection and only feature is enabled
      if (isNotificationsEnabled && !connection.current) {
        createConnection();
      }
    } catch (error) {
      console.error('Unable to establish WS connection');
    }
  }, [isNotificationsEnabled]);
};

export default useChromeServiceEvents;
