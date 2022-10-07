import { HelpTopic } from '@patternfly/quickstarts';

const helpTopicDataMock: HelpTopic[] = [
  {
    name: 'chrome-data-mock-1',
    tags: ['page-1'],
    title: 'Automatic Deployment',
    content:
      '**An Automatic Deployment** is...\n\nEtiam viverra et tortor et maximus. Aliquam quis scelerisque metus. Proin luctus pretium sodales. Mauris nibh nibh, auctor eu scelerisque et, hendrerit a metus. Vivamus pharetra bibendum finibus. Sed a pulvinar ipsum. Fusce pharetra venenatis porttitor. Praesent justo metus, consectetur quis erat id, congue varius metus. Suspendisse dui est, tempor nec diam quis, facilisis sodales erat. Curabitur viverra convallis ex. Ut egestas condimentum augue, id euismod leo volutpat vitae. Quisque aliquet ac dolor quis pretium. Nunc at nibh quis arcu maximus elementum vel a mi.',
    links: [
      {
        text: 'Creating quick starts (external)',
        href: 'https://docs.openshift.com/container-platform/4.9/web_console/creating-quick-start-tutorials.html',
        isExternal: true,
      },
      {
        text: 'Redhat Console (opens in new tab)',
        href: 'https://console.redhat.com',
        newTab: true,
      },
    ],
  },
  {
    name: 'chrome-data-mock-2',
    tags: ['page-1', 'page-2', 'page-3'],
    title: 'Workspace',
    content:
      '**A Workspace** is...\n\nFusce nunc risus, vehicula feugiat pellentesque sit amet, pretium non urna. Phasellus nibh mi, ornare quis euismod a, iaculis et eros. Vivamus auctor nunc odio, quis porttitor diam pellentesque nec. In et varius tellus, eget porta urna. Etiam bibendum, est eget mollis lobortis, velit risus efficitur lacus, sed pulvinar sem est vel libero. In sodales placerat tincidunt. Proin vitae risus elit. Ut lobortis ligula est, cursus rhoncus enim scelerisque ac. Donec lacus nisl, tempor porta hendrerit nec, volutpat vitae arcu. Curabitur ornare ullamcorper mi in tincidunt. Aenean efficitur posuere auctor. Pellentesque accumsan mauris vel arcu congue, nec sagittis nisl condimentum. Suspendisse mauris nulla, dignissim at viverra sed, fringilla eu purus.',
    links: [
      {
        text: 'Creating quick starts (external)',
        href: 'https://docs.openshift.com/container-platform/4.9/web_console/creating-quick-start-tutorials.html',
        isExternal: true,
      },
      {
        text: 'Redhat Console (opens in new tab)',
        href: 'https://console.redhat.com',
        newTab: true,
      },
    ],
  },
];

export default helpTopicDataMock;
