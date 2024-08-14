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

const pollStatus = async (statusID: string) => {
  return new Promise<{ status: string; filepath: string }>((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const {
          data: { status: data },
        } = await axios.get<{ status: { status: string; filepath: string } }>(`/api/crc-pdf-generator/v2/status/${statusID}`);
        if (data.status === 'Generated') {
          clearInterval(interval);
          resolve(data);
        }

        if (data.status.includes('Failed')) {
          clearInterval(interval);
          reject(new Error(data.status));
        }
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, 10000);
  });
};

const requestPdf = async (options: PDFRequestOptions) => {
  const { filename, payload } = options;
  try {
    const {
      data: { statusID },
    } = await axios.post<{ statusID: string }>(`/api/crc-pdf-generator/v2/create`, { payload });
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
