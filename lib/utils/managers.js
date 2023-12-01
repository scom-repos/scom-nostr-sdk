"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialDataManager = exports.NostrEventManager = void 0;
const index_1 = require("../core/index");
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
class NostrWebSocketManager {
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
    generateRandomNumber() {
        let randomNumber = '';
        for (let i = 0; i < 10; i++) {
            randomNumber += Math.floor(Math.random() * 10).toString();
        }
        return randomNumber;
    }
    establishConnection(requestId, cb) {
        const WebSocket = determineWebSocketType();
        this.requestCallbackMap[requestId] = cb;
        return new Promise((resolve) => {
            const openListener = () => {
                console.log('Connected to server');
                this.ws.removeEventListener('open', openListener);
                resolve(this.ws);
            };
            if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
                this.ws = new WebSocket(this._url);
                this.ws.addEventListener('open', openListener);
                this.ws.addEventListener('message', (event) => {
                    const messageStr = event.data.toString();
                    const message = JSON.parse(messageStr);
                    let requestId = message[1];
                    if (message[0] === 'EOSE') {
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
                });
                this.ws.addEventListener('close', () => {
                    console.log('Disconnected from server');
                });
                this.ws.addEventListener('error', (error) => {
                    console.error('WebSocket Error:', error);
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
    async fetchWebSocketEvents(...requests) {
        let requestId;
        do {
            requestId = this.generateRandomNumber();
        } while (this.requestCallbackMap[requestId]);
        return new Promise(async (resolve, reject) => {
            let events = [];
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
        });
    }
    async submitEvent(event, privateKey) {
        let requestId;
        do {
            requestId = this.generateRandomNumber();
        } while (this.requestCallbackMap[requestId]);
        const ws = await this.establishConnection(requestId, (message) => {
            console.log('from server:', message);
        });
        event = index_1.Event.finishEvent(event, privateKey);
        let msg = JSON.stringify(["EVENT", event]);
        console.log(msg);
        ws.send(msg);
    }
}
class NostrCachedWebSocketManager extends NostrWebSocketManager {
    async fetchCachedEvents(eventType, msg) {
        let requestId;
        do {
            requestId = eventType + '_' + this.generateRandomNumber();
        } while (this.requestCallbackMap[requestId]);
        return new Promise(async (resolve, reject) => {
            let events = [];
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
            ws.send(JSON.stringify(["REQ", requestId, {
                    cache: [
                        eventType,
                        msg
                    ]
                }]));
        });
    }
}
class NostrEventManager {
    constructor(relays, cachedServer) {
        this._relays = relays;
        this._cachedServer = cachedServer;
        this._websocketManager = new NostrWebSocketManager(this._relays[0]);
        this._cachedWebsocketManager = new NostrCachedWebSocketManager(this._cachedServer);
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
        const events = await this._cachedWebsocketManager.fetchCachedEvents('thread_view', msg);
        return events;
    }
    async fetchTrendingCacheEvents(pubKey) {
        let msg = {};
        if (pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
            msg.user_pubkey = decodedPubKey;
        }
        const events = await this._cachedWebsocketManager.fetchCachedEvents('explore_global_trending_24h', msg);
        return events;
    }
    async fetchProfileFeedCacheEvents(pubKey) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = {
            limit: 20,
            notes: "authored",
            pubkey: decodedPubKey,
            since: 0,
            user_pubkey: decodedPubKey
        };
        const events = await this._cachedWebsocketManager.fetchCachedEvents('feed', msg);
        return events;
    }
    async fetchHomeFeedCacheEvents(pubKey) {
        let msg = {
            limit: 20,
            since: 0,
        };
        msg.pubkey = index_1.Nip19.decode('npub1nfgqmnxqsjsnsvc2r5djhcx4ap3egcjryhf9ppxnajskfel2dx9qq6mnsp').data;
        const events = await this._cachedWebsocketManager.fetchCachedEvents('feed', msg);
        return events;
    }
    async fetchUserProfileCacheEvents(pubKeys) {
        const decodedPubKeys = pubKeys.map(pubKey => pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey);
        let msg = {
            pubkeys: decodedPubKeys
        };
        const events = await this._cachedWebsocketManager.fetchCachedEvents('user_infos', msg);
        return events;
    }
    async fetchCommunities(pubkeyToCommunityIdsMap) {
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
            events = await this._websocketManager.fetchWebSocketEvents(...requests);
        }
        else {
            let request = {
                kinds: [34550],
                limit: 50
            };
            events = await this._websocketManager.fetchWebSocketEvents(request);
        }
        return events;
    }
    async fetchUserCommunities(pubKey) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let requestForCreatedOrFollowedCommunities = {
            kinds: [0, 3, 34550, 30001],
            authors: [decodedPubKey]
        };
        let requestForModeratedCommunities = {
            kinds: [34550],
            "#p": [decodedPubKey]
        };
        const events = await this._websocketManager.fetchWebSocketEvents(requestForCreatedOrFollowedCommunities, requestForModeratedCommunities);
        return events;
    }
    async fetchUserSubscribedCommunities(pubKey) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let request = {
            kinds: [30001],
            authors: [decodedPubKey]
        };
        const events = await this._websocketManager.fetchWebSocketEvents(request);
        return events;
    }
    async fetchCommunity(creatorId, communityId) {
        const decodedCreatorId = creatorId.startsWith('npub1') ? index_1.Nip19.decode(creatorId).data : creatorId;
        let infoMsg = {
            kinds: [34550],
            authors: [decodedCreatorId],
            "#d": [communityId]
        };
        const events = await this._websocketManager.fetchWebSocketEvents(infoMsg);
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
        const events = await this._websocketManager.fetchWebSocketEvents(infoMsg, notesMsg);
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
        const events = await this._websocketManager.fetchWebSocketEvents(request);
        return events;
    }
    async fetchNotes(options) {
        const decodedNpubs = options.authors?.map(npub => index_1.Nip19.decode(npub).data);
        let decodedIds;
        if (options.decodedIds) {
            decodedIds = options.decodedIds;
        }
        else {
            decodedIds = options.ids?.map(id => id.startsWith('note1') ? index_1.Nip19.decode(id).data : id);
        }
        let msg = {
            kinds: [1],
            limit: 20
        };
        if (decodedNpubs)
            msg.authors = decodedNpubs;
        if (decodedIds)
            msg.ids = decodedIds;
        const events = await this._websocketManager.fetchWebSocketEvents(msg);
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
        const events = await this._websocketManager.fetchWebSocketEvents(msg);
        return events;
    }
    async fetchReplies(options) {
        let decodedNoteIds;
        if (options.decodedIds) {
            decodedNoteIds = options.decodedIds;
        }
        else {
            decodedNoteIds = options.noteIds?.map(id => id.startsWith('note1') ? index_1.Nip19.decode(id).data : id);
        }
        const msg = {
            "#e": decodedNoteIds,
            kinds: [1],
            limit: 20,
        };
        const events = await this._websocketManager.fetchWebSocketEvents(msg);
        return events;
    }
    async fetchFollowing(npubs) {
        const decodedNpubs = npubs.map(npub => index_1.Nip19.decode(npub).data);
        const msg = {
            authors: decodedNpubs,
            kinds: [3]
        };
        const events = await this._websocketManager.fetchWebSocketEvents(msg);
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
        await this._websocketManager.submitEvent(event, privateKey);
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
        await this._websocketManager.submitEvent(event, privateKey);
    }
    async updateUserCommunities(communities, privateKey) {
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
        await this._websocketManager.submitEvent(event, privateKey);
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
        await this._websocketManager.submitEvent(event, privateKey);
    }
    async submitNewAccount(content, privateKey) {
        let event = {
            "kind": 0,
            "created_at": Math.round(Date.now() / 1000),
            "content": JSON.stringify(content),
            "tags": []
        };
        await this._websocketManager.submitEvent(event, privateKey);
    }
    async fetchMessageCountsCacheEvents(pubKey) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = {
            user_pubkey: decodedPubKey,
            relation: 'follows'
        };
        const followsEvents = await this._cachedWebsocketManager.fetchCachedEvents('get_directmsg_contacts', msg);
        msg = {
            user_pubkey: decodedPubKey,
            relation: 'other'
        };
        const otherEvents = await this._cachedWebsocketManager.fetchCachedEvents('get_directmsg_contacts', msg);
        return [...followsEvents, ...otherEvents];
    }
    async fetchOldMessages(pubKey, sender, until = 0) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        const decodedSenderPubKey = sender.startsWith('npub1') ? index_1.Nip19.decode(sender).data : sender;
        const start = until === 0 ? 'since' : 'until';
        const msg = {
            receiver: decodedPubKey,
            sender: decodedSenderPubKey,
            limit: 20,
            [start]: until
        };
        const events = await this._cachedWebsocketManager.fetchCachedEvents('get_directmsgs', msg);
        return events;
    }
    async fetchNewMessages(pubKey, sender, since = 0) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        const decodedSenderPubKey = sender.startsWith('npub1') ? index_1.Nip19.decode(sender).data : sender;
        const msg = {
            receiver: decodedPubKey,
            sender: decodedSenderPubKey,
            limit: 20,
            since: since
        };
        const events = await this._cachedWebsocketManager.fetchCachedEvents('get_directmsgs', msg);
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
        await this._websocketManager.submitEvent(event, privateKey);
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
        await this._cachedWebsocketManager.fetchCachedEvents('reset_directmsg_count', msg);
    }
}
exports.NostrEventManager = NostrEventManager;
class SocialDataManager {
    constructor(relays, cachedServer) {
        this._socialEventManager = new NostrEventManager(relays, cachedServer);
    }
    get socialEventManager() {
        return this._socialEventManager;
    }
    hexStringToUint8Array(hexString) {
        return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    }
    base64ToUtf8(base64) {
        if (typeof window !== "undefined") {
            return atob(base64);
        }
        else {
            return Buffer.from(base64, 'base64').toString('utf8');
        }
    }
    async decryptMessage(ourPrivateKey, theirPublicKey, encryptedData) {
        const [encryptedMessage, ivBase64] = encryptedData.split('?iv=');
        const sharedSecret = index_1.Keys.getSharedSecret(ourPrivateKey, '02' + theirPublicKey);
        const sharedX = this.hexStringToUint8Array(sharedSecret.slice(2));
        let decryptedMessage;
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
        return decryptedMessage;
    }
    extractCommunityInfo(event) {
        const communityId = event.tags.find(tag => tag[0] === 'd')?.[1];
        const description = event.tags.find(tag => tag[0] === 'description')?.[1];
        const image = event.tags.find(tag => tag[0] === 'image')?.[1];
        const creatorId = index_1.Nip19.npubEncode(event.pubkey);
        const moderatorIds = event.tags.filter(tag => tag[0] === 'p' && tag?.[3] === 'moderator').map(tag => index_1.Nip19.npubEncode(tag[1]));
        const scpTag = event.tags.find(tag => tag[0] === 'scp');
        let scpData;
        let gatekeeperNpub;
        if (scpTag && scpTag[1] === '1') {
            const scpDataStr = this.base64ToUtf8(scpTag[2]);
            if (!scpDataStr.startsWith('$scp:'))
                return null;
            scpData = JSON.parse(scpDataStr.substring(5));
            if (scpData.gatekeeperPublicKey) {
                gatekeeperNpub = index_1.Nip19.npubEncode(scpData.gatekeeperPublicKey);
            }
        }
        const communityUri = `34550:${event.pubkey}:${communityId}`;
        let communityInfo = {
            creatorId,
            moderatorIds,
            communityUri,
            communityId,
            description,
            bannerImgUrl: image,
            scpData,
            eventData: event,
            gatekeeperNpub
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
        return {
            notes,
            info: communityInfo
        };
    }
    async retrieveCommunityUri(noteEvent, scpData) {
        const extractCommunityUri = (noteEvent) => {
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
        };
        let communityUri = extractCommunityUri(noteEvent);
        return communityUri;
    }
    extractPostScpData(noteEvent) {
        const scpTag = noteEvent.tags.find(tag => tag[0] === 'scp');
        let scpData;
        if (scpTag && scpTag[1] === '2') {
            const scpDataStr = this.base64ToUtf8(scpTag[2]);
            if (!scpDataStr.startsWith('$scp:'))
                return null;
            scpData = JSON.parse(scpDataStr.substring(5));
        }
        return scpData;
    }
    async retrievePostPrivateKey(noteEvent, communityUri, communityPrivateKey) {
        let key = null;
        let postScpData = this.extractPostScpData(noteEvent);
        try {
            const postPrivateKey = await this.decryptMessage(communityPrivateKey, noteEvent.pubkey, postScpData.encryptedKey);
            const messageContentStr = await this.decryptMessage(postPrivateKey, noteEvent.pubkey, noteEvent.content);
            const messageContent = JSON.parse(messageContentStr);
            if (communityUri === messageContent.communityUri) {
                key = postPrivateKey;
            }
        }
        catch (e) {
        }
        return key;
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
        else if (options.privateKey) {
            const communityEvents = await this.retrieveCommunityEvents(options.creatorId, options.communityId);
            const communityInfo = communityEvents.info;
            const notes = communityEvents.notes;
            let communityPrivateKey = await this.decryptMessage(options.privateKey, communityInfo.scpData.gatekeeperPublicKey, communityInfo.scpData.encryptedKey);
            for (const note of notes) {
                const postPrivateKey = await this.retrievePostPrivateKey(note, communityInfo.communityUri, communityPrivateKey);
                if (postPrivateKey) {
                    noteIdToPrivateKey[note.id] = postPrivateKey;
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
    async fetchThreadNotesInfo(id, fetchFromCache = true) {
        let focusedNote;
        let ancestorNotes = [];
        let replies = [];
        let metadataByPubKeyMap = {};
        let childReplyEventTagIds = [];
        let quotedNotesMap = {};
        let relevantNotes = [];
        if (fetchFromCache) {
            let decodedId = index_1.Nip19.decode(id).data;
            const threadEvents = await this._socialEventManager.fetchThreadCacheEvents(decodedId);
            for (let threadEvent of threadEvents) {
                if (threadEvent.kind === 0) {
                    metadataByPubKeyMap[threadEvent.pubkey] = {
                        ...threadEvent,
                        content: JSON.parse(threadEvent.content)
                    };
                }
                else if (threadEvent.kind === 1) {
                    if (threadEvent.id === decodedId) {
                        focusedNote = threadEvent;
                    }
                    else if (threadEvent.tags.some(tag => tag[0] === 'e' && tag[1] === decodedId)) {
                        replies.push(threadEvent);
                    }
                    else {
                        ancestorNotes.push(threadEvent);
                    }
                }
                else if (threadEvent.kind === 10000107) {
                    const note = JSON.parse(threadEvent.content);
                    quotedNotesMap[note.id] = note;
                }
            }
            relevantNotes = [
                ...ancestorNotes,
                focusedNote,
                ...replies
            ];
        }
        else {
            const focusedNotes = await this._socialEventManager.fetchNotes({
                ids: [id]
            });
            if (focusedNotes.length === 0)
                return null;
            focusedNote = focusedNotes[0];
            const ancestorDecodedIds = focusedNote.tags.filter(tag => tag[0] === 'e')?.map(tag => tag[1]) || [];
            if (ancestorDecodedIds.length > 0) {
                ancestorNotes = await this._socialEventManager.fetchNotes({
                    decodedIds: ancestorDecodedIds
                });
            }
            childReplyEventTagIds = [...ancestorDecodedIds, index_1.Nip19.decode(id).data];
            replies = await this._socialEventManager.fetchReplies({
                decodedIds: childReplyEventTagIds
            });
            relevantNotes = [
                ...ancestorNotes,
                focusedNote,
                ...replies
            ];
            metadataByPubKeyMap = await this.constructMetadataByPubKeyMap(relevantNotes);
        }
        let communityInfo = null;
        let scpData = this.extractPostScpData(focusedNote);
        if (scpData) {
            const communityUri = await this.retrieveCommunityUri(focusedNote, scpData);
            if (communityUri) {
                const creatorId = communityUri.split(':')[1];
                const communityId = communityUri.split(':')[2];
                const communityEvents = await this._socialEventManager.fetchCommunity(creatorId, communityId);
                const communityEvent = communityEvents.find(event => event.kind === 34550);
                if (!communityEvent)
                    throw new Error('No info event found');
                communityInfo = this.extractCommunityInfo(communityEvent);
            }
        }
        return {
            focusedNote,
            ancestorNotes,
            replies,
            metadataByPubKeyMap,
            quotedNotesMap,
            childReplyEventTagIds,
            communityInfo
        };
    }
}
exports.SocialDataManager = SocialDataManager;
