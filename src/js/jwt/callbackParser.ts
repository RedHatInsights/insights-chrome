export interface IOauth {
    newUrl: string;
    state ?: any;
    code?: string;
    error?: any;
    access_token?: string;
    id_token?: string;
    fragment?: string;
    prompt?: string;
    redirectUri?: string;
    storedNonce ?: string;
}

export default class CallbackParser {

    uriToParse: string;
    responseMode: string;

    constructor(uriToParse: string, responseMode: string) {
        this.uriToParse = uriToParse;
        this.responseMode = responseMode;
    }

    initialParse () {
        let baseUri = null;
        let queryString = null;
        let fragmentString = null;

        const questionMarkIndex = this.uriToParse.indexOf('?');
        let fragmentIndex = this.uriToParse.indexOf('#', questionMarkIndex + 1);
        if (questionMarkIndex === -1 && fragmentIndex === -1) {
            baseUri = this.uriToParse;
        } else if (questionMarkIndex !== -1) {
            baseUri = this.uriToParse.substring(0, questionMarkIndex);
            queryString = this.uriToParse.substring(questionMarkIndex + 1);
            if (fragmentIndex !== -1) {
                fragmentIndex = queryString.indexOf('#');
                fragmentString = queryString.substring(fragmentIndex + 1);
                queryString = queryString.substring(0, fragmentIndex);
            }
        } else {
            baseUri = this.uriToParse.substring(0, fragmentIndex);
            fragmentString = this.uriToParse.substring(fragmentIndex + 1);
        }

        return { baseUri: baseUri, queryString: queryString, fragmentString: fragmentString };
    }

    parseParams (paramString) {
        const result = {};
        const params = paramString.split('&');
        for (let i = 0; i < params.length; i++) {
            const p = params[i].split('=');
            const paramName = decodeURIComponent(p[0]);
            const paramValue = decodeURIComponent(p[1]);
            result[paramName] = paramValue;
        }
        return result;
    }

    handleQueryParam (paramName, paramValue, oauth) {
        const supportedOAuthParams = [ 'code', 'state', 'error', 'error_description' ];

        for (let i = 0; i < supportedOAuthParams.length ; i++) {
            if (paramName === supportedOAuthParams[i]) {
                oauth[paramName] = paramValue;
                return true;
            }
        }
        return false;
    }


    parseUri (): IOauth {
        const parsedUri = this.initialParse();

        let queryParams = {};
        if (parsedUri.queryString) {
            queryParams = this.parseParams(parsedUri.queryString);
        }

        const oauth: IOauth = {
            newUrl: parsedUri.baseUri,
        };

        for (let param in queryParams) {
            switch (param) {
                case 'redirect_fragment':
                    oauth.fragment = queryParams[param];
                    break;
                case 'prompt':
                    oauth.prompt = queryParams[param];
                    break;
                default:
                    if (this.responseMode !== 'query' || !this.handleQueryParam(param, queryParams[param], oauth)) {
                        oauth.newUrl += (oauth.newUrl.indexOf('?') === -1 ? '?' : '&') + param + '=' + queryParams[param];
                    }
                    break;
            }
        }

        if (this.responseMode === 'fragment') {
            let fragmentParams = {};
            if (parsedUri.fragmentString) {
                fragmentParams = this.parseParams(parsedUri.fragmentString);
            }
            for (let param in fragmentParams) {
                oauth[param] = fragmentParams[param];
            }
        }

        return oauth;
    }
}