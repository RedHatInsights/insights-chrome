export type ThreeScaleError = {
  data?: string;
  complianceError?: boolean;
  status: number;
  source?: string;
  detail: string;
  meta?: { response_by: string };
};

export const COMPLIACE_ERROR_CODES = ['ERROR_OFAC', 'ERROR_T5', 'ERROR_EXPORT_CONTROL'];
const errorCodeRegexp = new RegExp(`(${COMPLIACE_ERROR_CODES.join('|')})`);

export function get3scaleError(
  response: string | { errors: ThreeScaleError[] },
  auth?: {
    loginSilent: () => Promise<unknown>;
    loginRedirect: () => Promise<unknown>;
  }
) {
  if (auth && typeof response !== 'string' && isTokenExpiredError(response)) {
    auth.loginSilent().catch(() => {
      // if the silent login fails, we have to redirect to the login page
      auth.loginRedirect();
    });
    return;
  }

  // attempt to parse XHR response
  let parsedResponse: ThreeScaleError[];
  try {
    // the compliance error can be also in a simple string format. We have to parse it and shape it as a gateway error.
    if (typeof response === 'string' && isComplianceError(response)) {
      const parsedResponse: ThreeScaleError = {
        status: 403,
        detail: response,
        complianceError: true,
        meta: {
          response_by: 'gateway',
        },
      };
      return parsedResponse;
    }
    parsedResponse = typeof response === 'string' ? JSON.parse(response).errors : response.errors;
    if (typeof parsedResponse === 'undefined') {
      return;
    }
  } catch {
    // silently handle JSON parse error. Response is not a valid JSON and does not include any valid errors
    return;
  }

  // check if one of the error messages has gateway flag
  const result = parsedResponse.find(({ status, meta }) => (status === 401 || status === 403) && meta?.response_by === 'gateway');
  if (result) {
    // in case the gateway sends compliance error as a error detail
    result.complianceError = isComplianceError(result.detail);
  }
  return result;
}

function isComplianceError(response = '') {
  return !!response.match(errorCodeRegexp);
}

const TOKEN_EXPIRED_MATCHER = `Invalid JWT token - 'exp' claim expired at`;

function isTokenExpiredError(error?: { errors?: ThreeScaleError[] }) {
  return error?.errors?.find(({ status, detail }) => status === 401 && detail?.includes(TOKEN_EXPIRED_MATCHER));
}
