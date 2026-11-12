import type { ChromeUser } from '@redhat-cloud-services/types';

export const getAnalyticsUserId = (user: ChromeUser) => user.identity.internal?.account_id;
