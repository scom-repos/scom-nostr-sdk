import { Nip19, Event, Keys } from "../core/index";
import { 
    CalendarEventType, 
    IChannelInfo, 
    ICommunityBasicInfo, 
    ICommunityInfo, 
    IConversationPath, 
    ILongFormContentInfo, 
    INewCalendarEventPostInfo, 
    INewChannelMessageInfo, 
    INewCommunityPostInfo, 
    INostrMetadataContent, 
    INostrRestAPIManager, 
    IRelayConfig, 
    ISocialEventManagerWrite, 
    IMarketplaceStall, 
    IUpdateCalendarEventInfo, 
    MembershipType, 
    ScpStandardId, 
    SocialEventManagerWriteOptions, 
    IMarketplaceProduct,
    MarketplaceProductType
} from "../interfaces";
import {
    INostrCommunicationManager
} from "./communication";
import { SocialUtilsManager } from "./utilsManager";

function convertUnixTimestampToDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2); 
    const day = ("0" + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
}

class NostrEventManagerWrite implements ISocialEventManagerWrite {
    protected _nostrCommunicationManagers: INostrCommunicationManager[] = [];
    protected _privateKey: string;
    protected _mainNostrRestAPIManager: INostrRestAPIManager;

    constructor(managers: INostrCommunicationManager[], mainRelay: string) {
        this._nostrCommunicationManagers = managers;
        this._mainNostrRestAPIManager = managers.find(manager => manager.url === mainRelay) as INostrRestAPIManager;
    }

    set nostrCommunicationManagers(managers: INostrCommunicationManager[]) {
        this._nostrCommunicationManagers = managers;
    }

    set privateKey(privateKey: string) {
        this._privateKey = privateKey;
    }

