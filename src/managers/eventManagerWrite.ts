import { Nip19, Event, Keys } from "../core/index";
import { CalendarEventType, IChannelInfo, ICommunityBasicInfo, ICommunityInfo, IConversationPath, ILongFormContentInfo, INewCalendarEventPostInfo, INewChannelMessageInfo, INewCommunityPostInfo, INostrMetadataContent, INostrSubmitResponse, IRelayConfig, IUpdateCalendarEventInfo,  ScpStandardId } from "../utils/interfaces";
import {
    INostrCommunicationManager
} from "./communication";
import { SocialUtilsManager } from "./utilsManager";

interface ISocialEventManagerWrite {
    nostrCommunicationManagers: INostrCommunicationManager[];
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
    updateRelayList(relays: Record<string, IRelayConfig>, privateKey: string): Promise<void>;
    createPaymentRequestEvent(paymentRequest: string, amount: string, comment: string, privateKey: string): Promise<void>;
    createPaymentReceiptEvent(requestEventId: string, recipient: string, preimage: string, comment: string, privateKey: string): Promise<void>;
}

function convertUnixTimestampToDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2); 
    const day = ("0" + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
}

class NostrEventManagerWrite implements ISocialEventManagerWrite {
    private _nostrCommunicationManagers: INostrCommunicationManager[] = [];
    private _apiBaseUrl: string;

    constructor(managers: INostrCommunicationManager[], apiBaseUrl: string) {
        this._nostrCommunicationManagers = managers;
        this._apiBaseUrl = apiBaseUrl;
    }

    set nostrCommunicationManagers(managers: INostrCommunicationManager[]) {
        this._nostrCommunicationManagers = managers;
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

    async updateRelayList(relays: Record<string, IRelayConfig>, privateKey: string) {
        let event = {
            "kind": 10002,
            "created_at": Math.round(Date.now() / 1000),
            "content": "",
            "tags": []
        };
        for (let url in relays) {
            const { read, write } = relays[url];
            if(!read && !write) continue;
            const tag = [
                "r",
                url
            ];
            if (!read || !write) tag.push(read ? 'read' : 'write');
            event.tags.push(tag)
        }
        const verifiedEvent = Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
    }

    async createPaymentRequestEvent(paymentRequest: string, amount: string, comment: string, privateKey: string) {
        let event = {
            "kind": 9739,
            "created_at": Math.round(Date.now() / 1000),
            "content": comment,
            "tags": [
                [
                    "r",
                    paymentRequest
                ],
                [
                    "amount",
                    amount
                ]
            ]
        };
        const verifiedEvent = Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
    }

    async createPaymentReceiptEvent(requestEventId: string, recipient: string, preimage: string, comment: string, privateKey: string) {
        let event = {
            "kind": 9740,
            "created_at": Math.round(Date.now() / 1000),
            "content": comment,
            "tags": [
                [
                    "e",
                    requestEventId
                ],
                [
                    "p",
                    recipient
                ],
                [
                    "preimage",
                    preimage
                ]
            ]
        };
        const verifiedEvent = Event.finishEvent(event, privateKey);
        const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
    }
}

export {
    NostrEventManagerWrite,
    ISocialEventManagerWrite
}