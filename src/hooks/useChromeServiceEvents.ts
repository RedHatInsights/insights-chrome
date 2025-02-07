import { useContext, useEffect, useMemo, useRef } from 'react';
import { useFlag } from '@unleash/proxy-client-react';
import { setCookie } from '../auth/setCookie';
import ChromeAuthContext from '../auth/ChromeAuthContext';
import { useSetAtom } from 'jotai';
import { NotificationData, addNotificationAtom } from '../state/atoms/notificationDrawerAtom';
import { AddChromeWsEventListener, ChromeWsEventListener, ChromeWsEventTypes, ChromeWsPayload } from '@redhat-cloud-services/types';

const RETRY_LIMIT = 5;
const NOTIFICATION_DRAWER: ChromeWsEventTypes = 'com.redhat.console.notifications.drawer';
const ALL_TYPES: ChromeWsEventTypes[] = [NOTIFICATION_DRAWER];
type Payload = NotificationData;

function isGenericEvent(event: unknown): event is ChromeWsPayload<Payload> {
  return typeof event === 'object' && event !== null && ALL_TYPES.includes((event as Record<string, never>).type);
}

type WsEventListenersRegistry = {
  [type in ChromeWsEventTypes]: Map<symbol, ChromeWsEventListener<Payload>>;
};

// needs to be outside rendering cycle to preserver clients when chrome API changes
const wsEventListenersRegistry: WsEventListenersRegistry = {
  [NOTIFICATION_DRAWER]: new Map(),
};

const useChromeServiceEvents = (): AddChromeWsEventListener => {
  const connection = useRef<WebSocket | undefined>();
  const addNotification = useSetAtom(addNotificationAtom);
  const isNotificationsEnabled = useFlag('platform.chrome.notifications-drawer');
  const { token, tokenExpires } = useContext(ChromeAuthContext);
  const retries = useRef(0);

  const removeEventListener = (id: symbol) => {
    const type = id.description as ChromeWsEventTypes;
    wsEventListenersRegistry[type].delete(id);
  };

  const addEventListener: AddChromeWsEventListener = (type: ChromeWsEventTypes, listener: ChromeWsEventListener<any>) => {
    const id = Symbol(type);
    wsEventListenersRegistry[type].set(id, listener);
    return () => removeEventListener(id);
  };

  const triggerListeners = (type: ChromeWsEventTypes, data: ChromeWsPayload<Payload>) => {
    wsEventListenersRegistry[type].forEach((cb) => cb(data));
  };

  const handlerMap: { [key in ChromeWsEventTypes]: (payload: ChromeWsPayload<Payload>) => void } = useMemo(
    () => ({
      [NOTIFICATION_DRAWER]: (data: ChromeWsPayload<Payload>) => {
        triggerListeners(NOTIFICATION_DRAWER, data);
        // TODO: Move away from chrome once the portal content is moved to notifications
        addNotification(data.data as unknown as NotificationData);
      },
    }),
    []
  );

  function handleEvent(type: ChromeWsEventTypes, data: ChromeWsPayload<Payload>): void {
    handlerMap[type](data);
  }

  const createConnection = async () => {
    if (token) {
      const socketUrl = `${document.location.origin.replace(/^.+:\/\//, 'wss://')}/wss/chrome-service/v1/ws`;
      // ensure the cookie exists before we try to establish connection
      await setCookie(token, tokenExpires);

      // create WS URL from current origin
      // ensure to use the cloud events sub protocol
      const socket = new WebSocket(socketUrl, 'cloudevents.json');
      connection.current = socket;

      socket.onmessage = (event) => {
        retries.current = 0;
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

      socket.onclose = () => {
        // renew connection on close
        // pod was restarted or network issue
        setTimeout(() => {
          if (retries.current < RETRY_LIMIT) {
            createConnection();
          }

          retries.current += 1;
        }, 2000);
      };

      socket.onerror = (error) => {
        console.error('WS connection error: ', error);
        // renew connection on error
        // data was unable to be sent
        setTimeout(() => {
          if (retries.current < RETRY_LIMIT) {
            createConnection();
          }

          retries.current += 1;
        }, 2000);
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

  return addEventListener;
};

export default useChromeServiceEvents;
