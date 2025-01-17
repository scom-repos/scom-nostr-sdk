"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NostrWebSocketManager = exports.NostrRestAPIManager = exports.EventRetrievalCacheManager = void 0;
const utilsManager_1 = require("./utilsManager");
function determineWebSocketType() {
    if (typeof window !== "undefined") {
        return WebSocket;
    }
    else {
        let WebSocket = require('ws');
        return WebSocket;
    }
    ;
}
;
class EventRetrievalCacheManager {
    constructor() {
        this.cache = new Map();
    }
    generateCacheKey(endpoint, msg) {
        return `${endpoint}:${JSON.stringify(msg)}`;
    }
    async fetchWithCache(cacheKey, fetchFunction, cacheDuration = 1000) {
        const currentTime = Date.now();
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (cached && (currentTime - cached.timestamp < cacheDuration)) {
                return cached.result;
            }
        }
        const fetchPromise = fetchFunction();
        this.cache.set(cacheKey, { timestamp: currentTime, result: fetchPromise });
        setTimeout(() => {
            this.cache.delete(cacheKey);
        }, cacheDuration);
        return fetchPromise;
    }
}
exports.EventRetrievalCacheManager = EventRetrievalCacheManager;
class NostrRestAPIManager extends EventRetrievalCacheManager {
    constructor(url) {
        super();
        this.requestCallbackMap = {};
        this._url = url;
    }
    get url() {
        return this._url;
    }
    set url(url) {
        this._url = url;
    }
    async fetchEvents(...requests) {
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
        }
        catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
    }
    async fetchEventsFromAPI(endpoint, msg, authHeader) {
        const cacheKey = this.generateCacheKey(endpoint, msg);
        const fetchFunction = async () => {
            const requestInit = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(msg)
            };
            if (authHeader) {
                requestInit.headers = {
                    ...requestInit.headers,
                    Authorization: authHeader
                };
            }
            const response = await fetch(`${this._url}/${endpoint}`, requestInit);
            let result = await response.json();
            if (result.requestId) {
                result = await utilsManager_1.SocialUtilsManager.getPollResult(this._url, result.requestId, authHeader);
            }
            return result;
        };
        return this.fetchWithCache(cacheKey, fetchFunction);
    }
    async fetchCachedEvents(eventType, msg) {
        const events = await this.fetchEvents({
            cache: [
                eventType,
                msg
            ]
        });
        return events;
    }
    async submitEvent(event, authHeader) {
        try {
            const requestInit = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            };
            if (authHeader) {
                requestInit.headers['Authorization'] = authHeader;
            }
            const response = await fetch(`${this._url}/submit-event`, requestInit);
            const data = await response.json();
            return {
                ...data,
                relay: this.url
            };
        }
        catch (error) {
            console.error('Error submitting event:', error);
            throw error;
        }
    }
}
exports.NostrRestAPIManager = NostrRestAPIManager;
class NostrWebSocketManager {
    constructor(url) {
        this.requestCallbackMap = {};
        this._url = url;
        this.messageListenerBound = this.messageListener.bind(this);
    }
    get url() {
        return this._url;
    }
    set url(url) {
        this._url = url;
    }
    generateRandomNumber() {
        let randomNumber = '';
        for (let i = 0; i < 10; i++) {
            randomNumber += Math.floor(Math.random() * 10).toString();
        }
        return randomNumber;
    }
    messageListener(event) {
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
    establishConnection(requestId, cb) {
        const WebSocket = determineWebSocketType();
        this.requestCallbackMap[requestId] = cb;
        return new Promise((resolve, reject) => {
            const openListener = () => {
                this.ws.removeEventListener('open', openListener);
                resolve({ ws: this.ws, error: null });
            };
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
    async fetchEvents(...requests) {
        let requestId;
        do {
            requestId = this.generateRandomNumber();
        } while (this.requestCallbackMap[requestId]);
        return new Promise(async (resolve, reject) => {
            let events = [];
            const { ws, error } = await this.establishConnection(requestId, (message) => {
                if (message[0] === "EVENT") {
                    const eventData = message[2];
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
    async fetchCachedEvents(eventType, msg) {
        const events = await this.fetchEvents({
            cache: [
                eventType,
                msg
            ]
        });
        return events;
    }
    async submitEvent(event) {
        return new Promise(async (resolve, reject) => {
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
exports.NostrWebSocketManager = NostrWebSocketManager;
