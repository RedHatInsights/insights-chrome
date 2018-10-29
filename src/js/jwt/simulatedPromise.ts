export interface ISimplePromise {
    success: Function;
    error: Function;
}

export interface ISimulatedPromise {
    setSuccess: Function;
    setError: Function;
    promise: ISimplePromise;
    success?: boolean;
    result?: any;
    error?: any;
    errorCallback?: Function;
    successCallback?: Function;
 }

export function createPromise(): ISimulatedPromise {
    const p: ISimulatedPromise = {
        setSuccess: function(result) {
            p.success = true;
            p.result = result;
            if (p.successCallback) {
                p.successCallback(result);
            }
        },
        setError: function(result) {
            p.error = true;
            p.result = result;
            if (p.errorCallback) {
                p.errorCallback(result);
            }
        },
        promise: {
            success: function(callback) {
                if (p.success) {
                    callback(p.result);
                } else if (!p.error) {
                    p.successCallback = callback;
                }
                return p.promise;
            },
            error: function(callback) {
                if (p.error) {
                    callback(p.result);
                } else if (!p.success) {
                    p.errorCallback = callback;
                }
                return p.promise;
            }
        }
    };
    return p;
}