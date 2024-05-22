"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NostrEventManagerReadV2 = void 0;
const index_1 = require("../core/index");
const utilsManager_1 = require("./utilsManager");
const eventManagerRead_1 = require("./eventManagerRead");
class NostrEventManagerReadV2 extends eventManagerRead_1.NostrEventManagerRead {
    constructor(manager) {
        super(manager);
    }
    set nostrCommunicationManager(manager) {
        this._nostrCommunicationManager = manager;
    }
    augmentWithAuthInfo(obj) {
        return utilsManager_1.SocialUtilsManager.augmentWithAuthInfo(obj, this._privateKey);
    }
    async fetchThreadCacheEvents(id, pubKey) {
        let decodedId = id.startsWith('note1') ? index_1.Nip19.decode(id).data : id;
        let msg = this.augmentWithAuthInfo({
            eventId: decodedId,
            limit: 100
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-thread-posts', msg);
        return fetchEventsResponse.events;
    }
    async fetchTrendingCacheEvents(pubKey) {
        let msg = this.augmentWithAuthInfo({});
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-trending-posts', msg);
        return fetchEventsResponse.events;
    }
    async fetchProfileFeedCacheEvents(userPubkey, pubKey, since = 0, until = 0) {
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
        return fetchEventsResponse.events;
    }
    async fetchProfileRepliesCacheEvents(userPubkey, pubKey, since = 0, until = 0) {
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
        return fetchEventsResponse.events;
    }
    async fetchHomeFeedCacheEvents(pubKey, since = 0, until = 0) {
        let msg = this.augmentWithAuthInfo({
            limit: 20
        });
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
        return fetchEventsResponse.events;
    }
    async fetchUserProfileCacheEvents(pubKeys) {
        const decodedPubKeys = pubKeys.map(pubKey => pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey);
        let msg = this.augmentWithAuthInfo({
            pubkeys: decodedPubKeys
        });
        console.log('fetchUserProfileCacheEvents', msg);
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-profiles', msg);
        return fetchEventsResponse.events;
    }
    async fetchUserProfileDetailCacheEvents(pubKey) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = this.augmentWithAuthInfo({
            pubkey: decodedPubKey
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-profile-detail', msg);
        return fetchEventsResponse.events;
    }
    async fetchContactListCacheEvents(pubKey, detailIncluded = true) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = this.augmentWithAuthInfo({
            pubkey: decodedPubKey,
            detailIncluded: detailIncluded,
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-contact-list', msg);
        return fetchEventsResponse.events;
    }
    async fetchUserRelays(pubKey) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = this.augmentWithAuthInfo({
            pubkey: decodedPubKey
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-relays', msg);
        return fetchEventsResponse.events;
    }
    async fetchFollowersCacheEvents(pubKey) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = this.augmentWithAuthInfo({
            pubkey: decodedPubKey
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-followers', msg);
        return fetchEventsResponse.events;
    }
    async fetchCommunities(pubkeyToCommunityIdsMap) {
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
                limit: 50
            });
            let response = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-communities', msg);
            events = response.events;
        }
        return events;
    }
    async fetchAllUserRelatedCommunities(pubKey) {
        let msg = this.augmentWithAuthInfo({
            pubKey
        });
        let response = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-communities', msg);
        return response.events;
    }
    async fetchUserBookmarkedCommunities(pubKey, excludedCommunity) {
        let msg = this.augmentWithAuthInfo({
            pubKey
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
    async fetchCommunity(creatorId, communityId) {
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
        return fetchEventsResponse.events;
    }
    async fetchCommunitiesMetadataFeed(communities) {
        let identifiers = [];
        for (let community of communities) {
            const decodedCreatorId = community.creatorId.startsWith('npub1') ? index_1.Nip19.decode(community.creatorId).data : community.creatorId;
            let identifier = {
                pubkey: decodedCreatorId,
                names: [community.communityId]
            };
            identifiers.push(identifier);
        }
        let msg = this.augmentWithAuthInfo({
            identifiers,
            limit: 50
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-community-feed', msg);
        return fetchEventsResponse.events;
    }
    async fetchCommunitiesGeneralMembers(communities) {
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
        return fetchEventsResponse.events;
    }
    async fetchAllUserRelatedChannels(pubKey) {
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
        let msg = this.augmentWithAuthInfo({
            pubKey
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-bookmarked-channel-event-ids', msg);
        return fetchEventsResponse.data;
    }
    async fetchEventsByIds(ids) {
        let msg = this.augmentWithAuthInfo({
            ids
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-events', msg);
        return fetchEventsResponse.events;
    }
    async fetchChannelMessages(channelId, since = 0, until = 0) {
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
        return fetchEventsResponse.events;
    }
    async fetchChannelInfoMessages(channelId) {
        const decodedChannelId = channelId.startsWith('npub1') ? index_1.Nip19.decode(channelId).data : channelId;
        let msg = this.augmentWithAuthInfo({
            channelId: decodedChannelId,
            limit: 20
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-channel-info-messages', msg);
        return fetchEventsResponse.events;
    }
    async fetchMessageContactsCacheEvents(pubKey) {
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
        return fetchEventsResponse.events;
    }
    async fetchDirectMessages(pubKey, sender, since = 0, until = 0) {
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
        return fetchEventsResponse.events;
    }
    async resetMessageCount(pubKey, sender) {
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
    async fetchGroupKeys(identifier) {
        let msg = this.augmentWithAuthInfo({
            identifier
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-application-specific', msg);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    }
    async fetchUserGroupInvitations(groupKinds, pubKey) {
        const decodedPubKey = pubKey.startsWith('npub1') ? index_1.Nip19.decode(pubKey).data : pubKey;
        let msg = this.augmentWithAuthInfo({
            pubKey: decodedPubKey,
            groupKinds: groupKinds
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-group-invitations', msg);
        let events = fetchEventsResponse.events?.filter(event => event.tags.filter(tag => tag[0] === 'p' && tag?.[3] === 'invitee').map(tag => tag[1]).includes(decodedPubKey));
        return events;
    }
    async fetchCalendarEvents(start, end, limit) {
        let msg = this.augmentWithAuthInfo({
            start: start,
            end: end,
            limit: limit || 10
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-calendar-events', msg);
        return fetchEventsResponse.events;
    }
    async fetchCalendarEvent(address) {
        const key = `${address.kind}:${address.pubkey}:${address.identifier}`;
        let msg = this.augmentWithAuthInfo({
            key
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-calendar-events', msg);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    }
    async fetchCalendarEventPosts(calendarEventUri) {
        let msg = this.augmentWithAuthInfo({
            eventUri: calendarEventUri,
            limit: 50
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-calendar-posts', msg);
        return fetchEventsResponse.events;
    }
    async fetchCalendarEventRSVPs(calendarEventUri, pubkey) {
        let msg = this.augmentWithAuthInfo({
            eventUri: calendarEventUri
        });
        if (pubkey) {
            const decodedPubKey = pubkey.startsWith('npub1') ? index_1.Nip19.decode(pubkey).data : pubkey;
            msg.pubkey = decodedPubKey;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-calendar-rsvps', msg);
        return fetchEventsResponse.events;
    }
    async fetchLongFormContentEvents(pubKey, since = 0, until = 0) {
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
        return fetchEventsResponse.events;
    }
    async searchUsers(query) {
        return [];
    }
    async fetchPaymentRequestEvent(paymentRequest) {
        return null;
    }
    async fetchPaymentActivitiesForRecipient(pubkey, since = 0, until = 0) {
        return [];
    }
    async fetchPaymentActivitiesForSender(pubkey, since = 0, until = 0) {
        return [];
    }
    async fetchUserFollowingFeed(pubKey, until = 0) {
        return [];
    }
}
exports.NostrEventManagerReadV2 = NostrEventManagerReadV2;
