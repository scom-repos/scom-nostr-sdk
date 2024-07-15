"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NostrWebSocketManager = exports.NostrRestAPIManager = void 0;
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
class NostrRestAPIManager {
    constructor(url) {
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
    async fetchEventsFromAPI(endpoint, msg) {
        try {
            const response = await fetch(`${this._url}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(msg)
            });
            const data = await response.json();
            return data;
        }
        catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
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
        try {
            const response = await fetch(`${this._url}/submit-event`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            });
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
