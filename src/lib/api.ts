import axios, {
    AxiosError,
    AxiosInstance,
    AxiosInterceptorManager,
    AxiosPromise,
    AxiosRequestConfig,
    AxiosResponse,
    ResponseType,
} from 'axios';
import pickBy from 'lodash/pickBy';
import DownloadReachability from './DownloadReachability';
import MetadataAPI from './metadataAPI';
import lumappsPassThrough from './LUMAPPS_PassThrough';
import { LumAppsContext, PassThroughData } from './LUMAPPS_types';

export type APIGetConfig = {
    type?: ResponseType;
    connectorId?: string;
    LumAppsContext?: LumAppsContext;
} & AxiosRequestConfig;
export type APIError = { response: AxiosResponse } & Error;
export type APIPromise = Promise<AxiosPromise | SyntaxError>;

const filterOptions = (options: AxiosRequestConfig = {}): AxiosRequestConfig => {
    return pickBy(options, (value: keyof AxiosRequestConfig) => value !== undefined && value !== null);
};

const handleError = (response: AxiosError): void => {
    if (response) {
        const error = new Error(response.response?.statusText) as APIError;
        // @ts-ignore
        error.response = response; // Need to pass response through so we can see what kind of HTTP error this was
        throw error;
    }
};
const parseResponse = (response: AxiosResponse): AxiosResponse | AxiosResponse['data'] => {
    if (response.status === 204 || response.status === 202) {
        return response;
    }

    return response.data;
};

const transformTextResponse = <D>(data: D): D => data;

export default class Api {
    client: AxiosInstance;

    interceptors: number[] = [];

    metadata: MetadataAPI;

    reachability: DownloadReachability;

    constructor() {
        this.client = axios.create();
        this.metadata = new MetadataAPI(this);
        this.reachability = new DownloadReachability(this);
    }

    addResponseInterceptor(responseInterceptor: AxiosInterceptorManager<AxiosResponse>): void {
        if (typeof responseInterceptor === 'function') {
            this.interceptors.push(this.client.interceptors.response.use(responseInterceptor));
        }
    }

    addRequestInterceptor(requestInterceptor: AxiosInterceptorManager<AxiosRequestConfig>): void {
        if (typeof requestInterceptor === 'function') {
            this.interceptors.push(this.client.interceptors.request.use(requestInterceptor));
        }
    }

    ejectInterceptors(): void {
        this.interceptors.forEach(interceptorIndex => {
            this.client.interceptors.request.eject(interceptorIndex);
            this.client.interceptors.response.eject(interceptorIndex);
        });
    }

    delete<D>(url: string, data: D, options: AxiosRequestConfig = {}): AxiosPromise {
        return this.xhr(url, { method: 'delete', data, ...options });
    }

    get(url: string, { type: responseType = 'json', ...options }: APIGetConfig = {}): AxiosPromise {
        return this.xhr(url, { method: 'get', responseType, ...options });
    }

    head(url: string, options: AxiosRequestConfig = {}): AxiosPromise {
        return this.xhr(url, { method: 'head', ...options });
    }

    post<D>(url: string, data: D, options: AxiosRequestConfig = {}): AxiosPromise {
        return this.xhr(url, { method: 'post', data, ...options });
    }

    put<D>(url: string, data: D, options: AxiosRequestConfig = {}): AxiosPromise {
        return this.xhr(url, { method: 'put', data, ...options });
    }

    xhr(url: string, options: any): AxiosPromise {
        const { method, data, LumAppsContext, connectorId } = options;

        let transformResponse;

        if (options.responseType === 'text') transformResponse = transformTextResponse;

        const axiosConfig = filterOptions({ transformResponse, ...options });

        const passThroughData: PassThroughData = {
            method: method.toUpperCase(),
            url,
            headers: axiosConfig.headers,
        };

        if (data) passThroughData.body = data as object;

        return lumappsPassThrough(LumAppsContext as LumAppsContext, connectorId as string, passThroughData)
            .then(parseResponse)
            .catch(handleError);
    }
}
