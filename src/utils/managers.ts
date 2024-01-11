import { Utils } from "@ijstech/eth-wallet";
import { Nip19, Event, Keys } from "../core/index";
import { CalendarEventType, CommunityRole, ICalendarEventAttendee, ICalendarEventDetailInfo, ICalendarEventHost, ICalendarEventInfo, IChannelInfo, IChannelScpData, ICommunityBasicInfo, ICommunityInfo, IConversationPath, IMessageContactInfo, INewChannelMessageInfo, INewCommunityInfo, INewCommunityPostInfo, INostrEvent, INostrMetadata, INostrMetadataContent, INostrSubmitResponse, INoteCommunityInfo, INoteInfo, IPostStats, IRetrieveChannelMessageKeysOptions, IRetrieveCommunityPostKeysByNoteEventsOptions, IRetrieveCommunityPostKeysOptions, IRetrieveCommunityThreadPostKeysOptions, IUpdateCalendarEventInfo, IUserActivityStats, IUserProfile, MembershipType, ScpStandardId } from "./interfaces";
import Geohash from './geohash';

interface IFetchNotesOptions {
    authors?: string[];
    ids?: string[];
}

interface IFetchMetadataOptions {
    authors?: string[];
    decodedAuthors?: string[];
}

interface IFetchRepliesOptions {
    noteIds?: string[];
    decodedIds?: string[];
}

function determineWebSocketType() {
	if (typeof window !== "undefined"){
        return WebSocket;
	}
	else{
        // @ts-ignore
        let WebSocket = require('ws');
        return WebSocket;
	};
};

function convertUnixTimestampToDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2); 
    const day = ("0" + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
}

class NostrWebSocketManager {
    protected _url: string;
    protected ws: any;
    protected requestCallbackMap: Record<string, (message: any) => void> = {};

