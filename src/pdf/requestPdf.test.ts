import axios from 'axios';
import { pollStatus } from './requestPdf';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const statusUrl = (id: string) => `/api/crc-pdf-generator/v2/status/${id}`;

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
    const generated = { status: 'Generated', filepath: '/tmp/report.pdf' };
    mockedAxios.get.mockResolvedValueOnce({ data: { status: { status: 'Pending', filepath: '' } } }).mockResolvedValueOnce({ data: { status: generated } });

    const promise = pollStatus('abc');

    // first poll (Pending)
    await jest.advanceTimersByTimeAsync(2000);
    // second poll (Generated)
    await jest.advanceTimersByTimeAsync(2000);

    await expect(promise).resolves.toEqual(generated);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    expect(mockedAxios.get).toHaveBeenCalledWith(statusUrl('abc'), { timeout: 10_000 });
  });

  it('rejects when the status request times out', async () => {
    const timeout = { isAxiosError: true, code: 'ECONNABORTED', message: 'timeout of 10000ms exceeded' };
    mockedAxios.isAxiosError.mockReturnValue(true);
    mockedAxios.get.mockRejectedValueOnce(timeout);

    const promise = pollStatus('abc');
    const assertion = expect(promise).rejects.toBe(timeout);

    await jest.advanceTimersByTimeAsync(2000);
    await assertion;
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('rejects when status includes Failed', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { status: { status: 'Failed: boom', filepath: '' } } });

    const promise = pollStatus('abc');
    const assertion = expect(promise).rejects.toThrow('Failed: boom');

    await jest.advanceTimersByTimeAsync(2000);
    await assertion;
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('rejects when the status request throws', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

    const promise = pollStatus('abc');
    const assertion = expect(promise).rejects.toThrow('Network Error');

    await jest.advanceTimersByTimeAsync(2000);
    await assertion;
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('retries on a transient 404 and resolves once the collection appears', async () => {
    const notFound = { isAxiosError: true, response: { status: 404 } };
    const generated = { status: 'Generated', filepath: '/tmp/report.pdf' };
    mockedAxios.isAxiosError.mockReturnValue(true);
    mockedAxios.get
      .mockRejectedValueOnce(notFound)
      .mockRejectedValueOnce(notFound)
      .mockResolvedValueOnce({ data: { status: generated } });

    const promise = pollStatus('abc');

    await jest.advanceTimersByTimeAsync(2000); // 404 #1
    await jest.advanceTimersByTimeAsync(2000); // 404 #2
    await jest.advanceTimersByTimeAsync(2000); // Generated

    await expect(promise).resolves.toEqual(generated);
    expect(mockedAxios.get).toHaveBeenCalledTimes(3);
  });

  it('rejects after exhausting 404 retries', async () => {
    const notFound = { isAxiosError: true, response: { status: 404 } };
    mockedAxios.isAxiosError.mockReturnValue(true);
    mockedAxios.get.mockRejectedValue(notFound);

    const promise = pollStatus('abc');
    const assertion = expect(promise).rejects.toThrow('No PDF found for abc');

    // MAX_NOT_FOUND_RETRIES (5) retries + 1 final attempt that rejects = 6 calls
    for (let i = 0; i < 6; i += 1) {
      await jest.advanceTimersByTimeAsync(2000);
    }

    await assertion;
    expect(mockedAxios.get).toHaveBeenCalledTimes(6);
  });

  it('rejects with the failure description on HTTP 500', async () => {
    mockedAxios.isAxiosError.mockReturnValue(true);
    mockedAxios.get.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 500, data: { error: { description: 'renderer crashed' } } },
    });

    const promise = pollStatus('abc');
    const assertion = expect(promise).rejects.toThrow('renderer crashed');

    await jest.advanceTimersByTimeAsync(2000);
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
      .mockResolvedValueOnce({ data: { status: { status: 'Generated', filepath: '/tmp/report.pdf' } } });

    const promise = pollStatus('abc');

    // fire the first poll; it is still in flight (unresolved)
    await jest.advanceTimersByTimeAsync(2000);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);

    // advancing time again must NOT trigger another request while the first is pending
    await jest.advanceTimersByTimeAsync(2000);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);

    // resolve the in-flight request, then the next poll is armed
    resolveFirst({ data: { status: { status: 'Pending', filepath: '' } } });
    await jest.advanceTimersByTimeAsync(2000);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);

    await expect(promise).resolves.toEqual({ status: 'Generated', filepath: '/tmp/report.pdf' });
  });
});
