export const testData = [
  {
    id: '1',
    title: 'Test Notification 1',
    description: 'Testing of notification',
    read: false,
    source: 'rhel', // the origin of the message
    created: '2023-08-18T12:00:00Z',
  },
  {
    id: '2',
    title: 'Test Notification 2',
    description: 'Testing of notification',
    read: false,
    source: 'ansible', // the origin of the message
    created: '2023-08-18T12:05:00Z',
  },
  {
    id: '3',
    title: 'Test Notification 3',
    description: 'Testin of notification',
    read: false,
    source: 'openshift', // the origin of the message
    created: '2023-08-18T12:10:00Z',
  },
];

export const readTestData = [
  {
    id: '1',
    title: 'Read test notification 1',
    description: 'Notification testing with read',
    read: true,
    source: 'NEPTUNO',
    created: '20 mins ago',
  },
  {
    id: '2',
    title: 'Read test notification 2',
    description: 'Notification testing with read',
    read: true,
    source: 'MARS',
    created: '25 mins ago',
  },
];
