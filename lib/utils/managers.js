"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NostrEventManager = void 0;
const index_1 = require("../core/index");
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
    createWebSocket() {
        if (typeof window === 'object') {
            this.ws = new WebSocket(this._url);
        }
        else {
            let WebSocket = require('ws');
            this.ws = new WebSocket(this._url);
        }
    }
    generateRandomNumber() {
        let randomNumber = '';
        for (let i = 0; i < 10; i++) {
            randomNumber += Math.floor(Math.random() * 10).toString();
        }
        return randomNumber;
    }
    establishConnection(requestId, cb) {
        this.requestCallbackMap[requestId] = cb;
        return new Promise((resolve) => {
            const openListener = () => {
                console.log('Connected to server');
                this.ws.removeEventListener('open', openListener);
                resolve(this.ws);
            };
            if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
                this.createWebSocket();
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
            decodedIds = options.ids?.map(id => index_1.Nip19.decode(id).data);
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
            decodedNoteIds = options.noteIds.map(id => index_1.Nip19.decode(id).data);
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
}
exports.NostrEventManager = NostrEventManager;
