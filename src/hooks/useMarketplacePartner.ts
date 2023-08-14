import { useLocation } from 'react-router-dom';

// TODO: Figure out what param chrome should expect
export const AWS_BANNER_NAME = 'from-aws';
export const AZURE_BANNER_NAME = 'from-azure';
export const GCP_BANNER_NAME = 'from-gcp';

const partnerMapper: { [partner: string]: string } = {
  [AWS_BANNER_NAME]: 'AWS',
  [AZURE_BANNER_NAME]: 'Microsoft Azure',
  [GCP_BANNER_NAME]: 'Google Cloud',
};
const possibleParams = [AWS_BANNER_NAME, AZURE_BANNER_NAME, GCP_BANNER_NAME];

const hasPartner = (params: URLSearchParams) => possibleParams.find((param) => params.has(param));

const removePartnerParam = (params: URLSearchParams) => {
  params.delete(AWS_BANNER_NAME);
  params.delete(AZURE_BANNER_NAME);
  params.delete(GCP_BANNER_NAME);
  return params;
};

const useMarketplacePartner = () => {
  const { search } = useLocation();

  const params = new URLSearchParams(search);
  const partnerId = hasPartner(params);
  const partner = partnerId ? partnerMapper[partnerId] : null;
  return {
    partner,
    partnerId,
    removePartnerParam: () => removePartnerParam(params),
  };
};

export default useMarketplacePartner;
