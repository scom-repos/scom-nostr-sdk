"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NostrEventManagerRead = void 0;
const index_1 = require("../core/index");
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
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('thread_view', msg);
        return fetchEventsResponse.events;
    }
    async fetchTrendingCacheEvents(pubKey) {
        let msg = {};
        if (pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
            msg.user_pubkey = decodedPubKey;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('explore_global_trending_24h', msg);
        return fetchEventsResponse.events;
    }
    async fetchProfileFeedCacheEvents(userPubkey, pubKey, since = 0, until = 0) {
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
    async fetchProfileRepliesCacheEvents(userPubkey, pubKey, since = 0, until = 0) {
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
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('feed', msg);
        return fetchEventsResponse.events;
    }
    async fetchUserProfileCacheEvents(pubKeys) {
        const decodedPubKeys = pubKeys.map(pubKey => pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey);
        let msg = {
            pubkeys: decodedPubKeys
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('user_infos', msg);
        return fetchEventsResponse.events;
    }
    async fetchUserProfileDetailCacheEvents(pubKey) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = {
            pubkey: decodedPubKey,
            user_pubkey: decodedPubKey
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('user_profile', msg);
        return fetchEventsResponse.events;
    }
    async fetchContactListCacheEvents(pubKey, detailIncluded = true) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = {
            extended_response: detailIncluded,
            pubkey: decodedPubKey
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('contact_list', msg);
        return fetchEventsResponse.events;
    }
    async fetchUserRelays(pubKey) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = {
            pubkey: decodedPubKey
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('get_user_relays', msg);
        return fetchEventsResponse.events;
    }
    async fetchFollowersCacheEvents(pubKey) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = {
            pubkey: decodedPubKey
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('user_followers', msg);
        return fetchEventsResponse.events;
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
    async fetchAllUserRelatedCommunities(pubKey) {
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
            const bookmarkedCommunitiesEvents = await this.fetchCommunities(pubkeyToCommunityIdsMap);
            for (let event of bookmarkedCommunitiesEvents) {
                communitiesEvents.push(event);
            }
        }
        return communitiesEvents;
    }
    async fetchUserBookmarkedCommunities(pubKey, excludedCommunity) {
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
    async fetchCommunity(creatorId, communityId) {
        const decodedCreatorId = creatorId.startsWith('npub1') ? index_1.Nip19.decode(creatorId).data : creatorId;
        let infoMsg = {
            kinds: [34550],
            authors: [decodedCreatorId],
            "#d": [communityId]
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(infoMsg);
        return fetchEventsResponse.events;
    }
    async fetchCommunitiesMetadataFeed(communities) {
        let requests = [];
        for (let community of communities) {
            const decodedCreatorId = community.creatorId.startsWith('npub1') ? index_1.Nip19.decode(community.creatorId).data : community.creatorId;
            const communityUri = utilsManager_1.SocialUtilsManager.getCommunityUri(community.creatorId, community.communityId);
            let infoMsg = {
                kinds: [34550],
                authors: [decodedCreatorId],
                "#d": [community.communityId]
            };
            let notesMsg = {
                kinds: [1],
                "#a": [communityUri],
                limit: 50
            };
            requests.push(infoMsg);
            requests.push(notesMsg);
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(...requests);
        return fetchEventsResponse.events;
    }
    async fetchCommunitiesFeed(communityUriArr) {
        let request = {
            kinds: [1],
            "#a": communityUriArr,
            limit: 50
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
        return fetchEventsResponse.events;
    }
    async fetchCommunitiesGeneralMembers(communities) {
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
    async fetchNotes(options) {
        const decodedNpubs = options.authors?.map(npub => index_1.Nip19.decode(npub).data);
        let decodedIds = options.ids?.map(id => id.startsWith('note1') ? index_1.Nip19.decode(id).data : id);
        let msg = {
            kinds: [1],
            limit: 20
        };
        if (decodedNpubs)
            msg.authors = decodedNpubs;
        if (decodedIds)
            msg.ids = decodedIds;
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(msg);
        return fetchEventsResponse.events;
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
            const bookmarkedChannelEvents = await this.fetchEventsByIds(bookmarkedChannelEventIds);
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
    async fetchUserBookmarkedChannelEventIds(pubKey) {
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
    async fetchEventsByIds(ids) {
        let request = {
            ids: ids
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
        return fetchEventsResponse.events;
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
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(messagesReq);
        return fetchEventsResponse.events;
    }
    async fetchChannelInfoMessages(channelId) {
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
    async fetchMessageContactsCacheEvents(pubKey) {
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
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('get_directmsgs', req);
        return fetchEventsResponse.events;
    }
    async resetMessageCount(pubKey, sender) {
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
    async fetchGroupKeys(identifier) {
        let req = {
            kinds: [30078],
            "#d": [identifier]
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    }
    async fetchUserGroupInvitations(groupKinds, pubKey) {
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
    async fetchCalendarEvents(start, end, limit) {
        let req = {
            kinds: [31922, 31923],
            limit: limit || 10
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
        return fetchEventsResponse.events;
    }
    async fetchCalendarEvent(address) {
        let req = {
            kinds: [address.kind],
            "#d": [address.identifier],
            authors: [address.pubkey]
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    }
    async fetchCalendarEventPosts(calendarEventUri) {
        let request = {
            kinds: [1],
            "#a": [calendarEventUri],
            limit: 50
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
        return fetchEventsResponse.events;
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
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
        return fetchEventsResponse.events;
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
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
        return fetchEventsResponse.events;
    }
    async searchUsers(query) {
        const req = {
            query: query,
            limit: 10
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('user_search', req);
        return fetchEventsResponse.events;
    }
    async fetchPaymentRequestEvent(paymentRequest) {
        let hash = index_1.Event.getPaymentRequestHash(paymentRequest);
        let req = {
            kinds: [9739],
            "#r": [hash]
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    }
    async fetchPaymentReceiptEvent(requestEventId) {
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
    async fetchPaymentActivitiesForRecipient(pubkey, since = 0, until = 0) {
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
    async fetchPaymentActivitiesForSender(pubkey, since = 0, until = 0) {
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
    async fetchUserFollowingFeed(pubKey, until = 0) {
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
    async fetchCommunityPinnedNotes(creatorId, communityId) {
        const communityUri = utilsManager_1.SocialUtilsManager.getCommunityUri(creatorId, communityId);
        let request = {
            kinds: [9741],
            "#a": [communityUri]
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    }
}
exports.NostrEventManagerRead = NostrEventManagerRead;
