import { AxiosError } from 'axios';
import NotAuthorized from '@redhat-cloud-services/frontend-components/NotAuthorized';

const AccountOnHoldError = ({ error }: { error: AxiosError<{ errors: { detail: string }[] }> }) => {
  const data = error.response?.data.errors[0].detail;
  const description = <div dangerouslySetInnerHTML={{ __html: data! }}></div>;
  return <NotAuthorized description={description} serviceName="Hybrid Cloud Console" />;
};

export default AccountOnHoldError;
