"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NostrEventManagerReadV1o5 = void 0;
const index_1 = require("../core/index");
const utilsManager_1 = require("./utilsManager");
class NostrEventManagerReadV1o5 {
    constructor(manager) {
        this._nostrCommunicationManager = manager;
    }
    set nostrCommunicationManager(manager) {
        this._nostrCommunicationManager = manager;
    }
    set privateKey(privateKey) {
        this._privateKey = privateKey;
    }
    augmentWithAuthInfo(obj) {
        return utilsManager_1.SocialUtilsManager.augmentWithAuthInfo(obj, this._privateKey);
    }
    async fetchThreadCacheEvents(options) {
        const { id } = options;
        let decodedId = id.startsWith('note1') ? index_1.Nip19.decode(id).data : id;
        let msg = this.augmentWithAuthInfo({
            eventId: decodedId,
            limit: 100
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-thread-posts', msg);
        return fetchEventsResponse.events || [];
    }
    async fetchTrendingCacheEvents(options) {
        let msg = this.augmentWithAuthInfo({});
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-trending-posts', msg);
        return fetchEventsResponse.events || [];
    }
    async fetchProfileFeedCacheEvents(options) {
        let { pubKey, since, until, userPubkey } = options;
        if (!since)
            since = 0;
        if (!until)
            until = 0;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = this.augmentWithAuthInfo({
            limit: 20,
            pubkey: decodedPubKey
        });
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
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-profile-feed', msg);
        return fetchEventsResponse.events || [];
    }
    async fetchProfileRepliesCacheEvents(options) {
        let { pubKey, since, until, userPubkey } = options;
        if (!since)
            since = 0;
        if (!until)
            until = 0;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = this.augmentWithAuthInfo({
            limit: 20,
            pubkey: decodedPubKey
        });
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
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-profile-replies', msg);
        return fetchEventsResponse.events || [];
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
        if (pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
            msg.pubKey = decodedPubKey;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-home-feed', msg);
        return fetchEventsResponse.events || [];
    }
    async fetchUserProfileCacheEvents(options) {
        let { pubKeys } = options;
        const decodedPubKeys = pubKeys.map(pubKey => pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey);
        let msg = this.augmentWithAuthInfo({
            pubkeys: decodedPubKeys
        });
        console.log('fetchUserProfileCacheEvents', msg);
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-profiles', msg);
        return fetchEventsResponse.events || [];
    }
    async fetchUserProfileDetailCacheEvents(options) {
        let { pubKey } = options;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = this.augmentWithAuthInfo({
            pubkey: decodedPubKey
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-profile-detail', msg);
        return fetchEventsResponse.events || [];
    }
    async fetchContactListCacheEvents(options) {
        let { pubKey, detailIncluded } = options;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = this.augmentWithAuthInfo({
            pubkey: decodedPubKey,
            detailIncluded: detailIncluded,
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-contact-list', msg);
        return fetchEventsResponse.events || [];
    }
    async fetchUserRelays(options) {
        const { pubKey } = options;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = this.augmentWithAuthInfo({
            pubkey: decodedPubKey
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-relays', msg);
        return fetchEventsResponse.events || [];
    }
    async fetchFollowersCacheEvents(options) {
        const { pubKey } = options;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = this.augmentWithAuthInfo({
            pubkey: decodedPubKey
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-followers', msg);
        return fetchEventsResponse.events || [];
    }
    async fetchCommunities(options) {
        const { pubkeyToCommunityIdsMap, query } = options;
        let events;
        if (pubkeyToCommunityIdsMap && Object.keys(pubkeyToCommunityIdsMap).length > 0) {
            let msg = this.augmentWithAuthInfo({
                identifiers: []
            });
            for (let pubkey in pubkeyToCommunityIdsMap) {
                const decodedPubKey = pubkey.startsWith('npub1') ? index_1.Nip19.decode(pubkey).data : pubkey;
                const communityIds = pubkeyToCommunityIdsMap[pubkey];
                let request = {
                    pubkey: decodedPubKey,
                    names: communityIds
                };
                msg.identifiers.push(request);
            }
            let response = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-communities', msg);
            events = response.events;
        }
        else {
            let msg = this.augmentWithAuthInfo({
                limit: 50,
                query
            });
            let response = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-communities', msg);
            events = response.events;
        }
        return events;
    }
    async fetchAllUserRelatedCommunities(options) {
        const { pubKey } = options;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = this.augmentWithAuthInfo({
            pubkey: decodedPubKey
        });
        let response = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-communities', msg);
        return response.events || [];
    }
    async fetchAllUserRelatedCommunitiesFeed(options) {
        const { pubKey, since, until } = options;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = this.augmentWithAuthInfo({
            pubkey: decodedPubKey,
            since,
            until,
            limit: 20
        });
        let response = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-communities-feed', msg);
        return response.events || [];
    }
    async fetchUserBookmarkedCommunities(options) {
        const { pubKey, excludedCommunity } = options;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = this.augmentWithAuthInfo({
            pubkey: decodedPubKey
        });
        let response = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-bookmarked-communities', msg);
        let communities = [];
        for (let community of response.data) {
            if (excludedCommunity) {
                const decodedPubkey = index_1.Nip19.decode(excludedCommunity.creatorId).data;
                if (community.communityId === excludedCommunity.communityId && community.creatorId === decodedPubkey)
                    continue;
            }
            communities.push(community);
        }
        return communities;
    }
    async fetchCommunity(options) {
        const { communityId, creatorId } = options;
        const decodedCreatorId = creatorId.startsWith('npub1') ? index_1.Nip19.decode(creatorId).data : creatorId;
        let msg = this.augmentWithAuthInfo({
            identifiers: [
                {
                    pubkey: decodedCreatorId,
                    names: [communityId]
                }
            ]
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-communities', msg);
        return fetchEventsResponse.events || [];
    }
    async fetchCommunitiesMetadataFeed(options) {
        const { communities, since, until, noteCountsIncluded } = options;
        let identifiers = [];
        if (communities) {
            for (let community of communities) {
                const decodedCreatorId = community.creatorId.startsWith('npub1') ? index_1.Nip19.decode(community.creatorId).data : community.creatorId;
                let identifier = {
                    pubkey: decodedCreatorId,
                    names: [community.communityId]
                };
                identifiers.push(identifier);
            }
        }
        let msg = this.augmentWithAuthInfo({
            identifiers,
            limit: 20,
            since,
            until,
            noteCountsIncluded
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-communities-metadata-feed', msg);
        return fetchEventsResponse.events || [];
    }
    async fetchCommunityMetadataFeed(options) {
        const { communityCreatorId, communityName, since, until, statsIncluded } = options;
        const communityPubkey = communityCreatorId.startsWith('npub1') ? index_1.Nip19.decode(communityCreatorId).data : communityCreatorId;
        let msg = this.augmentWithAuthInfo({
            communityPubkey,
            communityName,
            limit: 20,
            since,
            until,
            statsIncluded
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-community-metadata-feed', msg);
        return fetchEventsResponse.events || [];
    }
    async fetchCommunityFeed(options) {
        const { communityUri, since, until } = options;
        const { creatorId, communityId } = utilsManager_1.SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
        let identifier = {
            pubkey: creatorId,
            names: [communityId]
        };
        let msg = this.augmentWithAuthInfo({
            identifiers: [identifier],
            limit: 50,
            since,
            until
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-community-feed', msg);
        return fetchEventsResponse.events || [];
    }
    async fetchCommunitiesGeneralMembers(options) {
        const { communities } = options;
        let msg = this.augmentWithAuthInfo({
            identifiers: []
        });
        for (let community of communities) {
            const decodedCreatorId = community.creatorId.startsWith('npub1') ? index_1.Nip19.decode(community.creatorId).data : community.creatorId;
            let request = {
                pubkey: decodedCreatorId,
                names: [community.communityId]
            };
            msg.identifiers.push(request);
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-communities-general-members', msg);
        return fetchEventsResponse.events || [];
    }
    async fetchAllUserRelatedChannels(options) {
        const { pubKey } = options;
        let msg = this.augmentWithAuthInfo({
            pubKey
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-related-channels', msg);
        let channels = [];
        const channelMetadataMap = {};
        for (let event of fetchEventsResponse.events) {
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
        const communityEvents = await this.fetchCommunities({ pubkeyToCommunityIdsMap });
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
        let msg = this.augmentWithAuthInfo({
            pubKey
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-bookmarked-channel-event-ids', msg);
        return fetchEventsResponse.data;
    }
    async fetchEventsByIds(options) {
        const { ids } = options;
        let msg = this.augmentWithAuthInfo({
            ids
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-events', msg);
        return fetchEventsResponse.events || [];
    }
    async fetchChannelMessages(options) {
        let { channelId, since, until } = options;
        if (!since)
            since = 0;
        if (!until)
            until = 0;
        const decodedChannelId = channelId.startsWith('npub1') ? index_1.Nip19.decode(channelId).data : channelId;
        let msg = this.augmentWithAuthInfo({
            channelId: decodedChannelId,
            limit: 20
        });
        if (until === 0) {
            msg.since = since;
        }
        else {
            msg.until = until;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-channel-messages', msg);
        return fetchEventsResponse.events || [];
    }
    async fetchChannelInfoMessages(options) {
        const { channelId } = options;
        const decodedChannelId = channelId.startsWith('npub1') ? index_1.Nip19.decode(channelId).data : channelId;
        let msg = this.augmentWithAuthInfo({
            channelId: decodedChannelId,
            limit: 20
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-channel-info-messages', msg);
        return fetchEventsResponse.events || [];
    }
    async fetchMessageContactsCacheEvents(options) {
        const { pubKey } = options;
        const senderToLastReadMap = {};
        if (localStorage) {
            const lastReadsStr = localStorage.getItem('lastReads');
            if (lastReadsStr) {
                const lastReads = JSON.parse(lastReadsStr);
                for (let sender in lastReads) {
                    const decodedSender = sender.startsWith('npub1') ? index_1.Nip19.decode(sender).data : sender;
                    senderToLastReadMap[decodedSender] = lastReads[sender];
                }
            }
        }
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        const msg = this.augmentWithAuthInfo({
            receiver: decodedPubKey,
            senderToLastReadMap: senderToLastReadMap
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-direct-messages-stats', msg);
        return fetchEventsResponse.events || [];
    }
    async fetchDirectMessages(options) {
        let { pubKey, since, until, sender } = options;
        if (!since)
            since = 0;
        if (!until)
            until = 0;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        const decodedSenderPubKey = sender.startsWith('npub1') ? index_1.Nip19.decode(sender).data : sender;
        const msg = this.augmentWithAuthInfo({
            receiver: decodedPubKey,
            sender: decodedSenderPubKey,
            limit: 20
        });
        if (until === 0) {
            msg.since = since;
        }
        else {
            msg.until = until;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-direct-messages', msg);
        return fetchEventsResponse.events || [];
    }
    async resetMessageCount(options) {
        const { sender } = options;
        if (localStorage) {
            const lastReadsStr = localStorage.getItem('lastReads');
            let lastReads = {};
            if (lastReadsStr) {
                lastReads = JSON.parse(lastReadsStr);
            }
            lastReads[sender] = Math.ceil(Date.now() / 1000);
            localStorage.setItem('lastReads', JSON.stringify(lastReads));
        }
    }
    async fetchGroupKeys(options) {
        const { identifiers } = options;
        let msg = this.augmentWithAuthInfo({
            identifiers
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-application-specific', msg);
        return fetchEventsResponse.events || [];
    }
    async fetchUserGroupInvitations(options) {
        const { pubKey, groupKinds } = options;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = this.augmentWithAuthInfo({
            pubKey: decodedPubKey,
            groupKinds: groupKinds
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-group-invitations', msg);
        let events = fetchEventsResponse.events?.filter(event => event.tags.filter(tag => tag[0] === 'p' && tag?.[3] === 'invitee').map(tag => tag[1]).includes(decodedPubKey));
        return events;
    }
    async fetchCalendarEvents(options) {
        const { start, end, limit, previousEventId } = options;
        let msg = this.augmentWithAuthInfo({
            start: start,
            end: end,
            limit: limit || 10,
            previousEventId
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-calendar-events', msg);
        return {
            events: fetchEventsResponse.events || [],
            data: fetchEventsResponse.data
        };
    }
    async fetchCalendarEvent(options) {
        const { address } = options;
        const key = `${address.kind}:${address.pubkey}:${address.identifier}`;
        let msg = this.augmentWithAuthInfo({
            key
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-calendar-events', msg);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    }
    async fetchCalendarEventPosts(options) {
        const { calendarEventUri } = options;
        let msg = this.augmentWithAuthInfo({
            eventUri: calendarEventUri,
            limit: 50
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-calendar-posts', msg);
        return fetchEventsResponse.events || [];
    }
    async fetchCalendarEventRSVPs(options) {
        const { calendarEventUri, pubkey } = options;
        let msg = this.augmentWithAuthInfo({
            eventUri: calendarEventUri
        });
        if (pubkey) {
            const decodedPubKey = pubkey.startsWith('npub1') ? index_1.Nip19.decode(pubkey).data : pubkey;
            msg.pubkey = decodedPubKey;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-calendar-rsvps', msg);
        return fetchEventsResponse.events || [];
    }
    async fetchLongFormContentEvents(options) {
        let { pubKey, since, until } = options;
        if (!since)
            since = 0;
        if (!until)
            until = 0;
        let msg = this.augmentWithAuthInfo({
            limit: 20
        });
        if (pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
            msg.pubKey = decodedPubKey;
        }
        if (until === 0) {
            msg.since = since;
        }
        else {
            msg.until = until;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-long-form-content', msg);
        return fetchEventsResponse.events || [];
    }
    async searchUsers(options) {
        const { query } = options;
        const req = {
            query: query,
            limit: 10
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('user_search', req);
        return fetchEventsResponse.events || [];
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
        let msg = this.augmentWithAuthInfo({
            pubkey: decodedPubKey,
            limit: 20
        });
        if (until > 0) {
            msg.until = until;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-following-feed', msg);
        return fetchEventsResponse.events || [];
    }
    async fetchCommunityPinnedNotesEvent(options) {
        const { communityId, creatorId } = options;
        const communityPubkey = creatorId.startsWith('npub1') ? index_1.Nip19.decode(creatorId).data : creatorId;
        let msg = this.augmentWithAuthInfo({
            communityPubkey,
            communityName: communityId,
            eventMetadataIncluded: true
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-community-pinned-notes', msg);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    }
    async fetchCommunityPinnedNoteIds(options) {
        const { communityId, creatorId } = options;
        const communityPubkey = creatorId.startsWith('npub1') ? index_1.Nip19.decode(creatorId).data : creatorId;
        let msg = this.augmentWithAuthInfo({
            communityPubkey,
            communityName: communityId,
            eventMetadataIncluded: false
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-community-pinned-notes', msg);
        return fetchEventsResponse.data?.ids || [];
    }
    async fetchUserPinnedNotes(options) {
        const { pubKey } = options;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = this.augmentWithAuthInfo({
            pubkey: decodedPubKey
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-pinned-notes', msg);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    }
    async fetchUserBookmarks(options) {
        const { pubKey } = options;
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = this.augmentWithAuthInfo({
            pubkey: decodedPubKey
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-bookmarks', msg);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    }
    async fetchTrendingCommunities() {
        let msg = this.augmentWithAuthInfo({});
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-trending-communities', msg);
        return fetchEventsResponse.events || [];
    }
    async fetchUserEthWalletAccountsInfo(options) {
        const { pubKey, walletHash } = options;
        let msg = this.augmentWithAuthInfo({});
        if (pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
            msg.pubkey = decodedPubKey;
        }
        else if (walletHash) {
            msg.walletHash = walletHash;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-eth-wallet-info', msg);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    }
}
exports.NostrEventManagerReadV1o5 = NostrEventManagerReadV1o5;
