import axios from 'axios';
import { pollStatus } from './requestPdf';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const POLL_INTERVAL = 2000;
const STATUS_ID = 'abc';
const statusUrl = (id: string) => `/api/crc-pdf-generator/v2/status/${id}`;

const generated = { status: 'Generated', filepath: '/tmp/report.pdf' };
const generatedResponse = { data: { status: generated } };
const pendingResponse = { data: { status: { status: 'Pending', filepath: '' } } };
const notFound = { isAxiosError: true, response: { status: 404 } };

const advancePolls = async (count = 1) => {
  for (let i = 0; i < count; i += 1) {
    await jest.advanceTimersByTimeAsync(POLL_INTERVAL);
  }
};

describe('pollStatus', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockedAxios.get.mockReset();
    mockedAxios.isAxiosError = jest.fn().mockReturnValue(false) as never;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves with data once status is Generated', async () => {
    mockedAxios.get.mockResolvedValueOnce(pendingResponse).mockResolvedValueOnce(generatedResponse);

    const promise = pollStatus(STATUS_ID);
    await advancePolls(2); // Pending, then Generated

    await expect(promise).resolves.toEqual(generated);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    expect(mockedAxios.get).toHaveBeenCalledWith(statusUrl(STATUS_ID), { timeout: 10_000 });
  });

  it('rejects when status includes Failed', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { status: { status: 'Failed: boom', filepath: '' } } });

    const promise = pollStatus(STATUS_ID);
    const assertion = expect(promise).rejects.toThrow(`Failed: boom (statusID: ${STATUS_ID})`);

    await advancePolls();
    await assertion;
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('rejects when the status request throws a non-axios error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

    const promise = pollStatus(STATUS_ID);
    const assertion = expect(promise).rejects.toThrow('Network Error');

    await advancePolls();
    await assertion;
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('does not overlap requests: waits for the previous response before re-polling', async () => {
    let resolveFirst: (value: unknown) => void = () => undefined;
    mockedAxios.get
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirst = resolve;
        }) as never
      )
      .mockResolvedValueOnce(generatedResponse);

    const promise = pollStatus(STATUS_ID);

    // fire the first poll; it is still in flight (unresolved)
    await advancePolls();
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);

    // advancing time again must NOT trigger another request while the first is pending
    await advancePolls();
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);

    // resolve the in-flight request, then the next poll is armed
    resolveFirst(pendingResponse);
    await advancePolls();
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);

    await expect(promise).resolves.toEqual(generated);
  });

  describe('axios errors', () => {
    beforeEach(() => {
      mockedAxios.isAxiosError.mockReturnValue(true);
    });

    it('rejects when the status request times out', async () => {
      const timeout = { isAxiosError: true, code: 'ECONNABORTED', message: 'timeout of 10000ms exceeded' };
      mockedAxios.get.mockRejectedValueOnce(timeout);

      const promise = pollStatus(STATUS_ID);
      const assertion = expect(promise).rejects.toBe(timeout);

      await advancePolls();
      await assertion;
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('retries on a transient 404 and resolves once the collection appears', async () => {
      mockedAxios.get.mockRejectedValueOnce(notFound).mockRejectedValueOnce(notFound).mockResolvedValueOnce(generatedResponse);

      const promise = pollStatus(STATUS_ID);
      await advancePolls(3); // 404, 404, Generated

      await expect(promise).resolves.toEqual(generated);
      expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    });

    it('rejects after exhausting 404 retries', async () => {
      mockedAxios.get.mockRejectedValue(notFound);

      const promise = pollStatus(STATUS_ID);
      const assertion = expect(promise).rejects.toThrow(`No PDF found for ${STATUS_ID}`);

      // MAX_NOT_FOUND_RETRIES (5) retries + 1 final attempt that rejects = 6 calls
      await advancePolls(6);

      await assertion;
      expect(mockedAxios.get).toHaveBeenCalledTimes(6);
    });

    it('rejects with the failure description and status ID on HTTP 500', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        isAxiosError: true,
        response: { status: 500, data: { error: { description: 'renderer crashed' } } },
      });

      const promise = pollStatus(STATUS_ID);
      const assertion = expect(promise).rejects.toThrow(`renderer crashed (statusID: ${STATUS_ID}, HTTP 500)`);

      await advancePolls();
      await assertion;
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('falls back to a generic message that includes the status ID when HTTP 500 has no description', async () => {
      mockedAxios.get.mockRejectedValueOnce({ isAxiosError: true, response: { status: 500, data: {} } });

      const promise = pollStatus(STATUS_ID);
      const assertion = expect(promise).rejects.toThrow(`PDF generation failed (statusID: ${STATUS_ID}, HTTP 500)`);

      await advancePolls();
      await assertion;
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });
});
