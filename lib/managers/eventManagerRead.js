"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NostrEventManagerRead = void 0;
const index_1 = require("../core/index");
const interfaces_1 = require("../interfaces");
const utilsManager_1 = require("./utilsManager");
class NostrEventManagerRead {
    constructor(manager) {
        this._nostrCommunicationManager = manager;
    }
    set nostrCommunicationManager(manager) {
        this._nostrCommunicationManager = manager;
    }
    set privateKey(privateKey) {
        this._privateKey = privateKey;
    }
    async fetchThreadCacheEvents(options) {
        const { id, pubKey } = options;
        let decodedId = id.startsWith('note1') ? index_1.Nip19.decode(id).data : id;
        let msg = {
            event_id: decodedId,
            limit: 100
        };
        if (pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
            msg.user_pubkey = decodedPubKey;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('thread_view', msg);
        return fetchEventsResponse.events;
    }
    async fetchTrendingCacheEvents(options) {
        const { pubKey } = options;
        let msg = {};
        if (pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
            msg.user_pubkey = decodedPubKey;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('explore_global_trending_24h', msg);
        return fetchEventsResponse.events;
    }
    async fetchProfileFeedCacheEvents(options) {
        let { pubKey, since, until, userPubkey } = options;
        if (!since)
            since = 0;
        if (!until)
            until = 0;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = {
            limit: 20,
            notes: "authored",
            pubkey: decodedPubKey
        };
        if (until === 0) {
            msg.since = since;
        }
        else {
            msg.until = until;
        }
        if (userPubkey) {
            const decodedUserPubKey = userPubkey.startsWith('npub1') ? index_1.Nip19.decode(userPubkey).data : userPubkey;
            msg.user_pubkey = decodedUserPubKey;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('feed', msg);
        return fetchEventsResponse.events;
    }
    async fetchProfileRepliesCacheEvents(options) {
        let { pubKey, since, until, userPubkey } = options;
        if (!since)
            since = 0;
        if (!until)
            until = 0;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = {
            limit: 20,
            notes: "replies",
            pubkey: decodedPubKey
        };
        if (until === 0) {
            msg.since = since;
        }
        else {
            msg.until = until;
        }
        if (userPubkey) {
            const decodedUserPubKey = userPubkey.startsWith('npub1') ? index_1.Nip19.decode(userPubkey).data : userPubkey;
            msg.user_pubkey = decodedUserPubKey;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('feed', msg);
        return fetchEventsResponse.events;
    }
    async fetchHomeFeedCacheEvents(options) {
        let { since, until, pubKey } = options;
        if (!since)
            since = 0;
        if (!until)
            until = 0;
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
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('feed', msg);
        return fetchEventsResponse.events;
    }
    async fetchUserProfileCacheEvents(options) {
        const { pubKeys } = options;
        if (!pubKeys || pubKeys.length === 0)
            return [];
        const decodedPubKeys = pubKeys.map(pubKey => pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey);
        let msg = {
            pubkeys: decodedPubKeys
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('user_infos', msg);
        return fetchEventsResponse.events;
    }
    async fetchUserProfileDetailEvents(options) {
        const { pubKey } = options;
        if (!pubKey)
            return [];
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = {
            pubkey: decodedPubKey,
            user_pubkey: decodedPubKey
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('user_profile', msg);
        return fetchEventsResponse.events;
    }
    async fetchContactListCacheEvents(options) {
        const { pubKey, detailIncluded } = options;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = {
            extended_response: detailIncluded,
            pubkey: decodedPubKey
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('contact_list', msg);
        return fetchEventsResponse.events;
    }
    async fetchUserRelays(options) {
        const { pubKey } = options;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = {
            pubkey: decodedPubKey
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('get_user_relays', msg);
        return fetchEventsResponse.events;
    }
    async fetchFollowersCacheEvents(options) {
        const { pubKey } = options;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = {
            pubkey: decodedPubKey
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('user_followers', msg);
        return fetchEventsResponse.events;
    }
    async fetchCommunities(options) {
        const { pubkeyToCommunityIdsMap } = options;
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
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(...requests);
            events = fetchEventsResponse.events;
        }
        else {
            let request = {
                kinds: [34550],
                limit: 50
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
            events = fetchEventsResponse.events;
        }
        return events;
    }
    async fetchAllUserRelatedCommunities(options) {
        const { pubKey } = options;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let requestForCreatedCommunities = {
            kinds: [34550],
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
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(requestForCreatedCommunities, requestForFollowedCommunities, requestForModeratedCommunities);
        let communitiesEvents = [];
        const pubkeyToCommunityIdsMap = {};
        for (let event of fetchEventsResponse.events) {
            if (event.kind === 34550) {
                communitiesEvents.push(event);
            }
            else if (event.kind === 30001) {
                const bookmarkedCommunities = utilsManager_1.SocialUtilsManager.extractBookmarkedCommunities(event);
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
            const bookmarkedCommunitiesEvents = await this.fetchCommunities({ pubkeyToCommunityIdsMap });
            for (let event of bookmarkedCommunitiesEvents) {
                communitiesEvents.push(event);
            }
        }
        return communitiesEvents;
    }
    async fetchAllUserRelatedCommunitiesFeed(options) {
        const { since, until } = options;
        const communitiesEvents = await this.fetchAllUserRelatedCommunities(options);
        let communityUriArr = [];
        let identifiers = [];
        for (let event of communitiesEvents) {
            if (event.kind === 34550) {
                const communityInfo = utilsManager_1.SocialUtilsManager.extractCommunityInfo(event);
                identifiers.push(communityInfo.communityUri + ':keys');
                communityUriArr.push(communityInfo.communityUri);
            }
        }
        let feedEvents = [];
        if (communityUriArr.length > 0) {
            feedEvents = await this.fetchCommunitiesFeed({ communityUriArr, since, until });
        }
        return feedEvents;
    }
    async fetchUserBookmarkedCommunities(options) {
        const { pubKey, excludedCommunity } = options;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let request = {
            kinds: [30001],
            "#d": ["communities"],
            authors: [decodedPubKey]
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
        const bookmarkedCommunitiesEvent = fetchEventsResponse.events.find(event => event.kind === 30001);
        const communities = utilsManager_1.SocialUtilsManager.extractBookmarkedCommunities(bookmarkedCommunitiesEvent, excludedCommunity);
        return communities;
    }
    async fetchCommunity(options) {
        const { communityId, creatorId } = options;
        const decodedCreatorId = creatorId.startsWith('npub1') ? index_1.Nip19.decode(creatorId).data : creatorId;
        let infoMsg = {
            kinds: [34550],
            authors: [decodedCreatorId],
            "#d": [communityId]
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(infoMsg);
        return fetchEventsResponse.events;
    }
    async fetchCommunityFeed(options) {
        const { communityUri, since, until } = options;
        let request = {
            kinds: [1],
            "#a": [communityUri],
            limit: 20
        };
        if (since != null) {
            request.since = since;
        }
        if (until != null) {
            request.until = until;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
        return fetchEventsResponse.events;
    }
    async fetchCommunitiesFeed(options) {
        const { communityUriArr, since, until } = options;
        let request = {
            kinds: [1],
            "#a": communityUriArr,
            limit: 20
        };
        if (since != null) {
            request.since = since;
        }
        if (until != null) {
            request.until = until;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
        return fetchEventsResponse.events;
    }
    async fetchCommunitiesGeneralMembers(options) {
        const { communities } = options;
        const communityUriArr = [];
        for (let community of communities) {
            const communityUri = utilsManager_1.SocialUtilsManager.getCommunityUri(community.creatorId, community.communityId);
            communityUriArr.push(communityUri);
        }
        let request = {
            kinds: [30001],
            "#d": ["communities"],
            "#a": communityUriArr
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
        return fetchEventsResponse.events;
    }
    async fetchAllUserRelatedChannels(options) {
        const { pubKey } = options;
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
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(requestForCreatedChannels, requestForJoinedChannels);
        let channels = [];
        let bookmarkedChannelEventIds = [];
        const channelMetadataMap = {};
        const handleChannelEvent = (event) => {
            if (event.kind === 40) {
                const channelInfo = utilsManager_1.SocialUtilsManager.extractChannelInfo(event);
                if (channelInfo) {
                    channels.push(channelInfo);
                }
            }
            else if (event.kind === 41) {
                const channelInfo = utilsManager_1.SocialUtilsManager.extractChannelInfo(event);
                if (channelInfo) {
                    channelMetadataMap[channelInfo.id] = channelInfo;
                }
            }
        };
        for (let event of fetchEventsResponse.events) {
            if (event.kind === 30001) {
                bookmarkedChannelEventIds = utilsManager_1.SocialUtilsManager.extractBookmarkedChannels(event);
            }
            else {
                handleChannelEvent(event);
            }
        }
        if (bookmarkedChannelEventIds.length > 0) {
            const bookmarkedChannelEvents = await this.fetchEventsByIds({
                ids: bookmarkedChannelEventIds
            });
            for (let event of bookmarkedChannelEvents) {
                handleChannelEvent(event);
            }
        }
        const pubkeyToCommunityIdsMap = {};
        for (let channel of channels) {
            const scpData = channel.scpData;
            if (!scpData?.communityUri)
                continue;
            const { communityId } = utilsManager_1.SocialUtilsManager.getCommunityBasicInfoFromUri(scpData.communityUri);
            pubkeyToCommunityIdsMap[channel.eventData.pubkey] = pubkeyToCommunityIdsMap[channel.eventData.pubkey] || [];
            if (!pubkeyToCommunityIdsMap[channel.eventData.pubkey].includes(communityId)) {
                pubkeyToCommunityIdsMap[channel.eventData.pubkey].push(communityId);
            }
        }
        let channelIdToCommunityMap = {};
        const communityEvents = await this.fetchCommunities(pubkeyToCommunityIdsMap);
        for (let event of communityEvents) {
            const communityInfo = utilsManager_1.SocialUtilsManager.extractCommunityInfo(event);
            const channelId = communityInfo.scpData?.channelEventId;
            if (!channelId)
                continue;
            channelIdToCommunityMap[channelId] = communityInfo;
        }
        return {
            channels,
            channelMetadataMap,
            channelIdToCommunityMap
        };
    }
    async fetchUserBookmarkedChannelEventIds(options) {
        const { pubKey } = options;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let requestForJoinedChannels = {
            kinds: [30001],
            "#d": ["channels"],
            authors: [decodedPubKey]
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(requestForJoinedChannels);
        const bookmarkedChannelsEvent = fetchEventsResponse.events.find(event => event.kind === 30001);
        const channelEventIds = utilsManager_1.SocialUtilsManager.extractBookmarkedChannels(bookmarkedChannelsEvent);
        return channelEventIds;
    }
    async fetchEventsByIds(options) {
        const { ids } = options;
        let request = {
            ids: ids
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
        return fetchEventsResponse.events;
    }
    async fetchTempEvents(options) {
        return [];
    }
    async fetchChannelMessages(options) {
        let { channelId, since, until } = options;
        if (!since)
            since = 0;
        if (!until)
            until = 0;
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
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(messagesReq);
        return fetchEventsResponse.events;
    }
    async fetchChannelInfoMessages(options) {
        const { channelId } = options;
        const decodedChannelId = channelId.startsWith('npub1') ? index_1.Nip19.decode(channelId).data : channelId;
        let channelCreationEventReq = {
            kinds: [40],
            ids: [decodedChannelId],
        };
        let channelMetadataEventReq = {
            kinds: [41],
            "#e": [decodedChannelId]
        };
        let messagesReq = {
            kinds: [42],
            "#e": [decodedChannelId],
            limit: 20
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(channelCreationEventReq, channelMetadataEventReq, messagesReq);
        return fetchEventsResponse.events;
    }
    async fetchMessageContactsCacheEvents(options) {
        const { pubKey } = options;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = {
            user_pubkey: decodedPubKey,
            relation: 'follows'
        };
        const followsEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('get_directmsg_contacts', msg);
        msg = {
            user_pubkey: decodedPubKey,
            relation: 'other'
        };
        const otherEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('get_directmsg_contacts', msg);
        return [...followsEventsResponse.events, ...otherEventsResponse.events];
    }
    async fetchDirectMessages(options) {
        let { pubKey, sender, since, until } = options;
        if (!since)
            since = 0;
        if (!until)
            until = 0;
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
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('get_directmsgs', req);
        return fetchEventsResponse.events;
    }
    async resetMessageCount(options) {
        const { pubKey, sender } = options;
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
        event.sig = index_1.Event.getSignature(event, this._privateKey);
        const msg = {
            event_from_user: event,
            sender: decodedSenderPubKey
        };
        await this._nostrCommunicationManager.fetchCachedEvents('reset_directmsg_count', msg);
    }
    async fetchGroupKeys(options) {
        const { identifiers } = options;
        let req = {
            kinds: [30078],
            "#d": identifiers
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
        return fetchEventsResponse.events || [];
    }
    async fetchUserGroupInvitations(options) {
        const { pubKey, groupKinds } = options;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let req = {
            kinds: [30078],
            "#p": [decodedPubKey],
            "#k": groupKinds.map(kind => kind.toString())
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
        let events = fetchEventsResponse.events?.filter(event => event.tags.filter(tag => tag[0] === 'p' && tag?.[3] === 'invitee').map(tag => tag[1]).includes(decodedPubKey));
        return events;
    }
    async fetchCalendarEvents(options) {
        const { limit } = options;
        let req = {
            kinds: [31922, 31923],
            limit: limit || 10
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
        return {
            events: fetchEventsResponse.events,
            data: fetchEventsResponse.data
        };
    }
    async fetchCalendarEvent(options) {
        const { address } = options;
        let req = {
            kinds: [address.kind],
            "#d": [address.identifier],
            authors: [address.pubkey]
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    }
    async fetchCalendarEventPosts(options) {
        const { calendarEventUri } = options;
        let request = {
            kinds: [1],
            "#a": [calendarEventUri],
            limit: 50
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
        return fetchEventsResponse.events;
    }
    async fetchCalendarEventRSVPs(options) {
        const { calendarEventUri, pubkey } = options;
        let req = {
            kinds: [31925],
            "#a": [calendarEventUri]
        };
        if (pubkey) {
            const decodedPubKey = pubkey.startsWith('npub1') ? index_1.Nip19.decode(pubkey).data : pubkey;
            req.authors = [decodedPubKey];
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
        return fetchEventsResponse.events;
    }
    async fetchLongFormContentEvents(options) {
        let { pubKey, since, until } = options;
        if (!since)
            since = 0;
        if (!until)
            until = 0;
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
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
        return fetchEventsResponse.events;
    }
    async searchUsers(options) {
        const { query } = options;
        const req = {
            query: query,
            limit: 10
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('user_search', req);
        return fetchEventsResponse.events;
    }
    async fetchPaymentRequestEvent(options) {
        const { paymentRequest } = options;
        let hash = index_1.Event.getPaymentRequestHash(paymentRequest);
        let req = {
            kinds: [9739],
            "#r": [hash]
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    }
    async fetchPaymentReceiptEvent(options) {
        const { requestEventId } = options;
        let req = {
            kinds: [9740],
            "#e": [requestEventId]
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    }
    getPaymentHash(tags) {
        let tagsMap = {};
        for (let _t of tags) {
            tagsMap[_t[0]] = _t.slice(1);
        }
        return tagsMap['bolt11']?.[0] || tagsMap['payreq']?.[0] || tagsMap['r']?.[0];
    }
    async fetchPaymentActivitiesForRecipient(options) {
        let { pubkey, since, until } = options;
        if (!since)
            since = 0;
        if (!until)
            until = 0;
        let paymentRequestEventsReq = {
            kinds: [9739],
            authors: [pubkey],
            limit: 10
        };
        if (until === 0) {
            paymentRequestEventsReq.since = since;
        }
        else {
            paymentRequestEventsReq.until = until;
        }
        const paymentRequestEvents = await this._nostrCommunicationManager.fetchEvents(paymentRequestEventsReq);
        const requestEventIds = paymentRequestEvents.events.map(event => event.id);
        let paymentReceiptEventsReq = {
            kinds: [9740],
            "#e": requestEventIds
        };
        const paymentReceiptEvents = await this._nostrCommunicationManager.fetchEvents(paymentReceiptEventsReq);
        let paymentActivity = [];
        for (let requestEvent of paymentRequestEvents.events) {
            const paymentHash = this.getPaymentHash(requestEvent.tags);
            const amount = requestEvent.tags.find(tag => tag[0] === 'amount')?.[1];
            const receiptEvent = paymentReceiptEvents.events.find(event => event.tags.find(tag => tag[0] === 'e')?.[1] === requestEvent.id);
            let status = 'pending';
            let sender;
            if (receiptEvent) {
                status = 'completed';
                sender = receiptEvent.pubkey;
            }
            paymentActivity.push({
                paymentHash,
                sender,
                recipient: pubkey,
                amount,
                status,
                createdAt: requestEvent.created_at
            });
        }
        return paymentActivity;
    }
    async fetchPaymentActivitiesForSender(options) {
        let { pubkey, since, until } = options;
        if (!since)
            since = 0;
        if (!until)
            until = 0;
        let paymentReceiptEventsReq = {
            kinds: [9740],
            authors: [pubkey],
            limit: 10
        };
        if (until === 0) {
            paymentReceiptEventsReq.since = since;
        }
        else {
            paymentReceiptEventsReq.until = until;
        }
        const paymentReceiptEvents = await this._nostrCommunicationManager.fetchEvents(paymentReceiptEventsReq);
        let requestEventIds = [];
        for (let event of paymentReceiptEvents.events) {
            const requestEventId = event.tags.find(tag => tag[0] === 'e')?.[1];
            if (requestEventId) {
                requestEventIds.push(requestEventId);
            }
        }
        let paymentRequestEventsReq = {
            kinds: [9739],
            ids: requestEventIds
        };
        const paymentRequestEvents = await this._nostrCommunicationManager.fetchEvents(paymentRequestEventsReq);
        let paymentActivity = [];
        for (let receiptEvent of paymentReceiptEvents.events) {
            const requestEventId = receiptEvent.tags.find(tag => tag[0] === 'e')?.[1];
            const requestEvent = paymentRequestEvents.events.find(event => event.id === requestEventId);
            if (requestEvent) {
                const paymentHash = this.getPaymentHash(requestEvent.tags);
                const amount = requestEvent.tags.find(tag => tag[0] === 'amount')?.[1];
                paymentActivity.push({
                    paymentHash,
                    sender: pubkey,
                    recipient: requestEvent.pubkey,
                    amount,
                    status: 'completed',
                    createdAt: receiptEvent.created_at
                });
            }
        }
        return paymentActivity;
    }
    async fetchUserFollowingFeed(options) {
        let { pubKey, until } = options;
        if (!until)
            until = 0;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = {
            user_pubkey: decodedPubKey,
            timeframe: 'latest',
            scope: 'follows',
            limit: 20
        };
        if (until > 0) {
            msg.until = until;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('explore', msg);
        return fetchEventsResponse.events;
    }
    async fetchCommunityPinnedNotesEvents(options) {
        const { creatorId, communityId } = options;
        const communityUri = utilsManager_1.SocialUtilsManager.getCommunityUri(creatorId, communityId);
        let request = {
            kinds: [9741],
            "#a": [communityUri]
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
        return fetchEventsResponse.events || [];
    }
    async fetchCommunityPinnedNoteIds(options) {
        const events = await this.fetchCommunityPinnedNotesEvents(options);
        const event = events[0];
        let noteIds = [];
        if (event) {
            for (let tag of event.tags) {
                if (tag[0] === 'e') {
                    noteIds.push(tag[1]);
                }
            }
        }
        return noteIds;
    }
    async fetchUserPinnedNotes(options) {
        const { pubKey } = options;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let request = {
            kinds: [10001],
            authors: [decodedPubKey]
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    }
    async fetchUserBookmarks(options) {
        const { pubKey } = options;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let request = {
            kinds: [10003],
            authors: [decodedPubKey]
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    }
    async fetchTrendingCommunities() {
        const pubkeyToCommunityIdsMap = {
            "npub1rjc54ve4sahunm7r0kpchg58eut7ttwvevst7m2fl8dfd9w4y33q0w0qw2": ["Photography"],
            "npub1c6dhrhzkflwr2zkdmlujnujawgp2c9rsep6gscyt6mvcusnt5a3srnzmx3": ["Vegan_Consciousness"]
        };
        const events = this.fetchCommunities({
            pubkeyToCommunityIdsMap
        });
        return events || [];
    }
    async fetchUserEthWalletAccountsInfo(options) {
        const { pubKey, walletHash } = options;
        let request = {
            kinds: [9742]
        };
        if (pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
            request.authors = [decodedPubKey];
        }
        else if (walletHash) {
            request["#d"] = [walletHash];
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    }
    async fetchSubcommunites(options) {
        return [];
    }
    async fetchCommunityDetailMetadata(options) {
        const { communityCreatorId, communityName } = options;
        const decodedCreatorId = communityCreatorId.startsWith('npub1') ? index_1.Nip19.decode(communityCreatorId).data : communityCreatorId;
        let request = {
            kinds: [34550],
            authors: [decodedCreatorId],
            "#d": communityName
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
        return fetchEventsResponse.events;
    }
    async getCommunityUriToMembersMap(communities) {
        const communityUriToMemberIdRoleComboMap = {};
        const communityUriToCreatorOrModeratorIdsMap = {};
        for (let community of communities) {
            const communityUri = community.communityUri;
            communityUriToMemberIdRoleComboMap[communityUri] = [];
            communityUriToMemberIdRoleComboMap[communityUri].push({
                id: community.creatorId,
                role: interfaces_1.CommunityRole.Creator
            });
            communityUriToCreatorOrModeratorIdsMap[communityUri] = new Set();
            communityUriToCreatorOrModeratorIdsMap[communityUri].add(community.creatorId);
            if (community.moderatorIds) {
                for (let moderator of community.moderatorIds) {
                    if (moderator === community.creatorId)
                        continue;
                    communityUriToMemberIdRoleComboMap[communityUri].push({
                        id: moderator,
                        role: interfaces_1.CommunityRole.Moderator
                    });
                    communityUriToCreatorOrModeratorIdsMap[communityUri].add(moderator);
                }
            }
        }
        const generalMembersEvents = await this.fetchCommunitiesGeneralMembers({ communities });
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
        let pubkeys = new Set(utilsManager_1.SocialUtilsManager.flatMap(Object.values(communityUriToMemberIdRoleComboMap), combo => combo.map(c => c.id)));
        const communityUriToMembersMap = {};
        if (pubkeys.size > 0) {
            let metadataArr = [];
            let followersCountMap = {};
            try {
                const events = await this.fetchUserProfileCacheEvents({ pubKeys: Array.from(pubkeys) });
                for (let event of events) {
                    if (event.kind === 0) {
                        metadataArr.push({
                            ...event,
                            content: utilsManager_1.SocialUtilsManager.parseContent(event.content)
                        });
                    }
                    else if (event.kind === 10000108) {
                        followersCountMap = utilsManager_1.SocialUtilsManager.parseContent(event.content);
                    }
                }
            }
            catch (error) {
                console.error('fetchUserProfiles', error);
            }
            if (metadataArr.length == 0)
                return null;
            const userProfiles = [];
            for (let metadata of metadataArr) {
                let userProfile = utilsManager_1.SocialUtilsManager.constructUserProfile(metadata, followersCountMap);
                userProfiles.push(userProfile);
            }
            if (!userProfiles)
                return communityUriToMembersMap;
            for (let community of communities) {
                const memberIds = communityUriToMemberIdRoleComboMap[community.communityUri];
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
                communityUriToMembersMap[community.communityUri] = communityMembers;
            }
        }
        return communityUriToMembersMap;
    }
    async fetchCommunityStalls(options) {
        const { creatorId, communityId } = options;
        const communityUri = utilsManager_1.SocialUtilsManager.getCommunityUri(creatorId, communityId);
        let request = {
            kinds: [30017],
            "#a": [communityUri]
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
        return fetchEventsResponse.events;
    }
    async fetchCommunityProducts(options) {
        const { creatorId, communityId } = options;
        const communityUri = utilsManager_1.SocialUtilsManager.getCommunityUri(creatorId, communityId);
        let request = {
            kinds: [30018],
            "#a": [communityUri]
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
        return fetchEventsResponse.events;
    }
    async fetchPaymentActivities(options) {
        return [];
    }
}
exports.NostrEventManagerRead = NostrEventManagerRead;
