import { useRef } from 'react';

function useAsyncLoader<R extends Record<string, any>, T extends Array<unknown>>(
  asyncMethod: (...args: T) => Promise<R>,
  afterResolve?: (result: R) => void,
  afterReject?: (error: any) => void
) {
  const storage = useRef<{ resolved: boolean; rejected: boolean; promise?: Promise<R>; result?: R }>({
    resolved: false,
    rejected: false,
    promise: undefined,
    result: undefined,
  });

  return {
    loader: (...args: Parameters<typeof asyncMethod>) => {
      if (storage.current.rejected) return;

      if (storage.current.resolved) return storage.current.result;

      if (storage.current.promise) throw storage.current.promise;

      storage.current.promise = asyncMethod(...args)
        .then((res) => {
          storage.current.promise = undefined;
          storage.current.resolved = true;
          storage.current.result = res;
          afterResolve?.(res);
          return res;
        })
        .catch((error) => {
          storage.current.promise = undefined;
          storage.current.rejected = true;
          afterReject?.(error);
          return error;
        });

      throw storage.current.promise;
    },
  };
}

export default useAsyncLoader;
