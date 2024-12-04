"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NostrEventManagerWrite = void 0;
const index_1 = require("../core/index");
const interfaces_1 = require("../interfaces");
const utilsManager_1 = require("./utilsManager");
function convertUnixTimestampToDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
}
class NostrEventManagerWrite {
    constructor(managers, mainRelay) {
        this._nostrCommunicationManagers = [];
        this._nostrCommunicationManagers = managers;
        this._mainNostrRestAPIManager = managers.find(manager => manager.url === mainRelay);
    }
    set nostrCommunicationManagers(managers) {
        this._nostrCommunicationManagers = managers;
    }
    set privateKey(privateKey) {
        this._privateKey = privateKey;
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
    async handleEventSubmission(event, options) {
        let mainRelayOnly = options?.mainRelayOnly;
        let privateKey = options?.privateKey || this._privateKey;
        const verifiedEvent = index_1.Event.finishEvent(event, privateKey);
        const authHeader = utilsManager_1.SocialUtilsManager.constructAuthHeader(this._privateKey);
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
        };
    }
    async updateContactList(content, contactPubKeys) {
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
    async postNote(content, conversationPath, createdAt) {
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
        const result = await this.handleEventSubmission(event);
        return result;
    }
    async deleteEvents(eventIds) {
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
        const result = await this.handleEventSubmission(event);
        return result;
    }
    async updateChannel(info) {
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
            let encodedScpData = utilsManager_1.SocialUtilsManager.utf8ToBase64('$scp:' + JSON.stringify(info.scpData));
            event.tags.push([
                "scp",
                interfaces_1.ScpStandardId.Channel,
                encodedScpData
            ]);
        }
        const result = await this.handleEventSubmission(event);
        return result;
    }
    async updateUserBookmarkedChannels(channelEventIds) {
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
    async updateCommunity(info) {
        const data = {
            pointSystem: info.pointSystem,
            collectibles: info.collectibles,
            telegramBotUsername: info.telegramBotUsername,
        };
        if (info.membershipType === interfaces_1.MembershipType.Protected) {
            data.policies = [];
            for (let policy of info.policies) {
                const memberIds = policy.memberIds?.map(memberId => {
                    return memberId.startsWith('npub1') ? index_1.Nip19.decode(memberId).data : memberId;
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
            let encodedScpData = utilsManager_1.SocialUtilsManager.utf8ToBase64('$scp:' + JSON.stringify(info.scpData));
            event.tags.push([
                "scp",
                interfaces_1.ScpStandardId.Community,
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
        if (info.enableLeaderboard) {
            event.tags.push([
                "leaderboard",
                "true"
            ]);
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
    async updateUserBookmarkedCommunities(communities) {
        let communityUriArr = [];
        for (let community of communities) {
            const communityUri = utilsManager_1.SocialUtilsManager.getCommunityUri(community.creatorId, community.communityId);
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
    async submitCommunityPost(info) {
        const community = info.community;
        const communityUri = utilsManager_1.SocialUtilsManager.getCommunityUri(community.creatorId, community.communityId);
        let event = {
            "kind": 1,
            "created_at": info.timestamp || Math.round(Date.now() / 1000),
            "content": info.message,
            "tags": []
        };
        if (info.scpData) {
            let encodedScpData = utilsManager_1.SocialUtilsManager.utf8ToBase64('$scp:' + JSON.stringify(info.scpData));
            event.tags.push([
                "scp",
                interfaces_1.ScpStandardId.CommunityPost,
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
            ]);
        }
        console.log('submitCommunityPost', event);
        const result = await this.handleEventSubmission(event);
        return result;
    }
    async submitChannelMessage(info) {
        let event = {
            "kind": 42,
            "created_at": Math.round(Date.now() / 1000),
            "content": info.message,
            "tags": []
        };
        if (info.scpData) {
            let encodedScpData = utilsManager_1.SocialUtilsManager.utf8ToBase64('$scp:' + JSON.stringify(info.scpData));
            event.tags.push([
                "scp",
                interfaces_1.ScpStandardId.ChannelMessage,
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
    async updateUserProfile(content) {
        let event = {
            "kind": 0,
            "created_at": Math.round(Date.now() / 1000),
            "content": JSON.stringify(content),
            "tags": []
        };
        const result = await this.handleEventSubmission(event);
        return result;
    }
    async sendMessage(receiver, encryptedMessage, replyToEventId) {
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
        if (replyToEventId) {
            event.tags.push(['e', replyToEventId]);
        }
        const result = await this.handleEventSubmission(event);
        return result;
    }
    async sendTempMessage(options) {
        const { receiver, encryptedMessage, replyToEventId, widgetId } = options;
        const decodedPubKey = receiver.startsWith('npub1') ? index_1.Nip19.decode(receiver).data : receiver;
        let event = {
            "kind": 20004,
            "created_at": Math.round(Date.now() / 1000),
            "content": encryptedMessage,
            "tags": [
                [
                    'p',
                    decodedPubKey
                ]
            ]
        };
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
    async updateGroupKeys(identifier, groupKind, keys, invitees) {
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
                    interfaces_1.ScpStandardId.GroupKeys
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
        const result = await this.handleEventSubmission(event);
        return result;
    }
    async updateCalendarEvent(info) {
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
        const result = await this.handleEventSubmission(event);
        return result;
    }
    async createCalendarEventRSVP(rsvpId, calendarEventUri, accepted) {
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
    async submitCalendarEventPost(info) {
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
    async submitLongFormContentEvents(info) {
        let hashtags = [];
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
    async submitLike(tags) {
        let event = {
            "kind": 7,
            "created_at": Math.round(Date.now() / 1000),
            "content": "+",
            "tags": tags
        };
        const result = await this.handleEventSubmission(event);
        return result;
    }
    async submitRepost(content, tags) {
        let event = {
            "kind": 6,
            "created_at": Math.round(Date.now() / 1000),
            "content": content,
            "tags": tags
        };
        const result = await this.handleEventSubmission(event);
        return result;
    }
    async updateRelayList(relays) {
        let event = {
            "kind": 10002,
            "created_at": Math.round(Date.now() / 1000),
            "content": "",
            "tags": []
        };
        for (let url in relays) {
            const { read, write } = relays[url];
            if (!read && !write)
                continue;
            const tag = [
                "r",
                url
            ];
            if (!read || !write)
                tag.push(read ? 'read' : 'write');
            event.tags.push(tag);
        }
        const result = await this.handleEventSubmission(event);
        return result;
    }
    async createPaymentRequestEvent(paymentRequest, amount, comment, isLightningInvoice) {
        let hash = index_1.Event.getPaymentRequestHash(paymentRequest);
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
    async createPaymentReceiptEvent(requestEventId, recipient, comment, preimage, tx) {
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
            event.tags.push([
                "preimage",
                preimage
            ]);
        }
        if (tx) {
            event.tags.push([
                "tx",
                tx
            ]);
        }
        const result = await this.handleEventSubmission(event);
        return result;
    }
    async updateCommunityPinnedNotes(creatorId, communityId, eventIds) {
        const communityUri = utilsManager_1.SocialUtilsManager.getCommunityUri(creatorId, communityId);
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
    async updateUserPinnedNotes(eventIds) {
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
    async updateUserBookmarks(tags) {
        let event = {
            "kind": 10003,
            "created_at": Math.round(Date.now() / 1000),
            "content": "",
            "tags": [...tags]
        };
        const result = await this.handleEventSubmission(event);
        return result;
    }
    async updateUserEthWalletAccountsInfo(options, privateKey) {
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
    async updateNoteStatus(noteId, status) {
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
    async updateCommunityStall(creatorId, communityId, stall) {
        const communityUri = utilsManager_1.SocialUtilsManager.getCommunityUri(creatorId, communityId);
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
    async updateCommunityProduct(creatorId, communityId, product) {
        const communityUri = utilsManager_1.SocialUtilsManager.getCommunityUri(creatorId, communityId);
        const stallUri = utilsManager_1.SocialUtilsManager.getMarketplaceStallUri(creatorId, product.stallId);
        const productContent = JSON.stringify({
            id: product.id,
            stall_id: product.stallId,
            product_type: product.productType || interfaces_1.MarketplaceProductType.Physical,
            name: product.name,
            description: product.description,
            images: product.images,
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
}
exports.NostrEventManagerWrite = NostrEventManagerWrite;
