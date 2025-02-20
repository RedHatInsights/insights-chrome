import React from 'react';
import { AxiosError } from 'axios';
import NotAuthorized from '@redhat-cloud-services/frontend-components/NotAuthorized';

const ON_HOLD_MARK = 'Insights authorization failed - ERROR_EXPORT_CONTROL:';

export const checkAccountOnHold = (error: any) => {
  return error?.response?.data?.errors?.[0]?.detail.includes(ON_HOLD_MARK);
};

const AccountOnHoldError = ({ error }: { error: AxiosError<{ errors: { detail: string }[] }> }) => {
  const data = error.response?.data.errors[0].detail;
  const description = <div dangerouslySetInnerHTML={{ __html: data! }}></div>;
  return <NotAuthorized bodyText={description} serviceName="Hybrid Cloud Console" />;
};

export default AccountOnHoldError;
