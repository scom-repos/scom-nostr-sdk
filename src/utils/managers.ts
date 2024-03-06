import { Utils } from "@ijstech/eth-wallet";
import { Nip19, Event, Keys } from "../core/index";
import { CalendarEventType, CommunityRole, IAllUserRelatedChannels, ICalendarEventAttendee, ICalendarEventDetailInfo, ICalendarEventHost, ICalendarEventInfo, IChannelInfo, IChannelScpData, ICommunity, ICommunityBasicInfo, ICommunityInfo, ICommunityMember, ICommunityPostScpData, IConversationPath, ILocationCoordinates, ILongFormContentInfo, IMessageContactInfo, INewCalendarEventPostInfo, INewChannelMessageInfo, INewCommunityInfo, INewCommunityPostInfo, INostrEvent, INostrFetchEventsResponse, INostrMetadata, INostrMetadataContent, INostrSubmitResponse, INoteCommunityInfo, INoteInfo, INoteInfoExtended, IPostStats, IRetrieveChannelMessageKeysOptions, IRetrieveCommunityPostKeysByNoteEventsOptions, IRetrieveCommunityPostKeysOptions, IRetrieveCommunityThreadPostKeysOptions, ISocialDataManagerConfig, IUpdateCalendarEventInfo, IUserActivityStats, IUserProfile, MembershipType, ScpStandardId } from "./interfaces";
import Geohash from './geohash';
import GeoQuery from './geoquery';
import { MqttManager } from "./mqtt";

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

//FIXME: remove this when compiler is fixed
function flatMap<T, U>(array: T[], callback: (item: T) => U[]): U[] {
    return array.reduce((acc, item) => {
        return acc.concat(callback(item));
    }, [] as U[]);
}

interface INostrCommunicationManager {
    fetchEvents(...requests: any): Promise<INostrFetchEventsResponse>;
    fetchCachedEvents(eventType: string, msg: any): Promise<INostrFetchEventsResponse>;
    submitEvent(event: Event.VerifiedEvent<number>): Promise<INostrSubmitResponse>;
}

interface INostrRestAPIManager extends INostrCommunicationManager {
    fetchEventsFromAPI(endpoint: string, msg: any): Promise<INostrFetchEventsResponse>;
}

interface ISocialEventManagerWrite {
    updateContactList(content: string, contactPubKeys: string[], privateKey: string): Promise<void>;
    postNote(content: string, privateKey: string, conversationPath?: IConversationPath): Promise<void>;
    deleteEvents(eventIds: string[], privateKey: string): Promise<INostrSubmitResponse[]>;
    updateCommunity(info: ICommunityInfo, privateKey: string): Promise<INostrSubmitResponse[]>;
    updateChannel(info: IChannelInfo, privateKey: string): Promise<INostrSubmitResponse[]>;
    updateUserBookmarkedChannels(channelEventIds: string[], privateKey: string): Promise<void>;
    submitChannelMessage(info: INewChannelMessageInfo, privateKey: string): Promise<void>;
    updateUserBookmarkedCommunities(communities: ICommunityBasicInfo[], privateKey: string): Promise<void>;
    submitCommunityPost(info: INewCommunityPostInfo, privateKey: string): Promise<void>;
    updateUserProfile(content: INostrMetadataContent, privateKey: string): Promise<void>;
    sendMessage(receiver: string, encryptedMessage: string, privateKey: string): Promise<void>;
    updateGroupKeys(identifier: string, groupKind: number, keys: string, invitees: string[], privateKey: string): Promise<INostrSubmitResponse[]>;
    updateCalendarEvent(info: IUpdateCalendarEventInfo, privateKey: string): Promise<INostrSubmitResponse[]>;
    createCalendarEventRSVP(rsvpId: string, calendarEventUri: string, accepted: boolean, privateKey: string): Promise<INostrSubmitResponse[]>;
    submitCalendarEventPost(info: INewCalendarEventPostInfo, privateKey: string): Promise<INostrSubmitResponse[]>;
    submitLongFormContentEvents(info: ILongFormContentInfo, privateKey: string): Promise<void>;
    submitLike(tags: string[][], privateKey: string): Promise<void>;
    submitRepost(content: string, tags: string[][], privateKey: string): Promise<void>;
}

interface ISocialEventManagerRead {
    fetchThreadCacheEvents(id: string, pubKey?: string): Promise<INostrEvent[]>;
    fetchTrendingCacheEvents(pubKey?: string): Promise<INostrEvent[]>;
    fetchProfileFeedCacheEvents(pubKey: string, since?: number, until?: number): Promise<INostrEvent[]>;
    fetchProfileRepliesCacheEvents(pubKey: string, since?: number, until?: number): Promise<INostrEvent[]>;
    fetchHomeFeedCacheEvents(pubKey?: string, since?: number, until?: number): Promise<INostrEvent[]>;
    fetchUserProfileCacheEvents(pubKeys: string[]): Promise<INostrEvent[]>;
    fetchUserProfileDetailCacheEvents(pubKey: string): Promise<INostrEvent[]>;
    fetchContactListCacheEvents(pubKey: string, detailIncluded?: boolean): Promise<INostrEvent[]>;
    fetchFollowersCacheEvents(pubKey: string): Promise<INostrEvent[]>;
    fetchCommunities(pubkeyToCommunityIdsMap?: Record<string, string[]>): Promise<INostrEvent[]>;
    fetchAllUserRelatedCommunities(pubKey: string): Promise<INostrEvent[]>;
    fetchUserBookmarkedCommunities(pubKey: string, excludedCommunity?: ICommunityInfo): Promise<ICommunityBasicInfo[]>;
    fetchCommunity(creatorId: string, communityId: string): Promise<INostrEvent[]>;
    fetchCommunityFeed(creatorId: string, communityId: string): Promise<INostrEvent[]>;
    fetchCommunitiesGeneralMembers(communities: ICommunityBasicInfo[]): Promise<INostrEvent[]>;
    // fetchNotes(options: IFetchNotesOptions): Promise<INostrEvent[]>;
    // fetchMetadata(options: IFetchMetadataOptions): Promise<INostrEvent[]>;
    // fetchReplies(options: IFetchRepliesOptions): Promise<INostrEvent[]>;
    // fetchFollowing(npubs: string[]): Promise<INostrEvent[]>;
    fetchEventsByIds(ids: string[]): Promise<INostrEvent[]>;
    fetchAllUserRelatedChannels(pubKey: string): Promise<IAllUserRelatedChannels>;
    fetchUserBookmarkedChannelEventIds(pubKey: string): Promise<string[]>;
    fetchChannelMessages(channelId: string, since?: number, until?: number): Promise<INostrEvent[]>;
    fetchChannelInfoMessages(channelId: string): Promise<INostrEvent[]>;
    fetchMessageContactsCacheEvents(pubKey: string): Promise<INostrEvent[]>;
    fetchDirectMessages(pubKey: string, sender: string, since?: number, until?: number): Promise<INostrEvent[]>;
    resetMessageCount(pubKey: string, sender: string, privateKey: string): Promise<void>;
    fetchGroupKeys(identifier: string): Promise<INostrEvent>;
    fetchUserGroupInvitations(groupKinds: number[], pubKey: string): Promise<INostrEvent[]>;
    fetchCalendarEventPosts(calendarEventUri: string): Promise<INostrEvent[]>;
    fetchCalendarEvents(start: number, end?: number, limit?: number): Promise<INostrEvent[]>;
    fetchCalendarEvent(address: Nip19.AddressPointer): Promise<INostrEvent | null>;
    fetchCalendarEventRSVPs(calendarEventUri: string, pubkey?: string): Promise<INostrEvent[]>;
    fetchLongFormContentEvents(pubKey?: string, since?: number, until?: number): Promise<INostrEvent[]>;
    // fetchLikes(eventId: string): Promise<INostrEvent[]>;
    searchUsers(query: string): Promise<INostrEvent[]>;
}

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
    async fetchEventsFromAPI(endpoint: string, msg: any): Promise<INostrFetchEventsResponse> {
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
    async submitEvent(event: any): Promise<any> {
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
                console.log('Connected to server');
                this.ws.removeEventListener('open', openListener);
                resolve({ ws: this.ws, error: null });
            }
            if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
                this.ws = new WebSocket(this._url);
                this.ws.addEventListener('open', openListener);
                this.ws.addEventListener('message', this.messageListenerBound);

                this.ws.addEventListener('close', () => {
                    console.log('Disconnected from server');
                });

                this.ws.addEventListener('error', (error) => {
                    console.error('WebSocket Error:', error);
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
                    console.log("end of stored events");
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
            console.log(msg);
            const { ws, error } = await this.establishConnection(event.id, (message) => {
                console.log('from server:', message);
                resolve({
                    eventId: message[1],
                    success: message[2],
                    message: message[3]
                });
            });
            if (error) {
                resolve({
                    eventId: event.id,
                    success: false,
                    message: error            
                });
            }
            else if (ws) {
                ws.send(msg);
            }
        });
    }
}

class NostrEventManagerWrite implements ISocialEventManagerWrite {
    private _nostrCommunicationManagers: INostrCommunicationManager[] = [];
    private _apiBaseUrl: string;

    constructor(managers: INostrCommunicationManager[], apiBaseUrl: string) {
        this._nostrCommunicationManagers = managers;
        this._apiBaseUrl = apiBaseUrl;
    }

