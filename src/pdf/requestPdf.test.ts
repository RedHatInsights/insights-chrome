import axios from 'axios';
import { pollStatus } from './requestPdf';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const statusUrl = (id: string) => `/api/crc-pdf-generator/v2/status/${id}`;

describe('pollStatus', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockedAxios.get.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves with data once status is Generated', async () => {
    const generated = { status: 'Generated', filepath: '/tmp/report.pdf' };
    mockedAxios.get
      .mockResolvedValueOnce({ data: { status: { status: 'Pending', filepath: '' } } })
      .mockResolvedValueOnce({ data: { status: generated } });

    const promise = pollStatus('abc');

    // first poll (Pending)
    await jest.advanceTimersByTimeAsync(2000);
    // second poll (Generated)
    await jest.advanceTimersByTimeAsync(2000);

    await expect(promise).resolves.toEqual(generated);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    expect(mockedAxios.get).toHaveBeenCalledWith(statusUrl('abc'));
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
