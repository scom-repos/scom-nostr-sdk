import { Event } from "../core/index";
import { INostrEvent, INostrFetchEventsResponse, INostrSubmitResponse, INostrCommunicationManager, INostrRestAPIManager } from "../utils";
import { SocialUtilsManager } from "./utilsManager";

function determineWebSocketType() {
    if (typeof window !== "undefined") {
        return WebSocket;
    }
    else {
        // @ts-ignore
        let WebSocket = require('ws');
        return WebSocket;
    };
};

class NostrRestAPIManager implements INostrRestAPIManager {
    protected _url: string;
    protected requestCallbackMap: Record<string, (response: any) => void> = {};

    constructor(url: string) {
        this._url = url;
    }

    get url() {
        return this._url;
    }

    set url(url: string) {
        this._url = url;
    }

    async fetchEvents(...requests: any): Promise<INostrFetchEventsResponse> {
        try {
            const response = await fetch(`${this._url}/fetch-events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    requests: [...requests]
                })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
    }
    async fetchEventsFromAPI(endpoint: string, msg: any, authHeader?: string): Promise<INostrFetchEventsResponse> {
        try {
            const requestInit = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(msg)
            }
            if (authHeader) {
                requestInit.headers['Authorization'] = authHeader;
            }
            const response = await fetch(`${this._url}/${endpoint}`, requestInit);
            let result: INostrFetchEventsResponse = await response.json();
            if (result.requestId) {
                let requestId = result.requestId;
                const pollFunction = async () => {
                    const pollRequestInit = {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                    if (authHeader) {
                        pollRequestInit.headers['Authorization'] = authHeader;
                    }
                    const pollResponse = await fetch(`${this._url}/poll/${requestId}`, pollRequestInit);
                    const pollResult = await pollResponse.json();
                    return pollResult;
                }
                const stopPolling = (pollResult: any) => {
                    return !!pollResult?.data;
                }
                const pollResult = await SocialUtilsManager.exponentialBackoffRetry(
                    pollFunction,
                    10, 
                    200, 
                    10000, 
                    2,
                    stopPolling
                );
                console.log('pollResult', pollResult);
                result = pollResult.data;
            }
            return result;
        } catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
    }
    async fetchCachedEvents(eventType: string, msg: any) {
        const events = await this.fetchEvents({
            cache: [
                eventType,
                msg
            ]
        });
        return events;
    }
    async submitEvent(event: any, authHeader?: string): Promise<any> {
        try {
            const requestInit = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            }
            if (authHeader) {
                requestInit.headers['Authorization'] = authHeader;
            }
            const response = await fetch(`${this._url}/submit-event`, requestInit);
            const data = await response.json();
            return {
                ...data,
                relay: this.url
            };
        } catch (error) {
            console.error('Error submitting event:', error);
            throw error;
        }
    }
}

class NostrWebSocketManager implements INostrCommunicationManager {
    protected _url: string;
    protected ws: any;
    protected requestCallbackMap: Record<string, (message: any) => void> = {};
    protected messageListenerBound: any;

    constructor(url) {
        this._url = url;
        this.messageListenerBound = this.messageListener.bind(this);
    }

    get url() {
        return this._url;
    }

    set url(url: string) {
        this._url = url;
    }

    generateRandomNumber(): string {
        let randomNumber = '';
        for (let i = 0; i < 10; i++) {
            randomNumber += Math.floor(Math.random() * 10).toString();
        }
        return randomNumber;
    }

    messageListener(event: any) {
        const messageStr = event.data.toString();
        const message = JSON.parse(messageStr);
        let requestId = message[1];
        if (message[0] === 'EOSE' || message[0] === 'OK') {
            if (this.requestCallbackMap[requestId]) {
                this.requestCallbackMap[requestId](message);
                delete this.requestCallbackMap[requestId];
            }
        }
        else if (message[0] === 'EVENT') {
            if (this.requestCallbackMap[requestId]) {
                this.requestCallbackMap[requestId](message);
            }
        }
    }

    establishConnection(requestId: string, cb: (message: any) => void) {
        const WebSocket = determineWebSocketType();
        this.requestCallbackMap[requestId] = cb;
        return new Promise<{ ws: any, error: any }>((resolve, reject) => {
            const openListener = () => {
                this.ws.removeEventListener('open', openListener);
                resolve({ ws: this.ws, error: null });
            }
            if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
                this.ws = new WebSocket(this._url);
                this.ws.addEventListener('open', openListener);
                this.ws.addEventListener('message', this.messageListenerBound);

                this.ws.addEventListener('close', () => {
                    this.requestCallbackMap = {};
                    resolve({ ws: null, error: 'Disconnected from server' });
                });

                this.ws.addEventListener('error', (error) => {
                    resolve({ ws: null, error });
                });
            }
            else {
                if (this.ws.readyState === WebSocket.OPEN) {
                    resolve({ ws: this.ws, error: null });
                }
                else {
                    this.ws.addEventListener('open', openListener);
                }
            }
        });
    }
    async fetchEvents(...requests: any) {
        let requestId;
        do {
            requestId = this.generateRandomNumber();
        } while (this.requestCallbackMap[requestId]);
        return new Promise<INostrFetchEventsResponse>(async (resolve, reject) => {
            let events: INostrEvent[] = [];
            const { ws, error } = await this.establishConnection(requestId, (message) => {
                if (message[0] === "EVENT") {
                    const eventData = message[2];
                    // Implement the verifySignature function according to your needs
                    // console.log(verifySignature(eventData)); // true
                    events.push(eventData);
                }
                else if (message[0] === "EOSE") {
                    resolve({
                        events
                    });
                }
            });
            if (error) {
                resolve({
                    error: 'Error establishing connection'
                });
            }
            else if (ws) {
                ws.send(JSON.stringify(["REQ", requestId, ...requests]));
            }
            else {
                resolve({
                    error: 'Error establishing connection'
                });
            }
        });
    }
    async fetchCachedEvents(eventType: string, msg: any) {
        const events = await this.fetchEvents({
            cache: [
                eventType,
                msg
            ]
        });
        return events;
    }
    async submitEvent(event: Event.VerifiedEvent<number>) {
        return new Promise<INostrSubmitResponse>(async (resolve, reject) => {
            let msg = JSON.stringify(["EVENT", event]);
            const { ws, error } = await this.establishConnection(event.id, (message) => {
                resolve({
                    success: message[2],
                    message: message[3],
                    relay: this.url
                });
            });
            if (error) {
                resolve({
                    success: false,
                    message: error,
                    relay: this.url
                });
            }
            else if (ws) {
                ws.send(msg);
            }
        });
    }
}

export {
    INostrCommunicationManager,
    INostrRestAPIManager,
    NostrRestAPIManager,
    NostrWebSocketManager
}