    private calculateConversationPathTags(conversationPath: IConversationPath) {
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

    async updateContactList(content: string, contactPubKeys: string[], privateKey: string) {
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
        const verifiedEvent = Event.finishEvent(event, privateKey);
        await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
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
        const verifiedEvent = Event.finishEvent(event, privateKey);
        await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
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
        const verifiedEvent = Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        return responses;
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
            let encodedScpData = SocialUtilsManager.utf8ToBase64('$scp:' + JSON.stringify(info.scpData));
            event.tags.push([
                "scp",
                ScpStandardId.Channel,
                encodedScpData
            ]);
        }
        const verifiedEvent = Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        return responses;
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
        const verifiedEvent = Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
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
        if (info.avatarImgUrl) {
            event.tags.push([
                "avatar",
                info.avatarImgUrl
            ]);
        }        
        if (info.rules) {
            event.tags.push([
                "rules",
                info.rules
            ]);
        }
        if (info.scpData) {
            let encodedScpData = SocialUtilsManager.utf8ToBase64('$scp:' + JSON.stringify(info.scpData));
            event.tags.push([
                "scp",
                ScpStandardId.Community,
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
        const verifiedEvent = Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        return responses;
    }

    async updateUserBookmarkedCommunities(communities: ICommunityBasicInfo[], privateKey: string) {
        let communityUriArr: string[] = [];
        for (let community of communities) {
            const communityUri = SocialUtilsManager.getCommunityUri(community.creatorId, community.communityId);
            communityUriArr.push(communityUri);
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
        const verifiedEvent = Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
    }

    async submitCommunityPost(info: INewCommunityPostInfo, privateKey: string) {
        const community = info.community;
        const communityUri = SocialUtilsManager.getCommunityUri(community.creatorId, community.communityId);
        let event = {
            "kind": 1,
            "created_at": Math.round(Date.now() / 1000),
            "content": info.message,
            "tags": []
        };
        if (info.scpData) {
            let encodedScpData = SocialUtilsManager.utf8ToBase64('$scp:' + JSON.stringify(info.scpData));
            event.tags.push([
                "scp",
                ScpStandardId.CommunityPost,
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
        const verifiedEvent = Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
    }

    async submitChannelMessage(info: INewChannelMessageInfo, privateKey: string) {
        let event = {
            "kind": 42,
            "created_at": Math.round(Date.now() / 1000),
            "content": info.message,
            "tags": []
        };
        if (info.scpData) {
            let encodedScpData = SocialUtilsManager.utf8ToBase64('$scp:' + JSON.stringify(info.scpData));
            event.tags.push([
                "scp",
                ScpStandardId.ChannelMessage,
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
        const verifiedEvent = Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
    }

    async updateUserProfile(content: INostrMetadataContent, privateKey: string) {
        let event = {
            "kind": 0,
            "created_at": Math.round(Date.now() / 1000),
            "content": JSON.stringify(content),
            "tags": []
        };
        const verifiedEvent = Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
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
        const verifiedEvent = Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
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
                ],
                [
                    "scp",
                    ScpStandardId.GroupKeys
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
        const verifiedEvent = Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        return responses;
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
        if (info.city) {
            event.tags.push([
                "city",
                info.city
            ]);
        }
        const verifiedEvent = Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        const failedResponses = responses.filter(response => !response.success); //FIXME: Handle failed responses
        if (failedResponses.length === 0) {
            let response = responses[0];
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
        return responses;
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
        const verifiedEvent = Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        return responses;
    }

    async submitCalendarEventPost(info: INewCalendarEventPostInfo, privateKey: string) {
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
        const verifiedEvent = Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        return responses;
    }

    async submitLongFormContentEvents(info: ILongFormContentInfo, privateKey: string) {
        let event = {
            "kind": 30023,
            "created_at": Math.round(Date.now() / 1000),
            "content": info.content,
            "tags": [
                [
                    "d",
                    info.id
                ]
            ]
        };
        if (info.title) {
            event.tags.push([
                "title",
                info.title
            ]);
        }
        if (info.image) {
            event.tags.push([
                "image",
                info.image
            ]);
        }
        if (info.summary) {
            event.tags.push([
                "summary",
                info.summary
            ]);
        }
        if (info.publishedAt) {
            event.tags.push([
                "published_at",
                info.publishedAt.toString()
            ]);
        }
        const verifiedEvent = Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
    }

    async submitLike(tags: string[][], privateKey: string) {
        let event = {
            "kind": 7,
            "created_at": Math.round(Date.now() / 1000),
            "content": "+",
            "tags": tags
        };
        const verifiedEvent = Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
    }

    async submitRepost(content: string, tags: string[][], privateKey: string) {
        let event = {
            "kind": 6,
            "created_at": Math.round(Date.now() / 1000),
            "content": content,
            "tags": tags
        };
        const verifiedEvent = Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
    }
}

class NostrEventManagerRead implements ISocialEventManagerRead {
    protected _nostrCommunicationManager: INostrCommunicationManager;
    protected _nostrCachedCommunicationManager: INostrCommunicationManager;
    protected _apiBaseUrl: string;

    constructor(manager: INostrCommunicationManager, cachedManager: INostrCommunicationManager, apiBaseUrl: string) {
        this._nostrCommunicationManager = manager;
        this._nostrCachedCommunicationManager = cachedManager;
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
        const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('thread_view', msg);
        return fetchEventsResponse.events;
    }

    async fetchTrendingCacheEvents(pubKey?: string) {
        let msg: any = {
        };
        if (pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
            msg.user_pubkey = decodedPubKey;
        }
        const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('explore_global_trending_24h', msg);
        return fetchEventsResponse.events;
    }

    async fetchProfileFeedCacheEvents(pubKey: string, since: number = 0, until: number = 0) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg: any = {
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
        const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('feed', msg);
        return fetchEventsResponse.events;
    }

    async fetchProfileRepliesCacheEvents(pubKey: string, since: number = 0, until: number = 0) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg: any = {
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
        const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('feed', msg);
        return fetchEventsResponse.events;
    }

    async fetchHomeFeedCacheEvents(pubKey?: string, since: number = 0, until: number = 0) {
        let msg: any = {
            limit: 20
        };
        if (until === 0) {
            msg.since = since;
        }
        else {
            msg.until = until;
        }
        msg.pubkey = Nip19.decode('npub1nfgqmnxqsjsnsvc2r5djhcx4ap3egcjryhf9ppxnajskfel2dx9qq6mnsp').data //FIXME: Account to show Nostr highlights 
        if (pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
            msg.user_pubkey = decodedPubKey;
        }
        const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('feed', msg);
        return fetchEventsResponse.events;
    }

    async fetchUserProfileCacheEvents(pubKeys: string[]) {
        const decodedPubKeys = pubKeys.map(pubKey => pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey);
        let msg: any = {
            pubkeys: decodedPubKeys
        };
        const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('user_infos', msg);
        return fetchEventsResponse.events;
    }

    async fetchUserProfileDetailCacheEvents(pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg: any = {
            pubkey: decodedPubKey,
            user_pubkey: decodedPubKey
        };
        const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('user_profile', msg);
        return fetchEventsResponse.events;
    }

    async fetchContactListCacheEvents(pubKey: string, detailIncluded: boolean = true) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg: any = {
            extended_response: detailIncluded,
            pubkey: decodedPubKey
        };
        const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('contact_list', msg);
        return fetchEventsResponse.events;
    }    

    async fetchFollowersCacheEvents(pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg: any = {
            pubkey: decodedPubKey
        };
        const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('user_followers', msg);
        return fetchEventsResponse.events;
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
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(...requests);
            events = fetchEventsResponse.events;
        }   
        else {
            let request: any = {
                kinds: [34550],
                limit: 50
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
            events = fetchEventsResponse.events;
        }
        return events;
    }

    async fetchAllUserRelatedCommunities(pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let requestForCreatedCommunities: any = {
            kinds: [34550],
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
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(
            requestForCreatedCommunities, 
            requestForFollowedCommunities,
            requestForModeratedCommunities
        );
        let communitiesEvents: INostrEvent[] = [];
        const pubkeyToCommunityIdsMap: Record<string, string[]> = {};
        for (let event of fetchEventsResponse.events) {
            if (event.kind === 34550) {
                communitiesEvents.push(event);
            }
            else if (event.kind === 30001) {
                const bookmarkedCommunities = SocialUtilsManager.extractBookmarkedCommunities(event);
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
            const bookmarkedCommunitiesEvents = await this.fetchCommunities(pubkeyToCommunityIdsMap);
            for (let event of bookmarkedCommunitiesEvents) {
                communitiesEvents.push(event);
            }
        }
        return communitiesEvents;
    }

    async fetchUserBookmarkedCommunities(pubKey: string, excludedCommunity?: ICommunityInfo) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let request: any = {
            kinds: [30001],
            "#d": ["communities"],
            authors: [decodedPubKey]
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
        const bookmarkedCommunitiesEvent = fetchEventsResponse.events.find(event => event.kind === 30001);
        const communities: ICommunityBasicInfo[] = SocialUtilsManager.extractBookmarkedCommunities(bookmarkedCommunitiesEvent, excludedCommunity);
        return communities;
    }

    async fetchCommunity(creatorId: string, communityId: string) {
        const decodedCreatorId = creatorId.startsWith('npub1') ? Nip19.decode(creatorId).data : creatorId;
        let infoMsg: any = {
            kinds: [34550],
            authors: [decodedCreatorId],
            "#d": [communityId]
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(infoMsg);
        return fetchEventsResponse.events;        
    }

    async fetchCommunityFeed(creatorId: string, communityId: string) {
        const decodedCreatorId = creatorId.startsWith('npub1') ? Nip19.decode(creatorId).data : creatorId;
        const communityUri = SocialUtilsManager.getCommunityUri(creatorId, communityId);
        let infoMsg: any = {
            kinds: [34550],
            authors: [decodedCreatorId],
            "#d": [communityId]
        };
        let notesMsg: any = {
            // kinds: [1, 7, 9735],
            kinds: [1],
            "#a": [communityUri],
            limit: 50
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(infoMsg, notesMsg);
        return fetchEventsResponse.events;        
    }

    async fetchCommunitiesGeneralMembers(communities: ICommunityBasicInfo[]) {
        const communityUriArr: string[] = [];
        for (let community of communities) {
            const communityUri = SocialUtilsManager.getCommunityUri(community.creatorId, community.communityId);
            communityUriArr.push(communityUri);
        }
        let request: any = {
            kinds: [30001],
            "#d": ["communities"],
            "#a": communityUriArr
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
        return fetchEventsResponse.events;        
    }

    // async fetchNotes(options: IFetchNotesOptions) {
    //     const decodedNpubs = options.authors?.map(npub => Nip19.decode(npub).data);
    //     let decodedIds = options.ids?.map(id => id.startsWith('note1') ? Nip19.decode(id).data : id);
    //     let msg: any = {
    //         kinds: [1],
    //         limit: 20
    //     };
    //     if (decodedNpubs) msg.authors = decodedNpubs;
    //     if (decodedIds) msg.ids = decodedIds;
    //     const events = await this._nostrCommunicationManager.fetchEvents(msg);
    //     return events;
    // }

    // async fetchMetadata(options: IFetchMetadataOptions) {
    //     let decodedNpubs;
    //     if (options.decodedAuthors) {
    //         decodedNpubs = options.decodedAuthors;
    //     }
    //     else {
    //         decodedNpubs = options.authors?.map(npub => Nip19.decode(npub).data) || [];
    //     }
    //     const msg = {
    //         authors: decodedNpubs,
    //         kinds: [0]
    //     };
    //     const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(msg);
    //     return fetchEventsResponse.events;
    // }

    // async fetchReplies(options: IFetchRepliesOptions) {
    //     let decodedNoteIds;
    //     if (options.decodedIds) {
    //         decodedNoteIds = options.decodedIds;
    //     }
    //     else {
    //         decodedNoteIds = options.noteIds?.map(id => id.startsWith('note1') ? Nip19.decode(id).data : id);
    //     }
    //     const msg = {
    //         "#e": decodedNoteIds,
    //         kinds: [1],
    //         limit: 20,
    //     }
    //     const events = await this._nostrCommunicationManager.fetchEvents(msg);
    //     return events;
    // }

    // async fetchFollowing(npubs: string[]) {
    //     const decodedNpubs = npubs.map(npub => Nip19.decode(npub).data);
    //     const msg = {
    //         authors: decodedNpubs,
    //         kinds: [3]
    //     }
    //     const events = await this._nostrCommunicationManager.fetchEvents(msg);
    //     return events;
    // }

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
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(
            requestForCreatedChannels, 
            requestForJoinedChannels
        );

        let channels: IChannelInfo[] = [];
        let bookmarkedChannelEventIds: string[] = [];
        const channelMetadataMap: Record<string, IChannelInfo> = {};
        const handleChannelEvent = (event: INostrEvent) => {
            if (event.kind === 40) {
                const channelInfo = SocialUtilsManager.extractChannelInfo(event);
                if (channelInfo) {
                    channels.push(channelInfo);
                }
            }
            else if (event.kind === 41) {
                const channelInfo = SocialUtilsManager.extractChannelInfo(event);
                if (channelInfo) {
                    channelMetadataMap[channelInfo.id] = channelInfo;
                }
            }
        };

        for (let event of fetchEventsResponse.events) {
            if (event.kind === 30001) {
                bookmarkedChannelEventIds = SocialUtilsManager.extractBookmarkedChannels(event);
            }
            else {
                handleChannelEvent(event);
            }
        }

        if (bookmarkedChannelEventIds.length > 0) {
            const bookmarkedChannelEvents = await this.fetchEventsByIds(bookmarkedChannelEventIds);
            for (let event of bookmarkedChannelEvents) {
                handleChannelEvent(event);
            }
        }

        const pubkeyToCommunityIdsMap: Record<string, string[]> = {};
        for (let channel of channels) {
            const scpData = channel.scpData;
            if (!scpData?.communityUri) continue;
            const {communityId} = SocialUtilsManager.getCommunityBasicInfoFromUri(scpData.communityUri);
            pubkeyToCommunityIdsMap[channel.eventData.pubkey] = pubkeyToCommunityIdsMap[channel.eventData.pubkey] || [];
            if (!pubkeyToCommunityIdsMap[channel.eventData.pubkey].includes(communityId)) {
                pubkeyToCommunityIdsMap[channel.eventData.pubkey].push(communityId);
            }
        }

        let channelIdToCommunityMap: Record<string, ICommunityInfo> = {};
        const communityEvents = await this.fetchCommunities(pubkeyToCommunityIdsMap);
        for (let event of communityEvents) {
            const communityInfo = SocialUtilsManager.extractCommunityInfo(event);
            const channelId = communityInfo.scpData?.channelEventId;
            if (!channelId) continue;
            channelIdToCommunityMap[channelId] = communityInfo;
        }
        return {
            channels,
            channelMetadataMap,
            channelIdToCommunityMap
        }
    }

    async fetchUserBookmarkedChannelEventIds(pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let requestForJoinedChannels: any = {
            kinds: [30001],
            "#d": ["channels"],
            authors: [decodedPubKey]
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(requestForJoinedChannels);
        const bookmarkedChannelsEvent = fetchEventsResponse.events.find(event => event.kind === 30001);
        const channelEventIds = SocialUtilsManager.extractBookmarkedChannels(bookmarkedChannelsEvent);

        return channelEventIds;
    }

    async fetchEventsByIds(ids: string[]) {
        let request: any = {
            ids: ids
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
        return fetchEventsResponse.events;
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
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(
            messagesReq
        );
        return fetchEventsResponse.events;        
    }

    async fetchChannelInfoMessages(channelId: string) {
        const decodedChannelId = channelId.startsWith('npub1') ? Nip19.decode(channelId).data : channelId;
        let channelCreationEventReq: any = {
            kinds: [40],
            ids: [decodedChannelId],
        };
        let channelMetadataEventReq: any = {
            kinds: [41],
            "#e": [decodedChannelId]
        };
        let messagesReq: any = {
            kinds: [42],
            "#e": [decodedChannelId],
            limit: 20
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(
            channelCreationEventReq, 
            channelMetadataEventReq,
            messagesReq
        );
        return fetchEventsResponse.events;        
    }

    async fetchMessageContactsCacheEvents(pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg: any = {
            user_pubkey: decodedPubKey,
            relation: 'follows'
        };
        const followsEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('get_directmsg_contacts', msg);
        msg = {
            user_pubkey: decodedPubKey,
            relation: 'other'
        };
        const otherEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('get_directmsg_contacts', msg);
        return [...followsEventsResponse.events, ...otherEventsResponse.events];
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
        const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('get_directmsgs', req);
        return fetchEventsResponse.events;
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
        await this._nostrCachedCommunicationManager.fetchCachedEvents('reset_directmsg_count', msg);
    }

    async fetchGroupKeys(identifier: string) {
        let req: any = {
            kinds: [30078],
            "#d": [identifier]
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    }

    async fetchUserGroupInvitations(groupKinds: number[], pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data as string : pubKey;
        let req: any = {
            kinds: [30078],
            "#p": [decodedPubKey],
            "#k": groupKinds.map(kind => kind.toString())
        };
        const fetchEventsResponse =  await this._nostrCommunicationManager.fetchEvents(req);
        let events = fetchEventsResponse.events?.filter(event => event.tags.filter(tag => tag[0] === 'p' && tag?.[3] === 'invitee').map(tag => tag[1]).includes(decodedPubKey));
        return events;
    }

    async fetchCalendarEvents(start: number, end?: number, limit?: number) {
        let req: any;
        // FixME: Remove line comments when events are indexed
        // if (this._apiBaseUrl) {
        //     let queriesObj: any = {
        //         start: start.toString()
        //     };
        //     if (end) {
        //         queriesObj.end = end.toString();
        //     }
        //     let queries = new URLSearchParams(queriesObj).toString();
        //     const apiUrl = `${this._apiBaseUrl}/calendar-events?${queries}`;
        //     const apiResponse = await fetch(apiUrl);
        //     const apiResult = await apiResponse.json();
        //     let calendarEventIds: string[] = [];
        //     if (apiResult.success) {
        //         const calendarEvents = apiResult.data.calendarEvents;
        //         calendarEventIds = calendarEvents.map(calendarEvent => calendarEvent.eventId);
        //     }
        //     req = {
        //         kinds: [31922, 31923],
        //         ids: calendarEventIds
        //     };
        // }
        // else {
            req = {
                kinds: [31922, 31923],
                limit: limit || 10
            }; 
        // }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
        return fetchEventsResponse.events;
    }

    async fetchCalendarEvent(address: Nip19.AddressPointer) {
        let req: any = {
            kinds: [address.kind],
            "#d": [address.identifier],
            authors: [address.pubkey]
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    }

    async fetchCalendarEventPosts(calendarEventUri: string) {
        let request: any = {
            kinds: [1],
            "#a": [calendarEventUri],
            limit: 50
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
        return fetchEventsResponse.events;        
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
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
        return fetchEventsResponse.events;
    }

    async fetchLongFormContentEvents(pubKey?: string, since: number = 0, until: number = 0) {
        let req: any = {
            kinds: [30023],
            limit: 20
        };
        if (pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
            req.authors = [decodedPubKey];
        }
        if (until === 0) {
            req.since = since;
        }
        else {
            req.until = until;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
        return fetchEventsResponse.events;
    }

    // async fetchLikes(eventId: string) {
    //     let req: any = {
    //         kinds: [7],
    //         "#e": [eventId]
    //     };
    //     const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
    //     return fetchEventsResponse.events;
    // }

    async searchUsers(query: string) {
        const req: any = {
            query: query,
            limit: 10
        };
        const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('user_search', req);
        return fetchEventsResponse.events;
    }
}

class NostrEventManagerReadV2 extends NostrEventManagerRead implements ISocialEventManagerRead {
    protected _nostrCommunicationManager: INostrRestAPIManager;
    protected _nostrCachedCommunicationManager: INostrRestAPIManager;
    protected _apiBaseUrl: string;

    constructor(manager: INostrRestAPIManager, cachedManager: INostrRestAPIManager, apiBaseUrl: string) {
        super(manager, cachedManager, apiBaseUrl);
    }

    async fetchThreadCacheEvents(id: string, pubKey?: string) {
        let decodedId = id.startsWith('note1') ? Nip19.decode(id).data : id;
        let msg: any = {
            eventId: decodedId,
            limit: 100
        };
        const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchEventsFromAPI('fetch-thread-posts', msg);
        return fetchEventsResponse.events;
    }

    async fetchTrendingCacheEvents(pubKey?: string) {
        let msg: any = {
        };
        const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchEventsFromAPI('fetch-trending-posts', msg);
        return fetchEventsResponse.events;
    }
    
    async fetchProfileFeedCacheEvents(pubKey: string, since: number = 0, until: number = 0) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg: any = {
            limit: 20,
            pubkey: decodedPubKey
        };
        if (until === 0) {
            msg.since = since;
        }
        else {
            msg.until = until;
        }
        const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchEventsFromAPI('fetch-profile-feed', msg);
        return fetchEventsResponse.events;
    }

    async fetchProfileRepliesCacheEvents(pubKey: string, since: number = 0, until: number = 0) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg: any = {
            limit: 20,
            pubkey: decodedPubKey
        };
        if (until === 0) {
            msg.since = since;
        }
        else {
            msg.until = until;
        }
        const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchEventsFromAPI('fetch-profile-replies', msg);
        return fetchEventsResponse.events;
    }

    async WIP_fetchHomeFeedCacheEvents(pubKey?: string, since: number = 0, until: number = 0) {
    }

    async fetchUserProfileCacheEvents(pubKeys: string[]) {
        const decodedPubKeys = pubKeys.map(pubKey => pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey);
        let msg: any = {
            pubkeys: decodedPubKeys
        };
        const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchEventsFromAPI('fetch-user-profiles', msg);
        return fetchEventsResponse.events;
    }

    async fetchUserProfileDetailCacheEvents(pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg: any = {
            pubkey: decodedPubKey
        };
        const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchEventsFromAPI('fetch-user-profile-detail', msg);
        return fetchEventsResponse.events;
    }

    async fetchContactListCacheEvents(pubKey: string, detailIncluded: boolean = true) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg: any = {
            pubkey: decodedPubKey,
            detailIncluded: detailIncluded,
        };
        const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchEventsFromAPI('fetch-contact-list', msg);
        return fetchEventsResponse.events;
    }    

    async fetchFollowersCacheEvents(pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg: any = {
            pubkey: decodedPubKey
        };
        const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchEventsFromAPI('fetch-followers', msg);
        return fetchEventsResponse.events;
    }  

    async fetchCommunities(pubkeyToCommunityIdsMap?: Record<string, string[]>) {
        let events;
        if (pubkeyToCommunityIdsMap && Object.keys(pubkeyToCommunityIdsMap).length > 0) {
            let msg = {
                identifiers: []
            }
            for (let pubkey in pubkeyToCommunityIdsMap) {
                const decodedPubKey = pubkey.startsWith('npub1') ? Nip19.decode(pubkey).data : pubkey;
                const communityIds = pubkeyToCommunityIdsMap[pubkey];
                let request: any = {
                    pubkey: decodedPubKey,
                    names: communityIds
                };
                msg.identifiers.push(request);
            }
            let response = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-communities', msg);
            events = response.events;
        }   
        else {
            let msg: any = {
                limit: 50
            };
            let response = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-communities', msg);
            events = response.events;
        }
        return events;
    }

    async fetchAllUserRelatedCommunities(pubKey: string) {
        let msg: any = {
            pubKey
        };
        let response = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-communities', msg);
        return response.events;
    }

    async fetchUserBookmarkedCommunities(pubKey: string, excludedCommunity?: ICommunityInfo) {
        let msg: any = {
            pubKey
        };
        let response = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-bookmarked-communities', msg);
        let communities: ICommunityBasicInfo[] = [];
        for (let community of response.data as ICommunityBasicInfo[]) {
            if (excludedCommunity) {
                const decodedPubkey = Nip19.decode(excludedCommunity.creatorId).data as string;
                if (community.communityId === excludedCommunity.communityId && community.creatorId === decodedPubkey) continue;
            }
            communities.push(community);
        }
        return communities;
    }

    async fetchCommunity(creatorId: string, communityId: string) {
        const decodedCreatorId = creatorId.startsWith('npub1') ? Nip19.decode(creatorId).data : creatorId;
        let msg: any = {
            identifiers: [
                {
                    pubkey: decodedCreatorId,
                    names: [communityId]
                }
            ]
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-communities', msg);
        return fetchEventsResponse.events;        
    }

    async fetchCommunityFeed(creatorId: string, communityId: string) {
        const decodedCreatorId = creatorId.startsWith('npub1') ? Nip19.decode(creatorId).data : creatorId;
        let msg: any = {
            identifiers: [
                {
                    pubkey: decodedCreatorId,
                    names: [communityId]
                }
            ],
            limit: 50
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-community-feed', msg);
        return fetchEventsResponse.events;        
    }

    async fetchCommunitiesGeneralMembers(communities: ICommunityBasicInfo[]) {  
        let msg = {
            identifiers: []
        }
        for (let community of communities) {
            const decodedCreatorId = community.creatorId.startsWith('npub1') ? Nip19.decode(community.creatorId).data : community.creatorId;
            let request: any = {
                pubkey: decodedCreatorId,
                names: [community.communityId]
            };
            msg.identifiers.push(request);
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-communities-general-members', msg);
        return fetchEventsResponse.events;    
    }

    async fetchAllUserRelatedChannels(pubKey: string) {
        let msg: any = {
            pubKey
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-related-channels', msg);
        let channels: IChannelInfo[] = [];
        const channelMetadataMap: Record<string, IChannelInfo> = {};
        for (let event of fetchEventsResponse.events) { 
            if (event.kind === 40) {
                const channelInfo = SocialUtilsManager.extractChannelInfo(event);
                if (channelInfo) {
                    channels.push(channelInfo);
                }
            }
            else if (event.kind === 41) {
                const channelInfo = SocialUtilsManager.extractChannelInfo(event);
                if (channelInfo) {
                    channelMetadataMap[channelInfo.id] = channelInfo;
                }
            }
        }

        const pubkeyToCommunityIdsMap: Record<string, string[]> = {};
        for (let channel of channels) {
            const scpData = channel.scpData;
            if (!scpData?.communityUri) continue;
            const {communityId} = SocialUtilsManager.getCommunityBasicInfoFromUri(scpData.communityUri);
            pubkeyToCommunityIdsMap[channel.eventData.pubkey] = pubkeyToCommunityIdsMap[channel.eventData.pubkey] || [];
            if (!pubkeyToCommunityIdsMap[channel.eventData.pubkey].includes(communityId)) {
                pubkeyToCommunityIdsMap[channel.eventData.pubkey].push(communityId);
            }
        }

        let channelIdToCommunityMap: Record<string, ICommunityInfo> = {};
        const communityEvents = await this.fetchCommunities(pubkeyToCommunityIdsMap);
        for (let event of communityEvents) {
            const communityInfo = SocialUtilsManager.extractCommunityInfo(event);
            const channelId = communityInfo.scpData?.channelEventId;
            if (!channelId) continue;
            channelIdToCommunityMap[channelId] = communityInfo;
        }
        return {
            channels,
            channelMetadataMap,
            channelIdToCommunityMap
        }
    }

    async fetchUserBookmarkedChannelEventIds(pubKey: string) {
        let msg: any = {
            pubKey
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-bookmarked-channel-event-ids', msg);
        return fetchEventsResponse.data;
    }

    async fetchEventsByIds(ids: string[]) {
        let msg: any = {
            ids
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-events', msg);
        return fetchEventsResponse.events;
    }

    async fetchChannelMessages(channelId: string, since: number = 0, until: number = 0) {
        const decodedChannelId = channelId.startsWith('npub1') ? Nip19.decode(channelId).data : channelId;
        let msg: any = {
            channelId: decodedChannelId,
            limit: 20
        };
        if (until === 0) {
            msg.since = since;
        }
        else {
            msg.until = until;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents('fetch-channel-messages', msg);
        return fetchEventsResponse.events;        
    }

    async fetchChannelInfoMessages(channelId: string) {
        const decodedChannelId = channelId.startsWith('npub1') ? Nip19.decode(channelId).data : channelId;
        let msg: any = {
            channelId: decodedChannelId,
            limit: 20
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents('fetch-channel-info-messages', msg);
        return fetchEventsResponse.events;         
    }

    async fetchMessageContactsCacheEvents(pubKey: string) {
        const senderToLastReadMap: Record<string, number> = {};
        //FIXME: Implement a better way to get last read messages
        if (localStorage) {
            const lastReadsStr = localStorage.getItem('lastReads');
            if (lastReadsStr) {
                const lastReads = JSON.parse(lastReadsStr);
                for (let sender in lastReads) {
                    senderToLastReadMap[sender] = lastReads[sender];
                }
            }
        }
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        const msg: any = {
            receiver: decodedPubKey,
            senderToLastReadMap: senderToLastReadMap
        }
        const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchEventsFromAPI('fetch-direct-messages-stats', msg);
        return fetchEventsResponse.events;
    }

    async fetchDirectMessages(pubKey: string, sender: string, since: number = 0, until: number = 0) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        const decodedSenderPubKey = sender.startsWith('npub1') ? Nip19.decode(sender).data : sender;
        const msg: any = {
            receiver: decodedPubKey,
            sender: decodedSenderPubKey,
            limit: 20
        }
        if (until === 0) {
            msg.since = since;
        }
        else {
            msg.until = until;
        }
        const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchEventsFromAPI('fetch-direct-messages', msg);
        return fetchEventsResponse.events;
    }

    async resetMessageCount(pubKey: string, sender: string, privateKey: string) {
        //FIXME: Implement a better way to set last read messages
        if (localStorage) {
            const lastReadsStr = localStorage.getItem('lastReads');
            let lastReads: Record<string, number> = {};
            if (lastReadsStr) {
                lastReads = JSON.parse(lastReadsStr);
            }
            lastReads[sender] = Math.ceil(Date.now() / 1000);
            localStorage.setItem('lastReads', JSON.stringify(lastReads));
        }
    }

    async fetchGroupKeys(identifier: string) {
        let msg: any = {
            identifier
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-application-specific', msg);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    }

    async fetchUserGroupInvitations(groupKinds: number[], pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data as string : pubKey;
        let msg: any = {
            pubKey: decodedPubKey,
            groupKinds: groupKinds
        };
        const fetchEventsResponse =  await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-group-invitations', msg);
        let events = fetchEventsResponse.events?.filter(event => event.tags.filter(tag => tag[0] === 'p' && tag?.[3] === 'invitee').map(tag => tag[1]).includes(decodedPubKey));
        return events;
    }

    async fetchCalendarEvents(start: number, end?: number, limit?: number) {
        let msg: any = {
            start: start,
            end: end,
            limit: limit || 10
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-calendar-events', msg);
        return fetchEventsResponse.events;  
    }

    async fetchCalendarEvent(address: Nip19.AddressPointer) {
        const key = `${address.kind}:${address.pubkey}:${address.identifier}`;
        let msg: any = {
            key
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-calendar-events', msg);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    } 

    async fetchCalendarEventPosts(calendarEventUri: string) {    
        let msg: any = {
            eventUri: calendarEventUri,
            limit: 50
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-calendar-posts', msg);
        return fetchEventsResponse.events;
    }

    async fetchCalendarEventRSVPs(calendarEventUri: string, pubkey?: string) {
        let msg: any = {
            eventUri: calendarEventUri
        };
        if (pubkey) {
            const decodedPubKey = pubkey.startsWith('npub1') ? Nip19.decode(pubkey).data : pubkey;
            msg.pubkey = decodedPubKey;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-calendar-rsvps', msg);
        return fetchEventsResponse.events;
    }

    async fetchLongFormContentEvents(pubKey?: string, since: number = 0, until: number = 0) {
        let msg: any = {
            limit: 20
        };
        if (pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
            msg.pubKey = decodedPubKey;
        }
        if (until === 0) {
            msg.since = since;
        }
        else {
            msg.until = until;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-long-form-content', msg);
        return fetchEventsResponse.events;
    }
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

    static utf8ToBase64(utf8: string): string {
        if (typeof window !== "undefined"){
            return btoa(utf8);
        }
        else {
            // @ts-ignore
            return Buffer.from(utf8).toString('base64');
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

    private static pad(number: number): string {
        return number < 10 ? '0' + number : number.toString();
    }

    static getGMTOffset(timezone: string): string {
        let gmtOffset
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
        } catch (err) {
            console.error(err);
        }
        return gmtOffset;
    }

    static async exponentialBackoffRetry<T>(
        fn: () => Promise<T>, // Function to retry
        retries: number, // Maximum number of retries
        delay: number, // Initial delay duration in milliseconds
        maxDelay: number, // Maximum delay duration in milliseconds
        factor: number // Exponential backoff factor
    ): Promise<T> {
        let currentDelay = delay;
    
        for (let i = 0; i < retries; i++) {
            try {
                return await fn();
            } catch (error) {
                console.error(`Attempt ${i + 1} failed. Retrying in ${currentDelay}ms...`);
    
                // Wait for the current delay period
                await new Promise(resolve => setTimeout(resolve, currentDelay));
    
                // Update delay for the next iteration, capped at maxDelay
                currentDelay = Math.min(maxDelay, currentDelay * factor);
            }
        }
    
        // If all retries have been exhausted, throw an error
        throw new Error(`Failed after ${retries} retries`);
    }

    static getCommunityUri(creatorId: string, communityId: string) {
        const decodedPubkey = creatorId.startsWith('npub1') ? Nip19.decode(creatorId).data as string : creatorId;
        return `34550:${decodedPubkey}:${communityId}`;
    }

    static getCommunityBasicInfoFromUri(communityUri: string): ICommunityBasicInfo {
        const parts = communityUri.split(':');
        return {
            creatorId: parts[1],
            communityId: parts[2]
        }
    }

    static extractCommunityInfo(event: INostrEvent) {
        const communityId = event.tags.find(tag => tag[0] === 'd')?.[1];
        const description = event.tags.find(tag => tag[0] === 'description')?.[1];
        const rules = event.tags.find(tag => tag[0] === 'rules')?.[1];
        const image = event.tags.find(tag => tag[0] === 'image')?.[1];
        const avatar = event.tags.find(tag => tag[0] === 'avatar')?.[1];
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
        const communityUri = SocialUtilsManager.getCommunityUri(creatorId, communityId);
        let communityInfo: ICommunityInfo = {
            creatorId,
            moderatorIds,
            communityUri,
            communityId,
            description,
            rules,
            bannerImgUrl: image,
            avatarImgUrl: avatar,
            scpData,
            eventData: event,
            gatekeeperNpub,
            membershipType
        }

        return communityInfo;
    }

    static extractBookmarkedCommunities(event: INostrEvent, excludedCommunity?: ICommunityInfo) {
        const communities: ICommunityBasicInfo[] = [];
        const communityUriArr = event?.tags.filter(tag => tag[0] === 'a')?.map(tag => tag[1]) || [];
        for (let communityUri of communityUriArr) {
            const basicInfo = SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
            if (excludedCommunity) {
                const decodedPubkey = Nip19.decode(excludedCommunity.creatorId).data as string;
                if (basicInfo.communityId === excludedCommunity.communityId && basicInfo.creatorId === decodedPubkey) continue;
            }
            communities.push({
                communityId: basicInfo.communityId,
                creatorId: basicInfo.creatorId
            });
        }
        return communities;
    }

    static extractBookmarkedChannels(event: INostrEvent) {
        const channelEventIds = event?.tags.filter(tag => tag[0] === 'a')?.map(tag => tag[1]) || [];
        return channelEventIds;
    }

    static extractScpData(event: INostrEvent, standardId: string) {
        const scpTag = event.tags.find(tag => tag[0] === 'scp');
        let scpData;
        if (scpTag && scpTag[1] === standardId) {
            const scpDataStr = SocialUtilsManager.base64ToUtf8(scpTag[2]);
            if (!scpDataStr.startsWith('$scp:')) return null;
            scpData = JSON.parse(scpDataStr.substring(5));
        }
        return scpData;
    }

    static parseContent(content: string): any {
        try{
            return JSON.parse(content);
        }
        catch(err){
            console.log('Error parsing content', content);
        };
    }

    static extractChannelInfo(event: INostrEvent) {
        const content = this.parseContent(event.content);
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
}

class SocialDataManager {
    private _defaultRestAPIRelay: string;
    private _apiBaseUrl: string;
    private _ipLocationServiceBaseUrl: string;
    private _socialEventManagerRead: ISocialEventManagerRead;
    private _socialEventManagerWrite: ISocialEventManagerWrite;
    private _privateKey: string;
    private mqttManager: MqttManager;

    constructor(config: ISocialDataManagerConfig) {
        this._apiBaseUrl = config.apiBaseUrl;
        this._ipLocationServiceBaseUrl = config.ipLocationServiceBaseUrl;
        let nostrCommunicationManagers: INostrCommunicationManager[] = [];
        let nostrCachedCommunicationManager: INostrCommunicationManager;
        for (let relay of config.relays) {
            if (relay.startsWith('wss://')) {
                nostrCommunicationManagers.push(new NostrWebSocketManager(relay));
            }
            else {
                nostrCommunicationManagers.push(new NostrRestAPIManager(relay));
                if (!this._defaultRestAPIRelay) {
                    this._defaultRestAPIRelay = relay;
                }
            }
        }

        if (config.cachedServer.startsWith('wss://')) {
            nostrCachedCommunicationManager = new NostrWebSocketManager(config.cachedServer);
        }
        else {
            nostrCachedCommunicationManager = new NostrRestAPIManager(config.cachedServer);
        }
        if (config.version === 2) {
            this._socialEventManagerRead = new NostrEventManagerReadV2(
                nostrCommunicationManagers[0] as NostrRestAPIManager,
                nostrCachedCommunicationManager as NostrRestAPIManager, 
                config.apiBaseUrl
            );
        }
        else {
            this._socialEventManagerRead = new NostrEventManagerRead(
                nostrCommunicationManagers[0], 
                nostrCachedCommunicationManager, 
                config.apiBaseUrl
            );
        }

        this._socialEventManagerWrite = new NostrEventManagerWrite(
            nostrCommunicationManagers, 
            config.apiBaseUrl
        );
        if (config.mqttBrokerUrl) {
            this.mqttManager = new MqttManager({
                brokerUrl: config.mqttBrokerUrl,
                subscriptions: config.mqttSubscriptions,
                messageCallback: config.mqttMessageCallback
            });
        }
    }

    set privateKey(privateKey: string) {
        this._privateKey = privateKey;
    }

    get socialEventManagerRead() {
        return this._socialEventManagerRead;
    }

    get socialEventManagerWrite() {
        return this._socialEventManagerWrite;
    }

    subscribeToMqttTopics(topics: string[]) {
        this.mqttManager.subscribe(topics);
    }

    unsubscribeFromMqttTopics(topics: string[]) {
        this.mqttManager.unsubscribe(topics);
    }

    publishToMqttTopic(topic: string, message: string) {
        this.mqttManager.publish(topic, message);
    }

    async retrieveCommunityEvents(creatorId: string, communityId: string) {
        const feedEvents = await this._socialEventManagerRead.fetchCommunityFeed(creatorId, communityId);
        const notes = feedEvents.filter(event => event.kind === 1);
        const communityEvent = feedEvents.find(event => event.kind === 34550);
        if (!communityEvent) throw new Error('No info event found');
        const communityInfo = SocialUtilsManager.extractCommunityInfo(communityEvent);
        if (!communityInfo) throw new Error('No info event found');
        //FIXME: not the best way to do this
        if (communityInfo.membershipType === MembershipType.InviteOnly) {
            const keyEvent = await this._socialEventManagerRead.fetchGroupKeys(communityInfo.communityUri + ':keys');
            if (keyEvent) {
                communityInfo.memberKeyMap = JSON.parse(keyEvent.content);
            }
        }

        return {
            notes,
            info: communityInfo
        }
    }

    retrieveCommunityUri(noteEvent: INostrEvent, scpData: ICommunityPostScpData) {
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

    async retrievePostPrivateKey(event: INostrEvent, communityUri: string, communityPrivateKey: string) {
        let key: string | null = null;
        let postScpData = SocialUtilsManager.extractScpData(event, ScpStandardId.CommunityPost);
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
        let messageScpData = SocialUtilsManager.extractScpData(event, ScpStandardId.ChannelMessage);
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

    private async retrieveInviteOnlyCommunityNotePrivateKeys(creatorId: string, communityId: string) {
        let noteIdToPrivateKey: Record<string, string> = {};
        const communityEvents = await this.retrieveCommunityEvents(creatorId, communityId);
        const communityInfo = communityEvents.info;
        const notes = communityEvents.notes;    
        let communityPrivateKey = await this.retrieveCommunityPrivateKey(communityInfo, this._privateKey);
        if (!communityPrivateKey) return noteIdToPrivateKey;
        for (const note of notes) {
            const postPrivateKey = await this.retrievePostPrivateKey(note, communityInfo.communityUri, communityPrivateKey);
            if (postPrivateKey) {
                noteIdToPrivateKey[note.id] = postPrivateKey;
            }
        }
        return noteIdToPrivateKey;
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
        else {
            const inviteOnlyNoteIdToPrivateKey = await this.retrieveInviteOnlyCommunityNotePrivateKeys(options.creatorId, options.communityId);
            noteIdToPrivateKey = {
                ...noteIdToPrivateKey,
                ...inviteOnlyNoteIdToPrivateKey
            };
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
        else {
            let communityPrivateKey = await this.retrieveCommunityPrivateKey(communityInfo, this._privateKey);
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
                let communityPrivateKey = await SocialUtilsManager.decryptMessage(this._privateKey, communityInfo.scpData.gatekeeperPublicKey, communityInfo.scpData.encryptedKey);
                if (communityPrivateKey) {
                    communityPrivateKeyMap[communityInfo.communityUri] = communityPrivateKey;
                }
            }
            communityInfoMap[communityInfo.communityUri] = communityInfo;
        }  
        let gatekeeperNpubToNotesMap: Record<string, INoteCommunityInfo[]> = {};
        let inviteOnlyCommunityNotesMap: Record<string, INoteCommunityInfo[]> = {};
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
                if (!communityInfo) continue;
                if (communityInfo.membershipType === MembershipType.InviteOnly) {
                    inviteOnlyCommunityNotesMap[communityInfo.communityUri] = inviteOnlyCommunityNotesMap[communityInfo.communityUri] || [];
                    inviteOnlyCommunityNotesMap[communityInfo.communityUri].push(noteCommunityInfo);
                }
                else if (communityInfo.gatekeeperNpub) {
                    gatekeeperNpubToNotesMap[communityInfo.gatekeeperNpub] = gatekeeperNpubToNotesMap[communityInfo.gatekeeperNpub] || [];
                    gatekeeperNpubToNotesMap[communityInfo.gatekeeperNpub].push(noteCommunityInfo);
                }
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
        for (let communityUri in inviteOnlyCommunityNotesMap) {
            for (let noteCommunityInfo of inviteOnlyCommunityNotesMap[communityUri]) {
                const inviteOnlyNoteIdToPrivateKey = await this.retrieveInviteOnlyCommunityNotePrivateKeys(noteCommunityInfo.creatorId, noteCommunityInfo.communityId);
                noteIdToPrivateKey = {
                    ...noteIdToPrivateKey,
                    ...inviteOnlyNoteIdToPrivateKey
                };
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
        const metadata = await this._socialEventManagerRead.fetchUserProfileCacheEvents([...npubs, ...uniqueKeys]);
    
        const metadataByPubKeyMap: Record<string, INostrMetadata> = metadata.reduce((acc, cur) => {
            const content = JSON.parse(cur.content);
            if (cur.pubkey) {
                acc[cur.pubkey] = {
                    ...cur,
                    content
                };
            }
            return acc;
        }, {});
        return metadataByPubKeyMap;
    }

    async fetchUserProfiles(pubKeys: string[]): Promise<IUserProfile[]> {
        const fetchFromCache = true;
        let metadataArr: INostrMetadata[] = [];
        let followersCountMap: Record<string, number> = {};
        const fetchData = async () => {
            if (fetchFromCache) {
                const events = await this._socialEventManagerRead.fetchUserProfileCacheEvents(pubKeys);
                for (let event of events) {
                    if (event.kind === 0) {
                        metadataArr.push({
                            ...event,
                            content: SocialUtilsManager.parseContent(event.content)
                        });
                    }
                    else if (event.kind === 10000108) {
                        followersCountMap = SocialUtilsManager.parseContent(event.content);
                    }
                }
            }
            // else {
            //     const metadataEvents = await this._socialEventManagerRead.fetchMetadata({
            //         authors: pubKeys
            //     });
            //     if (metadataEvents.length === 0) return null;
            //     metadataArr.push({
            //         ...metadataEvents[0],
            //         content: JSON.parse(metadataEvents[0].content)
            //     });
            // }
            // if (metadataArr.length == 0) {
            //     throw new Error(`Metadata not found`);
            // }
        };
        try {
            await SocialUtilsManager.exponentialBackoffRetry(fetchData, 5, 1000, 16000, 2);
        }
        catch (error) { }
        if (metadataArr.length == 0) return null;
        const userProfiles: IUserProfile[] = [];
        for (let metadata of metadataArr) {
            let userProfile = this.constructUserProfile(metadata, followersCountMap);
            userProfiles.push(userProfile);
        }
        return userProfiles;
    }

    async updateUserProfile(content: INostrMetadataContent) {
        await this._socialEventManagerWrite.updateUserProfile(content, this._privateKey)
    }

    async fetchTrendingNotesInfo() {
        let notes: INoteInfo[] = [];
        let metadataByPubKeyMap: Record<string, INostrMetadata> = {};
        const events = await this._socialEventManagerRead.fetchTrendingCacheEvents();
        for (let event of events) {
            if (event.kind === 0) {
                metadataByPubKeyMap[event.pubkey] = {
                    ...event,
                    content: SocialUtilsManager.parseContent(event.content)
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

    async fetchProfileFeedInfo(pubKey: string, since: number = 0, until?: number) {
        const events = await this._socialEventManagerRead.fetchProfileFeedCacheEvents(pubKey, since, until);
        const earliest = this.getEarliestEventTimestamp(events.filter(v => v.created_at));
        const {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            noteToRepostIdMap
        } = this.createNoteEventMappings(events);
        for (let note of notes as INoteInfoExtended[]) {
            if (note.eventData.tags?.length) {
                const communityUri = note.eventData.tags.find(tag => tag[0] === 'a')?.[1];
                if (communityUri) {
                    const {creatorId, communityId} = SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                    note.community = {
                        communityUri,
                        communityId,
                        creatorId: Nip19.npubEncode(creatorId)
                    };
                }
            }
            const noteId = note.eventData.id;
            const repostId = noteToRepostIdMap[noteId];
            if (!repostId) continue;
            const metadata = metadataByPubKeyMap[repostId];
            if (!metadata) continue;
            const metadataContent = metadata.content;
            const encodedPubkey = Nip19.npubEncode(metadata.pubkey);
            const internetIdentifier = typeof metadataContent.nip05 === 'string' ? metadataContent.nip05?.replace('_@', '') || '' : '';
            note.repost = {
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

    async fetchProfileRepliesInfo(pubKey: string, since: number = 0, until?: number) {
        const events = await this._socialEventManagerRead.fetchProfileRepliesCacheEvents(pubKey, since, until);
        const earliest = this.getEarliestEventTimestamp(events.filter(v => v.created_at));
        const {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            noteToParentAuthorIdMap
        } = this.createNoteEventMappings(events, true);
        for (let note of notes as INoteInfoExtended[]) {
            const noteId = note.eventData.id;
            const parentAuthorId = noteToParentAuthorIdMap[noteId];
            if (!parentAuthorId) continue;
            const metadata = metadataByPubKeyMap[parentAuthorId];
            if (!metadata) continue;
            const metadataContent = metadata.content;
            const encodedPubkey = Nip19.npubEncode(metadata.pubkey);
            const internetIdentifier = typeof metadataContent.nip05 === 'string' ? metadataContent.nip05?.replace('_@', '') || '' : '';
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

    private getEarliestEventTimestamp(events: INostrEvent[]) {
        if (!events || events.length === 0) {
            return 0;
        }
        return events.reduce((createdAt, event) => {
            return Math.min(createdAt, event.created_at);
        }, events[0].created_at);
    }

    async fetchHomeFeedInfo(pubKey: string, since: number = 0, until?: number) {
        let events: INostrEvent[] = await this._socialEventManagerRead.fetchHomeFeedCacheEvents(pubKey, since, until);
        const earliest = this.getEarliestEventTimestamp(events.filter(v => v.created_at));
        const {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap
        } = this.createNoteEventMappings(events);
        return {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            earliest
        }
    }
    createNoteEventMappings(events: INostrEvent[], parentAuthorsInfo: boolean = false) {
        let notes: INoteInfo[] = [];
        let metadataByPubKeyMap: Record<string, INostrMetadata> = {};
        let quotedNotesMap: Record<string, INoteInfo> = {};
        let noteToParentAuthorIdMap: Record<string, string> = {};
        let noteToRepostIdMap: Record<string, string> = {};
        let noteStatsMap: Record<string, IPostStats> = {};
        for (let event of events) {
            if (event.kind === 0) {
                metadataByPubKeyMap[event.pubkey] = {
                    ...event,
                    content: SocialUtilsManager.parseContent(event.content)
                };
            }
            else if (event.kind === 10000107) {
                const noteEvent = SocialUtilsManager.parseContent(event.content) as INostrEvent;
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
            else if (event.kind === 6) {
                if (!event.content) continue;
                const originalNoteContent = SocialUtilsManager.parseContent(event.content);
                notes.push({
                    eventData: originalNoteContent
                });
                if (originalNoteContent?.id)
                    noteToRepostIdMap[originalNoteContent.id] = event.pubkey;
                if (parentAuthorsInfo) {
                    const parentAuthors = event.tags.filter(tag => tag[0] === 'p')?.map(tag => tag[1]) || [];
                    if (parentAuthors.length > 0) {
                        noteToParentAuthorIdMap[event.id] = parentAuthors[parentAuthors.length - 1];
                    }
                }
            }
            else if (event.kind === 10000100) {
                const content = SocialUtilsManager.parseContent(event.content);
                noteStatsMap[content.event_id] = {
                    upvotes: content.likes,
                    replies: content.replies,
                    reposts: content.reposts
                }
            }
            else if (event.kind === 10000113) {
                //"{\"since\":1700034697,\"until\":1700044097,\"order_by\":\"created_at\"}"
                const timeInfo = SocialUtilsManager.parseContent(event.content);
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
            noteStatsMap,
            noteToRepostIdMap
        }
    }
    
    async fetchCommunityInfo(creatorId: string, communityId: string) {
        const communityEvents = await this._socialEventManagerRead.fetchCommunity(creatorId, communityId);
        const communityEvent = communityEvents.find(event => event.kind === 34550);
        if(!communityEvent) return null;
        let communityInfo = SocialUtilsManager.extractCommunityInfo(communityEvent);
        //FIXME: not the best way to do this
        if (communityInfo.membershipType === MembershipType.InviteOnly) {
            const keyEvent = await this._socialEventManagerRead.fetchGroupKeys(communityInfo.communityUri + ':keys');
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
        const threadEvents = await this._socialEventManagerRead.fetchThreadCacheEvents(decodedFocusedNoteId);
        const {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap
        } = this.createNoteEventMappings(threadEvents);
        for (let note of notes as INoteInfoExtended[]) {
            if (note.eventData.tags?.length) {
                const communityUri = note.eventData.tags.find(tag => tag[0] === 'a')?.[1];
                if (communityUri) {
                    const {creatorId, communityId} = SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                    note.community = {
                        communityUri,
                        communityId,
                        creatorId: Nip19.npubEncode(creatorId)
                    };
                }
            }
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
        replies = replies.sort((a, b) => a.eventData.created_at - b.eventData.created_at);
        ancestorNotes = ancestorNotes.sort((a, b) => a.eventData.created_at - b.eventData.created_at);
        let communityInfo: ICommunityInfo | null = null;
        let scpData = SocialUtilsManager.extractScpData(focusedNote.eventData, ScpStandardId.CommunityPost);
        if (scpData) {
            const communityUri = this.retrieveCommunityUri(focusedNote.eventData, scpData);
            if (communityUri) {
                const {creatorId, communityId} = SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
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
            let scpData = SocialUtilsManager.extractScpData(note, ScpStandardId.CommunityPost);
            if (scpData) {
                const communityUri = this.retrieveCommunityUri(note, scpData);
                if (communityUri) {
                    const {creatorId, communityId} = SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
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
            const communityEvents = await this._socialEventManagerRead.fetchCommunities(pubkeyToCommunityIdsMap);
            for (let event of communityEvents) {
                let communityInfo = SocialUtilsManager.extractCommunityInfo(event);
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
        const userContactEvents = await this._socialEventManagerRead.fetchUserProfileDetailCacheEvents(pubKey);
        for (let event of userContactEvents) {
            if (event.kind === 0) {
                metadata = {
                    ...event,
                    content: SocialUtilsManager.parseContent(event.content)
                };
            }
            else if (event.kind === 10000105) {
                let content = SocialUtilsManager.parseContent(event.content);
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
        const internetIdentifier = typeof metadataContent.nip05 === 'string' ? metadataContent.nip05?.replace('_@', '') || '' : '';
        let userProfile: IUserProfile = {
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
        }
        return userProfile;
    }

    async fetchUserContactList(pubKey: string) {
        let metadataArr: INostrMetadata[] = [];
        let followersCountMap: Record<string, number> = {};
        const userContactEvents = await this._socialEventManagerRead.fetchContactListCacheEvents(pubKey, true);
        for (let event of userContactEvents) {
            if (event.kind === 0) {
                metadataArr.push({
                    ...event,
                    content: SocialUtilsManager.parseContent(event.content)
                });
            }
            else if (event.kind === 10000108) {
                followersCountMap = SocialUtilsManager.parseContent(event.content);
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
        const userFollowersEvents = await this._socialEventManagerRead.fetchFollowersCacheEvents(pubKey);
        for (let event of userFollowersEvents) {
            if (event.kind === 0) {
                metadataArr.push({
                    ...event,
                    content: SocialUtilsManager.parseContent(event.content)
                });
            }
            else if (event.kind === 10000108) {
                followersCountMap = SocialUtilsManager.parseContent(event.content);
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
        const relaysEvents = await this._socialEventManagerRead.fetchContactListCacheEvents(pubKey, false);
        const relaysEvent = relaysEvents.find(event => event.kind === 3);
        if (!relaysEvent) return relayList;
        let content = relaysEvent.content ? JSON.parse(relaysEvent.content) : {};
        relayList = Object.keys(content);
        return relayList;
    }

    async followUser(userPubKey: string) {
        const decodedUserPubKey = userPubKey.startsWith('npub1') ? Nip19.decode(userPubKey).data as string : userPubKey;
        const selfPubkey = SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const contactListEvents = await this._socialEventManagerRead.fetchContactListCacheEvents(selfPubkey, false);
        let content = '';
        let contactPubKeys: Set<string> = new Set();
        let contactListEvent = contactListEvents.find(event => event.kind === 3);
        if (contactListEvent) {
            content = contactListEvent.content;
            contactPubKeys = new Set(contactListEvent.tags.filter(tag => tag[0] === 'p')?.map(tag => tag[1]) || []);
        }
        contactPubKeys.add(decodedUserPubKey);
        await this._socialEventManagerWrite.updateContactList(content, Array.from(contactPubKeys), this._privateKey);
    }

    async unfollowUser(userPubKey: string) {
        const decodedUserPubKey = userPubKey.startsWith('npub1') ? Nip19.decode(userPubKey).data as string : userPubKey;
        const selfPubkey = SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const contactListEvents = await this._socialEventManagerRead.fetchContactListCacheEvents(selfPubkey, false);
        let content = '';
        let contactPubKeys: Set<string> = new Set();
        const contactListEvent = contactListEvents.find(event => event.kind === 3);
        if (contactListEvent) {
            content = contactListEvent.content;
            for (let tag of contactListEvent.tags) {
                if (tag[0] === 'p' && tag[1] !== decodedUserPubKey) {
                    contactPubKeys.add(tag[1]);
                }
            }
        }
        await this._socialEventManagerWrite.updateContactList(content, Array.from(contactPubKeys), this._privateKey);
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

    async createCommunity(newInfo: INewCommunityInfo, creatorId: string) {
        const communityUri = SocialUtilsManager.getCommunityUri(creatorId, newInfo.name);
        let communityInfo: ICommunityInfo = {
            communityUri,
            communityId: newInfo.name,
            creatorId,
            description: newInfo.description,
            rules: newInfo.rules,
            bannerImgUrl: newInfo.bannerImgUrl,
            avatarImgUrl: newInfo.avatarImgUrl,
            moderatorIds: newInfo.moderatorIds,
            gatekeeperNpub: newInfo.gatekeeperNpub,
            scpData: newInfo.scpData,
            membershipType: newInfo.membershipType,
            memberIds: newInfo.memberIds
        }

        if (communityInfo.membershipType === MembershipType.NFTExclusive) {
            const gatekeeperPublicKey = Nip19.decode(communityInfo.gatekeeperNpub).data as string;
            const communityKeys = await this.generateGroupKeys(this._privateKey, [gatekeeperPublicKey]);
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
            const communityKeys = await this.generateGroupKeys(this._privateKey, encryptionPublicKeys);
            await this._socialEventManagerWrite.updateGroupKeys(
                communityUri + ':keys', 
                34550,
                JSON.stringify(communityKeys.encryptedGroupKeys),
                communityInfo.memberIds,
                this._privateKey
            );
            communityInfo.scpData = {
                ...communityInfo.scpData,
                publicKey: communityKeys.groupPublicKey
            }                 
        }
        if (communityInfo.scpData) {
            const updateChannelResponses = await this.updateCommunityChannel(communityInfo);
            //FIXME: fix this when the relay is fixed
            const updateChannelResponse = updateChannelResponses.find(v => v.success && !!v.eventId);
            if (updateChannelResponse?.eventId) {
                communityInfo.scpData.channelEventId = updateChannelResponse.eventId;
            }   
        }
        await this._socialEventManagerWrite.updateCommunity(communityInfo, this._privateKey);
    
        return communityInfo;
    }

    async updateCommunity(info: ICommunityInfo) {
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

            const groupPrivateKey = await this.retrieveCommunityPrivateKey(info, this._privateKey);
            let encryptedGroupKeys: Record<string, string> = {};
            for (let encryptionPublicKey of encryptionPublicKeys) {
                const encryptedGroupKey = await SocialUtilsManager.encryptMessage(this._privateKey, encryptionPublicKey, groupPrivateKey);
                encryptedGroupKeys[encryptionPublicKey] = encryptedGroupKey;
            }
            const response = await this._socialEventManagerWrite.updateGroupKeys(
                info.communityUri + ':keys',
                34550,
                JSON.stringify(encryptedGroupKeys),
                info.memberIds,
                this._privateKey
            );
            console.log('updateCommunity', response);
        }
        await this._socialEventManagerWrite.updateCommunity(info, this._privateKey);
        return info;
    }

    async updateCommunityChannel(communityInfo: ICommunityInfo) {
        let channelScpData: IChannelScpData = {
            communityUri: communityInfo.communityUri
        }
        let channelInfo: IChannelInfo = {
            name: communityInfo.communityId,
            about: communityInfo.description,
            scpData: channelScpData
        }
        const updateChannelResponse = await this._socialEventManagerWrite.updateChannel(channelInfo, this._privateKey);
        return updateChannelResponse;
    }

    async createChannel(channelInfo: IChannelInfo, memberIds: string[]) {
        let encryptionPublicKeys: string[] = [];
        for (let memberId of memberIds) {
            const memberPublicKey = Nip19.decode(memberId).data as string;
            encryptionPublicKeys.push(memberPublicKey);
        }
        const channelKeys = await this.generateGroupKeys(this._privateKey, encryptionPublicKeys);
        channelInfo.scpData = {
            ...channelInfo.scpData,
            publicKey: channelKeys.groupPublicKey
        } 
        const updateChannelResponses = await this._socialEventManagerWrite.updateChannel(channelInfo, this._privateKey);
        //FIXME: fix this when the relay is fixed
        const updateChannelResponse = updateChannelResponses.find(v => v.success && !!v.eventId);
        if (updateChannelResponse?.eventId) {
            const channelUri = `40:${updateChannelResponse.eventId}`;
            await this._socialEventManagerWrite.updateGroupKeys(
                channelUri + ':keys', 
                40,
                JSON.stringify(channelKeys.encryptedGroupKeys),
                memberIds,
                this._privateKey
            );
        }
        return channelInfo;
    }

    async updateChannel(channelInfo: IChannelInfo) {
        const updateChannelResponses = await this._socialEventManagerWrite.updateChannel(channelInfo, this._privateKey);
        return updateChannelResponses;
    }

    async fetchCommunitiesMembers(communities: ICommunityInfo[]) {
        const communityUriToMemberIdRoleComboMap = await this.mapCommunityUriToMemberIdRoleCombo(communities);
        let pubkeys = new Set(flatMap(Object.values(communityUriToMemberIdRoleComboMap), combo => combo.map(c => c.id)));
        const communityUriToMembersMap: Record<string, ICommunityMember[]> = {};
        if (pubkeys.size > 0) {
            const userProfiles = await this.fetchUserProfiles(Array.from(pubkeys));
            if (!userProfiles) return communityUriToMembersMap;
            for (let community of communities) {
                const memberIds = communityUriToMemberIdRoleComboMap[community.communityUri];
                if (!memberIds) continue;
                const communityMembers: ICommunityMember[] = [];
                for (let memberIdRoleCombo of memberIds) {
                    const userProfile = userProfiles.find(profile => profile.npub === memberIdRoleCombo.id);
                    if (!userProfile) continue;
                    let communityMember: ICommunityMember = {
                        id: userProfile.npub,
                        name: userProfile.displayName,
                        profileImageUrl: userProfile.avatar,
                        username: userProfile.username,
                        internetIdentifier: userProfile.internetIdentifier,
                        role: memberIdRoleCombo.role
                    }
                    communityMembers.push(communityMember);
                }
                communityUriToMembersMap[community.communityUri] = communityMembers;
            }
        }
        return communityUriToMembersMap;
    }
    
    async fetchCommunities() {
        let communities: ICommunity[] = [];
        const events = await this._socialEventManagerRead.fetchCommunities();
        for (let event of events) {
            const communityInfo = SocialUtilsManager.extractCommunityInfo(event);
            let community: ICommunity = {
                ...communityInfo,
                members: []
            }
            communities.push(community);
        }
        const communityUriToMembersMap = await this.fetchCommunitiesMembers(communities);
        for (let community of communities) {
            community.members = communityUriToMembersMap[community.communityUri];
        }
        return communities;
    }

    async fetchMyCommunities(pubKey: string) {
        let communities: ICommunityInfo[] = [];
        const events = await this._socialEventManagerRead.fetchAllUserRelatedCommunities(pubKey);
        for (let event of events) {
            if (event.kind === 34550) {
                const communityInfo = SocialUtilsManager.extractCommunityInfo(event);
                communities.push(communityInfo);
            }
        }
        return communities;
    }

    async joinCommunity(community: ICommunityInfo, pubKey: string) {
        const communities = await this._socialEventManagerRead.fetchUserBookmarkedCommunities(pubKey);
        communities.push(community);
        await this._socialEventManagerWrite.updateUserBookmarkedCommunities(communities, this._privateKey);
        if (community.scpData?.channelEventId) {
            const channelEventIds = await this._socialEventManagerRead.fetchUserBookmarkedChannelEventIds(pubKey);
            channelEventIds.push(community.scpData.channelEventId);
            await this._socialEventManagerWrite.updateUserBookmarkedChannels(channelEventIds, this._privateKey);
        }
    }
    
    async leaveCommunity(community: ICommunityInfo, pubKey: string) {
        const communities = await this._socialEventManagerRead.fetchUserBookmarkedCommunities(pubKey, community);
        await this._socialEventManagerWrite.updateUserBookmarkedCommunities(communities, this._privateKey);
        if (community.scpData?.channelEventId) {
            const channelEventIds = await this._socialEventManagerRead.fetchUserBookmarkedChannelEventIds(pubKey);
            const index = channelEventIds.indexOf(community.scpData.channelEventId);
            if (index > -1) {
                channelEventIds.splice(index, 1);
            }
            await this._socialEventManagerWrite.updateUserBookmarkedChannels(channelEventIds, this._privateKey);
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

    async submitCommunityPost(message: string, info: ICommunityInfo, conversationPath?: IConversationPath) {
        const messageContent = {
            communityUri: info.communityUri,
            message,
        }
        let newCommunityPostInfo: INewCommunityPostInfo;
        if (info.membershipType === MembershipType.Open) {
            newCommunityPostInfo = {
                community: info,
                message,
                conversationPath
            }
        }
        else {
            const {
                encryptedMessage,
                encryptedGroupKey
            } = await this.encryptGroupMessage(this._privateKey, info.scpData.publicKey, JSON.stringify(messageContent));
            newCommunityPostInfo = {
                community: info,
                message: encryptedMessage,
                conversationPath,
                scpData: {
                    encryptedKey: encryptedGroupKey,
                    communityUri: info.communityUri
                }
            }
        }   
        await this._socialEventManagerWrite.submitCommunityPost(newCommunityPostInfo, this._privateKey);
    }

    async fetchAllUserRelatedChannels(pubKey: string) {
        const {
            channels,
            channelMetadataMap,
            channelIdToCommunityMap  
        } = await this._socialEventManagerRead.fetchAllUserRelatedChannels(pubKey);

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
        const events = await this._socialEventManagerRead.fetchChannelMessages(channelId, since, until);
        const messageEvents = events.filter(event => event.kind === 42);
        return messageEvents;
    }

    async retrieveChannelEvents(creatorId: string, channelId: string) {
        const channelEvents = await this._socialEventManagerRead.fetchChannelInfoMessages(channelId);
        const messageEvents = channelEvents.filter(event => event.kind === 42);
        const channelCreationEvent = channelEvents.find(event => event.kind === 40);
        if (!channelCreationEvent) throw new Error('No info event found');
        const channelMetadataEvent = channelEvents.find(event => event.kind === 41);
        let channelInfo: IChannelInfo;
        if (channelMetadataEvent) {
            channelInfo = SocialUtilsManager.extractChannelInfo(channelMetadataEvent);
        }
        else {
            channelInfo = SocialUtilsManager.extractChannelInfo(channelCreationEvent);
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
            if (channelInfo.scpData.communityUri) {
                const {communityId} = SocialUtilsManager.getCommunityBasicInfoFromUri(channelInfo.scpData.communityUri);
                const communityInfo = await this.fetchCommunityInfo(channelInfo.eventData.pubkey, communityId);
                groupPrivateKey = await this.retrieveCommunityPrivateKey(communityInfo, options.privateKey);
                if (!groupPrivateKey) return messageIdToPrivateKey;
            }
            else {
                const groupUri = `40:${channelInfo.id}`;
                const keyEvent = await this._socialEventManagerRead.fetchGroupKeys(groupUri + ':keys');
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
        } = await this.encryptGroupMessage(this._privateKey, communityPublicKey, JSON.stringify(messageContent));
        const newChannelMessageInfo: INewChannelMessageInfo = {
            channelId: channelId,
            message: encryptedMessage,
            conversationPath,
            scpData: {
                encryptedKey: encryptedGroupKey,
                channelId: channelId
            }
        }
        await this._socialEventManagerWrite.submitChannelMessage(newChannelMessageInfo, this._privateKey);
    }

    async fetchDirectMessagesBySender(selfPubKey: string, senderPubKey: string, since?: number, until?: number) {
        const decodedSenderPubKey = Nip19.decode(senderPubKey).data as string;
        const events = await this._socialEventManagerRead.fetchDirectMessages(selfPubKey, decodedSenderPubKey, since, until);
        let metadataByPubKeyMap: Record<string, INostrMetadata> = {};
        const encryptedMessages = [];
        for (let event of events) {
            if (event.kind === 0) {
                metadataByPubKeyMap[event.pubkey] = {
                    ...event,
                    content: SocialUtilsManager.parseContent(event.content)
                };
            } else if (event.kind === 4) {
                encryptedMessages.push(event);
            }
        }
        return { 
            decodedSenderPubKey, 
            encryptedMessages,
            metadataByPubKeyMap 
        };
    }
    
    async sendDirectMessage(chatId: string, message: string) {
        const decodedReceiverPubKey = Nip19.decode(chatId).data as string;
        const content = await SocialUtilsManager.encryptMessage(this._privateKey, decodedReceiverPubKey, message);
        await this._socialEventManagerWrite.sendMessage(decodedReceiverPubKey, content, this._privateKey);
    }

    async resetMessageCount(selfPubKey: string, senderPubKey: string) {
        await this._socialEventManagerRead.resetMessageCount(selfPubKey, senderPubKey, this._privateKey);
    }

    async fetchMessageContacts(pubKey: string) {
        const events = await this._socialEventManagerRead.fetchMessageContactsCacheEvents(pubKey);
        const pubkeyToMessageInfoMap: Record<string, { cnt: number, latest_at: number, latest_event_id: string }> = {};
        let metadataByPubKeyMap: Record<string, INostrMetadata> = {};
        for (let event of events) {
            if (event.kind === 10000118) {
                const content = SocialUtilsManager.parseContent(event.content);
                Object.keys(content).forEach(pubkey => {
                    pubkeyToMessageInfoMap[pubkey] = content[pubkey];
                })
            }
            if (event.kind === 0) {
                metadataByPubKeyMap[event.pubkey] = {
                    ...event,
                    content: SocialUtilsManager.parseContent(event.content)
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
                avatar: channel.picture || channel.communityInfo?.avatarImgUrl,
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
        const events = await this._socialEventManagerRead.fetchUserGroupInvitations([40, 34550], pubKey);
        for (let event of events) {
            const identifier = event.tags.find(tag => tag[0] === 'd')?.[1];
            if (identifier) {
                identifiers.push(identifier);
            }
        }
        return identifiers;
    }

    private async mapCommunityUriToMemberIdRoleCombo(communities: ICommunityInfo[]) {
        const communityUriToMemberIdRoleComboMap: Record<string, { id: string; role: CommunityRole }[]> = {};
        const communityUriToCreatorOrModeratorIdsMap: Record<string, Set<string>> = {};
        for (let community of communities) {
            const communityUri = community.communityUri;
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
        const generalMembersEvents = await this._socialEventManagerRead.fetchCommunitiesGeneralMembers(communities);
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
        const city = event.tags.find(tag => tag[0] === 'city')?.[1];
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
            city,
            latitude: lonlat?.latitude,
            longitude: lonlat?.longitude,
            geohash,
            image,
            eventData: event
        }
        return calendarEventInfo;
    }

    async updateCalendarEvent(updateCalendarEventInfo: IUpdateCalendarEventInfo) {
        const geohash = Geohash.encode(updateCalendarEventInfo.latitude, updateCalendarEventInfo.longitude);
        updateCalendarEventInfo = {
            ...updateCalendarEventInfo,
            geohash
        }
        let naddr: string;
        const responses = await this._socialEventManagerWrite.updateCalendarEvent(updateCalendarEventInfo, this._privateKey);
        const response = responses[0];
        if (response.success) {
            const pubkey = SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
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
        const events = await this._socialEventManagerRead.fetchCalendarEvents(start, end, limit);
        let calendarEventInfoList: ICalendarEventInfo[] = [];
        for (let event of events) {
            let calendarEventInfo = this.extractCalendarEventInfo(event);
            calendarEventInfoList.push(calendarEventInfo);
        }
        return calendarEventInfoList;
    }

    async retrieveCalendarEvent(naddr: string) {
        let address = Nip19.decode(naddr).data as Nip19.AddressPointer;
        const calendarEvent = await this._socialEventManagerRead.fetchCalendarEvent(address);
        if (!calendarEvent) return null;
        let calendarEventInfo = this.extractCalendarEventInfo(calendarEvent);
        let hostPubkeys = calendarEvent.tags.filter(tag => tag[0] === 'p' && tag[3] === 'host')?.map(tag => tag[1]) || [];
        const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
        let hosts: ICalendarEventHost[] = [];
        let attendees: ICalendarEventAttendee[] = [];
        let attendeePubkeys: string[] = [];
        let attendeePubkeyToEventMap: Record<string, INostrEvent> = {};
        const postEvents = await this._socialEventManagerRead.fetchCalendarEventPosts(calendarEventUri);
        const notes: INoteInfo[] = [];
        for (let postEvent of postEvents) {
            const note: INoteInfo = {
                eventData: postEvent
            }
            notes.push(note);
        }
        const rsvpEvents = await this._socialEventManagerRead.fetchCalendarEventRSVPs(calendarEventUri);
        for (let rsvpEvent of rsvpEvents) {
            if (attendeePubkeyToEventMap[rsvpEvent.pubkey]) continue;
            let attendanceStatus = rsvpEvent.tags.find(tag => tag[0] === 'l' && tag[2] === 'status')?.[1];
            if (attendanceStatus === 'accepted') {
                attendeePubkeyToEventMap[rsvpEvent.pubkey] = rsvpEvent;
                attendeePubkeys.push(rsvpEvent.pubkey);
            }
        }
        const userProfileEvents = await this._socialEventManagerRead.fetchUserProfileCacheEvents([
            ...hostPubkeys,
            ...attendeePubkeys
        ])
        for (let event of userProfileEvents) {
            if (event.kind === 0) {
                let metaData = {
                    ...event,
                    content: SocialUtilsManager.parseContent(event.content)
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
            attendees,
            notes
        }
        return detailInfo;
    }

    async acceptCalendarEvent(rsvpId: string, naddr: string) {
        let address = Nip19.decode(naddr).data as Nip19.AddressPointer;
        const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
        const pubkey = SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const rsvpEvents = await this._socialEventManagerRead.fetchCalendarEventRSVPs(calendarEventUri, pubkey);
        if (rsvpEvents.length > 0) {
            rsvpId = rsvpEvents[0].tags.find(tag => tag[0] === 'd')?.[1];
        }
        await this._socialEventManagerWrite.createCalendarEventRSVP(rsvpId, calendarEventUri, true, this._privateKey);
    }

    async declineCalendarEvent(rsvpId: string, naddr: string) {
        let address = Nip19.decode(naddr).data as Nip19.AddressPointer;
        const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
        const pubkey = SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const rsvpEvents = await this._socialEventManagerRead.fetchCalendarEventRSVPs(calendarEventUri, pubkey);
        if (rsvpEvents.length > 0) {
            rsvpId = rsvpEvents[0].tags.find(tag => tag[0] === 'd')?.[1];
        }
        await this._socialEventManagerWrite.createCalendarEventRSVP(rsvpId, calendarEventUri, false, this._privateKey);
    }

    async submitCalendarEventPost(naddr: string, message: string, conversationPath?: IConversationPath) {
        let address = Nip19.decode(naddr).data as Nip19.AddressPointer;
        const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
        let info: INewCalendarEventPostInfo = {
            calendarEventUri,
            message,
            conversationPath
        }
        const responses = await this._socialEventManagerWrite.submitCalendarEventPost(info, this._privateKey);
        const response = responses[0];
        return response.success ? response.eventId : null;
    }

    async fetchTimezones() {
        const apiUrl = `${this._apiBaseUrl}/timezones`;
        const apiResponse = await fetch(apiUrl);
        const apiResult = await apiResponse.json();
        if (!apiResult.success) throw new Error(apiResult.error.message);
        let timezones: any[] = [];
        for (let timezone of apiResult.data.timezones) {
            let gmtOffset = SocialUtilsManager.getGMTOffset(timezone.timezoneName);
            if (!gmtOffset) continue;
            timezones.push({
                timezoneName: timezone.timezoneName,
                description: timezone.description,
                gmtOffset: gmtOffset
            });
        }
        timezones.sort((a, b) => {
            if (a.gmtOffset.startsWith('GMT-') && b.gmtOffset.startsWith('GMT+')) return -1;
            if (a.gmtOffset.startsWith('GMT+') && b.gmtOffset.startsWith('GMT-')) return 1;
            if (a.gmtOffset.startsWith('GMT-')) {
                if (a.gmtOffset < b.gmtOffset) return 1;
                if (a.gmtOffset > b.gmtOffset) return -1;
            }
            else {
                if (a.gmtOffset > b.gmtOffset) return 1;
                if (a.gmtOffset < b.gmtOffset) return -1;
            }
            if (a.description < b.description) return -1;
            if (a.description > b.description) return 1;
            return 0;
        });
        return timezones;
    }

    async fetchCitiesByKeyword(keyword: string) {
        const apiUrl = `${this._apiBaseUrl}/cities?keyword=${keyword}`;
        const apiResponse = await fetch(apiUrl);
        const apiResult = await apiResponse.json();
        if (!apiResult.success) throw new Error(apiResult.error.message);
        let cities: any[] = [];
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

    async fetchCitiesByCoordinates(latitude: number, longitude: number) {
        const apiUrl = `${this._apiBaseUrl}/cities?lat=${latitude}&lng=${longitude}`;
        const apiResponse = await fetch(apiUrl);
        const apiResult = await apiResponse.json();
        if (!apiResult.success) throw new Error(apiResult.error.message);
        let cities: any[] = [];
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
        if (!this._ipLocationServiceBaseUrl) return null;
        const response = await fetch(this._ipLocationServiceBaseUrl);
        const result = await response.json();
        let locationInfo: ILocationCoordinates;
        if (result.success) {
            locationInfo = {
                latitude: result.data.lat,
                longitude: result.data.long
            }
        }
        return locationInfo;
    }

    private async fetchEventMetadataFromIPFS(ipfsBaseUrl: string, eventId: string) {
        const url = `${ipfsBaseUrl}/nostr/${eventId}`;
        const response = await fetch(url);
        const result = await response.json();
        return result;
    }

    async getAccountBalance(walletAddress: string) {
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
        }
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

    async getNFTsByOwner(walletAddress: string) {
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
        }
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

    async submitMessage(message: string, conversationPath?: IConversationPath) {
        await this._socialEventManagerWrite.postNote(message, this._privateKey, conversationPath);
    }

    async submitLongFormContent(info: ILongFormContentInfo) {
        await this._socialEventManagerWrite.submitLongFormContentEvents(info, this._privateKey);
    }

    async submitLike(postEventData: INostrEvent) {
        let tags: string[][] = postEventData.tags.filter(
            tag => tag.length >= 2 && (tag[0] === 'e' || tag[0] === 'p')
        );
        tags.push(['e', postEventData.id]);
        tags.push(['p', postEventData.pubkey]);
        tags.push(['k', postEventData.kind.toString()]);
        await this._socialEventManagerWrite.submitLike(tags, this._privateKey);
    }

    async submitRepost(postEventData: INostrEvent) {
        let tags: string[][] = [
            [
                'e', 
                postEventData.id
            ],
            [
                'p', 
                postEventData.pubkey
            ]
        ]
        const content = JSON.stringify(postEventData);
        await this._socialEventManagerWrite.submitRepost(content, tags, this._privateKey);
    }

    async sendPingRequest(pubkey: string, walletAddress: string, signature: string) {
        if (!this._defaultRestAPIRelay) return null;
        let msg = pubkey;
        const pubkeyY = Keys.getPublicKeyY(this._privateKey);
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

    async fetchUnreadMessageCounts(pubkey: string) {
        if (!this._defaultRestAPIRelay) return null;
        let url = this._defaultRestAPIRelay + '/unread-message-counts?pubkey=' + pubkey;
        const response = await fetch(url);
        const result = await response.json();
        return result;
    }

    async updateMessageLastReadReceipt(pubkey: string, walletAddress: string, signature: string, fromId: string) {
        if (!this._defaultRestAPIRelay) return null;
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
    
    async searchUsers(query: string) {
        const events = await this._socialEventManagerRead.searchUsers(query);
        let metadataArr: INostrMetadata[] = [];
        let followersCountMap: Record<string, number> = {};
        for (let event of events) {
            if (event.kind === 0) {
                metadataArr.push({
                    ...event,
                    content: SocialUtilsManager.parseContent(event.content)
                });
            }
            else if (event.kind === 10000108) {
                followersCountMap = SocialUtilsManager.parseContent(event.content);
            }
        }
        const userProfiles: IUserProfile[] = [];
        for (let metadata of metadataArr) {
            let userProfile = this.constructUserProfile(metadata, followersCountMap);
            userProfiles.push(userProfile);
        }
        return userProfiles;
    }
}

export {
    NostrEventManagerRead,
    NostrEventManagerReadV2,
    NostrEventManagerWrite,
    ISocialEventManagerRead,
    ISocialEventManagerWrite,
    SocialUtilsManager,
    SocialDataManager,
    NostrRestAPIManager,
    NostrWebSocketManager
}