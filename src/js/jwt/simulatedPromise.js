export function createPromise() {
    const p = {
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
