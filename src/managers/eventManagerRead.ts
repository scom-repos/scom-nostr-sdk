import { Nip19, Event, Keys } from "../core/index";
import { IAllUserRelatedChannels, IChannelInfo, ICommunityBasicInfo, ICommunityInfo, INostrEvent, IPaymentActivity } from "../utils/interfaces";
import { INostrCommunicationManager, INostrRestAPIManager } from "./communication";
import { SocialUtilsManager } from "./utilsManager";

interface ISocialEventManagerRead {
    nostrCommunicationManager: INostrCommunicationManager | INostrRestAPIManager;
    fetchThreadCacheEvents(id: string, pubKey?: string): Promise<INostrEvent[]>;
    fetchTrendingCacheEvents(pubKey?: string): Promise<INostrEvent[]>;
    fetchProfileFeedCacheEvents(pubKey: string, since?: number, until?: number): Promise<INostrEvent[]>;
    fetchProfileRepliesCacheEvents(pubKey: string, since?: number, until?: number): Promise<INostrEvent[]>;
    fetchHomeFeedCacheEvents(pubKey?: string, since?: number, until?: number): Promise<INostrEvent[]>;
    fetchUserProfileCacheEvents(pubKeys: string[]): Promise<INostrEvent[]>;
    fetchUserProfileDetailCacheEvents(pubKey: string): Promise<INostrEvent[]>;
    fetchContactListCacheEvents(pubKey: string, detailIncluded?: boolean): Promise<INostrEvent[]>;
    fetchUserRelays(pubKey: string): Promise<INostrEvent[]>;
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
    fetchPaymentRequestEvent(paymentRequest: string): Promise<INostrEvent>;
    fetchPaymentActivitiesForRecipient(pubkey: string, since?: number, until?: number): Promise<IPaymentActivity[]>;
    fetchPaymentActivitiesForSender(pubKey: string, since?: number, until?: number): Promise<IPaymentActivity[]>;
    fetchUserFollowingFeed(pubKey: string, until?: number): Promise<INostrEvent[]>;
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

    set nostrCommunicationManager(manager: INostrCommunicationManager) {
        this._nostrCommunicationManager = manager;
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

    async fetchUserRelays(pubKey) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg: any = {
            pubkey: decodedPubKey
        };
        const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('get_user_relays', msg);
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

    async fetchPaymentRequestEvent(paymentRequest: string) {
        let req: any = {
            kinds: [9739],
            "#r": [paymentRequest]
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
        return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
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
            const paymentHash = requestEvent.tags.find(tag => tag[0] === 'r')?.[1];
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
                const paymentHash = requestEvent.tags.find(tag => tag[0] === 'r')?.[1];
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
        const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('explore', msg);
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

    set nostrCommunicationManager(manager: INostrRestAPIManager) {
        this._nostrCommunicationManager = manager;
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

export {
    NostrEventManagerRead,
    NostrEventManagerReadV2,
    ISocialEventManagerRead
}