    protected calculateConversationPathTags(conversationPath: IConversationPath) {
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

    private async handleEventSubmission(event: Event.EventTemplate<number>, options?: {privateKey?: string, mainRelayOnly?: boolean}) {
        let mainRelayOnly = options?.mainRelayOnly;
        let privateKey = options?.privateKey || this._privateKey;
        const verifiedEvent = Event.finishEvent(event, privateKey);
        const authHeader = SocialUtilsManager.constructAuthHeader(this._privateKey);
        const response = await this._mainNostrRestAPIManager.submitEvent(verifiedEvent, authHeader);
        if (response.success) {
            if (!mainRelayOnly) {
                const otherRelays = this._nostrCommunicationManagers.filter(manager => manager.url !== this._mainNostrRestAPIManager.url);
                setTimeout(async () => {
                    try {
                        await Promise.all(otherRelays.map(manager => manager.submitEvent(verifiedEvent, authHeader)));
                    } 
                    catch (error) {
                        console.error('Error submitting to other relays:', error);
                    }
                });
            }
        }
        return {
            event: verifiedEvent,
            relayResponse: response
        }
    }

    async updateContactList(content: string, contactPubKeys: string[]) {
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
        const result = await this.handleEventSubmission(event);
        return result;
    }  

    async postNote(content: string, conversationPath?: IConversationPath, createdAt?: number) {
        let event = {
            "kind": 1,
            "created_at": createdAt !== undefined ? createdAt : Math.round(Date.now() / 1000),
            "content": content,
            "tags": []
        };
        if (conversationPath) {
            const conversationPathTags = this.calculateConversationPathTags(conversationPath);
            event.tags = conversationPathTags;
        }
        // const noteId = Nip19.noteEncode(verifiedEvent.id);
        // return noteId;
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async deleteEvents(eventIds: string[]) {
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
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async updateChannel(info: IChannelInfo) {
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
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async updateUserBookmarkedChannels(channelEventIds: string[]) {
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
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async updateCommunity(info: ICommunityInfo) {
        const data: any = {
            pointSystem: info.pointSystem,
            collectibles: info.collectibles,
            telegramBotUsername: info.telegramBotUsername,
        }
        if (info.membershipType === MembershipType.Protected) {
            data.policies = [];
            for (let policy of info.policies) {
                const memberIds = policy.memberIds?.map(memberId => {
                    return memberId.startsWith('npub1') ? Nip19.decode(memberId).data as string : memberId;
                });
                data.policies.push({
                    ...policy,
                    memberIds
                });
            }
        }
        if (info.postStatusOptions?.length > 0) {
            data.postStatuses = info.postStatusOptions;
        }
        if (info.campaigns?.length > 0) {
            data.campaigns = info.campaigns;
        }
        const isEmptyObject = JSON.stringify(data) === "{}";
        const content = isEmptyObject ? "" : JSON.stringify(data);
        let event = {
            "kind": 34550,
            "created_at": Math.round(Date.now() / 1000),
            "content": content,
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
        if (info.privateRelay) {
            event.tags.push([
                "private_relay",
                info.privateRelay
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
        if (info.enableLeaderboard) {
            event.tags.push([
                "leaderboard",
                "true"
            ])
        }
        if (info.parentCommunityUri) {
            event.tags.push([
                "a",
                info.parentCommunityUri
            ]);
        }

        const result = await this.handleEventSubmission(event);
        return result;
    }

    async updateUserBookmarkedCommunities(communities: ICommunityBasicInfo[]) {
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
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async submitCommunityPost(info: INewCommunityPostInfo) {
        const community = info.community;
        const communityUri = SocialUtilsManager.getCommunityUri(community.creatorId, community.communityId);
        let event = {
            "kind": 1,
            "created_at": info.timestamp || Math.round(Date.now() / 1000),
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
        if (info.alt) {
            event.tags.push([
                "alt",
                info.alt
            ])
        }
        console.log('submitCommunityPost', event);
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async submitChannelMessage(info: INewChannelMessageInfo) {
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
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async updateUserProfile(content: INostrMetadataContent) {
        let event = {
            "kind": 0,
            "created_at": Math.round(Date.now() / 1000),
            "content": JSON.stringify(content),
            "tags": []
        };
        const result = await this.handleEventSubmission(event);
        return result;
    }
  
    async sendMessage(options: SocialEventManagerWriteOptions.ISendMessage) {
        const { receiver, encryptedMessage, replyToEventId } = options;
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
        if (replyToEventId) {
            event.tags.push(['e', replyToEventId]);
        }
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async sendTempMessage(options: SocialEventManagerWriteOptions.ISendTempMessage) {
        const { receiver, encryptedMessage, replyToEventId, widgetId } = options;
        const decodedPubKey = receiver.startsWith('npub1') ? Nip19.decode(receiver).data : receiver;
        let event = {
            "kind": 20004,
            "created_at": Math.round(Date.now() / 1000),
            "content": encryptedMessage,
            "tags": [
                [
                    'p',
                    decodedPubKey as string
                ]
            ]
        }
        if (replyToEventId) {
            event.tags.push(['e', replyToEventId]);
        }
        if (widgetId) {
            event.tags.push(['w', widgetId]);
        }
        const result = await this.handleEventSubmission(event, {
            mainRelayOnly: true
        });
        return result;
    }

    async updateGroupKeys(identifier: string, groupKind: number, keys: string, invitees: string[]) {
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
        const result = await this.handleEventSubmission(event);
        return result;
    }
    
    async updateCalendarEvent(info: IUpdateCalendarEventInfo) {
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
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async createCalendarEventRSVP(rsvpId: string, calendarEventUri: string, accepted: boolean) {
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
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async submitCalendarEventPost(info: INewCalendarEventPostInfo) {
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
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async submitLongFormContentEvents(info: ILongFormContentInfo) {
        let hashtags: string[][] = [];
        if (info.hashtags?.length > 0) {
            hashtags = info.hashtags.map(tag => ["t", tag]);
        }
        let event = {
            "kind": 1,
            "created_at": info.createdAt || Math.round(Date.now() / 1000),
            "content": info.content,
            "tags": [
                [
                    "d",
                    info.id
                ],
                [
                    "c",
                    "md"
                ],
                [
                    "content",
                    info.markdownContent
                ],
                ...hashtags
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
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async submitLike(tags: string[][]) {
        let event = {
            "kind": 7,
            "created_at": Math.round(Date.now() / 1000),
            "content": "+",
            "tags": tags
        };
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async submitRepost(content: string, tags: string[][]) {
        let event = {
            "kind": 6,
            "created_at": Math.round(Date.now() / 1000),
            "content": content,
            "tags": tags
        };
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async updateRelayList(relays: Record<string, IRelayConfig>) {
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
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async createPaymentRequestEvent(paymentRequest: string, amount: string, comment: string, isLightningInvoice?: boolean) {
        let hash = Event.getPaymentRequestHash(paymentRequest);
        let event = {
            "kind": 9739,
            "created_at": Math.round(Date.now() / 1000),
            "content": comment,
            "tags": [
                [
                    "r",
                    hash
                ],
                [
                    isLightningInvoice ? "bolt11" : "payreq",
                    paymentRequest
                ],
                [
                    "amount",
                    amount
                ]
            ]
        };
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async createPaymentReceiptEvent(requestEventId: string, recipient: string, comment: string, preimage?: string, tx?: string) {
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
            ]
        };
        if (preimage) {
            event.tags.push(
                [
                    "preimage",
                    preimage
                ]
            );
        }
        if (tx) {
            event.tags.push(
                [
                    "tx",
                    tx
                ]
            );
        }
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async updateCommunityPinnedNotes(creatorId: string, communityId: string, eventIds: string[]) {
        const communityUri = SocialUtilsManager.getCommunityUri(creatorId, communityId);
        let tags = eventIds.map(id => ["e", id]);
        let event = {
            "kind": 9741,
            "created_at": Math.round(Date.now() / 1000),
            "content": "",
            "tags": [
                [
                    "a",
                    communityUri
                ],
                ...tags
            ]
        };
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async updateUserPinnedNotes(eventIds: string[]) {
        let tags = eventIds.map(id => ["e", id]);
        let event = {
            "kind": 10001,
            "created_at": Math.round(Date.now() / 1000),
            "content": "",
            "tags": tags
        };
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async updateUserBookmarks(tags: string[][]) {
        let event = {
            "kind": 10003,
            "created_at": Math.round(Date.now() / 1000),
            "content": "",
            "tags": [ ...tags ]
        };
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async updateUserEthWalletAccountsInfo(options: SocialEventManagerWriteOptions.IUpdateUserEthWalletAccountsInfo, privateKey?: string) {
        let event = {
            "kind": 9742,
            "created_at": Math.round(Date.now() / 1000),
            "content": JSON.stringify({
                "master_wallet_signature": options.masterWalletSignature,
                "social_wallet_signature": options.socialWalletSignature,
                "encrypted_key": options.encryptedKey
            }),
            "tags": [
                [
                    "d",
                    options.masterWalletHash
                ]
            ]
        };
        const result = await this.handleEventSubmission(event, {
            privateKey
        });
        return result;
    }

    async updateNoteStatus(noteId: string, status: string) {
        let event = {
            "kind": 1985,
            "created_at": Math.round(Date.now() / 1000),
            "content": "",
            "tags": [
                [
                    "L",
                    "status"
                ],
                [
                    "l",
                    status,
                    "status"
                ],
                [
                    "e",
                    noteId
                ]
            ]
        };
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async updateCommunityStall(creatorId: string, communityId: string, stall: IMarketplaceStall) {
        const communityUri = SocialUtilsManager.getCommunityUri(creatorId, communityId);
        let event = {
            "kind": 30017,
            "created_at": Math.round(Date.now() / 1000),
            "content": JSON.stringify(stall),
            "tags": [
                [
                    "d",
                    stall.id
                ],
                [
                    "a",
                    communityUri
                ]
            ]
        };
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async updateCommunityProduct(creatorId: string, communityId: string, product: IMarketplaceProduct) {
        const communityUri = SocialUtilsManager.getCommunityUri(creatorId, communityId);
        const stallUri = SocialUtilsManager.getMarketplaceStallUri(creatorId, product.stallId);
        const productContent = JSON.stringify({
            id: product.id,
            stall_id: product.stallId,
            product_type: product.productType || MarketplaceProductType.Physical,
            name: product.name,
            description: product.description,
            images: product.images,
            thumbnail: product.thumbnail,
            currency: product.currency,
            price: product.price,
            quantity: product.quantity,
            specs: product.specs,
            shipping: product.shipping
        });
        let event = {
            "kind": 30018,
            "created_at": Math.round(Date.now() / 1000),
            "content": productContent,
            "tags": [
                [
                    "d",
                    product.id
                ],
                [
                    "a",
                    stallUri
                ],
                [
                    "a",
                    communityUri
                ]
            ]
        };
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async placeMarketplaceOrder(options: SocialEventManagerWriteOptions.IPlaceMarketplaceOrder) {
        const { merchantId, stallId, order, replyToEventId } = options;
        const stallUri = SocialUtilsManager.getMarketplaceStallUri(merchantId, stallId);
        const decodedMerchantPubkey = merchantId.startsWith('npub1') ? Nip19.decode(merchantId).data as string : merchantId;
        let orderItems = order.items.map(item => {
            return {
                product_id: item.productId,
                quantity: item.quantity
            }
        });
        let message = {
            id: order.id,
            type: 0,
            contact: order.contact,
            items: orderItems,
            shipping_id: order.shippingId
        };
        if (order.name) {
            message['name'] = order.name;
        }
        if (order.address) {
            message['address'] = order.address;
        }
        if (order.message) {
            message['message'] = order.message;
        }
        const encryptedMessage = await SocialUtilsManager.encryptMessage(this._privateKey, decodedMerchantPubkey, JSON.stringify(message));
        let event = {
            "kind": 4,
            "created_at": Math.round(Date.now() / 1000),
            "content": encryptedMessage,
            "tags": [
                [
                    'p',
                    decodedMerchantPubkey
                ],
                [
                    "a",
                    stallUri
                ],
                [
                    "t",
                    "order"
                ],
                [
                    "z",
                    order.id
                ]
            ]
        }
        if (replyToEventId) {
            event.tags.push(['e', replyToEventId]);
        }
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async requestMarketplaceOrderPayment(options: SocialEventManagerWriteOptions.IRequestMarketplaceOrderPayment) {
        const { customerId, merchantId, stallId, paymentRequest, replyToEventId } = options;
        const stallUri = SocialUtilsManager.getMarketplaceStallUri(merchantId, stallId);
        const decodedCustomerPubkey = customerId.startsWith('npub1') ? Nip19.decode(customerId).data as string : customerId;
        let message = {
            id: paymentRequest.id,
            type: 1,
            message: paymentRequest.message,
            payment_options: paymentRequest.paymentOptions
        };
        const encryptedMessage = await SocialUtilsManager.encryptMessage(this._privateKey, decodedCustomerPubkey, JSON.stringify(message));
        let event = {
            "kind": 4,
            "created_at": Math.round(Date.now() / 1000),
            "content": encryptedMessage,
            "tags": [
                [
                    'p',
                    decodedCustomerPubkey
                ],
                [
                    "a",
                    stallUri
                ]
            ]
        }
        if (replyToEventId) {
            event.tags.push(['e', replyToEventId]);
        }
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async updateMarketplaceOrderStatus(options: SocialEventManagerWriteOptions.IUpdatetMarketplaceOrderStatus) {
        const { customerId, merchantId, stallId, status, replyToEventId } = options;
        const stallUri = SocialUtilsManager.getMarketplaceStallUri(merchantId, stallId);
        const decodedCustomerPubkey = customerId.startsWith('npub1') ? Nip19.decode(customerId).data as string : customerId;
        let message = {
            id: status.id,
            type: 2,
            message: status.message,
            paid: status.paid,
            shipped: status.shipped
        };
        const encryptedMessage = await SocialUtilsManager.encryptMessage(this._privateKey, decodedCustomerPubkey, JSON.stringify(message));
        let event = {
            "kind": 4,
            "created_at": Math.round(Date.now() / 1000),
            "content": encryptedMessage,
            "tags": [
                [
                    'p',
                    decodedCustomerPubkey
                ],
                [
                    "a",
                    stallUri
                ]
            ]
        }
        if (replyToEventId) {
            event.tags.push(['e', replyToEventId]);
        }
        const result = await this.handleEventSubmission(event);
        return result;
    }

    async recordPaymentActivity(options: SocialEventManagerWriteOptions.IRecordPaymentActivity) {
        const { 
            id, 
            sender, 
            recipient, 
            amount, 
            currencyCode, 
            networkCode, 
            stallId,
            orderId, 
            referenceId, 
            replyToEventId 
        } = options;
        const decodedRecipientPubkey = recipient.startsWith('npub1') ? Nip19.decode(recipient).data as string : recipient;
        let message = {
            id,
            type: 3,
            sender,
            recipient,
            amount,
            currency_code: currencyCode
        };
        if (networkCode) {
            message['network_code'] = networkCode;
        }
        if (orderId) {
            message['order_id'] = orderId;
        }
        if (referenceId) {
            message['reference_id'] = referenceId;
        }
        if (stallId) {
            message['stall_id'] = stallId;
        }
        const encryptedMessage = await SocialUtilsManager.encryptMessage(this._privateKey, decodedRecipientPubkey, JSON.stringify(message));
        let event = {
            "kind": 4,
            "created_at": Math.round(Date.now() / 1000),
            "content": encryptedMessage,
            "tags": [
                [
                    "p",
                    decodedRecipientPubkey
                ],
                [
                    "t",
                    "payment"
                ]
            ]
        };
        if (orderId) {
            event.tags.push([
                "z",
                orderId
            ]);
        }
        if (stallId) {
            const stallUri = SocialUtilsManager.getMarketplaceStallUri(recipient, stallId);
            event.tags.push([
                "a",
                stallUri
            ]);
        }
        if (replyToEventId) {
            event.tags.push(['e', replyToEventId]);
        }
        const result = await this.handleEventSubmission(event);
        return result;
    }
}

export {
    NostrEventManagerWrite
}
