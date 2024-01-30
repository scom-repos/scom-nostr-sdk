"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NostrWebSocketManager = exports.SocialDataManager = exports.SocialUtilsManager = exports.NostrEventManager = void 0;
const eth_wallet_1 = require("@ijstech/eth-wallet");
const index_1 = require("../core/index");
const interfaces_1 = require("./interfaces");
const geohash_1 = __importDefault(require("./geohash"));
const mqtt_1 = require("./mqtt");
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
function convertUnixTimestampToDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
}
function flatMap(array, callback) {
    return array.reduce((acc, item) => {
        return acc.concat(callback(item));
    }, []);
}
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
            return data;
        }
        catch (error) {
            console.error('Error submitting event:', error);
            throw error;
        }
    }
}
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
                console.log('Connected to server');
                this.ws.removeEventListener('open', openListener);
                resolve(this.ws);
            };
            if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
                this.ws = new WebSocket(this._url);
                this.ws.addEventListener('open', openListener);
                this.ws.addEventListener('message', this.messageListenerBound);
                this.ws.addEventListener('close', () => {
                    console.log('Disconnected from server');
                });
                this.ws.addEventListener('error', (error) => {
                    console.error('WebSocket Error:', error);
                    reject(error);
                });
            }
            else {
                if (this.ws.readyState === WebSocket.OPEN) {
                    resolve(this.ws);
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
            try {
                const ws = await this.establishConnection(requestId, (message) => {
                    if (message[0] === "EVENT") {
                        const eventData = message[2];
                        events.push(eventData);
                    }
                    else if (message[0] === "EOSE") {
                        resolve(events);
                        console.log("end of stored events");
                    }
                });
                ws.send(JSON.stringify(["REQ", requestId, ...requests]));
            }
            catch (err) {
                resolve([]);
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
            console.log(msg);
            try {
                const ws = await this.establishConnection(event.id, (message) => {
                    console.log('from server:', message);
                    resolve({
                        eventId: message[1],
                        success: message[2],
                        message: message[3]
                    });
                });
                ws.send(msg);
            }
            catch (err) {
                resolve({
                    eventId: event.id,
                    success: false,
                    message: err.toString()
                });
            }
        });
    }
}
exports.NostrWebSocketManager = NostrWebSocketManager;
class NostrEventManager {
    constructor(relays, cachedServer, apiBaseUrl) {
        this._relays = [];
        this._nostrCommunicationManagers = [];
        this._relays = relays;
        this._cachedServer = cachedServer;
        for (let relay of relays) {
            if (relay.startsWith('wss://')) {
                this._nostrCommunicationManagers.push(new NostrWebSocketManager(relay));
            }
            else {
                this._nostrCommunicationManagers.push(new NostrRestAPIManager(relay));
            }
        }
        if (this._cachedServer.startsWith('wss://')) {
            this._nostrCachedCommunicationManager = new NostrWebSocketManager(this._cachedServer);
        }
        else {
            this._nostrCachedCommunicationManager = new NostrRestAPIManager(this._cachedServer);
        }
        this._apiBaseUrl = apiBaseUrl;
    }
    async fetchThreadCacheEvents(id, pubKey) {
        let decodedId = id.startsWith('note1') ? index_1.Nip19.decode(id).data : id;
        let msg = {
            event_id: decodedId,
            limit: 100
        };
        if (pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
            msg.user_pubkey = decodedPubKey;
        }
        const events = await this._nostrCachedCommunicationManager.fetchCachedEvents('thread_view', msg);
        return events;
    }
    async fetchTrendingCacheEvents(pubKey) {
        let msg = {};
        if (pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
            msg.user_pubkey = decodedPubKey;
        }
        const events = await this._nostrCachedCommunicationManager.fetchCachedEvents('explore_global_trending_24h', msg);
        return events;
    }
    async fetchProfileFeedCacheEvents(pubKey, since = 0, until = 0) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = {
            limit: 20,
            notes: "authored",
            pubkey: decodedPubKey,
            user_pubkey: decodedPubKey
        };
        if (until === 0) {
            msg.since = since;
        }
        else {
            msg.until = until;
        }
        const events = await this._nostrCachedCommunicationManager.fetchCachedEvents('feed', msg);
        return events;
    }
    async fetchProfileRepliesCacheEvents(pubKey, since = 0, until = 0) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = {
            limit: 20,
            notes: "replies",
            pubkey: decodedPubKey,
            user_pubkey: decodedPubKey
        };
        if (until === 0) {
            msg.since = since;
        }
        else {
            msg.until = until;
        }
        const events = await this._nostrCachedCommunicationManager.fetchCachedEvents('feed', msg);
        return events;
    }
    async fetchHomeFeedCacheEvents(pubKey, since = 0, until = 0) {
        let msg = {
            limit: 20
        };
        if (until === 0) {
            msg.since = since;
        }
        else {
            msg.until = until;
        }
        msg.pubkey = index_1.Nip19.decode('npub1nfgqmnxqsjsnsvc2r5djhcx4ap3egcjryhf9ppxnajskfel2dx9qq6mnsp').data;
        if (pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
            msg.user_pubkey = decodedPubKey;
        }
        const events = await this._nostrCachedCommunicationManager.fetchCachedEvents('feed', msg);
        return events;
    }
    async fetchUserProfileCacheEvents(pubKeys) {
        const decodedPubKeys = pubKeys.map(pubKey => pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey);
        let msg = {
            pubkeys: decodedPubKeys
        };
        const events = await this._nostrCachedCommunicationManager.fetchCachedEvents('user_infos', msg);
        return events;
    }
    async fetchUserProfileDetailCacheEvents(pubKey) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = {
            pubkey: decodedPubKey,
            user_pubkey: decodedPubKey
        };
        const events = await this._nostrCachedCommunicationManager.fetchCachedEvents('user_profile', msg);
        return events;
    }
    async fetchContactListCacheEvents(pubKey, detailIncluded = true) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = {
            extended_response: detailIncluded,
            pubkey: decodedPubKey
        };
        const events = await this._nostrCachedCommunicationManager.fetchCachedEvents('contact_list', msg);
        return events;
    }
    async fetchFollowersCacheEvents(pubKey) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = {
            pubkey: decodedPubKey
        };
        const events = await this._nostrCachedCommunicationManager.fetchCachedEvents('user_followers', msg);
        return events;
    }
    async updateContactList(content, contactPubKeys, privateKey) {
        let event = {
            "kind": 3,
            "created_at": Math.round(Date.now() / 1000),
            "content": content,
            "tags": []
        };
        for (let contactPubKey of contactPubKeys) {
            event.tags.push([
                "p",
                contactPubKey
            ]);
        }
        const verifiedEvent = index_1.Event.finishEvent(event, privateKey);
        await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
    }
    async fetchCommunities(pubkeyToCommunityIdsMap) {
        const manager = this._nostrCommunicationManagers[0];
        let events;
        if (pubkeyToCommunityIdsMap && Object.keys(pubkeyToCommunityIdsMap).length > 0) {
            let requests = [];
            for (let pubkey in pubkeyToCommunityIdsMap) {
                const decodedPubKey = pubkey.startsWith('npub1') ? index_1.Nip19.decode(pubkey).data : pubkey;
                const communityIds = pubkeyToCommunityIdsMap[pubkey];
                let request = {
                    kinds: [34550],
                    authors: [decodedPubKey],
                    "#d": communityIds
                };
                requests.push(request);
            }
            events = await manager.fetchEvents(...requests);
        }
        else {
            let request = {
                kinds: [34550],
                limit: 50
            };
            events = await manager.fetchEvents(request);
        }
        return events;
    }
    async fetchAllUserRelatedCommunities(pubKey) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let requestForCreatedCommunities = {
            kinds: [0, 3, 34550],
            authors: [decodedPubKey]
        };
        let requestForFollowedCommunities = {
            kinds: [30001],
            "#d": ["communities"],
            authors: [decodedPubKey]
        };
        let requestForModeratedCommunities = {
            kinds: [34550],
            "#p": [decodedPubKey]
        };
        const manager = this._nostrCommunicationManagers[0];
        const events = await manager.fetchEvents(requestForCreatedCommunities, requestForFollowedCommunities, requestForModeratedCommunities);
        return events;
    }
    async fetchUserBookmarkedCommunities(pubKey) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let request = {
            kinds: [30001],
            "#d": ["communities"],
            authors: [decodedPubKey]
        };
        const manager = this._nostrCommunicationManagers[0];
        const events = await manager.fetchEvents(request);
        return events;
    }
    async fetchCommunity(creatorId, communityId) {
        const decodedCreatorId = creatorId.startsWith('npub1') ? index_1.Nip19.decode(creatorId).data : creatorId;
        let infoMsg = {
            kinds: [34550],
            authors: [decodedCreatorId],
            "#d": [communityId]
        };
        const manager = this._nostrCommunicationManagers[0];
        const events = await manager.fetchEvents(infoMsg);
        return events;
    }
    async fetchCommunityFeed(creatorId, communityId) {
        const decodedCreatorId = creatorId.startsWith('npub1') ? index_1.Nip19.decode(creatorId).data : creatorId;
        let infoMsg = {
            kinds: [34550],
            authors: [decodedCreatorId],
            "#d": [communityId]
        };
        let notesMsg = {
            kinds: [1, 7, 9735],
            "#a": [`34550:${decodedCreatorId}:${communityId}`],
            limit: 50
        };
        const manager = this._nostrCommunicationManagers[0];
        const events = await manager.fetchEvents(infoMsg, notesMsg);
        return events;
    }
    async fetchCommunitiesGeneralMembers(communities) {
        const communityUriArr = [];
        for (let community of communities) {
            const decodedCreatorId = community.creatorId.startsWith('npub1') ? index_1.Nip19.decode(community.creatorId).data : community.creatorId;
            communityUriArr.push(`34550:${decodedCreatorId}:${community.communityId}`);
        }
        let request = {
            kinds: [30001],
            "#d": ["communities"],
            "#a": communityUriArr
        };
        const manager = this._nostrCommunicationManagers[0];
        const events = await manager.fetchEvents(request);
        return events;
    }
    async fetchMetadata(options) {
        let decodedNpubs;
        if (options.decodedAuthors) {
            decodedNpubs = options.decodedAuthors;
        }
        else {
            decodedNpubs = options.authors?.map(npub => index_1.Nip19.decode(npub).data) || [];
        }
        const msg = {
            authors: decodedNpubs,
            kinds: [0]
        };
        const manager = this._nostrCommunicationManagers[0];
        const events = await manager.fetchEvents(msg);
        return events;
    }
    async postNote(content, privateKey, conversationPath) {
        let event = {
            "kind": 1,
            "created_at": Math.round(Date.now() / 1000),
            "content": content,
            "tags": []
        };
        if (conversationPath) {
            const conversationPathTags = this.calculateConversationPathTags(conversationPath);
            event.tags = conversationPathTags;
        }
        console.log('postNote', event);
        const verifiedEvent = index_1.Event.finishEvent(event, privateKey);
        await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
    }
    calculateConversationPathTags(conversationPath) {
        let tags = [];
        for (let i = 0; i < conversationPath.noteIds.length; i++) {
            const noteId = conversationPath.noteIds[i];
            const decodedNoteId = noteId.startsWith('note1') ? index_1.Nip19.decode(noteId).data : noteId;
            let tagItem;
            if (i === 0) {
                tagItem = [
                    "e",
                    decodedNoteId,
                    "",
                    "root"
                ];
            }
            else if (i === conversationPath.noteIds.length - 1) {
                tagItem = [
                    "e",
                    decodedNoteId,
                    "",
                    "reply"
                ];
            }
            else {
                tagItem = [
                    "e",
                    decodedNoteId
                ];
            }
            tags.push(tagItem);
        }
        for (let authorId of conversationPath.authorIds) {
            const decodedAuthorId = authorId.startsWith('npub1') ? index_1.Nip19.decode(authorId).data : authorId;
            tags.push([
                "p",
                decodedAuthorId
            ]);
        }
        return tags;
    }
    async deleteEvents(eventIds, privateKey) {
        let event = {
            "kind": 5,
            "created_at": Math.round(Date.now() / 1000),
            "content": "",
            "tags": []
        };
        for (let eventId of eventIds) {
            const decodedEventId = eventId.startsWith('note1') ? index_1.Nip19.decode(eventId).data : eventId;
            event.tags.push([
                "e",
                decodedEventId
            ]);
        }
        const verifiedEvent = index_1.Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        return responses;
    }
    async updateChannel(info, privateKey) {
        let kind = info.id ? 41 : 40;
        let event = {
            "kind": kind,
            "created_at": Math.round(Date.now() / 1000),
            "content": JSON.stringify({
                name: info.name,
                about: info.about,
                picture: info.picture
            }),
            "tags": []
        };
        if (info.id) {
            event.tags.push([
                "e",
                info.id
            ]);
        }
        if (info.scpData) {
            let encodedScpData = window.btoa('$scp:' + JSON.stringify(info.scpData));
            event.tags.push([
                "scp",
                "3",
                encodedScpData
            ]);
        }
        const verifiedEvent = index_1.Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        return responses;
    }
    async updateUserBookmarkedChannels(channelEventIds, privateKey) {
        let event = {
            "kind": 30001,
            "created_at": Math.round(Date.now() / 1000),
            "content": '',
            "tags": [
                [
                    "d",
                    "channels"
                ]
            ]
        };
        for (let channelEventId of channelEventIds) {
            event.tags.push([
                "a",
                channelEventId
            ]);
        }
        const verifiedEvent = index_1.Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
    }
    async fetchAllUserRelatedChannels(pubKey) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let requestForCreatedChannels = {
            kinds: [40, 41],
            authors: [decodedPubKey]
        };
        let requestForJoinedChannels = {
            kinds: [30001],
            "#d": ["channels"],
            authors: [decodedPubKey]
        };
        let requestForModeratedCommunities = {
            kinds: [34550],
            "#p": [decodedPubKey]
        };
        const manager = this._nostrCommunicationManagers[0];
        const events = await manager.fetchEvents(requestForCreatedChannels, requestForJoinedChannels, requestForModeratedCommunities);
        return events;
    }
    async fetchUserBookmarkedChannels(pubKey) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let requestForJoinedChannels = {
            kinds: [30001],
            "#d": ["channels"],
            authors: [decodedPubKey]
        };
        const manager = this._nostrCommunicationManagers[0];
        const events = await manager.fetchEvents(requestForJoinedChannels);
        return events;
    }
    async fetchChannels(channelEventIds) {
        let request = {
            kinds: [40, 41],
            ids: channelEventIds
        };
        const manager = this._nostrCommunicationManagers[0];
        let events = await manager.fetchEvents(request);
        return events;
    }
    async fetchChannelMessages(channelId, since = 0, until = 0) {
        const decodedChannelId = channelId.startsWith('npub1') ? index_1.Nip19.decode(channelId).data : channelId;
        let messagesReq = {
            kinds: [42],
            "#e": [decodedChannelId],
            limit: 20
        };
        if (until === 0) {
            messagesReq.since = since;
        }
        else {
            messagesReq.until = until;
        }
        const manager = this._nostrCommunicationManagers[0];
        const events = await manager.fetchEvents(messagesReq);
        return events;
    }
    async fetchChannelInfoMessages(creatorId, channelId) {
        const decodedCreatorId = creatorId.startsWith('npub1') ? index_1.Nip19.decode(creatorId).data : creatorId;
        let channelCreationEventReq = {
            kinds: [40],
            ids: [channelId],
            authors: [decodedCreatorId]
        };
        let channelMetadataEventReq = {
            kinds: [41],
            "#e": [channelId],
            authors: [decodedCreatorId]
        };
        let messagesReq = {
            kinds: [42],
            "#e": [channelId],
            limit: 20
        };
        const manager = this._nostrCommunicationManagers[0];
        const events = await manager.fetchEvents(channelCreationEventReq, channelMetadataEventReq, messagesReq);
        return events;
    }
    async updateCommunity(info, privateKey) {
        let event = {
            "kind": 34550,
            "created_at": Math.round(Date.now() / 1000),
            "content": '',
            "tags": [
                [
                    "d",
                    info.communityId
                ],
                [
                    "description",
                    info.description
                ]
            ]
        };
        if (info.bannerImgUrl) {
            event.tags.push([
                "image",
                info.bannerImgUrl
            ]);
        }
        if (info.rules) {
            event.tags.push([
                "rules",
                info.rules
            ]);
        }
        if (info.scpData) {
            let encodedScpData = window.btoa('$scp:' + JSON.stringify(info.scpData));
            event.tags.push([
                "scp",
                "1",
                encodedScpData
            ]);
        }
        for (let moderatorId of info.moderatorIds) {
            const decodedModeratorId = moderatorId.startsWith('npub1') ? index_1.Nip19.decode(moderatorId).data : moderatorId;
            event.tags.push([
                "p",
                decodedModeratorId,
                "",
                "moderator"
            ]);
        }
        const verifiedEvent = index_1.Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        return responses;
    }
    async updateUserBookmarkedCommunities(communities, privateKey) {
        let communityUriArr = [];
        for (let community of communities) {
            const decodedCreatorId = community.creatorId.startsWith('npub1') ? index_1.Nip19.decode(community.creatorId).data : community.creatorId;
            communityUriArr.push(`34550:${decodedCreatorId}:${community.communityId}`);
        }
        let event = {
            "kind": 30001,
            "created_at": Math.round(Date.now() / 1000),
            "content": '',
            "tags": [
                [
                    "d",
                    "communities"
                ]
            ]
        };
        for (let communityUri of communityUriArr) {
            event.tags.push([
                "a",
                communityUri
            ]);
        }
        const verifiedEvent = index_1.Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
    }
    async submitCommunityPost(info, privateKey) {
        const community = info.community;
        const decodedCreatorId = community.creatorId.startsWith('npub1') ? index_1.Nip19.decode(community.creatorId).data : community.creatorId;
        const communityUri = `34550:${decodedCreatorId}:${community.communityId}`;
        let event = {
            "kind": 1,
            "created_at": Math.round(Date.now() / 1000),
            "content": info.message,
            "tags": []
        };
        if (info.scpData) {
            let encodedScpData = window.btoa('$scp:' + JSON.stringify(info.scpData));
            event.tags.push([
                "scp",
                "2",
                encodedScpData
            ]);
        }
        if (info.conversationPath) {
            const conversationPathTags = this.calculateConversationPathTags(info.conversationPath);
            event.tags.push(...conversationPathTags);
        }
        else {
            event.tags.push([
                "a",
                communityUri,
                "",
                "root"
            ]);
        }
        console.log('submitCommunityPost', event);
        const verifiedEvent = index_1.Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
    }
    async submitChannelMessage(info, privateKey) {
        let event = {
            "kind": 42,
            "created_at": Math.round(Date.now() / 1000),
            "content": info.message,
            "tags": []
        };
        if (info.scpData) {
            let encodedScpData = window.btoa('$scp:' + JSON.stringify(info.scpData));
            event.tags.push([
                "scp",
                "4",
                encodedScpData
            ]);
        }
        if (info.conversationPath) {
            const conversationPathTags = this.calculateConversationPathTags(info.conversationPath);
            event.tags.push(...conversationPathTags);
        }
        else {
            event.tags.push([
                "e",
                info.channelId,
                "",
                "root"
            ]);
        }
        const verifiedEvent = index_1.Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
    }
    async updateUserProfile(content, privateKey) {
        let event = {
            "kind": 0,
            "created_at": Math.round(Date.now() / 1000),
            "content": JSON.stringify(content),
            "tags": []
        };
        const verifiedEvent = index_1.Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
    }
    async fetchMessageContactsCacheEvents(pubKey) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = {
            user_pubkey: decodedPubKey,
            relation: 'follows'
        };
        const followsEvents = await this._nostrCachedCommunicationManager.fetchCachedEvents('get_directmsg_contacts', msg);
        msg = {
            user_pubkey: decodedPubKey,
            relation: 'other'
        };
        const otherEvents = await this._nostrCachedCommunicationManager.fetchCachedEvents('get_directmsg_contacts', msg);
        return [...followsEvents, ...otherEvents];
    }
    async fetchDirectMessages(pubKey, sender, since = 0, until = 0) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        const decodedSenderPubKey = sender.startsWith('npub1') ? index_1.Nip19.decode(sender).data : sender;
        const req = {
            receiver: decodedPubKey,
            sender: decodedSenderPubKey,
            limit: 20
        };
        if (until === 0) {
            req.since = since;
        }
        else {
            req.until = until;
        }
        const events = await this._nostrCachedCommunicationManager.fetchCachedEvents('get_directmsgs', req);
        return events;
    }
    async sendMessage(receiver, encryptedMessage, privateKey) {
        const decodedPubKey = receiver.startsWith('npub1') ? index_1.Nip19.decode(receiver).data : receiver;
        let event = {
            "kind": 4,
            "created_at": Math.round(Date.now() / 1000),
            "content": encryptedMessage,
            "tags": [
                [
                    'p',
                    decodedPubKey
                ]
            ]
        };
        const verifiedEvent = index_1.Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
    }
    async resetMessageCount(pubKey, sender, privateKey) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        const decodedSenderPubKey = sender.startsWith('npub1') ? index_1.Nip19.decode(sender).data : sender;
        const createAt = Math.ceil(Date.now() / 1000);
        let event = {
            "content": JSON.stringify({ "description": `reset messages from '${decodedSenderPubKey}'` }),
            "kind": 30078,
            "tags": [
                [
                    "d",
                    "Scom Social"
                ]
            ],
            "created_at": createAt,
            "pubkey": decodedPubKey
        };
        event.id = index_1.Event.getEventHash(event);
        event.sig = index_1.Event.getSignature(event, privateKey);
        const msg = {
            event_from_user: event,
            sender: decodedSenderPubKey
        };
        await this._nostrCachedCommunicationManager.fetchCachedEvents('reset_directmsg_count', msg);
    }
    async fetchGroupKeys(identifier) {
        let req = {
            kinds: [30078],
            "#d": [identifier]
        };
        const manager = this._nostrCommunicationManagers[0];
        const events = await manager.fetchEvents(req);
        return events?.length > 0 ? events[0] : null;
    }
    async fetchUserGroupInvitations(groupKinds, pubKey) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let req = {
            kinds: [30078],
            "#p": [decodedPubKey],
            "#k": groupKinds.map(kind => kind.toString())
        };
        const manager = this._nostrCommunicationManagers[0];
        let events = await manager.fetchEvents(req);
        events = events.filter(event => event.tags.filter(tag => tag[0] === 'p' && tag?.[3] === 'invitee').map(tag => tag[1]).includes(decodedPubKey));
        return events;
    }
    async updateGroupKeys(identifier, groupKind, keys, invitees, privateKey) {
        let event = {
            "kind": 30078,
            "created_at": Math.round(Date.now() / 1000),
            "content": keys,
            "tags": [
                [
                    "d",
                    identifier
                ],
                [
                    "k",
                    groupKind.toString()
                ]
            ]
        };
        for (let invitee of invitees) {
            const decodedInvitee = invitee.startsWith('npub1') ? index_1.Nip19.decode(invitee).data : invitee;
            event.tags.push([
                "p",
                decodedInvitee,
                "",
                "invitee"
            ]);
        }
        const verifiedEvent = index_1.Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        return responses;
    }
    async updateCalendarEvent(info, privateKey) {
        let kind;
        let start;
        let end;
        if (info.type === interfaces_1.CalendarEventType.DateBased) {
            kind = 31922;
            start = convertUnixTimestampToDate(info.start);
        }
        else {
            kind = 31923;
            start = info.start.toString();
        }
        let event = {
            "kind": kind,
            "created_at": Math.round(Date.now() / 1000),
            "content": info.description,
            "tags": [
                [
                    "d",
                    info.id
                ],
                [
                    "title",
                    info.title
                ],
                [
                    "start",
                    start
                ],
                [
                    "location",
                    info.location
                ],
                [
                    "g",
                    info.geohash
                ]
            ]
        };
        if (info.image) {
            event.tags.push([
                "image",
                info.image
            ]);
        }
        if (info.end) {
            if (info.type === interfaces_1.CalendarEventType.DateBased) {
                end = convertUnixTimestampToDate(info.end);
            }
            else {
                end = info.end.toString();
            }
            event.tags.push([
                "end",
                end
            ]);
        }
        if (info.startTzid) {
            event.tags.push([
                "start_tzid",
                info.startTzid
            ]);
        }
        if (info.endTzid) {
            event.tags.push([
                "end_tzid",
                info.endTzid
            ]);
        }
        if (info.hostIds) {
            for (let hostId of info.hostIds) {
                const decodedHostId = hostId.startsWith('npub1') ? index_1.Nip19.decode(hostId).data : hostId;
                event.tags.push([
                    "p",
                    decodedHostId,
                    "",
                    "host"
                ]);
            }
        }
        if (info.city) {
            event.tags.push([
                "city",
                info.city
            ]);
        }
        const verifiedEvent = index_1.Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        const failedResponses = responses.filter(response => !response.success);
        if (failedResponses.length === 0) {
            let response = responses[0];
            let pubkey = SocialUtilsManager.convertPrivateKeyToPubkey(privateKey);
            let eventKey = `${kind}:${pubkey}:${info.id}`;
            let apiRequestBody = {
                eventId: response.eventId,
                eventKey,
                start,
                end,
                location: info.location
            };
            const apiUrl = `${this._apiBaseUrl}/calendar-events`;
            await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(apiRequestBody)
            });
        }
        return responses;
    }
    async fetchCalendarEvents(start, end, limit) {
        let req;
        if (this._apiBaseUrl) {
            let queriesObj = {
                start: start.toString()
            };
            if (end) {
                queriesObj.end = end.toString();
            }
            let queries = new URLSearchParams(queriesObj).toString();
            const apiUrl = `${this._apiBaseUrl}/calendar-events?${queries}`;
            const apiResponse = await fetch(apiUrl);
            const apiResult = await apiResponse.json();
            let calendarEventIds = [];
            if (apiResult.success) {
                const calendarEvents = apiResult.data.calendarEvents;
                calendarEventIds = calendarEvents.map(calendarEvent => calendarEvent.eventId);
            }
            req = {
                kinds: [31922, 31923],
                ids: calendarEventIds
            };
        }
        else {
            req = {
                kinds: [31922, 31923],
                limit: limit || 10
            };
        }
        const manager = this._nostrCommunicationManagers[0];
        const events = await manager.fetchEvents(req);
        return events;
    }
    async fetchCalendarEvent(address) {
        let req = {
            kinds: [address.kind],
            "#d": [address.identifier],
            authors: [address.pubkey]
        };
        const manager = this._nostrCommunicationManagers[0];
        const events = await manager.fetchEvents(req);
        return events?.length > 0 ? events[0] : null;
    }
    async fetchCalendarEventPosts(calendarEventUri) {
        let request = {
            kinds: [1],
            "#a": [calendarEventUri],
            limit: 50
        };
        const manager = this._nostrCommunicationManagers[0];
        const events = await manager.fetchEvents(request);
        return events;
    }
    async createCalendarEventRSVP(rsvpId, calendarEventUri, accepted, privateKey) {
        let event = {
            "kind": 31925,
            "created_at": Math.round(Date.now() / 1000),
            "content": "",
            "tags": [
                [
                    "d",
                    rsvpId
                ],
                [
                    "a",
                    calendarEventUri
                ],
                [
                    "L",
                    "status"
                ],
                [
                    "l",
                    accepted ? "accepted" : "declined",
                    "status"
                ]
            ]
        };
        const verifiedEvent = index_1.Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        return responses;
    }
    async fetchCalendarEventRSVPs(calendarEventUri, pubkey) {
        let req = {
            kinds: [31925],
            "#a": [calendarEventUri]
        };
        if (pubkey) {
            const decodedPubKey = pubkey.startsWith('npub1') ? index_1.Nip19.decode(pubkey).data : pubkey;
            req.authors = [decodedPubKey];
        }
        const manager = this._nostrCommunicationManagers[0];
        const events = await manager.fetchEvents(req);
        return events;
    }
    async submitCalendarEventPost(info, privateKey) {
        let event = {
            "kind": 1,
            "created_at": Math.round(Date.now() / 1000),
            "content": info.message,
            "tags": []
        };
        if (info.conversationPath) {
            const conversationPathTags = this.calculateConversationPathTags(info.conversationPath);
            event.tags.push(...conversationPathTags);
        }
        else {
            event.tags.push([
                "a",
                info.calendarEventUri,
                "",
                "root"
            ]);
        }
        const verifiedEvent = index_1.Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        return responses;
    }
    async fetchLongFormContentEvents(pubKey, since = 0, until = 0) {
        let req = {
            kinds: [30023],
            limit: 20
        };
        if (pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
            req.authors = [decodedPubKey];
        }
        if (until === 0) {
            req.since = since;
        }
        else {
            req.until = until;
        }
        const manager = this._nostrCommunicationManagers[0];
        const events = await manager.fetchEvents(req);
        return events;
    }
    async submitLike(tags, privateKey) {
        let event = {
            "kind": 7,
            "created_at": Math.round(Date.now() / 1000),
            "content": "+",
            "tags": tags
        };
        const verifiedEvent = index_1.Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
    }
    async fetchLikes(eventId) {
        let req = {
            kinds: [7],
            "#e": [eventId]
        };
        const manager = this._nostrCommunicationManagers[0];
        const events = await manager.fetchEvents(req);
        return events;
    }
    async submitRepost(content, tags, privateKey) {
        let event = {
            "kind": 6,
            "created_at": Math.round(Date.now() / 1000),
            "content": content,
            "tags": tags
        };
        const verifiedEvent = index_1.Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
    }
}
exports.NostrEventManager = NostrEventManager;
class SocialUtilsManager {
    static hexStringToUint8Array(hexString) {
        return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    }
    static base64ToUtf8(base64) {
        if (typeof window !== "undefined") {
            return atob(base64);
        }
        else {
            return Buffer.from(base64, 'base64').toString('utf8');
        }
    }
    static convertPrivateKeyToPubkey(privateKey) {
        if (privateKey.startsWith('0x'))
            privateKey = privateKey.replace('0x', '');
        let pub = eth_wallet_1.Utils.padLeft(index_1.Keys.getPublicKey(privateKey), 64);
        return pub;
    }
    static async encryptMessage(ourPrivateKey, theirPublicKey, text) {
        const sharedSecret = index_1.Keys.getSharedSecret(ourPrivateKey, '02' + theirPublicKey);
        const sharedX = SocialUtilsManager.hexStringToUint8Array(sharedSecret.slice(2));
        let encryptedMessage;
        let ivBase64;
        if (typeof window !== "undefined") {
            const iv = crypto.getRandomValues(new Uint8Array(16));
            const key = await crypto.subtle.importKey('raw', sharedX, { name: 'AES-CBC' }, false, ['encrypt']);
            const encryptedBuffer = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, new TextEncoder().encode(text));
            encryptedMessage = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
            ivBase64 = btoa(String.fromCharCode(...iv));
        }
        else {
            const crypto = require('crypto');
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-cbc', sharedX, iv);
            encryptedMessage = cipher.update(text, 'utf8', 'base64');
            encryptedMessage += cipher.final('base64');
            ivBase64 = iv.toString('base64');
        }
        return `${encryptedMessage}?iv=${ivBase64}`;
    }
    static async decryptMessage(ourPrivateKey, theirPublicKey, encryptedData) {
        let decryptedMessage = null;
        try {
            const [encryptedMessage, ivBase64] = encryptedData.split('?iv=');
            const sharedSecret = index_1.Keys.getSharedSecret(ourPrivateKey, '02' + theirPublicKey);
            const sharedX = SocialUtilsManager.hexStringToUint8Array(sharedSecret.slice(2));
            if (typeof window !== "undefined") {
                const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
                const key = await crypto.subtle.importKey('raw', sharedX, { name: 'AES-CBC' }, false, ['decrypt']);
                const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0)));
                decryptedMessage = new TextDecoder().decode(decryptedBuffer);
            }
            else {
                const crypto = require('crypto');
                const iv = Buffer.from(ivBase64, 'base64');
                const decipher = crypto.createDecipheriv('aes-256-cbc', sharedX, iv);
                let decrypted = decipher.update(Buffer.from(encryptedMessage, 'base64'));
                decrypted = Buffer.concat([decrypted, decipher.final()]);
                decryptedMessage = decrypted.toString('utf8');
            }
        }
        catch (e) {
        }
        return decryptedMessage;
    }
    static pad(number) {
        return number < 10 ? '0' + number : number.toString();
    }
    static getGMTOffset(timezone) {
        let gmtOffset;
        try {
            const date = new Date();
            const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
            const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
            const offset = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
            const sign = offset < 0 ? '-' : '+';
            const absoluteOffset = Math.abs(offset);
            const hours = Math.floor(absoluteOffset);
            const minutes = (absoluteOffset - hours) * 60;
            gmtOffset = `GMT${sign}${this.pad(hours)}:${this.pad(minutes)}`;
        }
        catch (err) {
            console.error(err);
        }
        return gmtOffset;
    }
    static async exponentialBackoffRetry(fn, retries, delay, maxDelay, factor) {
        let currentDelay = delay;
        for (let i = 0; i < retries; i++) {
            try {
                return await fn();
            }
            catch (error) {
                console.error(`Attempt ${i + 1} failed. Retrying in ${currentDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, currentDelay));
                currentDelay = Math.min(maxDelay, currentDelay * factor);
            }
        }
        throw new Error(`Failed after ${retries} retries`);
    }
}
exports.SocialUtilsManager = SocialUtilsManager;
class SocialDataManager {
    constructor(config) {
        this._apiBaseUrl = config.apiBaseUrl;
        this._ipLocationServiceBaseUrl = config.ipLocationServiceBaseUrl;
        this._defaultRestAPIRelay = config.relays.find(relay => !relay.startsWith('wss://'));
        this._socialEventManager = new NostrEventManager(config.relays, config.cachedServer, config.apiBaseUrl);
        if (config.mqttBrokerUrl) {
            this.mqttManager = new mqtt_1.MqttManager({
                brokerUrl: config.mqttBrokerUrl,
                subscriptions: config.mqttSubscriptions,
                messageCallback: config.mqttMessageCallback
            });
        }
    }
    set privateKey(privateKey) {
        this._privateKey = privateKey;
    }
    get socialEventManager() {
        return this._socialEventManager;
    }
    subscribeToMqttTopics(topics) {
        this.mqttManager.subscribe(topics);
    }
    unsubscribeFromMqttTopics(topics) {
        this.mqttManager.unsubscribe(topics);
    }
    publishToMqttTopic(topic, message) {
        this.mqttManager.publish(topic, message);
    }
    extractCommunityInfo(event) {
        const communityId = event.tags.find(tag => tag[0] === 'd')?.[1];
        const description = event.tags.find(tag => tag[0] === 'description')?.[1];
        const rules = event.tags.find(tag => tag[0] === 'rules')?.[1];
        const image = event.tags.find(tag => tag[0] === 'image')?.[1];
        const creatorId = index_1.Nip19.npubEncode(event.pubkey);
        const moderatorIds = event.tags.filter(tag => tag[0] === 'p' && tag?.[3] === 'moderator').map(tag => index_1.Nip19.npubEncode(tag[1]));
        const scpTag = event.tags.find(tag => tag[0] === 'scp');
        let scpData;
        let gatekeeperNpub;
        let membershipType = interfaces_1.MembershipType.Open;
        if (scpTag && scpTag[1] === '1') {
            const scpDataStr = SocialUtilsManager.base64ToUtf8(scpTag[2]);
            if (!scpDataStr.startsWith('$scp:'))
                return null;
            scpData = JSON.parse(scpDataStr.substring(5));
            if (scpData.gatekeeperPublicKey) {
                gatekeeperNpub = index_1.Nip19.npubEncode(scpData.gatekeeperPublicKey);
                membershipType = interfaces_1.MembershipType.NFTExclusive;
            }
            else {
                membershipType = interfaces_1.MembershipType.InviteOnly;
            }
        }
        const communityUri = `34550:${event.pubkey}:${communityId}`;
        let communityInfo = {
            creatorId,
            moderatorIds,
            communityUri,
            communityId,
            description,
            rules,
            bannerImgUrl: image,
            scpData,
            eventData: event,
            gatekeeperNpub,
            membershipType
        };
        return communityInfo;
    }
    async retrieveCommunityEvents(creatorId, communityId) {
        const feedEvents = await this._socialEventManager.fetchCommunityFeed(creatorId, communityId);
        const notes = feedEvents.filter(event => event.kind === 1);
        const communityEvent = feedEvents.find(event => event.kind === 34550);
        if (!communityEvent)
            throw new Error('No info event found');
        const communityInfo = this.extractCommunityInfo(communityEvent);
        if (!communityInfo)
            throw new Error('No info event found');
        if (communityInfo.membershipType === interfaces_1.MembershipType.InviteOnly) {
            const keyEvent = await this._socialEventManager.fetchGroupKeys(communityInfo.communityUri + ':keys');
            if (keyEvent) {
                communityInfo.memberKeyMap = JSON.parse(keyEvent.content);
            }
        }
        return {
            notes,
            info: communityInfo
        };
    }
    retrieveCommunityUri(noteEvent, scpData) {
        let communityUri = null;
        if (scpData?.communityUri) {
            communityUri = scpData.communityUri;
        }
        else {
            const replaceableTag = noteEvent.tags.find(tag => tag[0] === 'a');
            if (replaceableTag) {
                const replaceableTagArr = replaceableTag[1].split(':');
                if (replaceableTagArr[0] === '34550') {
                    communityUri = replaceableTag[1];
                }
            }
        }
        return communityUri;
    }
    extractScpData(event, standardId) {
        const scpTag = event.tags.find(tag => tag[0] === 'scp');
        let scpData;
        if (scpTag && scpTag[1] === standardId) {
            const scpDataStr = SocialUtilsManager.base64ToUtf8(scpTag[2]);
            if (!scpDataStr.startsWith('$scp:'))
                return null;
            scpData = JSON.parse(scpDataStr.substring(5));
        }
        return scpData;
    }
    async retrievePostPrivateKey(event, communityUri, communityPrivateKey) {
        let key = null;
        let postScpData = this.extractScpData(event, interfaces_1.ScpStandardId.CommunityPost);
        try {
            const postPrivateKey = await SocialUtilsManager.decryptMessage(communityPrivateKey, event.pubkey, postScpData.encryptedKey);
            const messageContentStr = await SocialUtilsManager.decryptMessage(postPrivateKey, event.pubkey, event.content);
            const messageContent = JSON.parse(messageContentStr);
            if (communityUri === messageContent.communityUri) {
                key = postPrivateKey;
            }
        }
        catch (e) {
        }
        return key;
    }
    async retrieveChannelMessagePrivateKey(event, channelId, communityPrivateKey) {
        let key = null;
        let messageScpData = this.extractScpData(event, interfaces_1.ScpStandardId.ChannelMessage);
        try {
            const messagePrivateKey = await SocialUtilsManager.decryptMessage(communityPrivateKey, event.pubkey, messageScpData.encryptedKey);
            const messageContentStr = await SocialUtilsManager.decryptMessage(messagePrivateKey, event.pubkey, event.content);
            const messageContent = JSON.parse(messageContentStr);
            if (channelId === messageContent.channelId) {
                key = messagePrivateKey;
            }
        }
        catch (e) {
        }
        return key;
    }
    async retrieveCommunityPrivateKey(communityInfo, selfPrivateKey) {
        let communityPrivateKey;
        if (communityInfo.membershipType === interfaces_1.MembershipType.InviteOnly) {
            const creatorPubkey = communityInfo.eventData.pubkey;
            const pubkey = SocialUtilsManager.convertPrivateKeyToPubkey(selfPrivateKey);
            const encryptedKey = communityInfo.memberKeyMap?.[pubkey];
            if (encryptedKey) {
                communityPrivateKey = await SocialUtilsManager.decryptMessage(selfPrivateKey, creatorPubkey, encryptedKey);
            }
        }
        else if (communityInfo.membershipType === interfaces_1.MembershipType.NFTExclusive) {
            communityPrivateKey = await SocialUtilsManager.decryptMessage(selfPrivateKey, communityInfo.scpData.gatekeeperPublicKey, communityInfo.scpData.encryptedKey);
        }
        return communityPrivateKey;
    }
    async retrieveCommunityPostKeys(options) {
        let noteIdToPrivateKey = {};
        if (options.gatekeeperUrl) {
            let bodyData = {
                creatorId: options.creatorId,
                communityId: options.communityId,
                message: options.message,
                signature: options.signature
            };
            let url = `${options.gatekeeperUrl}/api/communities/v0/post-keys`;
            let response = await fetch(url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bodyData)
            });
            let result = await response.json();
            if (result.success) {
                noteIdToPrivateKey = result.data;
            }
        }
        else {
            const communityEvents = await this.retrieveCommunityEvents(options.creatorId, options.communityId);
            const communityInfo = communityEvents.info;
            const notes = communityEvents.notes;
            let communityPrivateKey = await this.retrieveCommunityPrivateKey(communityInfo, this._privateKey);
            if (!communityPrivateKey)
                return noteIdToPrivateKey;
            for (const note of notes) {
                const postPrivateKey = await this.retrievePostPrivateKey(note, communityInfo.communityUri, communityPrivateKey);
                if (postPrivateKey) {
                    noteIdToPrivateKey[note.id] = postPrivateKey;
                }
            }
        }
        return noteIdToPrivateKey;
    }
    async retrieveCommunityThreadPostKeys(options) {
        const communityInfo = options.communityInfo;
        let noteIdToPrivateKey = {};
        if (options.gatekeeperUrl) {
            let bodyData = {
                creatorId: communityInfo.creatorId,
                communityId: communityInfo.communityId,
                focusedNoteId: options.focusedNoteId,
                message: options.message,
                signature: options.signature
            };
            let url = `${options.gatekeeperUrl}/api/communities/v0/post-keys`;
            let response = await fetch(url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bodyData)
            });
            let result = await response.json();
            if (result.success) {
                noteIdToPrivateKey = result.data;
            }
        }
        else {
            let communityPrivateKey = await this.retrieveCommunityPrivateKey(communityInfo, this._privateKey);
            if (!communityPrivateKey)
                return noteIdToPrivateKey;
            for (const note of options.noteEvents) {
                const postPrivateKey = await this.retrievePostPrivateKey(note, communityInfo.communityUri, communityPrivateKey);
                if (postPrivateKey) {
                    noteIdToPrivateKey[note.id] = postPrivateKey;
                }
            }
        }
        return noteIdToPrivateKey;
    }
    async retrieveCommunityPostKeysByNoteEvents(options) {
        let noteIdToPrivateKey = {};
        let communityPrivateKeyMap = {};
        const noteCommunityMappings = await this.createNoteCommunityMappings(options.notes);
        if (noteCommunityMappings.noteCommunityInfoList.length === 0)
            return noteIdToPrivateKey;
        const communityInfoMap = {};
        for (let communityInfo of noteCommunityMappings.communityInfoList) {
            if (options.pubKey === communityInfo.creatorId) {
                let communityPrivateKey = await SocialUtilsManager.decryptMessage(this._privateKey, communityInfo.scpData.gatekeeperPublicKey, communityInfo.scpData.encryptedKey);
                if (communityPrivateKey) {
                    communityPrivateKeyMap[communityInfo.communityUri] = communityPrivateKey;
                }
            }
            communityInfoMap[communityInfo.communityUri] = communityInfo;
        }
        let gatekeeperNpubToNotesMap = {};
        for (let noteCommunityInfo of noteCommunityMappings.noteCommunityInfoList) {
            const communityPrivateKey = communityPrivateKeyMap[noteCommunityInfo.communityUri];
            if (communityPrivateKey) {
                const postPrivateKey = await this.retrievePostPrivateKey(noteCommunityInfo.eventData, noteCommunityInfo.communityUri, communityPrivateKey);
                if (postPrivateKey) {
                    noteIdToPrivateKey[noteCommunityInfo.eventData.id] = postPrivateKey;
                }
            }
            else {
                const communityInfo = communityInfoMap[noteCommunityInfo.communityUri];
                gatekeeperNpubToNotesMap[communityInfo.gatekeeperNpub] = gatekeeperNpubToNotesMap[communityInfo.gatekeeperNpub] || [];
                gatekeeperNpubToNotesMap[communityInfo.gatekeeperNpub].push(noteCommunityInfo);
            }
        }
        if (Object.keys(gatekeeperNpubToNotesMap).length > 0) {
            for (let gatekeeperNpub in gatekeeperNpubToNotesMap) {
                const gatekeeperUrl = options.gatekeepers.find(v => v.npub === gatekeeperNpub)?.url;
                if (gatekeeperUrl) {
                    const noteIds = gatekeeperNpubToNotesMap[gatekeeperNpub].map(v => v.eventData.id);
                    const signature = await options.getSignature(options.pubKey);
                    let bodyData = {
                        noteIds: noteIds.join(','),
                        message: options.pubKey,
                        signature: signature
                    };
                    let url = `${gatekeeperUrl}/api/communities/v0/post-keys`;
                    let response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(bodyData)
                    });
                    let result = await response.json();
                    if (result.success) {
                        noteIdToPrivateKey = {
                            ...noteIdToPrivateKey,
                            ...result.data
                        };
                    }
                }
            }
        }
        return noteIdToPrivateKey;
    }
    async constructMetadataByPubKeyMap(notes) {
        let mentionAuthorSet = new Set();
        for (let i = 0; i < notes.length; i++) {
            const mentionTags = notes[i].tags.filter(tag => tag[0] === 'p' && tag[1] !== notes[i].pubkey)?.map(tag => tag[1]) || [];
            if (mentionTags.length) {
                mentionTags.forEach(tag => mentionAuthorSet.add(tag));
            }
        }
        const uniqueKeys = Array.from(mentionAuthorSet);
        const npubs = notes.map(note => note.pubkey).filter((value, index, self) => self.indexOf(value) === index);
        const metadata = await this._socialEventManager.fetchMetadata({
            decodedAuthors: [...npubs, ...uniqueKeys]
        });
        const metadataByPubKeyMap = metadata.reduce((acc, cur) => {
            const content = JSON.parse(cur.content);
            acc[cur.pubkey] = {
                ...cur,
                content
            };
            return acc;
        }, {});
        return metadataByPubKeyMap;
    }
    async fetchUserProfiles(pubKeys) {
        const fetchFromCache = true;
        let metadataArr = [];
        const fetchData = async () => {
            if (fetchFromCache) {
                const events = await this._socialEventManager.fetchUserProfileCacheEvents(pubKeys);
                for (let event of events) {
                    if (event.kind === 0) {
                        metadataArr.push({
                            ...event,
                            content: this.parseContent(event.content)
                        });
                    }
                }
            }
            else {
                const metadataEvents = await this._socialEventManager.fetchMetadata({
                    authors: pubKeys
                });
                if (metadataEvents.length === 0)
                    return null;
                metadataArr.push({
                    ...metadataEvents[0],
                    content: JSON.parse(metadataEvents[0].content)
                });
            }
        };
        try {
            await SocialUtilsManager.exponentialBackoffRetry(fetchData, 5, 1000, 16000, 2);
        }
        catch (error) { }
        if (metadataArr.length == 0)
            return null;
        const userProfiles = [];
        for (let metadata of metadataArr) {
            const encodedPubkey = index_1.Nip19.npubEncode(metadata.pubkey);
            const metadataContent = metadata.content;
            const internetIdentifier = metadataContent?.nip05?.replace('_@', '') || '';
            let userProfile = {
                id: encodedPubkey,
                username: metadataContent.username || metadataContent.name,
                description: metadataContent.about,
                avatar: metadataContent.picture,
                pubkey: metadata.pubkey,
                npub: encodedPubkey,
                displayName: metadataContent.display_name || metadataContent.displayName || metadataContent.name,
                internetIdentifier,
                website: metadataContent.website,
                banner: metadataContent.banner
            };
            userProfiles.push(userProfile);
        }
        return userProfiles;
    }
    async updateUserProfile(content) {
        await this._socialEventManager.updateUserProfile(content, this._privateKey);
    }
    async fetchTrendingNotesInfo() {
        let notes = [];
        let metadataByPubKeyMap = {};
        const events = await this._socialEventManager.fetchTrendingCacheEvents();
        for (let event of events) {
            if (event.kind === 0) {
                metadataByPubKeyMap[event.pubkey] = {
                    ...event,
                    content: this.parseContent(event.content)
                };
            }
            else if (event.kind === 1) {
                notes.push({
                    eventData: event
                });
            }
        }
        return {
            notes,
            metadataByPubKeyMap
        };
    }
    async fetchProfileFeedInfo(pubKey, since = 0, until) {
        const events = await this._socialEventManager.fetchProfileFeedCacheEvents(pubKey, since, until);
        const earliest = this.getEarliestEventTimestamp(events.filter(v => v.created_at));
        const { notes, metadataByPubKeyMap, quotedNotesMap } = this.createNoteEventMappings(events);
        return {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            earliest
        };
    }
    async fetchProfileRepliesInfo(pubKey, since = 0, until) {
        const events = await this._socialEventManager.fetchProfileRepliesCacheEvents(pubKey, since, until);
        const earliest = this.getEarliestEventTimestamp(events.filter(v => v.created_at));
        const { notes, metadataByPubKeyMap, quotedNotesMap, noteToParentAuthorIdMap } = this.createNoteEventMappings(events, true);
        for (let note of notes) {
            const noteId = note.eventData.id;
            const parentAuthorId = noteToParentAuthorIdMap[noteId];
            if (!parentAuthorId)
                continue;
            const metadata = metadataByPubKeyMap[parentAuthorId];
            if (!metadata)
                continue;
            const metadataContent = metadata.content;
            const encodedPubkey = index_1.Nip19.npubEncode(metadata.pubkey);
            const internetIdentifier = metadataContent.nip05?.replace('_@', '') || '';
            note.parentAuthor = {
                id: encodedPubkey,
                username: '',
                description: metadataContent.about,
                avatar: metadataContent.picture,
                pubKey: encodedPubkey,
                displayName: metadataContent.display_name || metadataContent.name,
                internetIdentifier: internetIdentifier
            };
        }
        return {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            earliest
        };
    }
    getEarliestEventTimestamp(events) {
        if (!events || events.length === 0) {
            return 0;
        }
        return events.reduce((createdAt, event) => {
            return Math.min(createdAt, event.created_at);
        }, events[0].created_at);
    }
    async fetchHomeFeedInfo(pubKey, since = 0, until) {
        let events = await this._socialEventManager.fetchHomeFeedCacheEvents(pubKey, since, until);
        const earliest = this.getEarliestEventTimestamp(events.filter(v => v.created_at));
        const { notes, metadataByPubKeyMap, quotedNotesMap } = this.createNoteEventMappings(events);
        return {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            earliest
        };
    }
    parseContent(content) {
        try {
            return JSON.parse(content);
        }
        catch (err) {
            console.log('Error parsing content', content);
        }
        ;
    }
    ;
    createNoteEventMappings(events, parentAuthorsInfo = false) {
        let notes = [];
        let metadataByPubKeyMap = {};
        let quotedNotesMap = {};
        let noteToParentAuthorIdMap = {};
        let noteStatsMap = {};
        for (let event of events) {
            if (event.kind === 0) {
                metadataByPubKeyMap[event.pubkey] = {
                    ...event,
                    content: this.parseContent(event.content)
                };
            }
            else if (event.kind === 10000107) {
                const noteEvent = this.parseContent(event.content);
                quotedNotesMap[noteEvent.id] = {
                    eventData: noteEvent
                };
            }
            else if (event.kind === 1) {
                notes.push({
                    eventData: event
                });
                if (parentAuthorsInfo) {
                    const parentAuthors = event.tags.filter(tag => tag[0] === 'p')?.map(tag => tag[1]) || [];
                    if (parentAuthors.length > 0) {
                        noteToParentAuthorIdMap[event.id] = parentAuthors[parentAuthors.length - 1];
                    }
                }
            }
            else if (event.kind === 6) {
                const originalNoteContent = this.parseContent(event.content);
                notes.push({
                    eventData: originalNoteContent
                });
                if (parentAuthorsInfo) {
                    const parentAuthors = event.tags.filter(tag => tag[0] === 'p')?.map(tag => tag[1]) || [];
                    if (parentAuthors.length > 0) {
                        noteToParentAuthorIdMap[event.id] = parentAuthors[parentAuthors.length - 1];
                    }
                }
            }
            else if (event.kind === 10000100) {
                const content = this.parseContent(event.content);
                noteStatsMap[content.event_id] = {
                    upvotes: content.likes,
                    replies: content.replies,
                    reposts: content.reposts
                };
            }
            else if (event.kind === 10000113) {
                const timeInfo = this.parseContent(event.content);
            }
        }
        for (let note of notes) {
            const noteId = note.eventData?.id;
            note.stats = noteStatsMap[noteId];
        }
        return {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            noteToParentAuthorIdMap,
            noteStatsMap
        };
    }
    async fetchCommunityInfo(creatorId, communityId) {
        const communityEvents = await this._socialEventManager.fetchCommunity(creatorId, communityId);
        const communityEvent = communityEvents.find(event => event.kind === 34550);
        if (!communityEvent)
            return null;
        let communityInfo = this.extractCommunityInfo(communityEvent);
        if (communityInfo.membershipType === interfaces_1.MembershipType.InviteOnly) {
            const keyEvent = await this._socialEventManager.fetchGroupKeys(communityInfo.communityUri + ':keys');
            if (keyEvent) {
                communityInfo.memberKeyMap = JSON.parse(keyEvent.content);
            }
        }
        return communityInfo;
    }
    async fetchThreadNotesInfo(focusedNoteId) {
        let focusedNote;
        let ancestorNotes = [];
        let replies = [];
        let childReplyEventTagIds = [];
        let decodedFocusedNoteId = focusedNoteId.startsWith('note1') ? index_1.Nip19.decode(focusedNoteId).data : focusedNoteId;
        const threadEvents = await this._socialEventManager.fetchThreadCacheEvents(decodedFocusedNoteId);
        const { notes, metadataByPubKeyMap, quotedNotesMap } = this.createNoteEventMappings(threadEvents);
        for (let note of notes) {
            if (note.eventData.id === decodedFocusedNoteId) {
                focusedNote = note;
            }
            else if (note.eventData.tags.some(tag => tag[0] === 'e' && tag[1] === decodedFocusedNoteId)) {
                replies.push(note);
            }
            else {
                ancestorNotes.push(note);
            }
        }
        let communityInfo = null;
        let scpData = this.extractScpData(focusedNote.eventData, interfaces_1.ScpStandardId.CommunityPost);
        if (scpData) {
            const communityUri = this.retrieveCommunityUri(focusedNote.eventData, scpData);
            if (communityUri) {
                const creatorId = communityUri.split(':')[1];
                const communityId = communityUri.split(':')[2];
                communityInfo = await this.fetchCommunityInfo(creatorId, communityId);
            }
        }
        return {
            focusedNote,
            ancestorNotes,
            replies,
            quotedNotesMap,
            metadataByPubKeyMap,
            childReplyEventTagIds,
            communityInfo
        };
    }
    async createNoteCommunityMappings(notes) {
        let noteCommunityInfoList = [];
        let pubkeyToCommunityIdsMap = {};
        let communityInfoList = [];
        for (let note of notes) {
            let scpData = this.extractScpData(note, interfaces_1.ScpStandardId.CommunityPost);
            if (scpData) {
                const communityUri = this.retrieveCommunityUri(note, scpData);
                if (communityUri) {
                    const creatorId = communityUri.split(':')[1];
                    const communityId = communityUri.split(':')[2];
                    pubkeyToCommunityIdsMap[creatorId] = pubkeyToCommunityIdsMap[creatorId] || [];
                    if (!pubkeyToCommunityIdsMap[creatorId].includes(communityId)) {
                        pubkeyToCommunityIdsMap[creatorId].push(communityId);
                    }
                    noteCommunityInfoList.push({
                        eventData: note,
                        communityUri,
                        communityId,
                        creatorId
                    });
                }
            }
        }
        if (noteCommunityInfoList.length > 0) {
            const communityEvents = await this._socialEventManager.fetchCommunities(pubkeyToCommunityIdsMap);
            for (let event of communityEvents) {
                let communityInfo = this.extractCommunityInfo(event);
                communityInfoList.push(communityInfo);
            }
        }
        return {
            noteCommunityInfoList,
            communityInfoList
        };
    }
    async retrieveUserProfileDetail(pubKey) {
        let metadata;
        let stats;
        const userContactEvents = await this._socialEventManager.fetchUserProfileDetailCacheEvents(pubKey);
        for (let event of userContactEvents) {
            if (event.kind === 0) {
                metadata = {
                    ...event,
                    content: this.parseContent(event.content)
                };
            }
            else if (event.kind === 10000105) {
                let content = this.parseContent(event.content);
                stats = {
                    notes: content.note_count,
                    replies: content.reply_count,
                    followers: content.followers_count,
                    following: content.follows_count,
                    relays: content.relay_count,
                    timeJoined: content.time_joined
                };
            }
        }
        if (!metadata)
            return null;
        let userProfile = this.constructUserProfile(metadata);
        return {
            userProfile,
            stats
        };
    }
    constructUserProfile(metadata, followersCountMap) {
        const followersCount = followersCountMap?.[metadata.pubkey] || 0;
        const encodedPubkey = index_1.Nip19.npubEncode(metadata.pubkey);
        const metadataContent = metadata.content;
        const internetIdentifier = metadataContent.nip05?.replace('_@', '') || '';
        let userProfile = {
            id: encodedPubkey,
            username: metadataContent.username || metadataContent.name,
            description: metadataContent.about,
            avatar: metadataContent.picture,
            npub: encodedPubkey,
            pubkey: metadata.pubkey,
            displayName: metadataContent.display_name || metadataContent.displayName || metadataContent.name,
            internetIdentifier,
            website: metadataContent.website,
            banner: metadataContent.banner,
            followers: followersCount,
            metadata
        };
        return userProfile;
    }
    async fetchUserContactList(pubKey) {
        let metadataArr = [];
        let followersCountMap = {};
        const userContactEvents = await this._socialEventManager.fetchContactListCacheEvents(pubKey, true);
        for (let event of userContactEvents) {
            if (event.kind === 0) {
                metadataArr.push({
                    ...event,
                    content: this.parseContent(event.content)
                });
            }
            else if (event.kind === 10000108) {
                followersCountMap = this.parseContent(event.content);
            }
        }
        const userProfiles = [];
        for (let metadata of metadataArr) {
            let userProfile = this.constructUserProfile(metadata, followersCountMap);
            userProfiles.push(userProfile);
        }
        return userProfiles;
    }
    async fetchUserFollowersList(pubKey) {
        let metadataArr = [];
        let followersCountMap = {};
        const userFollowersEvents = await this._socialEventManager.fetchFollowersCacheEvents(pubKey);
        for (let event of userFollowersEvents) {
            if (event.kind === 0) {
                metadataArr.push({
                    ...event,
                    content: this.parseContent(event.content)
                });
            }
            else if (event.kind === 10000108) {
                followersCountMap = this.parseContent(event.content);
            }
        }
        const userProfiles = [];
        for (let metadata of metadataArr) {
            let userProfile = this.constructUserProfile(metadata, followersCountMap);
            userProfiles.push(userProfile);
        }
        return userProfiles;
    }
    async fetchUserRelayList(pubKey) {
        let relayList = [];
        const relaysEvents = await this._socialEventManager.fetchContactListCacheEvents(pubKey, false);
        const relaysEvent = relaysEvents.find(event => event.kind === 3);
        if (!relaysEvent)
            return relayList;
        let content = relaysEvent.content ? JSON.parse(relaysEvent.content) : {};
        relayList = Object.keys(content);
        return relayList;
    }
    async followUser(userPubKey) {
        const decodedUserPubKey = userPubKey.startsWith('npub1') ? index_1.Nip19.decode(userPubKey).data : userPubKey;
        const selfPubkey = SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const contactListEvents = await this._socialEventManager.fetchContactListCacheEvents(selfPubkey, false);
        let content = '';
        let contactPubKeys = [];
        const contactListEvent = contactListEvents.find(event => event.kind === 3);
        if (contactListEvent) {
            content = contactListEvent.content;
            contactPubKeys = contactListEvent.tags.filter(tag => tag[0] === 'p')?.[1] || [];
        }
        contactPubKeys.push(decodedUserPubKey);
        await this._socialEventManager.updateContactList(content, contactPubKeys, this._privateKey);
    }
    async unfollowUser(userPubKey) {
        const decodedUserPubKey = userPubKey.startsWith('npub1') ? index_1.Nip19.decode(userPubKey).data : userPubKey;
        const selfPubkey = SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const contactListEvents = await this._socialEventManager.fetchContactListCacheEvents(selfPubkey, false);
        let content = '';
        let contactPubKeys = [];
        const contactListEvent = contactListEvents.find(event => event.kind === 3);
        if (contactListEvent) {
            content = contactListEvent.content;
            for (let tag of contactListEvent.tags) {
                if (tag[0] === 'p' && tag[1] !== decodedUserPubKey) {
                    contactPubKeys.push(tag[1]);
                }
            }
        }
        await this._socialEventManager.updateContactList(content, contactPubKeys, this._privateKey);
    }
    getCommunityUri(creatorId, communityId) {
        const decodedPubkey = index_1.Nip19.decode(creatorId).data;
        return `34550:${decodedPubkey}:${communityId}`;
    }
    async generateGroupKeys(privateKey, encryptionPublicKeys) {
        const groupPrivateKey = index_1.Keys.generatePrivateKey();
        const groupPublicKey = index_1.Keys.getPublicKey(groupPrivateKey);
        let encryptedGroupKeys = {};
        for (let encryptionPublicKey of encryptionPublicKeys) {
            const encryptedGroupKey = await SocialUtilsManager.encryptMessage(privateKey, encryptionPublicKey, groupPrivateKey);
            encryptedGroupKeys[encryptionPublicKey] = encryptedGroupKey;
        }
        return {
            groupPrivateKey,
            groupPublicKey,
            encryptedGroupKeys
        };
    }
    async createCommunity(newInfo, creatorId) {
        const communityUri = this.getCommunityUri(creatorId, newInfo.name);
        let communityInfo = {
            communityUri,
            communityId: newInfo.name,
            creatorId,
            description: newInfo.description,
            rules: newInfo.rules,
            bannerImgUrl: newInfo.bannerImgUrl,
            moderatorIds: newInfo.moderatorIds,
            gatekeeperNpub: newInfo.gatekeeperNpub,
            scpData: newInfo.scpData,
            membershipType: newInfo.membershipType,
            memberIds: newInfo.memberIds
        };
        if (communityInfo.membershipType === interfaces_1.MembershipType.NFTExclusive) {
            const gatekeeperPublicKey = index_1.Nip19.decode(communityInfo.gatekeeperNpub).data;
            const communityKeys = await this.generateGroupKeys(this._privateKey, [gatekeeperPublicKey]);
            const encryptedKey = communityKeys.encryptedGroupKeys[gatekeeperPublicKey];
            communityInfo.scpData = {
                ...communityInfo.scpData,
                publicKey: communityKeys.groupPublicKey,
                encryptedKey: encryptedKey,
                gatekeeperPublicKey
            };
        }
        else if (communityInfo.membershipType === interfaces_1.MembershipType.InviteOnly) {
            let encryptionPublicKeys = [];
            for (let memberId of communityInfo.memberIds) {
                const memberPublicKey = index_1.Nip19.decode(memberId).data;
                encryptionPublicKeys.push(memberPublicKey);
            }
            const communityKeys = await this.generateGroupKeys(this._privateKey, encryptionPublicKeys);
            await this._socialEventManager.updateGroupKeys(communityUri + ':keys', 34550, JSON.stringify(communityKeys.encryptedGroupKeys), communityInfo.memberIds, this._privateKey);
            communityInfo.scpData = {
                ...communityInfo.scpData,
                publicKey: communityKeys.groupPublicKey
            };
        }
        if (communityInfo.scpData) {
            const updateChannelResponses = await this.updateCommunityChannel(communityInfo);
            const updateChannelResponse = updateChannelResponses[0];
            if (updateChannelResponse.eventId) {
                communityInfo.scpData.channelEventId = updateChannelResponse.eventId;
            }
        }
        await this._socialEventManager.updateCommunity(communityInfo, this._privateKey);
        return communityInfo;
    }
    async updateCommunity(info) {
        if (info.membershipType === interfaces_1.MembershipType.NFTExclusive) {
            const gatekeeperPublicKey = index_1.Nip19.decode(info.gatekeeperNpub).data;
            info.scpData.gatekeeperPublicKey = gatekeeperPublicKey;
        }
        else if (info.membershipType === interfaces_1.MembershipType.InviteOnly) {
            let encryptionPublicKeys = [];
            for (let memberId of info.memberIds) {
                const memberPublicKey = index_1.Nip19.decode(memberId).data;
                encryptionPublicKeys.push(memberPublicKey);
            }
            const groupPrivateKey = await this.retrieveCommunityPrivateKey(info, this._privateKey);
            let encryptedGroupKeys = {};
            for (let encryptionPublicKey of encryptionPublicKeys) {
                const encryptedGroupKey = await SocialUtilsManager.encryptMessage(this._privateKey, encryptionPublicKey, groupPrivateKey);
                encryptedGroupKeys[encryptionPublicKey] = encryptedGroupKey;
            }
            const response = await this._socialEventManager.updateGroupKeys(info.communityUri + ':keys', 34550, JSON.stringify(encryptedGroupKeys), info.memberIds, this._privateKey);
            console.log('updateCommunity', response);
        }
        await this._socialEventManager.updateCommunity(info, this._privateKey);
        return info;
    }
    async updateCommunityChannel(communityInfo) {
        let channelScpData = {
            communityId: communityInfo.communityId
        };
        let channelInfo = {
            name: communityInfo.communityId,
            about: communityInfo.description,
            scpData: channelScpData
        };
        const updateChannelResponse = await this._socialEventManager.updateChannel(channelInfo, this._privateKey);
        return updateChannelResponse;
    }
    async createChannel(channelInfo, memberIds) {
        let encryptionPublicKeys = [];
        for (let memberId of memberIds) {
            const memberPublicKey = index_1.Nip19.decode(memberId).data;
            encryptionPublicKeys.push(memberPublicKey);
        }
        const channelKeys = await this.generateGroupKeys(this._privateKey, encryptionPublicKeys);
        channelInfo.scpData = {
            ...channelInfo.scpData,
            publicKey: channelKeys.groupPublicKey
        };
        const updateChannelResponses = await this._socialEventManager.updateChannel(channelInfo, this._privateKey);
        const updateChannelResponse = updateChannelResponses[0];
        if (updateChannelResponse.eventId) {
            const channelUri = `40:${updateChannelResponse.eventId}`;
            await this._socialEventManager.updateGroupKeys(channelUri + ':keys', 40, JSON.stringify(channelKeys.encryptedGroupKeys), memberIds, this._privateKey);
        }
        return channelInfo;
    }
    async fetchCommunitiesMembers(communities) {
        const communityUriToMemberIdRoleComboMap = await this.mapCommunityUriToMemberIdRoleCombo(communities);
        let pubkeys = new Set(flatMap(Object.values(communityUriToMemberIdRoleComboMap), combo => combo.map(c => c.id)));
        const communityUriToMembersMap = {};
        if (pubkeys.size > 0) {
            const userProfiles = await this.fetchUserProfiles(Array.from(pubkeys));
            if (!userProfiles)
                return communityUriToMembersMap;
            for (let community of communities) {
                const decodedPubkey = index_1.Nip19.decode(community.creatorId).data;
                const communityUri = `34550:${decodedPubkey}:${community.communityId}`;
                const memberIds = communityUriToMemberIdRoleComboMap[communityUri];
                if (!memberIds)
                    continue;
                const communityMembers = [];
                for (let memberIdRoleCombo of memberIds) {
                    const userProfile = userProfiles.find(profile => profile.npub === memberIdRoleCombo.id);
                    if (!userProfile)
                        continue;
                    let communityMember = {
                        id: userProfile.npub,
                        name: userProfile.displayName,
                        profileImageUrl: userProfile.avatar,
                        username: userProfile.username,
                        internetIdentifier: userProfile.internetIdentifier,
                        role: memberIdRoleCombo.role
                    };
                    communityMembers.push(communityMember);
                }
                communityUriToMembersMap[communityUri] = communityMembers;
            }
        }
        return communityUriToMembersMap;
    }
    async fetchCommunities() {
        let communities = [];
        const events = await this._socialEventManager.fetchCommunities();
        for (let event of events) {
            const communityInfo = this.extractCommunityInfo(event);
            let community = {
                ...communityInfo,
                members: []
            };
            communities.push(community);
        }
        const communityUriToMembersMap = await this.fetchCommunitiesMembers(communities);
        for (let community of communities) {
            const decodedPubkey = index_1.Nip19.decode(community.creatorId).data;
            const communityUri = `34550:${decodedPubkey}:${community.communityId}`;
            community.members = communityUriToMembersMap[communityUri];
        }
        return communities;
    }
    async fetchMyCommunities(pubKey) {
        let communities = [];
        const pubkeyToCommunityIdsMap = {};
        const events = await this._socialEventManager.fetchAllUserRelatedCommunities(pubKey);
        for (let event of events) {
            if (event.kind === 34550) {
                const communityInfo = this.extractCommunityInfo(event);
                communities.push(communityInfo);
            }
            else if (event.kind === 30001) {
                const bookmarkedCommunities = this.extractBookmarkedCommunities(event);
                for (let community of bookmarkedCommunities) {
                    const pubkey = community.creatorId;
                    const communityId = community.communityId;
                    if (!pubkeyToCommunityIdsMap[pubkey]) {
                        pubkeyToCommunityIdsMap[pubkey] = [];
                    }
                    pubkeyToCommunityIdsMap[pubkey].push(communityId);
                }
            }
        }
        if (Object.keys(pubkeyToCommunityIdsMap).length > 0) {
            const bookmarkedCommunitiesEvents = await this._socialEventManager.fetchCommunities(pubkeyToCommunityIdsMap);
            for (let event of bookmarkedCommunitiesEvents) {
                const communityInfo = this.extractCommunityInfo(event);
                communities.push(communityInfo);
            }
        }
        return communities;
    }
    extractBookmarkedCommunities(event, excludedCommunity) {
        const communities = [];
        const communityUriArr = event?.tags.filter(tag => tag[0] === 'a')?.map(tag => tag[1]) || [];
        for (let communityUri of communityUriArr) {
            const pubkey = communityUri.split(':')[1];
            const communityId = communityUri.split(':')[2];
            if (excludedCommunity) {
                const decodedPubkey = index_1.Nip19.decode(excludedCommunity.creatorId).data;
                if (communityId === excludedCommunity.communityId && pubkey === decodedPubkey)
                    continue;
            }
            communities.push({
                communityId,
                creatorId: pubkey
            });
        }
        return communities;
    }
    extractBookmarkedChannels(event) {
        const channelEventIds = event?.tags.filter(tag => tag[0] === 'a')?.map(tag => tag[1]) || [];
        return channelEventIds;
    }
    async joinCommunity(community, pubKey) {
        const bookmarkedCommunitiesEvents = await this._socialEventManager.fetchUserBookmarkedCommunities(pubKey);
        const bookmarkedCommunitiesEvent = bookmarkedCommunitiesEvents.find(event => event.kind === 30001);
        const communities = this.extractBookmarkedCommunities(bookmarkedCommunitiesEvent);
        communities.push(community);
        await this._socialEventManager.updateUserBookmarkedCommunities(communities, this._privateKey);
        if (community.scpData?.channelEventId) {
            const bookmarkedChannelsEvents = await this._socialEventManager.fetchUserBookmarkedChannels(pubKey);
            const bookmarkedChannelsEvent = bookmarkedChannelsEvents.find(event => event.kind === 30001);
            const channelEventIds = this.extractBookmarkedChannels(bookmarkedChannelsEvent);
            channelEventIds.push(community.scpData.channelEventId);
            await this._socialEventManager.updateUserBookmarkedChannels(channelEventIds, this._privateKey);
        }
    }
    async leaveCommunity(community, pubKey) {
        const events = await this._socialEventManager.fetchUserBookmarkedCommunities(pubKey);
        const bookmarkedEvent = events.find(event => event.kind === 30001);
        const communities = this.extractBookmarkedCommunities(bookmarkedEvent, community);
        await this._socialEventManager.updateUserBookmarkedCommunities(communities, this._privateKey);
        if (community.scpData?.channelEventId) {
            const bookmarkedChannelsEvents = await this._socialEventManager.fetchUserBookmarkedChannels(pubKey);
            const bookmarkedChannelsEvent = bookmarkedChannelsEvents.find(event => event.kind === 30001);
            const channelEventIds = this.extractBookmarkedChannels(bookmarkedChannelsEvent);
            const index = channelEventIds.indexOf(community.scpData.channelEventId);
            if (index > -1) {
                channelEventIds.splice(index, 1);
            }
            await this._socialEventManager.updateUserBookmarkedChannels(channelEventIds, this._privateKey);
        }
    }
    async encryptGroupMessage(privateKey, groupPublicKey, message) {
        const messagePrivateKey = index_1.Keys.generatePrivateKey();
        const messagePublicKey = index_1.Keys.getPublicKey(messagePrivateKey);
        const encryptedGroupKey = await SocialUtilsManager.encryptMessage(privateKey, groupPublicKey, messagePrivateKey);
        const encryptedMessage = await SocialUtilsManager.encryptMessage(privateKey, messagePublicKey, message);
        return {
            encryptedMessage,
            encryptedGroupKey
        };
    }
    async submitCommunityPost(message, info, conversationPath) {
        const messageContent = {
            communityUri: info.communityUri,
            message,
        };
        let newCommunityPostInfo;
        if (info.membershipType === interfaces_1.MembershipType.Open) {
            newCommunityPostInfo = {
                community: info,
                message,
                conversationPath
            };
        }
        else {
            const { encryptedMessage, encryptedGroupKey } = await this.encryptGroupMessage(this._privateKey, info.scpData.publicKey, JSON.stringify(messageContent));
            newCommunityPostInfo = {
                community: info,
                message: encryptedMessage,
                conversationPath,
                scpData: {
                    encryptedKey: encryptedGroupKey,
                    communityUri: info.communityUri
                }
            };
        }
        await this._socialEventManager.submitCommunityPost(newCommunityPostInfo, this._privateKey);
    }
    extractChannelInfo(event) {
        const content = this.parseContent(event.content);
        let eventId;
        if (event.kind === 40) {
            eventId = event.id;
        }
        else if (event.kind === 41) {
            eventId = event.tags.find(tag => tag[0] === 'e')?.[1];
        }
        if (!eventId)
            return null;
        let scpData = this.extractScpData(event, interfaces_1.ScpStandardId.Channel);
        let channelInfo = {
            id: eventId,
            name: content.name,
            about: content.about,
            picture: content.picture,
            scpData,
            eventData: event,
        };
        return channelInfo;
    }
    async fetchAllUserRelatedChannels(pubKey) {
        let channels = [];
        let bookmarkedChannelEventIds = [];
        const channelMetadataMap = {};
        let channelIdToCommunityMap = {};
        const events = await this._socialEventManager.fetchAllUserRelatedChannels(pubKey);
        for (let event of events) {
            if (event.kind === 40) {
                const channelInfo = this.extractChannelInfo(event);
                if (!channelInfo)
                    continue;
                channels.push(channelInfo);
            }
            else if (event.kind === 41) {
                const channelInfo = this.extractChannelInfo(event);
                if (!channelInfo)
                    continue;
                channelMetadataMap[channelInfo.id] = channelInfo;
            }
            else if (event.kind === 30001) {
                bookmarkedChannelEventIds = this.extractBookmarkedChannels(event);
            }
            else if (event.kind === 34550) {
                const communityInfo = this.extractCommunityInfo(event);
                const channelId = communityInfo.scpData?.channelEventId;
                if (!channelId)
                    continue;
                channelIdToCommunityMap[channelId] = communityInfo;
            }
        }
        const bookmarkedChannelEvents = await this._socialEventManager.fetchChannels(bookmarkedChannelEventIds);
        for (let event of bookmarkedChannelEvents) {
            if (event.kind === 40) {
                const channelInfo = this.extractChannelInfo(event);
                if (!channelInfo)
                    continue;
                channels.push(channelInfo);
            }
            else if (event.kind === 41) {
                const channelInfo = this.extractChannelInfo(event);
                if (!channelInfo)
                    continue;
                channelMetadataMap[channelInfo.id] = channelInfo;
            }
        }
        const pubkeyToCommunityIdsMap = {};
        for (let channel of channels) {
            const scpData = channel.scpData;
            if (!scpData.communityId)
                continue;
            pubkeyToCommunityIdsMap[channel.eventData.pubkey] = pubkeyToCommunityIdsMap[channel.eventData.pubkey] || [];
            if (!pubkeyToCommunityIdsMap[channel.eventData.pubkey].includes(scpData.communityId)) {
                pubkeyToCommunityIdsMap[channel.eventData.pubkey].push(scpData.communityId);
            }
        }
        const communityEvents = await this._socialEventManager.fetchCommunities(pubkeyToCommunityIdsMap);
        for (let event of communityEvents) {
            const communityInfo = this.extractCommunityInfo(event);
            const channelId = communityInfo.scpData?.channelEventId;
            if (!channelId)
                continue;
            channelIdToCommunityMap[channelId] = communityInfo;
        }
        let outputChannels = [];
        for (let channel of channels) {
            const channelMetadata = channelMetadataMap[channel.id];
            const communityInfo = channelIdToCommunityMap[channel.id];
            if (channelMetadata) {
                outputChannels.push({
                    ...channel,
                    ...channelMetadata,
                    communityInfo: communityInfo
                });
            }
            else {
                outputChannels.push({
                    ...channel,
                    communityInfo: communityInfo
                });
            }
        }
        return outputChannels;
    }
    async retrieveChannelMessages(channelId, since, until) {
        const events = await this._socialEventManager.fetchChannelMessages(channelId, since, until);
        const messageEvents = events.filter(event => event.kind === 42);
        return messageEvents;
    }
    async retrieveChannelEvents(creatorId, channelId) {
        const channelEvents = await this._socialEventManager.fetchChannelInfoMessages(creatorId, channelId);
        const messageEvents = channelEvents.filter(event => event.kind === 42);
        const channelCreationEvent = channelEvents.find(event => event.kind === 40);
        if (!channelCreationEvent)
            throw new Error('No info event found');
        const channelMetadataEvent = channelEvents.find(event => event.kind === 41);
        let channelInfo;
        if (channelMetadataEvent) {
            channelInfo = this.extractChannelInfo(channelMetadataEvent);
        }
        else {
            channelInfo = this.extractChannelInfo(channelCreationEvent);
        }
        if (!channelInfo)
            throw new Error('No info event found');
        return {
            messageEvents,
            info: channelInfo
        };
    }
    async retrieveChannelMessageKeys(options) {
        let messageIdToPrivateKey = {};
        if (options.gatekeeperUrl) {
            let bodyData = {
                creatorId: options.creatorId,
                channelId: options.channelId,
                message: options.message,
                signature: options.signature
            };
            let url = `${options.gatekeeperUrl}/api/channels/v0/message-keys`;
            let response = await fetch(url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bodyData)
            });
            let result = await response.json();
            if (result.success) {
                messageIdToPrivateKey = result.data;
            }
        }
        else if (options.privateKey) {
            let groupPrivateKey;
            const channelEvents = await this.retrieveChannelEvents(options.creatorId, options.channelId);
            const channelInfo = channelEvents.info;
            const messageEvents = channelEvents.messageEvents;
            if (channelInfo.scpData.communityId) {
                const communityInfo = await this.fetchCommunityInfo(channelInfo.eventData.pubkey, channelInfo.scpData.communityId);
                groupPrivateKey = await this.retrieveCommunityPrivateKey(communityInfo, options.privateKey);
                if (!groupPrivateKey)
                    return messageIdToPrivateKey;
            }
            else {
                const groupUri = `40:${channelInfo.id}`;
                const keyEvent = await this._socialEventManager.fetchGroupKeys(groupUri + ':keys');
                if (keyEvent) {
                    const creatorPubkey = channelInfo.eventData.pubkey;
                    const pubkey = SocialUtilsManager.convertPrivateKeyToPubkey(options.privateKey);
                    const memberKeyMap = JSON.parse(keyEvent.content);
                    const encryptedKey = memberKeyMap?.[pubkey];
                    if (encryptedKey) {
                        groupPrivateKey = await SocialUtilsManager.decryptMessage(options.privateKey, creatorPubkey, encryptedKey);
                    }
                }
            }
            for (const messageEvent of messageEvents) {
                const messagePrivateKey = await this.retrieveChannelMessagePrivateKey(messageEvent, channelInfo.id, groupPrivateKey);
                if (messagePrivateKey) {
                    messageIdToPrivateKey[messageEvent.id] = messagePrivateKey;
                }
            }
        }
        return messageIdToPrivateKey;
    }
    async submitChannelMessage(message, channelId, communityPublicKey, conversationPath) {
        const messageContent = {
            channelId,
            message,
        };
        const { encryptedMessage, encryptedGroupKey } = await this.encryptGroupMessage(this._privateKey, communityPublicKey, JSON.stringify(messageContent));
        const newChannelMessageInfo = {
            channelId: channelId,
            message: encryptedMessage,
            conversationPath,
            scpData: {
                encryptedKey: encryptedGroupKey,
                channelId: channelId
            }
        };
        await this._socialEventManager.submitChannelMessage(newChannelMessageInfo, this._privateKey);
    }
    async fetchDirectMessagesBySender(selfPubKey, senderPubKey, since, until) {
        const decodedSenderPubKey = index_1.Nip19.decode(senderPubKey).data;
        const events = await this._socialEventManager.fetchDirectMessages(selfPubKey, decodedSenderPubKey, since, until);
        let metadataByPubKeyMap = {};
        const encryptedMessages = [];
        for (let event of events) {
            if (event.kind === 0) {
                metadataByPubKeyMap[event.pubkey] = {
                    ...event,
                    content: this.parseContent(event.content)
                };
            }
            else if (event.kind === 4) {
                encryptedMessages.push(event);
            }
        }
        return {
            decodedSenderPubKey,
            encryptedMessages,
            metadataByPubKeyMap
        };
    }
    async sendDirectMessage(chatId, message) {
        const decodedReceiverPubKey = index_1.Nip19.decode(chatId).data;
        const content = await SocialUtilsManager.encryptMessage(this._privateKey, decodedReceiverPubKey, message);
        await this._socialEventManager.sendMessage(decodedReceiverPubKey, content, this._privateKey);
    }
    async resetMessageCount(selfPubKey, senderPubKey) {
        await this._socialEventManager.resetMessageCount(selfPubKey, senderPubKey, this._privateKey);
    }
    async fetchMessageContacts(pubKey) {
        const events = await this._socialEventManager.fetchMessageContactsCacheEvents(pubKey);
        const pubkeyToMessageInfoMap = {};
        let metadataByPubKeyMap = {};
        for (let event of events) {
            if (event.kind === 10000118) {
                const content = this.parseContent(event.content);
                Object.keys(content).forEach(pubkey => {
                    pubkeyToMessageInfoMap[pubkey] = content[pubkey];
                });
            }
            if (event.kind === 0) {
                metadataByPubKeyMap[event.pubkey] = {
                    ...event,
                    content: this.parseContent(event.content)
                };
            }
        }
        let profiles = Object.entries(metadataByPubKeyMap).map(([k, v]) => {
            const encodedPubkey = index_1.Nip19.npubEncode(k);
            return {
                id: encodedPubkey,
                pubKey: k,
                creatorId: encodedPubkey,
                username: v.content.name,
                displayName: v.content.display_name,
                avatar: v.content.picture,
                banner: v.content.banner,
                latestAt: pubkeyToMessageInfoMap[k].latest_at,
                cnt: pubkeyToMessageInfoMap[k].cnt
            };
        });
        const channels = await this.fetchAllUserRelatedChannels(pubKey);
        for (let channel of channels) {
            let creatorId = index_1.Nip19.npubEncode(channel.eventData.pubkey);
            profiles.push({
                id: channel.id,
                pubKey: channel.eventData.pubkey,
                creatorId,
                username: channel.name,
                displayName: channel.name,
                avatar: channel.picture,
                banner: '',
                latestAt: 0,
                cnt: 0,
                isGroup: true,
                channelInfo: channel
            });
        }
        const invitations = await this.fetchUserGroupInvitations(pubKey);
        console.log('invitations', invitations);
        return profiles;
    }
    async fetchUserGroupInvitations(pubKey) {
        const identifiers = [];
        const events = await this._socialEventManager.fetchUserGroupInvitations([40, 34550], pubKey);
        for (let event of events) {
            const identifier = event.tags.find(tag => tag[0] === 'd')?.[1];
            if (identifier) {
                identifiers.push(identifier);
            }
        }
        return identifiers;
    }
    async mapCommunityUriToMemberIdRoleCombo(communities) {
        const communityUriToMemberIdRoleComboMap = {};
        const communityUriToCreatorOrModeratorIdsMap = {};
        for (let community of communities) {
            const decodedPubkey = index_1.Nip19.decode(community.creatorId).data;
            const communityUri = `34550:${decodedPubkey}:${community.communityId}`;
            communityUriToMemberIdRoleComboMap[communityUri] = [];
            communityUriToMemberIdRoleComboMap[communityUri].push({
                id: community.creatorId,
                role: interfaces_1.CommunityRole.Creator
            });
            communityUriToCreatorOrModeratorIdsMap[communityUri] = new Set();
            communityUriToCreatorOrModeratorIdsMap[communityUri].add(community.creatorId);
            if (community.moderatorIds) {
                if (community.moderatorIds.includes(community.creatorId))
                    continue;
                for (let moderator of community.moderatorIds) {
                    communityUriToMemberIdRoleComboMap[communityUri].push({
                        id: moderator,
                        role: interfaces_1.CommunityRole.Moderator
                    });
                    communityUriToCreatorOrModeratorIdsMap[communityUri].add(moderator);
                }
            }
        }
        const generalMembersEvents = await this._socialEventManager.fetchCommunitiesGeneralMembers(communities);
        for (let event of generalMembersEvents) {
            const communityUriArr = event.tags.filter(tag => tag[0] === 'a')?.map(tag => tag[1]) || [];
            for (let communityUri of communityUriArr) {
                if (!communityUriToMemberIdRoleComboMap[communityUri])
                    continue;
                const pubkey = index_1.Nip19.npubEncode(event.pubkey);
                if (communityUriToCreatorOrModeratorIdsMap[communityUri].has(pubkey))
                    continue;
                communityUriToMemberIdRoleComboMap[communityUri].push({
                    id: pubkey,
                    role: interfaces_1.CommunityRole.GeneralMember
                });
            }
        }
        return communityUriToMemberIdRoleComboMap;
    }
    extractCalendarEventInfo(event) {
        const description = event.content;
        const id = event.tags.find(tag => tag[0] === 'd')?.[1];
        const name = event.tags.find(tag => tag[0] === 'name')?.[1];
        const title = event.tags.find(tag => tag[0] === 'title')?.[1];
        const start = event.tags.find(tag => tag[0] === 'start')?.[1];
        const end = event.tags.find(tag => tag[0] === 'end')?.[1];
        const startTzid = event.tags.find(tag => tag[0] === 'start_tzid')?.[1];
        const endTzid = event.tags.find(tag => tag[0] === 'end_tzid')?.[1];
        const location = event.tags.find(tag => tag[0] === 'location')?.[1];
        const city = event.tags.find(tag => tag[0] === 'city')?.[1];
        let lonlat;
        const geohash = event.tags.find(tag => tag[0] === 'g')?.[1];
        if (geohash) {
            lonlat = geohash_1.default.decode(geohash);
        }
        const image = event.tags.find(tag => tag[0] === 'image')?.[1];
        let type;
        let startTime;
        let endTime;
        if (event.kind === 31922) {
            type = interfaces_1.CalendarEventType.DateBased;
            const startDate = new Date(start);
            startTime = startDate.getTime() / 1000;
            if (end) {
                const endDate = new Date(end);
                endTime = endDate.getTime() / 1000;
            }
        }
        else if (event.kind === 31923) {
            type = interfaces_1.CalendarEventType.TimeBased;
            startTime = Number(start);
            if (end) {
                endTime = Number(end);
            }
        }
        const naddr = index_1.Nip19.naddrEncode({
            identifier: id,
            pubkey: event.pubkey,
            kind: event.kind,
            relays: []
        });
        let calendarEventInfo = {
            naddr,
            type,
            id,
            title: title || name,
            description,
            start: startTime,
            end: endTime,
            startTzid,
            endTzid,
            location,
            city,
            latitude: lonlat?.latitude,
            longitude: lonlat?.longitude,
            geohash,
            image,
            eventData: event
        };
        return calendarEventInfo;
    }
    async updateCalendarEvent(updateCalendarEventInfo) {
        const geohash = geohash_1.default.encode(updateCalendarEventInfo.latitude, updateCalendarEventInfo.longitude);
        updateCalendarEventInfo = {
            ...updateCalendarEventInfo,
            geohash
        };
        let naddr;
        const responses = await this._socialEventManager.updateCalendarEvent(updateCalendarEventInfo, this._privateKey);
        const response = responses[0];
        if (response.success) {
            const pubkey = SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
            naddr = index_1.Nip19.naddrEncode({
                identifier: updateCalendarEventInfo.id,
                pubkey: pubkey,
                kind: updateCalendarEventInfo.type === interfaces_1.CalendarEventType.DateBased ? 31922 : 31923,
                relays: []
            });
        }
        return naddr;
    }
    async retrieveCalendarEventsByDateRange(start, end, limit) {
        const events = await this._socialEventManager.fetchCalendarEvents(start, end, limit);
        let calendarEventInfoList = [];
        for (let event of events) {
            let calendarEventInfo = this.extractCalendarEventInfo(event);
            calendarEventInfoList.push(calendarEventInfo);
        }
        return calendarEventInfoList;
    }
    async retrieveCalendarEvent(naddr) {
        let address = index_1.Nip19.decode(naddr).data;
        const calendarEvent = await this._socialEventManager.fetchCalendarEvent(address);
        if (!calendarEvent)
            return null;
        let calendarEventInfo = this.extractCalendarEventInfo(calendarEvent);
        let hostPubkeys = calendarEvent.tags.filter(tag => tag[0] === 'p' && tag[3] === 'host')?.map(tag => tag[1]) || [];
        const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
        let hosts = [];
        let attendees = [];
        let attendeePubkeys = [];
        let attendeePubkeyToEventMap = {};
        const postEvents = await this._socialEventManager.fetchCalendarEventPosts(calendarEventUri);
        const notes = [];
        for (let postEvent of postEvents) {
            const note = {
                eventData: postEvent
            };
            notes.push(note);
        }
        const rsvpEvents = await this._socialEventManager.fetchCalendarEventRSVPs(calendarEventUri);
        for (let rsvpEvent of rsvpEvents) {
            if (attendeePubkeyToEventMap[rsvpEvent.pubkey])
                continue;
            let attendanceStatus = rsvpEvent.tags.find(tag => tag[0] === 'l' && tag[2] === 'status')?.[1];
            if (attendanceStatus === 'accepted') {
                attendeePubkeyToEventMap[rsvpEvent.pubkey] = rsvpEvent;
                attendeePubkeys.push(rsvpEvent.pubkey);
            }
        }
        const userProfileEvents = await this._socialEventManager.fetchUserProfileCacheEvents([
            ...hostPubkeys,
            ...attendeePubkeys
        ]);
        for (let event of userProfileEvents) {
            if (event.kind === 0) {
                let metaData = {
                    ...event,
                    content: this.parseContent(event.content)
                };
                let userProfile = this.constructUserProfile(metaData);
                if (hostPubkeys.includes(event.pubkey)) {
                    let host = {
                        pubkey: event.pubkey,
                        userProfile
                    };
                    hosts.push(host);
                }
                else if (attendeePubkeyToEventMap[event.pubkey]) {
                    let attendee = {
                        pubkey: event.pubkey,
                        userProfile,
                        rsvpEventData: attendeePubkeyToEventMap[event.pubkey]
                    };
                    attendees.push(attendee);
                }
            }
        }
        let detailInfo = {
            ...calendarEventInfo,
            hosts,
            attendees,
            notes
        };
        return detailInfo;
    }
    async acceptCalendarEvent(rsvpId, naddr) {
        let address = index_1.Nip19.decode(naddr).data;
        const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
        const pubkey = SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const rsvpEvents = await this._socialEventManager.fetchCalendarEventRSVPs(calendarEventUri, pubkey);
        if (rsvpEvents.length > 0) {
            rsvpId = rsvpEvents[0].tags.find(tag => tag[0] === 'd')?.[1];
        }
        await this._socialEventManager.createCalendarEventRSVP(rsvpId, calendarEventUri, true, this._privateKey);
    }
    async declineCalendarEvent(rsvpId, naddr) {
        let address = index_1.Nip19.decode(naddr).data;
        const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
        const pubkey = SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const rsvpEvents = await this._socialEventManager.fetchCalendarEventRSVPs(calendarEventUri, pubkey);
        if (rsvpEvents.length > 0) {
            rsvpId = rsvpEvents[0].tags.find(tag => tag[0] === 'd')?.[1];
        }
        await this._socialEventManager.createCalendarEventRSVP(rsvpId, calendarEventUri, false, this._privateKey);
    }
    async submitCalendarEventPost(naddr, message, conversationPath) {
        let address = index_1.Nip19.decode(naddr).data;
        const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
        let info = {
            calendarEventUri,
            message,
            conversationPath
        };
        const responses = await this._socialEventManager.submitCalendarEventPost(info, this._privateKey);
        const response = responses[0];
        return response.success ? response.eventId : null;
    }
    async fetchTimezones() {
        const apiUrl = `${this._apiBaseUrl}/timezones`;
        const apiResponse = await fetch(apiUrl);
        const apiResult = await apiResponse.json();
        if (!apiResult.success)
            throw new Error(apiResult.error.message);
        let timezones = [];
        for (let timezone of apiResult.data.timezones) {
            let gmtOffset = SocialUtilsManager.getGMTOffset(timezone.timezoneName);
            if (!gmtOffset)
                continue;
            timezones.push({
                timezoneName: timezone.timezoneName,
                description: timezone.description,
                gmtOffset: gmtOffset
            });
        }
        timezones.sort((a, b) => {
            if (a.gmtOffset.startsWith('GMT-') && b.gmtOffset.startsWith('GMT+'))
                return -1;
            if (a.gmtOffset.startsWith('GMT+') && b.gmtOffset.startsWith('GMT-'))
                return 1;
            if (a.gmtOffset.startsWith('GMT-')) {
                if (a.gmtOffset < b.gmtOffset)
                    return 1;
                if (a.gmtOffset > b.gmtOffset)
                    return -1;
            }
            else {
                if (a.gmtOffset > b.gmtOffset)
                    return 1;
                if (a.gmtOffset < b.gmtOffset)
                    return -1;
            }
            if (a.description < b.description)
                return -1;
            if (a.description > b.description)
                return 1;
            return 0;
        });
        return timezones;
    }
    async fetchCitiesByKeyword(keyword) {
        const apiUrl = `${this._apiBaseUrl}/cities?keyword=${keyword}`;
        const apiResponse = await fetch(apiUrl);
        const apiResult = await apiResponse.json();
        if (!apiResult.success)
            throw new Error(apiResult.error.message);
        let cities = [];
        for (let city of apiResult.data.cities) {
            cities.push({
                id: city.id,
                city: city.city,
                cityAscii: city.cityAscii,
                latitude: city.lat,
                longitude: city.lng,
                country: city.country
            });
        }
        return cities;
    }
    async fetchCitiesByCoordinates(latitude, longitude) {
        const apiUrl = `${this._apiBaseUrl}/cities?lat=${latitude}&lng=${longitude}`;
        const apiResponse = await fetch(apiUrl);
        const apiResult = await apiResponse.json();
        if (!apiResult.success)
            throw new Error(apiResult.error.message);
        let cities = [];
        for (let city of apiResult.data.cities) {
            cities.push({
                id: city.id,
                city: city.city,
                cityAscii: city.cityAscii,
                latitude: city.lat,
                longitude: city.lng,
                country: city.country
            });
        }
        return cities;
    }
    async fetchLocationInfoFromIP() {
        if (!this._ipLocationServiceBaseUrl)
            return null;
        const response = await fetch(this._ipLocationServiceBaseUrl);
        const result = await response.json();
        let locationInfo;
        if (result.success) {
            locationInfo = {
                latitude: result.data.lat,
                longitude: result.data.long
            };
        }
        return locationInfo;
    }
    async fetchEventMetadataFromIPFS(ipfsBaseUrl, eventId) {
        const url = `${ipfsBaseUrl}/nostr/${eventId}`;
        const response = await fetch(url);
        const result = await response.json();
        return result;
    }
    async getAccountBalance(walletAddress) {
        const apiUrl = 'https://rpc.ankr.com/multichain/79258ce7f7ee046decc3b5292a24eb4bf7c910d7e39b691384c7ce0cfb839a01/?ankr_getAccountBalance';
        const bodyData = {
            jsonrpc: '2.0',
            method: 'ankr_getAccountBalance',
            params: {
                blockchain: [
                    'bsc',
                    'avalanche'
                ],
                walletAddress
            },
            id: 1
        };
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyData)
        });
        const data = await response.json();
        if (data.error) {
            console.log('error', data.error);
            return null;
        }
        return data.result;
    }
    async getNFTsByOwner(walletAddress) {
        const apiUrl = 'https://rpc.ankr.com/multichain/79258ce7f7ee046decc3b5292a24eb4bf7c910d7e39b691384c7ce0cfb839a01/?ankr_getNFTsByOwner';
        const bodyData = {
            jsonrpc: '2.0',
            method: 'ankr_getNFTsByOwner',
            params: {
                blockchain: [
                    'bsc',
                    'avalanche'
                ],
                walletAddress
            },
            id: 1
        };
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyData)
        });
        const data = await response.json();
        if (data.error) {
            console.log('error', data.error);
            return null;
        }
        return data.result;
    }
    async submitMessage(message, conversationPath) {
        await this._socialEventManager.postNote(message, this._privateKey, conversationPath);
    }
    async submitLike(postEventData) {
        let tags = postEventData.tags.filter(tag => tag.length >= 2 && (tag[0] === 'e' || tag[0] === 'p'));
        tags.push(['e', postEventData.id]);
        tags.push(['p', postEventData.pubkey]);
        tags.push(['k', postEventData.kind.toString()]);
        await this._socialEventManager.submitLike(tags, this._privateKey);
    }
    async submitRepost(postEventData) {
        let tags = [
            [
                'e',
                postEventData.id
            ],
            [
                'p',
                postEventData.pubkey
            ]
        ];
        const content = JSON.stringify(postEventData);
        await this._socialEventManager.submitRepost(content, tags, this._privateKey);
    }
    async sendPingRequest(pubkey, walletAddress, signature) {
        if (!this._defaultRestAPIRelay)
            return null;
        let msg = pubkey;
        const pubkeyY = index_1.Keys.getPublicKeyY(this._privateKey);
        const data = {
            msg: msg,
            signature: signature,
            pubkey: pubkey,
            pubkeyY: pubkeyY,
            walletAddress: walletAddress
        };
        let response = await fetch(this._defaultRestAPIRelay + '/ping', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        let result = await response.json();
        return result;
    }
    async fetchUnreadMessageCounts(pubkey) {
        if (!this._defaultRestAPIRelay)
            return null;
        let url = this._defaultRestAPIRelay + '/unread-message-counts?pubkey=' + pubkey;
        const response = await fetch(url);
        const result = await response.json();
        return result;
    }
    async updateMessageLastReadReceipt(pubkey, walletAddress, signature, fromId) {
        if (!this._defaultRestAPIRelay)
            return null;
        let msg = pubkey;
        const data = {
            fromId: fromId,
            msg: msg,
            signature: signature,
            pubkey: pubkey,
            walletAddress: walletAddress
        };
        let response = await fetch(this._defaultRestAPIRelay + '/update-message-last-read-receipt', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        let result = await response.json();
        return result;
    }
}
exports.SocialDataManager = SocialDataManager;
