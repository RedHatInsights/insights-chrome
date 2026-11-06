import { PDFRequestOptions } from '@redhat-cloud-services/types';
import axios from 'axios';

const downloadPDF = async (url: string, filename = 'report.pdf') => {
  const resp = await fetch(url);
  if (!resp.ok) {
    const result = await resp.json();
    console.error(result);
    throw new Error('Failed to download PDF. Check console for more details.');
  }

  const blob = await resp.blob();
  const hiddenLink: HTMLAnchorElement | undefined = document.createElement('a');
  hiddenLink.href = window.URL.createObjectURL(blob);
  hiddenLink.download = filename;

  document.body.appendChild(hiddenLink);
  hiddenLink.click();
  hiddenLink.remove();
};

const POLL_INTERVAL = 2000;
// A 404 can be transient: the collection may not be registered yet on the pod
// serving the status request (Kafka sync lag across pods). Retry a bounded
// number of times before giving up.
const MAX_NOT_FOUND_RETRIES = 5;

type PdfFailureBody = { error?: { description?: string } };

export const pollStatus = async (statusID: string) => {
  return new Promise<{ status: string; filepath: string }>((resolve, reject) => {
    let notFoundRetries = 0;

    const poll = async () => {
      try {
        const {
          data: { status: data },
        } = await axios.get<{ status: { status: string; filepath: string } }>(`/api/crc-pdf-generator/v2/status/${statusID}`);
        if (data.status === 'Generated') {
          return resolve(data);
        }

        if (data.status.includes('Failed')) {
          return reject(new Error(data.status));
        }

        // re-arm only after the previous request resolves to avoid overlapping requests
        setTimeout(poll, POLL_INTERVAL);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const code = error.response?.status;

          // Transient 404 while the collection propagates — retry up to the cap.
          if (code === 404 && notFoundRetries < MAX_NOT_FOUND_RETRIES) {
            notFoundRetries += 1;
            setTimeout(poll, POLL_INTERVAL);
            return;
          }

          if (code === 404) {
            return reject(new Error(`No PDF found for ${statusID}`));
          }

          // Backend returns HTTP 500 when generation fails; surface the reason.
          if (code === 500) {
            const description = (error.response?.data as PdfFailureBody | undefined)?.error?.description;
            return reject(new Error(description ?? 'PDF generation failed'));
          }
        }

        reject(error);
      }
    };

    setTimeout(poll, POLL_INTERVAL);
  });
};

const requestPdf = async (options: PDFRequestOptions, getRefreshToken: () => Promise<string>) => {
  const { filename, payload } = options;
  try {
    const refreshToken = await getRefreshToken();
    const {
      data: { statusID },
    } = await axios.post<{ statusID: string }>(
      `/api/crc-pdf-generator/v2/create`,
      { payload },
      { headers: { 'x-rh-refresh-token': `Bearer ${refreshToken}` } }
    );
    const { status } = await pollStatus(statusID);
    if (status === 'Generated') {
      return downloadPDF(`/api/crc-pdf-generator/v2/download/${statusID}`, filename);
    }
  } catch (error) {
    console.log(error);
    throw new Error('Failed to generate PDF. Check console for more details.');
  }
};

export default requestPdf;
