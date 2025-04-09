# Websocket subscription API

> This API is experimental and is restricted only to the notification drawer and other internal chrome APIs. If you are interested in using the WS API, contact the platform experience services team.

## Subscribing to an event

To consume events, the following information is necessary
- the event type
- the event payload shape

Once this information is know, you can subscribe using the chrome API:

```tsx
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { ChromeWsPayload, ChromeWsEventTypes } from '@redhat-cloud-services/types';
// depends on the event type
type EventPayload = {
  description: string;
  id: string;
  read: boolean;
  title: string;
};

const eventType: ChromeWsEventTypes = 'foo.bar';

const ConsumerComponent = () => {
  const { addWsEventListener } = useChrome();
  const [data, setData] = useState<ChromeWsPayload<EventPayload>[]>([])

  function handleWsEvent(event: ChromeWsPayload<EventPayload>) {
    // handle the event according to requirements
    setData(prev => [...prev, event])
  }

  useEffect(() => {
    const unRegister = addWsEventListener(eventType, handleWsEvent)
    return () => {
      // Do not forget to clean the listener once the component is removed from VDOM
      unRegister()
    }
  }, [])

  return (
    // somehow use the data
  )
}


```
