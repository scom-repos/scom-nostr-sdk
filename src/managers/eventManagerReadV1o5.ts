import { Nip19, Event, Keys } from "../core/index";
import { IAllUserRelatedChannels, IChannelInfo, ICommunityBasicInfo, ICommunityInfo, IFetchNotesOptions, INostrEvent, IPaymentActivity } from "../utils/interfaces";
import { INostrCommunicationManager, INostrRestAPIManager } from "./communication";
import { SocialUtilsManager } from "./utilsManager";
import { ISocialEventManagerRead, NostrEventManagerRead } from "./eventManagerRead";

class NostrEventManagerReadV1o5 implements ISocialEventManagerRead {
    protected _nostrCommunicationManager: INostrRestAPIManager;
    protected _privateKey: string;

    constructor(manager: INostrRestAPIManager) {
        this._nostrCommunicationManager = manager;
    }

    set nostrCommunicationManager(manager: INostrRestAPIManager) {
        this._nostrCommunicationManager = manager;
    }

    set privateKey(privateKey: string) {
        this._privateKey = privateKey;
    }

    protected augmentWithAuthInfo(obj: Record<string, any>) {
        return SocialUtilsManager.augmentWithAuthInfo(obj, this._privateKey);
    }

    async fetchThreadCacheEvents(id: string, pubKey?: string) {
        let decodedId = id.startsWith('note1') ? Nip19.decode(id).data : id;
        let msg = this.augmentWithAuthInfo({
            eventId: decodedId,
            limit: 100
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-thread-posts', msg);
        return fetchEventsResponse.events || [];
    }

    async fetchTrendingCacheEvents(pubKey?: string) {
        let msg = this.augmentWithAuthInfo({
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-trending-posts', msg);
        return fetchEventsResponse.events || [];
    }
    
    async fetchProfileFeedCacheEvents(userPubkey: string, pubKey: string, since: number = 0, until: number = 0) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
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
            const decodedUserPubKey = userPubkey.startsWith('npub1') ? Nip19.decode(userPubkey).data : userPubkey;
            msg.user_pubkey = decodedUserPubKey;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-profile-feed', msg);
        return fetchEventsResponse.events || [];
    }

    async fetchProfileRepliesCacheEvents(userPubkey: string, pubKey: string, since: number = 0, until: number = 0) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
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
            const decodedUserPubKey = userPubkey.startsWith('npub1') ? Nip19.decode(userPubkey).data : userPubkey;
            msg.user_pubkey = decodedUserPubKey;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-profile-replies', msg);
        return fetchEventsResponse.events || [];
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
        if (pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
            msg.pubKey = decodedPubKey;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-home-feed', msg);
        return fetchEventsResponse.events || [];
    }

    async fetchUserProfileCacheEvents(pubKeys: string[]) {
        const decodedPubKeys = pubKeys.map(pubKey => pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey);
        let msg = this.augmentWithAuthInfo({
            pubkeys: decodedPubKeys
        });
        console.log('fetchUserProfileCacheEvents', msg);
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-profiles', msg);
        return fetchEventsResponse.events || [];
    }

    async fetchUserProfileDetailCacheEvents(pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg = this.augmentWithAuthInfo({
            pubkey: decodedPubKey
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-profile-detail', msg);
        return fetchEventsResponse.events || [];
    }

    async fetchContactListCacheEvents(pubKey: string, detailIncluded: boolean = true) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg = this.augmentWithAuthInfo({
            pubkey: decodedPubKey,
            detailIncluded: detailIncluded,
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-contact-list', msg);
        return fetchEventsResponse.events || [];
    }    

    async fetchUserRelays(pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg = this.augmentWithAuthInfo({
            pubkey: decodedPubKey
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-relays', msg);
        return fetchEventsResponse.events || [];
    }

    async fetchFollowersCacheEvents(pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg = this.augmentWithAuthInfo({
            pubkey: decodedPubKey
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-followers', msg);
        return fetchEventsResponse.events || [];
    }  

    async fetchCommunities(pubkeyToCommunityIdsMap?: Record<string, string[]>) {
        let events;
        if (pubkeyToCommunityIdsMap && Object.keys(pubkeyToCommunityIdsMap).length > 0) {
            let msg = this.augmentWithAuthInfo({
                identifiers: []
            });
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
            let msg = this.augmentWithAuthInfo({
                limit: 50
            });
            let response = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-communities', msg);
            events = response.events;
        }
        return events;
    }

    async fetchAllUserRelatedCommunities(pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg = this.augmentWithAuthInfo({
            pubkey: decodedPubKey
        });
        let response = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-communities', msg);
        return response.events || [];
    }

    async fetchUserBookmarkedCommunities(pubKey: string, excludedCommunity?: ICommunityInfo) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg = this.augmentWithAuthInfo({
            pubkey: decodedPubKey
        });
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

    async fetchCommunitiesMetadataFeed(communities: ICommunityBasicInfo[]) {
        let identifiers: any[] = [];
        for (let community of communities) {
            const decodedCreatorId = community.creatorId.startsWith('npub1') ? Nip19.decode(community.creatorId).data : community.creatorId;
            let identifier: any = {
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
        return fetchEventsResponse.events || [];        
    }

    async fetchCommunityFeed(communityUri: string, since?: number, until?: number) {
        let request: any = {
            kinds: [1],
            "#a": [communityUri],
            limit: 20
        }
        if (since != null) {
            request.since = since;
        }
        if (until != null) {
            request.until = until;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
        return fetchEventsResponse.events;
    }

    async fetchCommunitiesFeed(communityUriArr: string[]) {
        let request: any = {
            kinds: [1],
            "#a": communityUriArr,
            limit: 50
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
        return fetchEventsResponse.events || [];
    }

    async fetchCommunitiesGeneralMembers(communities: ICommunityBasicInfo[]) {  
        let msg = this.augmentWithAuthInfo({
            identifiers: []
        });
        for (let community of communities) {
            const decodedCreatorId = community.creatorId.startsWith('npub1') ? Nip19.decode(community.creatorId).data : community.creatorId;
            let request: any = {
                pubkey: decodedCreatorId,
                names: [community.communityId]
            };
            msg.identifiers.push(request);
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-communities-general-members', msg);
        return fetchEventsResponse.events || [];    
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
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(msg);
        return fetchEventsResponse.events || [];
    }

    async fetchAllUserRelatedChannels(pubKey: string) {
        let msg = this.augmentWithAuthInfo({
            pubKey
        });
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
        let msg = this.augmentWithAuthInfo({
            pubKey
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-bookmarked-channel-event-ids', msg);
        return fetchEventsResponse.data;
    }

    async fetchEventsByIds(ids: string[]) {
        let msg = this.augmentWithAuthInfo({
            ids
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-events', msg);
        return fetchEventsResponse.events || [];
    }

    async fetchChannelMessages(channelId: string, since: number = 0, until: number = 0) {
        const decodedChannelId = channelId.startsWith('npub1') ? Nip19.decode(channelId).data : channelId;
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

    async fetchChannelInfoMessages(channelId: string) {
        const decodedChannelId = channelId.startsWith('npub1') ? Nip19.decode(channelId).data : channelId;
        let msg = this.augmentWithAuthInfo({
            channelId: decodedChannelId,
            limit: 20
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-channel-info-messages', msg);
        return fetchEventsResponse.events || [];         
    }

    async fetchMessageContactsCacheEvents(pubKey: string) {
        const senderToLastReadMap: Record<string, number> = {};
        //FIXME: Implement a better way to get last read messages
        if (localStorage) {
            const lastReadsStr = localStorage.getItem('lastReads');
            if (lastReadsStr) {
                const lastReads = JSON.parse(lastReadsStr);
                for (let sender in lastReads) {
                    const decodedSender = sender.startsWith('npub1') ? Nip19.decode(sender).data as string : sender;
                    senderToLastReadMap[decodedSender] = lastReads[sender];
                }
            }
        }
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        const msg = this.augmentWithAuthInfo({
            receiver: decodedPubKey,
            senderToLastReadMap: senderToLastReadMap
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-direct-messages-stats', msg);
        return fetchEventsResponse.events || [];
    }

    async fetchDirectMessages(pubKey: string, sender: string, since: number = 0, until: number = 0) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        const decodedSenderPubKey = sender.startsWith('npub1') ? Nip19.decode(sender).data : sender;
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

    async resetMessageCount(pubKey: string, sender: string) {
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
        let msg = this.augmentWithAuthInfo({
            identifier
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-application-specific', msg);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    }

    async fetchUserGroupInvitations(groupKinds: number[], pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data as string : pubKey;
        let msg = this.augmentWithAuthInfo({
            pubKey: decodedPubKey,
            groupKinds: groupKinds
        });
        const fetchEventsResponse =  await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-group-invitations', msg);
        let events = fetchEventsResponse.events?.filter(event => event.tags.filter(tag => tag[0] === 'p' && tag?.[3] === 'invitee').map(tag => tag[1]).includes(decodedPubKey));
        return events;
    }

    async fetchCalendarEvents(start: number, end?: number, limit?: number, previousEventId?: string) {
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
        }
    }

    async fetchCalendarEvent(address: Nip19.AddressPointer) {
        const key = `${address.kind}:${address.pubkey}:${address.identifier}`;
        let msg = this.augmentWithAuthInfo({
            key
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-calendar-events', msg);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    } 

    async fetchCalendarEventPosts(calendarEventUri: string) {    
        let msg = this.augmentWithAuthInfo({
            eventUri: calendarEventUri,
            limit: 50
        });
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-calendar-posts', msg);
        return fetchEventsResponse.events || [];
    }

    async fetchCalendarEventRSVPs(calendarEventUri: string, pubkey?: string) {
        let msg = this.augmentWithAuthInfo({
            eventUri: calendarEventUri
        });
        if (pubkey) {
            const decodedPubKey = pubkey.startsWith('npub1') ? Nip19.decode(pubkey).data : pubkey;
            msg.pubkey = decodedPubKey;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-calendar-rsvps', msg);
        return fetchEventsResponse.events || [];
    }

    async fetchLongFormContentEvents(pubKey?: string, since: number = 0, until: number = 0) {
        let msg = this.augmentWithAuthInfo({
            limit: 20
        });
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
        return fetchEventsResponse.events || [];
    }

    async searchUsers(query: string) {
        const req: any = {
            query: query,
            limit: 10
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('user_search', req);
        return fetchEventsResponse.events || [];
    }

    async fetchPaymentRequestEvent(paymentRequest: string) {
        let hash = Event.getPaymentRequestHash(paymentRequest);
        let req: any = {
            kinds: [9739],
            "#r": [hash]
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    }
    
    async fetchPaymentReceiptEvent(requestEventId: string) {
        let req: any = {
            kinds: [9740],
            "#e": [requestEventId]
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    }
    
    private getPaymentHash(tags: string[][]) {
        let tagsMap: Record<string, string[]> = {};
        for (let _t of tags) {
            tagsMap[_t[0]] = _t.slice(1);
        }
        return tagsMap['bolt11']?.[0] || tagsMap['payreq']?.[0] || tagsMap['r']?.[0];
    }

    async fetchPaymentActivitiesForRecipient(pubkey: string, since: number = 0, until: number = 0) {
        let paymentRequestEventsReq: any = {
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
        let paymentReceiptEventsReq: any = {
            kinds: [9740],
            "#e": requestEventIds
        };
        const paymentReceiptEvents = await this._nostrCommunicationManager.fetchEvents(paymentReceiptEventsReq);
        let paymentActivity: IPaymentActivity[] = [];
        for (let requestEvent of paymentRequestEvents.events) {
            const paymentHash = this.getPaymentHash(requestEvent.tags);
            const amount = requestEvent.tags.find(tag => tag[0] === 'amount')?.[1];
            const receiptEvent = paymentReceiptEvents.events.find(event => event.tags.find(tag => tag[0] === 'e')?.[1] === requestEvent.id);
            let status = 'pending';
            let sender: string;
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

    async fetchPaymentActivitiesForSender(pubkey: string, since: number = 0, until: number = 0) {
        let paymentReceiptEventsReq: any = {
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
        let requestEventIds: string[] = [];
        for (let event of paymentReceiptEvents.events) {
            const requestEventId = event.tags.find(tag => tag[0] === 'e')?.[1];
            if (requestEventId) {
                requestEventIds.push(requestEventId);
            }
        }
        let paymentRequestEventsReq: any = {
            kinds: [9739],
            ids: requestEventIds
        };
        const paymentRequestEvents = await this._nostrCommunicationManager.fetchEvents(paymentRequestEventsReq);
        let paymentActivity: IPaymentActivity[] = [];
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

    async fetchUserFollowingFeed(pubKey: string, until: number = 0) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg: any = {
            user_pubkey: decodedPubKey,
            timeframe: 'latest',
            scope: 'follows',
            limit: 20
        };
        if (until > 0) {
            msg.until = until;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('explore', msg);
        return fetchEventsResponse.events || [];
    }

    async fetchCommunityPinnedNotes(creatorId: string, communityId: string) {
        const communityUri = SocialUtilsManager.getCommunityUri(creatorId, communityId);
        let request: any = {
            kinds: [9741],
            "#a": [communityUri]
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    }
    
    async fetchUserPinnedNotes(pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let request: any = {
            kinds: [10001],
            authors: [decodedPubKey]
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
    }
}

export {
    NostrEventManagerReadV1o5
}