    constructor(url) {
        this._url = url;
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

    establishConnection(requestId: string, cb: (message: any) => void) {
        const WebSocket = determineWebSocketType();
        this.requestCallbackMap[requestId] = cb; 
        return new Promise<WebSocket>((resolve) => {
            const openListener = () => {
                console.log('Connected to server');
                this.ws.removeEventListener('open', openListener);
                resolve(this.ws);
            }
            if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
                this.ws = new WebSocket(this._url);
                this.ws.addEventListener('open', openListener);
                this.ws.addEventListener('message', (event) => {
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
    async fetchWebSocketEvents(...requests: any) {
        let requestId;
        do {
            requestId = this.generateRandomNumber();
        } while (this.requestCallbackMap[requestId]);
        return new Promise<INostrEvent[]>(async (resolve, reject) => {
            let events: INostrEvent[] = [];
            const ws = await this.establishConnection(requestId, (message) => {
                if (message[0] === "EVENT") {
                    const eventData = message[2];
                    // Implement the verifySignature function according to your needs
                    // console.log(verifySignature(eventData)); // true
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
    async submitEvent(event: Event.EventTemplate<number>, privateKey: string) {
        return new Promise<INostrSubmitResponse>(async (resolve, reject) => {
            const verifiedEvent = Event.finishEvent(event, privateKey)
            let msg = JSON.stringify(["EVENT", verifiedEvent]);
            console.log(msg);
            const ws = await this.establishConnection(verifiedEvent.id, (message) => {
                console.log('from server:', message);
                resolve({
                    eventId: message[1],
                    success: message[2],
                    message: message[3]
                });
            });
            ws.send(msg);
        });
    }
}

class NostrCachedWebSocketManager extends NostrWebSocketManager {
    async fetchCachedEvents(eventType: string, msg: any) {
        let requestId;
        do {
            requestId = eventType + '_' + this.generateRandomNumber();
        } while (this.requestCallbackMap[requestId]);
        return new Promise<INostrEvent[]>(async (resolve, reject) => {
            let events: INostrEvent[] = [];
            const ws = await this.establishConnection(requestId, (message) => {
                // console.log('from server:', message);
                if (message[0] === "EVENT") {
                    const eventData = message[2];
                    // Implement the verifySignature function according to your needs
                    // console.log(verifySignature(eventData)); // true
                    events.push(eventData);
                } else if (message[0] === "EOSE") {
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
    private _relays: string[];
    private _cachedServer: string;
    private _websocketManager: NostrWebSocketManager;
    private _cachedWebsocketManager: NostrCachedWebSocketManager;
    private _apiBaseUrl: string;

    constructor(relays: string[], cachedServer: string, apiBaseUrl: string) {
        this._relays = relays;
        this._cachedServer = cachedServer;
        this._websocketManager = new NostrWebSocketManager(this._relays[0]);
        this._cachedWebsocketManager = new NostrCachedWebSocketManager(this._cachedServer);
        this._apiBaseUrl = apiBaseUrl;
    }

    async fetchThreadCacheEvents(id: string, pubKey?: string) {
        let decodedId = id.startsWith('note1') ? Nip19.decode(id).data : id;
        let msg: any = {
            event_id: decodedId,
            limit: 100
        };
        if (pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
            msg.user_pubkey = decodedPubKey;
        }
        const events = await this._cachedWebsocketManager.fetchCachedEvents('thread_view', msg);
        return events;
    }

    async fetchTrendingCacheEvents(pubKey?: string) {
        let msg: any = {
        };
        if (pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
            msg.user_pubkey = decodedPubKey;
        }
        const events = await this._cachedWebsocketManager.fetchCachedEvents('explore_global_trending_24h', msg);
        return events;
    }

    async fetchProfileFeedCacheEvents(pubKey: string, since: number = 0) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg: any = {
            limit: 20,
            notes: "authored",
            pubkey: decodedPubKey,
            since,
            user_pubkey: decodedPubKey
        };
        const events = await this._cachedWebsocketManager.fetchCachedEvents('feed', msg);
        return events;
    }

    async fetchProfileRepliesCacheEvents(pubKey: string, since: number = 0) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg: any = {
            limit: 20,
            notes: "replies",
            pubkey: decodedPubKey,
            since,
            user_pubkey: decodedPubKey
        };
        const events = await this._cachedWebsocketManager.fetchCachedEvents('feed', msg);
        return events;
    }

    async fetchHomeFeedCacheEvents(pubKey?: string, since: number = 0) {
        let msg: any = {
            limit: 20,
            since
        };
        if (pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
            msg.pubkey = decodedPubKey;
            msg.user_pubkey = decodedPubKey;
        }
        else {
            msg.pubkey = Nip19.decode('npub1nfgqmnxqsjsnsvc2r5djhcx4ap3egcjryhf9ppxnajskfel2dx9qq6mnsp').data //FIXME: Account to show Nostr highlights 
        }
        const events = await this._cachedWebsocketManager.fetchCachedEvents('feed', msg);
        return events;
    }

    async fetchUserProfileCacheEvents(pubKeys: string[]) {
        const decodedPubKeys = pubKeys.map(pubKey => pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey);
        let msg: any = {
            pubkeys: decodedPubKeys
        };
        const events = await this._cachedWebsocketManager.fetchCachedEvents('user_infos', msg);
        return events;
    }

    async fetchUserProfileDetailCacheEvents(pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg: any = {
            pubkey: decodedPubKey,
            user_pubkey: decodedPubKey
        };
        const events = await this._cachedWebsocketManager.fetchCachedEvents('user_profile', msg);
        return events;
    }

    async fetchContactListCacheEvents(pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg: any = {
            extended_response: true,
            pubkey: decodedPubKey
        };
        const events = await this._cachedWebsocketManager.fetchCachedEvents('contact_list', msg);
        return events;
    }    

    async fetchFollowersCacheEvents(pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg: any = {
            pubkey: decodedPubKey
        };
        const events = await this._cachedWebsocketManager.fetchCachedEvents('user_followers', msg);
        return events;
    }  

    async fetchRelaysCacheEvents(pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg: any = {
            extended_response: false,
            pubkey: decodedPubKey
        };
        const events = await this._cachedWebsocketManager.fetchCachedEvents('contact_list', msg);
        return events;
    }   

    async fetchCommunities(pubkeyToCommunityIdsMap?: Record<string, string[]>) {
        let events;
        if (pubkeyToCommunityIdsMap && Object.keys(pubkeyToCommunityIdsMap).length > 0) {
            let requests: any[] = [];
            for (let pubkey in pubkeyToCommunityIdsMap) {
                const decodedPubKey = pubkey.startsWith('npub1') ? Nip19.decode(pubkey).data : pubkey;
                const communityIds = pubkeyToCommunityIdsMap[pubkey];
                let request: any = {
                    kinds: [34550],
                    authors: [decodedPubKey],
                    "#d": communityIds
                };
                requests.push(request);
            }
            events = await this._websocketManager.fetchWebSocketEvents(...requests);
        }
        else {
            let request: any = {
                kinds: [34550],
                limit: 50
            };
            events = await this._websocketManager.fetchWebSocketEvents(request);
        }
        return events;
    }

    async fetchAllUserRelatedCommunities(pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let requestForCreatedCommunities: any = {
            kinds: [0, 3, 34550],
            authors: [decodedPubKey]
        };
        let requestForFollowedCommunities: any = {
            kinds: [30001],
            "#d": ["communities"],
            authors: [decodedPubKey]
        }
        let requestForModeratedCommunities: any = {
            kinds: [34550],
            "#p": [decodedPubKey]
        };
        const events = await this._websocketManager.fetchWebSocketEvents(
            requestForCreatedCommunities, 
            requestForFollowedCommunities,
            requestForModeratedCommunities
        );
        return events;
    }

    async fetchUserBookmarkedCommunities(pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let request: any = {
            kinds: [30001],
            "#d": ["communities"],
            authors: [decodedPubKey]
        };
        const events = await this._websocketManager.fetchWebSocketEvents(request);
        return events;
    }

    async fetchCommunity(creatorId: string, communityId: string) {
        const decodedCreatorId = creatorId.startsWith('npub1') ? Nip19.decode(creatorId).data : creatorId;
        let infoMsg: any = {
            kinds: [34550],
            authors: [decodedCreatorId],
            "#d": [communityId]
        };
        const events = await this._websocketManager.fetchWebSocketEvents(infoMsg);
        return events;        
    }

    async fetchCommunityFeed(creatorId: string, communityId: string) {
        const decodedCreatorId = creatorId.startsWith('npub1') ? Nip19.decode(creatorId).data : creatorId;
        let infoMsg: any = {
            kinds: [34550],
            authors: [decodedCreatorId],
            "#d": [communityId]
        };
        let notesMsg: any = {
            kinds: [1, 7, 9735],
            "#a": [`34550:${decodedCreatorId}:${communityId}`],
            limit: 50
        };
        const events = await this._websocketManager.fetchWebSocketEvents(infoMsg, notesMsg);
        return events;        
    }

    async fetchCommunitiesGeneralMembers(communities: ICommunityBasicInfo[]) {
        const communityUriArr: string[] = [];
        for (let community of communities) {
            const decodedCreatorId = community.creatorId.startsWith('npub1') ? Nip19.decode(community.creatorId).data : community.creatorId;
            communityUriArr.push(`34550:${decodedCreatorId}:${community.communityId}`);
        }
        let request: any = {
            kinds: [30001],
            "#d": ["communities"],
            "#a": communityUriArr
        };
        const events = await this._websocketManager.fetchWebSocketEvents(request);
        return events;        
    }

    async fetchNotes(options: IFetchNotesOptions) {
        const decodedNpubs = options.authors?.map(npub => Nip19.decode(npub).data);
        let decodedIds = options.ids?.map(id => id.startsWith('note1') ? Nip19.decode(id).data : id);
        let msg: any = {
            kinds: [1],
            limit: 20
        };
        if (decodedNpubs) msg.authors = decodedNpubs;
        if (decodedIds) msg.ids = decodedIds;
        const events = await this._websocketManager.fetchWebSocketEvents(msg);
        return events;
    }

    async fetchMetadata(options: IFetchMetadataOptions) {
        let decodedNpubs;
        if (options.decodedAuthors) {
            decodedNpubs = options.decodedAuthors;
        }
        else {
            decodedNpubs = options.authors?.map(npub => Nip19.decode(npub).data) || [];
        }
        const msg = {
            authors: decodedNpubs,
            kinds: [0]
        };
        const events = await this._websocketManager.fetchWebSocketEvents(msg);
        return events;
    }

    async fetchReplies(options: IFetchRepliesOptions) {
        let decodedNoteIds;
        if (options.decodedIds) {
            decodedNoteIds = options.decodedIds;
        }
        else {
            decodedNoteIds = options.noteIds?.map(id => id.startsWith('note1') ? Nip19.decode(id).data : id);
        }
        const msg = {
            "#e": decodedNoteIds,
            kinds: [1],
            limit: 20,
        }
        const events = await this._websocketManager.fetchWebSocketEvents(msg);
        return events;
    }

    async fetchFollowing(npubs: string[]) {
        const decodedNpubs = npubs.map(npub => Nip19.decode(npub).data);
        const msg = {
            authors: decodedNpubs,
            kinds: [3]
        }
        const events = await this._websocketManager.fetchWebSocketEvents(msg);
        return events;
    }

    async postNote(content: string, privateKey: string, conversationPath?: IConversationPath) {
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

    calculateConversationPathTags(conversationPath: IConversationPath) {
        let tags: string[][] = [];
        for (let i = 0; i < conversationPath.noteIds.length; i++) {
            const noteId = conversationPath.noteIds[i];
            const decodedNoteId = noteId.startsWith('note1') ? Nip19.decode(noteId).data as string : noteId;
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
            const decodedAuthorId = authorId.startsWith('npub1') ? Nip19.decode(authorId).data as string : authorId;
            tags.push([
                "p",
                decodedAuthorId
            ]);
        }
        return tags;
    }

    async deleteEvents(eventIds: string[], privateKey: string) {
        let event = {
            "kind": 5,
            "created_at": Math.round(Date.now() / 1000),
            "content": "",
            "tags": []
        };
        for (let eventId of eventIds) {
            const decodedEventId = eventId.startsWith('note1') ? Nip19.decode(eventId).data as string : eventId;
            event.tags.push([
                "e",
                decodedEventId
            ]);
        }
        const response = await this._websocketManager.submitEvent(event, privateKey);
        return response;
    }

    async updateChannel(info: IChannelInfo, privateKey: string) {
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
        const response = await this._websocketManager.submitEvent(event, privateKey);
        return response;
    }

    async updateUserBookmarkedChannels(channelEventIds: string[], privateKey: string) {
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
        await this._websocketManager.submitEvent(event, privateKey);
    }

    async fetchAllUserRelatedChannels(pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let requestForCreatedChannels: any = {
            kinds: [40, 41],
            authors: [decodedPubKey]
        };
        let requestForJoinedChannels: any = {
            kinds: [30001],
            "#d": ["channels"],
            authors: [decodedPubKey]
        }
        let requestForModeratedCommunities: any = {
            kinds: [34550],
            "#p": [decodedPubKey]
        };
        const events = await this._websocketManager.fetchWebSocketEvents(
            requestForCreatedChannels, 
            requestForJoinedChannels,
            requestForModeratedCommunities
        );
        return events;
    }

    async fetchUserBookmarkedChannels(pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let requestForJoinedChannels: any = {
            kinds: [30001],
            "#d": ["channels"],
            authors: [decodedPubKey]
        }
        const events = await this._websocketManager.fetchWebSocketEvents(requestForJoinedChannels);
        return events;
    }

    async fetchChannels(channelEventIds: string[]) {
        let request: any = {
            kinds: [40, 41],
            ids: channelEventIds
        };
        let events = await this._websocketManager.fetchWebSocketEvents(request);
        return events;
    }

    async fetchChannelMessages(channelId: string, since: number = 0, until: number = 0) {
        const decodedChannelId = channelId.startsWith('npub1') ? Nip19.decode(channelId).data : channelId;
        let messagesReq: any = {
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
        const events = await this._websocketManager.fetchWebSocketEvents(
            messagesReq
        );
        return events;        
    }

    async fetchChannelInfoMessages(creatorId: string, channelId: string) {
        const decodedCreatorId = creatorId.startsWith('npub1') ? Nip19.decode(creatorId).data : creatorId;
        let channelCreationEventReq: any = {
            kinds: [40],
            ids: [channelId],
            authors: [decodedCreatorId]
        };
        let channelMetadataEventReq: any = {
            kinds: [41],
            "#e": [channelId],
            authors: [decodedCreatorId]
        };
        let messagesReq: any = {
            kinds: [42],
            "#e": [channelId],
            limit: 20
        };
        const events = await this._websocketManager.fetchWebSocketEvents(
            channelCreationEventReq, 
            channelMetadataEventReq,
            messagesReq
        );
        return events;        
    }

    async updateCommunity(info: ICommunityInfo, privateKey: string) {
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
            const decodedModeratorId = moderatorId.startsWith('npub1') ? Nip19.decode(moderatorId).data as string : moderatorId;
            event.tags.push([
                "p",
                decodedModeratorId,
                "",
                "moderator"
            ]);
        }
        const response = await this._websocketManager.submitEvent(event, privateKey);
        return response;
    }

    async updateUserBookmarkedCommunities(communities: ICommunityBasicInfo[], privateKey: string) {
        let communityUriArr: string[] = [];
        for (let community of communities) {
            const decodedCreatorId = community.creatorId.startsWith('npub1') ? Nip19.decode(community.creatorId).data as string : community.creatorId;
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

    async submitCommunityPost(info: INewCommunityPostInfo, privateKey: string) {
        const community = info.community;
        const decodedCreatorId = community.creatorId.startsWith('npub1') ? Nip19.decode(community.creatorId).data as string : community.creatorId;
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

    async submitChannelMessage(info: INewChannelMessageInfo, privateKey: string) {
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
        await this._websocketManager.submitEvent(event, privateKey);
    }

    async updateUserProfile(content: INostrMetadataContent, privateKey: string) {
        let event = {
            "kind": 0,
            "created_at": Math.round(Date.now() / 1000),
            "content": JSON.stringify(content),
            "tags": []
        };
        await this._websocketManager.submitEvent(event, privateKey);
    }

    async fetchMessageContactsCacheEvents(pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg: any = {
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

    async fetchDirectMessages(pubKey: string, sender: string, since: number = 0, until: number = 0) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        const decodedSenderPubKey = sender.startsWith('npub1') ? Nip19.decode(sender).data : sender;
        const req: any = {
            receiver: decodedPubKey,
            sender: decodedSenderPubKey,
            limit: 20
        }
        if (until === 0) {
            req.since = since;
        }
        else {
            req.until = until;
        }
        const events = await this._cachedWebsocketManager.fetchCachedEvents('get_directmsgs', req);
        return events;
    }

    async sendMessage(receiver: string, encryptedMessage: string, privateKey: string) {
        const decodedPubKey = receiver.startsWith('npub1') ? Nip19.decode(receiver).data : receiver;
        let event = {
            "kind": 4,
            "created_at": Math.round(Date.now() / 1000),
            "content": encryptedMessage,
            "tags": [
                [
                    'p',
                    decodedPubKey as string
                ]
            ]
        }
        await this._websocketManager.submitEvent(event, privateKey);
    }

    async resetMessageCount(pubKey: string, sender: string, privateKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data as string : pubKey;
        const decodedSenderPubKey = sender.startsWith('npub1') ? Nip19.decode(sender).data : sender;
        const createAt = Math.ceil(Date.now() / 1000);
        let event: any = {
            "content": JSON.stringify({ "description": `reset messages from '${decodedSenderPubKey}'`}),
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
        event.id = Event.getEventHash(event);
        event.sig = Event.getSignature(event, privateKey);
        const msg: any = {
            event_from_user: event,
            sender: decodedSenderPubKey
        };
        await this._cachedWebsocketManager.fetchCachedEvents('reset_directmsg_count', msg);
    }

    async fetchGroupKeys(identifier: string) {
        let req: any = {
            kinds: [30078],
            "#d": [identifier]
        };
        const events = await this._websocketManager.fetchWebSocketEvents(req);
        return events?.length > 0 ? events[0] : null;
    }

    async fetchUserGroupInvitations(groupKinds: number[], pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data as string : pubKey;
        let req: any = {
            kinds: [30078],
            "#p": [decodedPubKey],
            "#k": groupKinds.map(kind => kind.toString())
        };
        let events = await this._websocketManager.fetchWebSocketEvents(req);
        events = events.filter(event => event.tags.filter(tag => tag[0] === 'p' && tag?.[3] === 'invitee').map(tag => tag[1]).includes(decodedPubKey));
        return events;
    }

    async updateGroupKeys(identifier: string, groupKind: number, keys: string, invitees: string[], privateKey: string) {
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
            const decodedInvitee = invitee.startsWith('npub1') ? Nip19.decode(invitee).data as string : invitee;
            event.tags.push([
                "p",
                decodedInvitee,
                "",
                "invitee"
            ]);
        }
        const response = await this._websocketManager.submitEvent(event, privateKey);
        return response;
    }
    
    async updateCalendarEvent(info: IUpdateCalendarEventInfo, privateKey: string) {
        let kind;
        let start: string;
        let end: string;
        if (info.type === CalendarEventType.DateBased) {
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
        }
        if (info.image) {
            event.tags.push([
                "image",
                info.image
            ]);
        }
        if (info.end) {
            if (info.type === CalendarEventType.DateBased) {
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
                const decodedHostId = hostId.startsWith('npub1') ? Nip19.decode(hostId).data as string : hostId;
                event.tags.push([
                    "p",
                    decodedHostId,
                    "",
                    "host"
                ]);
            }
        }
        const response = await this._websocketManager.submitEvent(event, privateKey);
        if (response.success) {
            let pubkey = SocialUtilsManager.convertPrivateKeyToPubkey(privateKey);
            let eventKey = `${kind}:${pubkey}:${info.id}`;
            let apiRequestBody: any = {
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
        return response;
    }

    async fetchCalendarEvents(start: number, end?: number, limit?: number) {
        let req: any;
        if (this._apiBaseUrl) {
            let queriesObj: any = {
                start: start.toString()
            };
            if (end) {
                queriesObj.end = end.toString();
            }
            let queries = new URLSearchParams(queriesObj).toString();
            const apiUrl = `${this._apiBaseUrl}/calendar-events?${queries}`;
            const apiResponse = await fetch(apiUrl);
            const apiResult = await apiResponse.json();
            let calendarEventIds: string[] = [];
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
        const events = await this._websocketManager.fetchWebSocketEvents(req);
        return events;
    }

    async fetchCalendarEvent(address: Nip19.AddressPointer) {
        let req: any = {
            kinds: [address.kind],
            "#d": [address.identifier],
            authors: [address.pubkey]
        };
        const events = await this._websocketManager.fetchWebSocketEvents(req);
        return events?.length > 0 ? events[0] : null;
    }

    async createCalendarEventRSVP(rsvpId: string, calendarEventUri: string, accepted: boolean, privateKey: string) {
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
        const response = await this._websocketManager.submitEvent(event, privateKey);
        return response;
    }

    async fetchCalendarEventRSVPs(calendarEventUri: string, pubkey?: string) {
        let req: any = {
            kinds: [31925],
            "#a": [calendarEventUri]
        };
        if (pubkey) {
            const decodedPubKey = pubkey.startsWith('npub1') ? Nip19.decode(pubkey).data : pubkey;
            req.authors = [decodedPubKey];
        }
        const events = await this._websocketManager.fetchWebSocketEvents(req);
        return events;
    }
}

interface ISocialEventManager {
    fetchThreadCacheEvents(id: string, pubKey?: string): Promise<INostrEvent[]>;
    fetchTrendingCacheEvents(pubKey?: string): Promise<INostrEvent[]>;
    fetchProfileFeedCacheEvents(pubKey: string, since?: number): Promise<INostrEvent[]>;
    fetchProfileRepliesCacheEvents(pubKey: string, since?: number): Promise<INostrEvent[]>;
    fetchHomeFeedCacheEvents(pubKey?: string, since?: number): Promise<INostrEvent[]>;
    fetchUserProfileCacheEvents(pubKeys: string[]): Promise<INostrEvent[]>;
    fetchUserProfileDetailCacheEvents(pubKey: string): Promise<INostrEvent[]>;
    fetchContactListCacheEvents(pubKey: string): Promise<INostrEvent[]>;
    fetchFollowersCacheEvents(pubKey: string): Promise<INostrEvent[]>;
    fetchRelaysCacheEvents(pubKey: string): Promise<INostrEvent[]>;
    fetchCommunities(pubkeyToCommunityIdsMap?: Record<string, string[]>): Promise<INostrEvent[]>;
    fetchAllUserRelatedCommunities(pubKey: string): Promise<INostrEvent[]>;
    fetchUserBookmarkedCommunities(pubKey: string): Promise<INostrEvent[]>;
    fetchCommunity(creatorId: string, communityId: string): Promise<INostrEvent[]>;
    fetchCommunityFeed(creatorId: string, communityId: string): Promise<INostrEvent[]>;
    fetchCommunitiesGeneralMembers(communities: ICommunityBasicInfo[]): Promise<INostrEvent[]>;
    fetchNotes(options: IFetchNotesOptions): Promise<INostrEvent[]>;
    fetchMetadata(options: IFetchMetadataOptions): Promise<INostrEvent[]>;
    fetchReplies(options: IFetchRepliesOptions): Promise<INostrEvent[]>;
    fetchFollowing(npubs: string[]): Promise<INostrEvent[]>;
    postNote(content: string, privateKey: string, conversationPath?: IConversationPath): Promise<void>;
    deleteEvents(eventIds: string[], privateKey: string): Promise<INostrSubmitResponse>;
    updateCommunity(info: ICommunityInfo, privateKey: string): Promise<INostrSubmitResponse>;
    updateChannel(info: IChannelInfo, privateKey: string): Promise<INostrSubmitResponse>;
    fetchChannels(channelEventIds: string[]): Promise<INostrEvent[]>;
    updateUserBookmarkedChannels(channelEventIds: string[], privateKey: string): Promise<void>;
    fetchAllUserRelatedChannels(pubKey: string): Promise<INostrEvent[]>;
    fetchUserBookmarkedChannels(pubKey: string): Promise<INostrEvent[]>;
    submitChannelMessage(info: INewChannelMessageInfo, privateKey: string): Promise<void>;
    fetchChannelMessages(channelId: string, since?: number, until?: number): Promise<INostrEvent[]>;
    fetchChannelInfoMessages(creatorId: string, channelId: string): Promise<INostrEvent[]>;
    updateUserBookmarkedCommunities(communities: ICommunityBasicInfo[], privateKey: string): Promise<void>;
    submitCommunityPost(info: INewCommunityPostInfo, privateKey: string): Promise<void>;
    updateUserProfile(content: INostrMetadataContent, privateKey: string): Promise<void>;
    fetchMessageContactsCacheEvents(pubKey: string): Promise<INostrEvent[]>;
    fetchDirectMessages(pubKey: string, sender: string, since?: number, until?: number): Promise<INostrEvent[]>;
    sendMessage(receiver: string, encryptedMessage: string, privateKey: string): Promise<void>;
    resetMessageCount(pubKey: string, sender: string, privateKey: string): Promise<void>;
    fetchGroupKeys(identifier: string): Promise<INostrEvent>;
    fetchUserGroupInvitations(groupKinds: number[], pubKey: string): Promise<INostrEvent[]>;
    updateGroupKeys(identifier: string, groupKind: number, keys: string, invitees: string[], privateKey: string): Promise<INostrSubmitResponse>;
    updateCalendarEvent(info: IUpdateCalendarEventInfo, privateKey: string): Promise<INostrSubmitResponse>;
    fetchCalendarEvents(start: number, end?: number, limit?: number): Promise<INostrEvent[]>;
    fetchCalendarEvent(address: Nip19.AddressPointer): Promise<INostrEvent | null>;
    createCalendarEventRSVP(rsvpId: string, calendarEventUri: string, accepted: boolean, privateKey: string): Promise<INostrSubmitResponse>;
    fetchCalendarEventRSVPs(calendarEventUri: string, pubkey?: string): Promise<INostrEvent[]>;
}

class SocialUtilsManager {
    static hexStringToUint8Array(hexString: string): Uint8Array {
        return new Uint8Array(hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    }

    static base64ToUtf8(base64: string): string {
        if (typeof window !== "undefined"){
            return atob(base64);
        }
        else {
            // @ts-ignore
            return Buffer.from(base64, 'base64').toString('utf8');
        }
    }

    static convertPrivateKeyToPubkey(privateKey: string) {
        if (privateKey.startsWith('0x')) privateKey = privateKey.replace('0x', '');
        let pub = Utils.padLeft(Keys.getPublicKey(privateKey), 64);
        return pub;
    }

    static async encryptMessage(ourPrivateKey: string, theirPublicKey: string, text: string): Promise<string> {
        const sharedSecret = Keys.getSharedSecret(ourPrivateKey, '02' + theirPublicKey);
        const sharedX = SocialUtilsManager.hexStringToUint8Array(sharedSecret.slice(2));
        
        let encryptedMessage;
        let ivBase64;
        if (typeof window !== "undefined"){
            const iv = crypto.getRandomValues(new Uint8Array(16));
            const key = await crypto.subtle.importKey('raw', sharedX, { name: 'AES-CBC' }, false, ['encrypt']);
            const encryptedBuffer = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, new TextEncoder().encode(text));
            encryptedMessage = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
            ivBase64 = btoa(String.fromCharCode(...iv));
        }
        else {
            // @ts-ignore
            const crypto = require('crypto');
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-cbc', sharedX, iv);
            encryptedMessage = cipher.update(text, 'utf8', 'base64');
            encryptedMessage += cipher.final('base64');
            ivBase64 = iv.toString('base64');
        }
        return `${encryptedMessage}?iv=${ivBase64}`;
    }

    static async decryptMessage(ourPrivateKey: string, theirPublicKey: string, encryptedData: string): Promise<string> {
        let decryptedMessage = null;
        try {
            const [encryptedMessage, ivBase64] = encryptedData.split('?iv=');
            
            const sharedSecret = Keys.getSharedSecret(ourPrivateKey, '02' + theirPublicKey);
            const sharedX = SocialUtilsManager.hexStringToUint8Array(sharedSecret.slice(2)); 
            if (typeof window !== "undefined"){
                const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
                const key = await crypto.subtle.importKey('raw', sharedX, { name: 'AES-CBC' }, false, ['decrypt']);
                const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0)));
                decryptedMessage = new TextDecoder().decode(decryptedBuffer);
            }
            else {
                // @ts-ignore
                const crypto = require('crypto');
                // @ts-ignore
                const iv = Buffer.from(ivBase64, 'base64');
                const decipher = crypto.createDecipheriv('aes-256-cbc', sharedX, iv);
                // @ts-ignore
                let decrypted = decipher.update(Buffer.from(encryptedMessage, 'base64'));
                // @ts-ignore
                decrypted = Buffer.concat([decrypted, decipher.final()]);
                decryptedMessage = decrypted.toString('utf8');
            }
        }
        catch (e) {
        }
        return decryptedMessage;
    }
}

class SocialDataManager {
    private _socialEventManager: ISocialEventManager;

    constructor(relays: string[], cachedServer: string, apiBaseUrl: string) {
        this._socialEventManager = new NostrEventManager(relays, cachedServer, apiBaseUrl);
    }

    get socialEventManager() {
        return this._socialEventManager;
    }

    extractCommunityInfo(event: INostrEvent) {
        const communityId = event.tags.find(tag => tag[0] === 'd')?.[1];
        const description = event.tags.find(tag => tag[0] === 'description')?.[1];
        const rules = event.tags.find(tag => tag[0] === 'rules')?.[1];
        const image = event.tags.find(tag => tag[0] === 'image')?.[1];
        const creatorId = Nip19.npubEncode(event.pubkey);
        const moderatorIds = event.tags.filter(tag => tag[0] === 'p' && tag?.[3] === 'moderator').map(tag => Nip19.npubEncode(tag[1]));
        const scpTag = event.tags.find(tag => tag[0] === 'scp');
        let scpData;
        let gatekeeperNpub;
        let membershipType: MembershipType = MembershipType.Open;
        if (scpTag && scpTag[1] === '1') {
            const scpDataStr = SocialUtilsManager.base64ToUtf8(scpTag[2]);
            if (!scpDataStr.startsWith('$scp:')) return null;
            scpData = JSON.parse(scpDataStr.substring(5));
            if (scpData.gatekeeperPublicKey) {
                gatekeeperNpub = Nip19.npubEncode(scpData.gatekeeperPublicKey);
                membershipType = MembershipType.NFTExclusive;
            }
            else {
                membershipType = MembershipType.InviteOnly;
            }
        }
        const communityUri = `34550:${event.pubkey}:${communityId}`;
        
        let communityInfo: ICommunityInfo = {
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
        }

        return communityInfo;
    }

    async retrieveCommunityEvents(creatorId: string, communityId: string) {
        const feedEvents = await this._socialEventManager.fetchCommunityFeed(creatorId, communityId);
        const notes = feedEvents.filter(event => event.kind === 1);
        const communityEvent = feedEvents.find(event => event.kind === 34550);
        if (!communityEvent) throw new Error('No info event found');
        const communityInfo = this.extractCommunityInfo(communityEvent);
        if (!communityInfo) throw new Error('No info event found');
        //FIXME: not the best way to do this
        if (communityInfo.membershipType === MembershipType.InviteOnly) {
            const keyEvent = await this._socialEventManager.fetchGroupKeys(communityInfo.communityUri + ':keys');
            if (keyEvent) {
                communityInfo.memberKeyMap = JSON.parse(keyEvent.content);
            }
        }

        return {
            notes,
            info: communityInfo
        }
    }

    retrieveCommunityUri(noteEvent: INostrEvent, scpData: any) {
        let communityUri: string | null = null;
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

    private extractScpData(event: INostrEvent, standardId: string) {
        const scpTag = event.tags.find(tag => tag[0] === 'scp');
        let scpData;
        if (scpTag && scpTag[1] === standardId) {
            const scpDataStr = SocialUtilsManager.base64ToUtf8(scpTag[2]);
            if (!scpDataStr.startsWith('$scp:')) return null;
            scpData = JSON.parse(scpDataStr.substring(5));
        }
        return scpData;
    }

    async retrievePostPrivateKey(event: INostrEvent, communityUri: string, communityPrivateKey: string) {
        let key: string | null = null;
        let postScpData = this.extractScpData(event, ScpStandardId.CommunityPost);
        try {
            const postPrivateKey = await SocialUtilsManager.decryptMessage(communityPrivateKey, event.pubkey, postScpData.encryptedKey);
            const messageContentStr = await SocialUtilsManager.decryptMessage(postPrivateKey, event.pubkey, event.content);
            const messageContent = JSON.parse(messageContentStr);
            if (communityUri === messageContent.communityUri) {
                key = postPrivateKey;
            }
        } 
        catch (e) {
            // console.error(e);
        }
        return key;
    }

    async retrieveChannelMessagePrivateKey(event: INostrEvent, channelId: string, communityPrivateKey: string) {
        let key: string | null = null;
        let messageScpData = this.extractScpData(event, ScpStandardId.ChannelMessage);
        try {
            const messagePrivateKey = await SocialUtilsManager.decryptMessage(communityPrivateKey, event.pubkey, messageScpData.encryptedKey);
            const messageContentStr = await SocialUtilsManager.decryptMessage(messagePrivateKey, event.pubkey, event.content);
            const messageContent = JSON.parse(messageContentStr);
            if (channelId === messageContent.channelId) {
                key = messagePrivateKey;
            }
        } 
        catch (e) {
            // console.error(e);
        }
        return key;
    }

    async retrieveCommunityPrivateKey(communityInfo: ICommunityInfo, selfPrivateKey: string) {
        let communityPrivateKey: string;
        if (communityInfo.membershipType === MembershipType.InviteOnly) {
            const creatorPubkey = communityInfo.eventData.pubkey;
            const pubkey = SocialUtilsManager.convertPrivateKeyToPubkey(selfPrivateKey);
            const encryptedKey = communityInfo.memberKeyMap?.[pubkey];
            if (encryptedKey) {
                communityPrivateKey = await SocialUtilsManager.decryptMessage(selfPrivateKey, creatorPubkey, encryptedKey);
            }
        }
        else if (communityInfo.membershipType === MembershipType.NFTExclusive) {
            communityPrivateKey = await SocialUtilsManager.decryptMessage(selfPrivateKey, communityInfo.scpData.gatekeeperPublicKey, communityInfo.scpData.encryptedKey);
        }
        return communityPrivateKey;
    }

    async retrieveCommunityPostKeys(options: IRetrieveCommunityPostKeysOptions) {
        let noteIdToPrivateKey: Record<string, string> = {};
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
            let communityPrivateKey = await this.retrieveCommunityPrivateKey(communityInfo, options.privateKey);
            if (!communityPrivateKey) return noteIdToPrivateKey;
            for (const note of notes) {
                const postPrivateKey = await this.retrievePostPrivateKey(note, communityInfo.communityUri, communityPrivateKey);
                if (postPrivateKey) {
                    noteIdToPrivateKey[note.id] = postPrivateKey;
                }
            }
        }
        return noteIdToPrivateKey;
    }

    async retrieveCommunityThreadPostKeys(options: IRetrieveCommunityThreadPostKeysOptions) {
        const communityInfo = options.communityInfo;
        let noteIdToPrivateKey: Record<string, string> = {};
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
        else if (options.privateKey) {
            let communityPrivateKey = await this.retrieveCommunityPrivateKey(communityInfo, options.privateKey);
            if (!communityPrivateKey) return noteIdToPrivateKey;
            for (const note of options.noteEvents) {
                const postPrivateKey = await this.retrievePostPrivateKey(note, communityInfo.communityUri, communityPrivateKey);
                if (postPrivateKey) {
                    noteIdToPrivateKey[note.id] = postPrivateKey;
                }
            }
        }
        return noteIdToPrivateKey;
    }

    async retrieveCommunityPostKeysByNoteEvents(options: IRetrieveCommunityPostKeysByNoteEventsOptions) {
        let noteIdToPrivateKey: Record<string, string> = {};
        let communityPrivateKeyMap: Record<string, string> = {};
        const noteCommunityMappings = await this.createNoteCommunityMappings(options.notes);
        if (noteCommunityMappings.noteCommunityInfoList.length === 0) return noteIdToPrivateKey;
        const communityInfoMap: Record<string, ICommunityInfo> = {};
        for (let communityInfo of noteCommunityMappings.communityInfoList) {
            if (options.pubKey === communityInfo.creatorId) {
                let communityPrivateKey = await SocialUtilsManager.decryptMessage(options.privateKey, communityInfo.scpData.gatekeeperPublicKey, communityInfo.scpData.encryptedKey);
                if (communityPrivateKey) {
                    communityPrivateKeyMap[communityInfo.communityUri] = communityPrivateKey;
                }
            }
            communityInfoMap[communityInfo.communityUri] = communityInfo;
        }  
        let gatekeeperNpubToNotesMap: Record<string, INoteCommunityInfo[]> = {};
        for (let noteCommunityInfo of noteCommunityMappings.noteCommunityInfoList) {
            const communityPrivateKey = communityPrivateKeyMap[noteCommunityInfo.communityUri];
            if (communityPrivateKey)  {
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

    async constructMetadataByPubKeyMap(notes: INostrEvent[]) {
        let mentionAuthorSet = new Set();
        for (let i = 0; i < notes.length; i++) {
            const mentionTags = notes[i].tags.filter(tag => tag[0] === 'p' && tag[1] !== notes[i].pubkey)?.map(tag => tag[1]) || [];
            if (mentionTags.length) {
                mentionTags.forEach(tag => mentionAuthorSet.add(tag));
            }
        }
        const uniqueKeys = Array.from(mentionAuthorSet) as string[];
        const npubs = notes.map(note => note.pubkey).filter((value, index, self) => self.indexOf(value) === index);
        const metadata = await this._socialEventManager.fetchMetadata({
            decodedAuthors: [...npubs, ...uniqueKeys]
        });
    
        const metadataByPubKeyMap: Record<string, INostrMetadata> = metadata.reduce((acc, cur) => {
            const content = JSON.parse(cur.content);
            acc[cur.pubkey] = {
                ...cur,
                content
            };
            return acc;
        }, {});
        return metadataByPubKeyMap;
    }

    createNoteEventMappings(events: INostrEvent[], parentAuthorsInfo: boolean = false) {
        let notes: INoteInfo[] = [];
        let metadataByPubKeyMap: Record<string, INostrMetadata> = {};
        let quotedNotesMap: Record<string, INoteInfo> = {};
        let noteToParentAuthorIdMap: Record<string, string> = {};
        let noteStatsMap: Record<string, IPostStats> = {};
        for (let event of events) {
            if (event.kind === 0) {
                metadataByPubKeyMap[event.pubkey] = {
                    ...event,
                    content: JSON.parse(event.content)
                };
            }
            else if (event.kind === 10000107) {
                const noteEvent = JSON.parse(event.content) as INostrEvent;
                quotedNotesMap[noteEvent.id] = {
                    eventData: noteEvent
                }
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
            else if (event.kind === 10000100) {
                const content = JSON.parse(event.content);
                noteStatsMap[content.event_id] = {
                    upvotes: content.likes,
                    replies: content.replies,
                    reposts: content.reposts
                }
            }
            else if (event.kind === 10000113) {
                //"{\"since\":1700034697,\"until\":1700044097,\"order_by\":\"created_at\"}"
                const timeInfo = JSON.parse(event.content);
            }
        }
        for (let note of notes) {
            const noteId = note.eventData.id;
            note.stats = noteStatsMap[noteId];
        }
        return {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            noteToParentAuthorIdMap,
            noteStatsMap
        }
    }
    
    async fetchCommunityInfo(creatorId: string, communityId: string) {
        const communityEvents = await this._socialEventManager.fetchCommunity(creatorId, communityId);
        const communityEvent = communityEvents.find(event => event.kind === 34550);
        if(!communityEvent) return null;
        let communityInfo = this.extractCommunityInfo(communityEvent);
        //FIXME: not the best way to do this
        if (communityInfo.membershipType === MembershipType.InviteOnly) {
            const keyEvent = await this._socialEventManager.fetchGroupKeys(communityInfo.communityUri + ':keys');
            if (keyEvent) {
                communityInfo.memberKeyMap = JSON.parse(keyEvent.content);
            }
        }
        return communityInfo;
    }

    async fetchThreadNotesInfo(focusedNoteId: string) {
        let focusedNote: INoteInfo;
        let ancestorNotes: INoteInfo[] = [];
        let replies: INoteInfo[] = [];
        let childReplyEventTagIds: string[] = [];
        //Ancestor posts -> Focused post -> Child replies
        let decodedFocusedNoteId = focusedNoteId.startsWith('note1') ? Nip19.decode(focusedNoteId).data as string : focusedNoteId;
        const threadEvents = await this._socialEventManager.fetchThreadCacheEvents(decodedFocusedNoteId);
        const {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap
        } = this.createNoteEventMappings(threadEvents);
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
        let communityInfo: ICommunityInfo | null = null;
        let scpData = this.extractScpData(focusedNote.eventData, ScpStandardId.CommunityPost);
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

    async createNoteCommunityMappings(notes: INostrEvent[]) {
        let noteCommunityInfoList: INoteCommunityInfo[] = [];
        let pubkeyToCommunityIdsMap: Record<string, string[]> = {};
        let communityInfoList: ICommunityInfo[] = [];
        for (let note of notes) {
            let scpData = this.extractScpData(note, ScpStandardId.CommunityPost);
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
        }
    }

    async retrieveUserProfileDetail(pubKey: string) {
        let metadata: INostrMetadata;
        let stats: IUserActivityStats;
        const userContactEvents = await this._socialEventManager.fetchUserProfileDetailCacheEvents(pubKey);
        for (let event of userContactEvents) {
            if (event.kind === 0) {
                metadata = {
                    ...event,
                    content: JSON.parse(event.content)
                };
            }
            else if (event.kind === 10000105) {
                let content = JSON.parse(event.content);
                stats = {
                    notes: content.note_count,
                    replies: content.reply_count,
                    followers: content.followers_count,
                    following: content.follows_count,
                    relays: content.relay_count,
                    timeJoined: content.time_joined
                }
            }
        }
        if (!metadata) return null;
        let userProfile = this.constructUserProfile(metadata);
        return {
            userProfile,
            stats
        }
    }

    private constructUserProfile(metadata: INostrMetadata, followersCountMap?: Record<string, number>) {
        const followersCount = followersCountMap?.[metadata.pubkey] || 0;
        const encodedPubkey = Nip19.npubEncode(metadata.pubkey);
        const metadataContent = metadata.content;
        const internetIdentifier = metadataContent.nip05?.replace('_@', '') || '';
        let userProfile: IUserProfile = {
            id: encodedPubkey,
            username: metadataContent.username || metadataContent.name,
            description: metadataContent.about,
            avatar: metadataContent.picture,
            pubKey: encodedPubkey,
            displayName: metadataContent.display_name || metadataContent.displayName || metadataContent.name,
            internetIdentifier,
            website: metadataContent.website,
            banner: metadataContent.banner,
            followers: followersCount,
            metadata
        }
        return userProfile;
    }

    async fetchUserContactList(pubKey: string) {
        let metadataArr: INostrMetadata[] = [];
        let followersCountMap: Record<string, number> = {};
        const userContactEvents = await this._socialEventManager.fetchContactListCacheEvents(pubKey);
        for (let event of userContactEvents) {
            if (event.kind === 0) {
                metadataArr.push({
                    ...event,
                    content: JSON.parse(event.content)
                });
            }
            else if (event.kind === 10000108) {
                followersCountMap = JSON.parse(event.content);
            }
        }
        const userProfiles: IUserProfile[] = [];
        for (let metadata of metadataArr) {
            let userProfile = this.constructUserProfile(metadata, followersCountMap);
            userProfiles.push(userProfile);
        }
        return userProfiles;
    }

    async fetchUserFollowersList(pubKey: string) {
        let metadataArr: INostrMetadata[] = [];
        let followersCountMap: Record<string, number> = {};
        const userFollowersEvents = await this._socialEventManager.fetchFollowersCacheEvents(pubKey);
        for (let event of userFollowersEvents) {
            if (event.kind === 0) {
                metadataArr.push({
                    ...event,
                    content: JSON.parse(event.content)
                });
            }
            else if (event.kind === 10000108) {
                followersCountMap = JSON.parse(event.content);
            }
        }
        const userProfiles: IUserProfile[] = [];
        for (let metadata of metadataArr) {
            let userProfile = this.constructUserProfile(metadata, followersCountMap);
            userProfiles.push(userProfile);
        }
        return userProfiles;
    }

    async fetchUserRelayList(pubKey: string) {
        let relayList: string[] = [];
        const relaysEvents = await this._socialEventManager.fetchRelaysCacheEvents(pubKey);
        const relaysEvent = relaysEvents.find(event => event.kind === 3);
        if (!relaysEvent) return relayList;
        let content = JSON.parse(relaysEvent.content);
        relayList = Object.keys(content);
        return relayList;
    }

    getCommunityUri(creatorId: string, communityId: string) {
        const decodedPubkey = Nip19.decode(creatorId).data as string;
        return `34550:${decodedPubkey}:${communityId}`;
    }

    async generateGroupKeys(privateKey: string, encryptionPublicKeys: string[]) {
        const groupPrivateKey = Keys.generatePrivateKey();
        const groupPublicKey = Keys.getPublicKey(groupPrivateKey);
        let encryptedGroupKeys: Record<string, string> = {};
        for (let encryptionPublicKey of encryptionPublicKeys) {
            const encryptedGroupKey = await SocialUtilsManager.encryptMessage(privateKey, encryptionPublicKey, groupPrivateKey);
            encryptedGroupKeys[encryptionPublicKey] = encryptedGroupKey;
        }
        return {
            groupPrivateKey,
            groupPublicKey,
            encryptedGroupKeys
        }
    }

    async createCommunity(newInfo: INewCommunityInfo, creatorId: string, privateKey: string) {
        const communityUri = this.getCommunityUri(creatorId, newInfo.name);
        let communityInfo: ICommunityInfo = {
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
        }

        if (communityInfo.membershipType === MembershipType.NFTExclusive) {
            const gatekeeperPublicKey = Nip19.decode(communityInfo.gatekeeperNpub).data as string;
            const communityKeys = await this.generateGroupKeys(privateKey, [gatekeeperPublicKey]);
            const encryptedKey = communityKeys.encryptedGroupKeys[gatekeeperPublicKey];
            communityInfo.scpData = {
                ...communityInfo.scpData,
                publicKey: communityKeys.groupPublicKey,
                encryptedKey: encryptedKey,
                gatekeeperPublicKey
            }        
        }
        else if (communityInfo.membershipType === MembershipType.InviteOnly) {
            let encryptionPublicKeys: string[] = [];
            for (let memberId of communityInfo.memberIds) {
                const memberPublicKey = Nip19.decode(memberId).data as string;
                encryptionPublicKeys.push(memberPublicKey);
            }
            const communityKeys = await this.generateGroupKeys(privateKey, encryptionPublicKeys);
            await this._socialEventManager.updateGroupKeys(
                communityUri + ':keys', 
                34550,
                JSON.stringify(communityKeys.encryptedGroupKeys),
                communityInfo.memberIds,
                privateKey
            );
            communityInfo.scpData = {
                ...communityInfo.scpData,
                publicKey: communityKeys.groupPublicKey
            }                 
        }
        if (communityInfo.scpData) {
            const updateChannelResponse = await this.updateCommunityChannel(communityInfo, privateKey);
            if (updateChannelResponse.eventId) {
                communityInfo.scpData.channelEventId = updateChannelResponse.eventId;
            }   
        }
        await this._socialEventManager.updateCommunity(communityInfo, privateKey);
    
        return communityInfo;
    }

    async updateCommunity(info: ICommunityInfo, privateKey: string) {
        if (info.membershipType === MembershipType.NFTExclusive) {
            const gatekeeperPublicKey = Nip19.decode(info.gatekeeperNpub).data as string;
            info.scpData.gatekeeperPublicKey = gatekeeperPublicKey;
        }
        else if (info.membershipType === MembershipType.InviteOnly) {
            let encryptionPublicKeys: string[] = [];
            for (let memberId of info.memberIds) {
                const memberPublicKey = Nip19.decode(memberId).data as string;
                encryptionPublicKeys.push(memberPublicKey);
            }

            const groupPrivateKey = await this.retrieveCommunityPrivateKey(info, privateKey);
            let encryptedGroupKeys: Record<string, string> = {};
            for (let encryptionPublicKey of encryptionPublicKeys) {
                const encryptedGroupKey = await SocialUtilsManager.encryptMessage(privateKey, encryptionPublicKey, groupPrivateKey);
                encryptedGroupKeys[encryptionPublicKey] = encryptedGroupKey;
            }
            const response = await this._socialEventManager.updateGroupKeys(
                info.communityUri + ':keys',
                34550,
                JSON.stringify(encryptedGroupKeys),
                info.memberIds,
                privateKey
            );
            console.log('updateCommunity', response);
        }
        await this._socialEventManager.updateCommunity(info, privateKey);
        return info;
    }

    async updateCommunityChannel(communityInfo: ICommunityInfo, privateKey: string) {
        let channelScpData: IChannelScpData = {
            communityId: communityInfo.communityId
        }
        let channelInfo: IChannelInfo = {
            name: communityInfo.communityId,
            about: communityInfo.description,
            scpData: channelScpData
        }
        const updateChannelResponse = await this._socialEventManager.updateChannel(channelInfo, privateKey);
        return updateChannelResponse;
    }

    async createChannel(channelInfo: IChannelInfo, memberIds: string[], privateKey: string) {
        let encryptionPublicKeys: string[] = [];
        for (let memberId of memberIds) {
            const memberPublicKey = Nip19.decode(memberId).data as string;
            encryptionPublicKeys.push(memberPublicKey);
        }
        const channelKeys = await this.generateGroupKeys(privateKey, encryptionPublicKeys);
        channelInfo.scpData = {
            ...channelInfo.scpData,
            publicKey: channelKeys.groupPublicKey
        } 
        const updateChannelResponse = await this._socialEventManager.updateChannel(channelInfo, privateKey);
        if (updateChannelResponse.eventId) {
            const channelUri = `40:${updateChannelResponse.eventId}`;
            await this._socialEventManager.updateGroupKeys(
                channelUri + ':keys', 
                40,
                JSON.stringify(channelKeys.encryptedGroupKeys),
                memberIds,
                privateKey
            );
        }
        return channelInfo;
    }

    async fetchMyCommunities(pubKey: string) {
        let communities: ICommunityInfo[] = [];
        const pubkeyToCommunityIdsMap: Record<string, string[]> = {};
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

    private extractBookmarkedCommunities(event: INostrEvent, excludedCommunity?: ICommunityInfo) {
        const communities: ICommunityBasicInfo[] = [];
        const communityUriArr = event?.tags.filter(tag => tag[0] === 'a')?.map(tag => tag[1]) || [];
        for (let communityUri of communityUriArr) {
            const pubkey = communityUri.split(':')[1];
            const communityId = communityUri.split(':')[2];
            if (excludedCommunity) {
                const decodedPubkey = Nip19.decode(excludedCommunity.creatorId).data as string;
                if (communityId === excludedCommunity.communityId && pubkey === decodedPubkey) continue;
            }
            communities.push({
                communityId,
                creatorId: pubkey
            });
        }
        return communities;
    }

    private extractBookmarkedChannels(event: INostrEvent) {
        const channelEventIds = event?.tags.filter(tag => tag[0] === 'a')?.map(tag => tag[1]) || [];
        return channelEventIds;
    }

    async joinCommunity(community: ICommunityInfo, pubKey: string, privateKey: string) {
        const bookmarkedCommunitiesEvents = await this._socialEventManager.fetchUserBookmarkedCommunities(pubKey);
        const bookmarkedCommunitiesEvent = bookmarkedCommunitiesEvents.find(event => event.kind === 30001);
        const communities: ICommunityBasicInfo[] = this.extractBookmarkedCommunities(bookmarkedCommunitiesEvent);
        communities.push(community);
        await this._socialEventManager.updateUserBookmarkedCommunities(communities, privateKey);
        if (community.scpData?.channelEventId) {
            const bookmarkedChannelsEvents = await this._socialEventManager.fetchUserBookmarkedChannels(pubKey);
            const bookmarkedChannelsEvent = bookmarkedChannelsEvents.find(event => event.kind === 30001);
            const channelEventIds = this.extractBookmarkedChannels(bookmarkedChannelsEvent);
            channelEventIds.push(community.scpData.channelEventId);
            await this._socialEventManager.updateUserBookmarkedChannels(channelEventIds, privateKey);
        }
    }
    
    async leaveCommunity(community: ICommunityInfo, pubKey: string, privateKey: string) {
        const events = await this._socialEventManager.fetchUserBookmarkedCommunities(pubKey);
        const bookmarkedEvent = events.find(event => event.kind === 30001);
        const communities: ICommunityBasicInfo[] = this.extractBookmarkedCommunities(bookmarkedEvent, community);
        await this._socialEventManager.updateUserBookmarkedCommunities(communities, privateKey);
        if (community.scpData?.channelEventId) {
            const bookmarkedChannelsEvents = await this._socialEventManager.fetchUserBookmarkedChannels(pubKey);
            const bookmarkedChannelsEvent = bookmarkedChannelsEvents.find(event => event.kind === 30001);
            const channelEventIds = this.extractBookmarkedChannels(bookmarkedChannelsEvent);
            const index = channelEventIds.indexOf(community.scpData.channelEventId);
            if (index > -1) {
                channelEventIds.splice(index, 1);
            }
            await this._socialEventManager.updateUserBookmarkedChannels(channelEventIds, privateKey);
        }
    }

    private async encryptGroupMessage(privateKey: string, groupPublicKey: string, message: string) {
        const messagePrivateKey = Keys.generatePrivateKey();
        const messagePublicKey = Keys.getPublicKey(messagePrivateKey);
        const encryptedGroupKey = await SocialUtilsManager.encryptMessage(privateKey, groupPublicKey, messagePrivateKey);
        const encryptedMessage = await SocialUtilsManager.encryptMessage(privateKey, messagePublicKey, message);
        return {
            encryptedMessage,
            encryptedGroupKey
        }
    }

    async submitCommunityPost(message: string, info: ICommunityInfo, privateKey: string, conversationPath?: IConversationPath) {
        const messageContent = {
            communityUri: info.communityUri,
            message,
        }
        const {
            encryptedMessage,
            encryptedGroupKey
        } = await this.encryptGroupMessage(privateKey, info.scpData.publicKey, JSON.stringify(messageContent));
        const newCommunityPostInfo: INewCommunityPostInfo = {
            community: info,
            message: encryptedMessage,
            conversationPath,
            scpData: {
                encryptedKey: encryptedGroupKey,
                communityUri: info.communityUri
            }
        }
        await this._socialEventManager.submitCommunityPost(newCommunityPostInfo, privateKey);
    }

    private extractChannelInfo(event: INostrEvent) {
        const content = JSON.parse(event.content);
        let eventId;
        if (event.kind === 40) {
            eventId = event.id;
        }
        else if (event.kind === 41) {
            eventId = event.tags.find(tag => tag[0] === 'e')?.[1];
        }
        if (!eventId) return null;
        let scpData = this.extractScpData(event, ScpStandardId.Channel);
        let channelInfo: IChannelInfo = {
            id: eventId,
            name: content.name,
            about: content.about,
            picture: content.picture,
            scpData,
            eventData: event,
        }

        return channelInfo;
    }

    async fetchAllUserRelatedChannels(pubKey: string) {
        let channels: IChannelInfo[] = [];
        let bookmarkedChannelEventIds: string[] = [];
        const channelMetadataMap: Record<string, IChannelInfo> = {};
        let channelIdToCommunityMap: Record<string, ICommunityInfo> = {};
        const events = await this._socialEventManager.fetchAllUserRelatedChannels(pubKey);
        for (let event of events) {
            if (event.kind === 40) {
                const channelInfo = this.extractChannelInfo(event);
                if (!channelInfo) continue;
                channels.push(channelInfo);
            }
            else if (event.kind === 41) {
                const channelInfo = this.extractChannelInfo(event);
                if (!channelInfo) continue;
                channelMetadataMap[channelInfo.id] = channelInfo;
            }
            else if (event.kind === 30001) {
                bookmarkedChannelEventIds = this.extractBookmarkedChannels(event);
            }
            else if (event.kind === 34550) {
                const communityInfo = this.extractCommunityInfo(event);
                const channelId = communityInfo.scpData?.channelEventId;
                if (!channelId) continue;
                channelIdToCommunityMap[channelId] = communityInfo;
            }
        }

        const bookmarkedChannelEvents = await this._socialEventManager.fetchChannels(bookmarkedChannelEventIds);
        for (let event of bookmarkedChannelEvents) {
            if (event.kind === 40) {
                const channelInfo = this.extractChannelInfo(event);
                if (!channelInfo) continue;
                channels.push(channelInfo);
            }
            else if (event.kind === 41) {
                const channelInfo = this.extractChannelInfo(event);
                if (!channelInfo) continue;
                channelMetadataMap[channelInfo.id] = channelInfo;
            }
        }

        const pubkeyToCommunityIdsMap: Record<string, string[]> = {};
        for (let channel of channels) {
            const scpData = channel.scpData;
            if (!scpData.communityId) continue;
            pubkeyToCommunityIdsMap[channel.eventData.pubkey] = pubkeyToCommunityIdsMap[channel.eventData.pubkey] || [];
            if (!pubkeyToCommunityIdsMap[channel.eventData.pubkey].includes(scpData.communityId)) {
                pubkeyToCommunityIdsMap[channel.eventData.pubkey].push(scpData.communityId);
            }
        }
        const communityEvents = await this._socialEventManager.fetchCommunities(pubkeyToCommunityIdsMap);
        for (let event of communityEvents) {
            const communityInfo = this.extractCommunityInfo(event);
            const channelId = communityInfo.scpData?.channelEventId;
            if (!channelId) continue;
            channelIdToCommunityMap[channelId] = communityInfo;
        }

        let outputChannels: IChannelInfo[] = []; 
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

    async retrieveChannelMessages(channelId: string, since?: number, until?: number) {
        const events = await this._socialEventManager.fetchChannelMessages(channelId, since, until);
        const messageEvents = events.filter(event => event.kind === 42);
        return messageEvents;
    }

    async retrieveChannelEvents(creatorId: string, channelId: string) {
        const channelEvents = await this._socialEventManager.fetchChannelInfoMessages(creatorId, channelId);
        const messageEvents = channelEvents.filter(event => event.kind === 42);
        const channelCreationEvent = channelEvents.find(event => event.kind === 40);
        if (!channelCreationEvent) throw new Error('No info event found');
        const channelMetadataEvent = channelEvents.find(event => event.kind === 41);
        let channelInfo: IChannelInfo;
        if (channelMetadataEvent) {
            channelInfo = this.extractChannelInfo(channelMetadataEvent);
        }
        else {
            channelInfo = this.extractChannelInfo(channelCreationEvent);
        }
        if (!channelInfo) throw new Error('No info event found');

        return {
            messageEvents,
            info: channelInfo
        }
    }

    async retrieveChannelMessageKeys(options: IRetrieveChannelMessageKeysOptions) {
        let messageIdToPrivateKey: Record<string, string> = {};
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
                if (!groupPrivateKey) return messageIdToPrivateKey;
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

    async submitChannelMessage(
        message: string, 
        channelId: string, 
        privateKey: string, 
        communityPublicKey: string, 
        conversationPath?: IConversationPath
    ) {
        const messageContent = {
            channelId,
            message,
        }
        const {
            encryptedMessage,
            encryptedGroupKey
        } = await this.encryptGroupMessage(privateKey, communityPublicKey, JSON.stringify(messageContent));
        const newChannelMessageInfo: INewChannelMessageInfo = {
            channelId: channelId,
            message: encryptedMessage,
            conversationPath,
            scpData: {
                encryptedKey: encryptedGroupKey,
                channelId: channelId
            }
        }
        await this._socialEventManager.submitChannelMessage(newChannelMessageInfo, privateKey);
    }

    async fetchMessageContacts(pubKey: string) {
        const events = await this._socialEventManager.fetchMessageContactsCacheEvents(pubKey);
        const pubkeyToMessageInfoMap: Record<string, { cnt: number, latest_at: number, latest_event_id: string }> = {};
        let metadataByPubKeyMap: Record<string, INostrMetadata> = {};
        for (let event of events) {
            if (event.kind === 10000118) {
                const content = JSON.parse(event.content);
                Object.keys(content).forEach(pubkey => {
                    pubkeyToMessageInfoMap[pubkey] = content[pubkey];
                })
            }
            if (event.kind === 0) {
                metadataByPubKeyMap[event.pubkey] = {
                    ...event,
                    content: JSON.parse(event.content)
                };
            }
        }
        let profiles: IMessageContactInfo[] = Object.entries(metadataByPubKeyMap).map(([k, v]) => {
            const encodedPubkey = Nip19.npubEncode(k);
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
            }
        });

        const channels = await this.fetchAllUserRelatedChannels(pubKey);
        for (let channel of channels) {
            let creatorId = Nip19.npubEncode(channel.eventData.pubkey);
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

    async fetchUserGroupInvitations(pubKey: string) {
        const identifiers: string[] = [];
        const events = await this._socialEventManager.fetchUserGroupInvitations([40, 34550], pubKey);
        for (let event of events) {
            const identifier = event.tags.find(tag => tag[0] === 'd')?.[1];
            if (identifier) {
                identifiers.push(identifier);
            }
        }
        return identifiers;
    }

    async mapCommunityUriToMemberIdRoleCombo(communities: ICommunityInfo[]) {
        const communityUriToMemberIdRoleComboMap: Record<string, { id: string; role: CommunityRole }[]> = {};
        const communityUriToCreatorOrModeratorIdsMap: Record<string, Set<string>> = {};
        for (let community of communities) {
            const decodedPubkey = Nip19.decode(community.creatorId).data as string;
            const communityUri = `34550:${decodedPubkey}:${community.communityId}`;
            communityUriToMemberIdRoleComboMap[communityUri] = [];
            communityUriToMemberIdRoleComboMap[communityUri].push({
                id: community.creatorId,
                role: CommunityRole.Creator
            });
            communityUriToCreatorOrModeratorIdsMap[communityUri] = new Set<string>();
            communityUriToCreatorOrModeratorIdsMap[communityUri].add(community.creatorId);
            if (community.moderatorIds) {
                if (community.moderatorIds.includes(community.creatorId)) continue;
                for (let moderator of community.moderatorIds) {
                    communityUriToMemberIdRoleComboMap[communityUri].push({
                        id: moderator,
                        role: CommunityRole.Moderator
                    });
                    communityUriToCreatorOrModeratorIdsMap[communityUri].add(moderator);
                }
            }
        }
        const generalMembersEvents = await this._socialEventManager.fetchCommunitiesGeneralMembers(communities);
        for (let event of generalMembersEvents) {
            const communityUriArr = event.tags.filter(tag => tag[0] === 'a')?.map(tag => tag[1]) || [];
            for (let communityUri of communityUriArr) {
                if (!communityUriToMemberIdRoleComboMap[communityUri]) continue;
                const pubkey = Nip19.npubEncode(event.pubkey);
                if (communityUriToCreatorOrModeratorIdsMap[communityUri].has(pubkey)) continue;
                communityUriToMemberIdRoleComboMap[communityUri].push({
                    id: pubkey,
                    role: CommunityRole.GeneralMember
                });
            }
        }
        return communityUriToMemberIdRoleComboMap;
    }

    private extractCalendarEventInfo(event: INostrEvent) {
        const description = event.content;
        const id = event.tags.find(tag => tag[0] === 'd')?.[1];
        const name = event.tags.find(tag => tag[0] === 'name')?.[1]; //deprecated
        const title = event.tags.find(tag => tag[0] === 'title')?.[1];
        const start = event.tags.find(tag => tag[0] === 'start')?.[1];
        const end = event.tags.find(tag => tag[0] === 'end')?.[1];
        const startTzid = event.tags.find(tag => tag[0] === 'start_tzid')?.[1];
        const endTzid = event.tags.find(tag => tag[0] === 'end_tzid')?.[1];
        const location = event.tags.find(tag => tag[0] === 'location')?.[1];
        let lonlat;
        const geohash = event.tags.find(tag => tag[0] === 'g')?.[1];
        if (geohash) {
            lonlat = Geohash.decode(geohash);
        }
        const image = event.tags.find(tag => tag[0] === 'image')?.[1];
        let type;
        let startTime;
        let endTime;
        if (event.kind === 31922) {
            type = CalendarEventType.DateBased;
            const startDate = new Date(start);
            startTime = startDate.getTime() / 1000;
            if (end) {
                const endDate = new Date(end);
                endTime = endDate.getTime() / 1000;
            }
        }
        else if (event.kind === 31923) {
            type = CalendarEventType.TimeBased;
            startTime = Number(start);
            if (end) {
                endTime = Number(end);
            }
        }
        const naddr = Nip19.naddrEncode({
            identifier: id,
            pubkey: event.pubkey,
            kind: event.kind,
            relays: []
        })
        let calendarEventInfo: ICalendarEventInfo = {
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
            latitude: lonlat?.latitude,
            longitude: lonlat?.longitude,
            geohash,
            image,
            eventData: event
        }
        return calendarEventInfo;
    }

    async updateCalendarEvent(updateCalendarEventInfo: IUpdateCalendarEventInfo, privateKey: string) {
        const geohash = Geohash.encode(updateCalendarEventInfo.latitude, updateCalendarEventInfo.longitude);
        updateCalendarEventInfo = {
            ...updateCalendarEventInfo,
            geohash
        }
        let naddr: string;
        const response = await this._socialEventManager.updateCalendarEvent(updateCalendarEventInfo, privateKey);
        if (response.success) {
            const pubkey = SocialUtilsManager.convertPrivateKeyToPubkey(privateKey);
            naddr = Nip19.naddrEncode({
                identifier: updateCalendarEventInfo.id,
                pubkey: pubkey,
                kind: updateCalendarEventInfo.type === CalendarEventType.DateBased ? 31922 : 31923,
                relays: []
            });
        }
        return naddr;
    }

    async retrieveCalendarEventsByDateRange(start: number, end?: number, limit?: number) {
        const events = await this._socialEventManager.fetchCalendarEvents(start, end, limit);
        let calendarEventInfoList: ICalendarEventInfo[] = [];
        for (let event of events) {
            let calendarEventInfo = this.extractCalendarEventInfo(event);
            calendarEventInfoList.push(calendarEventInfo);
        }
        return calendarEventInfoList;
    }

    async retrieveCalendarEvent(naddr: string) {
        let address = Nip19.decode(naddr).data as Nip19.AddressPointer;
        const calendarEvent = await this._socialEventManager.fetchCalendarEvent(address);
        if (!calendarEvent) return null;
        let calendarEventInfo = this.extractCalendarEventInfo(calendarEvent);
        let hostPubkeys = calendarEvent.tags.filter(tag => tag[0] === 'p' && tag[3] === 'host')?.map(tag => tag[1]) || [];
        const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
        let hosts: ICalendarEventHost[] = [];
        let attendees: ICalendarEventAttendee[] = [];
        let attendeePubkeys: string[] = [];
        let attendeePubkeyToEventMap: Record<string, INostrEvent> = {};
        const rsvpEvents = await this._socialEventManager.fetchCalendarEventRSVPs(calendarEventUri);
        for (let rsvpEvent of rsvpEvents) {
            if (attendeePubkeyToEventMap[rsvpEvent.pubkey]) continue;
            let attendanceStatus = rsvpEvent.tags.find(tag => tag[0] === 'l' && tag[2] === 'status')?.[1];
            if (attendanceStatus === 'accepted') {
                attendeePubkeyToEventMap[rsvpEvent.pubkey] = rsvpEvent;
                attendeePubkeys.push(rsvpEvent.pubkey);
            }
        }
        const userProfileEvents = await this._socialEventManager.fetchUserProfileCacheEvents([
            ...hostPubkeys,
            ...attendeePubkeys
        ])
        for (let event of userProfileEvents) {
            if (event.kind === 0) {
                let metaData = {
                    ...event,
                    content: JSON.parse(event.content)
                };
                let userProfile = this.constructUserProfile(metaData);
                if (hostPubkeys.includes(event.pubkey)) {
                    let host: ICalendarEventHost = {
                        pubkey: event.pubkey,
                        userProfile
                    }
                    hosts.push(host);
                }
                else if (attendeePubkeyToEventMap[event.pubkey]) {
                    let attendee: ICalendarEventAttendee = {
                        pubkey: event.pubkey,
                        userProfile,
                        rsvpEventData: attendeePubkeyToEventMap[event.pubkey]
                    }
                    attendees.push(attendee);
                }
            }
        }
        let detailInfo: ICalendarEventDetailInfo = {
            ...calendarEventInfo,
            hosts,
            attendees
        }
        return detailInfo;
    }

    async acceptCalendarEvent(rsvpId: string, naddr: string, privateKey: string) {
        let address = Nip19.decode(naddr).data as Nip19.AddressPointer;
        const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
        const pubkey = SocialUtilsManager.convertPrivateKeyToPubkey(privateKey);
        const rsvpEvents = await this._socialEventManager.fetchCalendarEventRSVPs(calendarEventUri, pubkey);
        if (rsvpEvents.length > 0) {
            rsvpId = rsvpEvents[0].tags.find(tag => tag[0] === 'd')?.[1];
        }
        await this._socialEventManager.createCalendarEventRSVP(rsvpId, calendarEventUri, true, privateKey);
    }

    async declineCalendarEvent(rsvpId: string, naddr: string, privateKey: string) {
        let address = Nip19.decode(naddr).data as Nip19.AddressPointer;
        const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
        const pubkey = SocialUtilsManager.convertPrivateKeyToPubkey(privateKey);
        const rsvpEvents = await this._socialEventManager.fetchCalendarEventRSVPs(calendarEventUri, pubkey);
        if (rsvpEvents.length > 0) {
            rsvpId = rsvpEvents[0].tags.find(tag => tag[0] === 'd')?.[1];
        }
        await this._socialEventManager.createCalendarEventRSVP(rsvpId, calendarEventUri, false, privateKey);
    }
}

export {
    NostrEventManager,
    ISocialEventManager,
    SocialUtilsManager,
    SocialDataManager
}