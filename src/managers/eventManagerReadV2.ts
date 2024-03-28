import { Nip19, Event, Keys } from "../core/index";
import { IAllUserRelatedChannels, IChannelInfo, ICommunityBasicInfo, ICommunityInfo, INostrEvent, IPaymentActivity } from "../utils/interfaces";
import { INostrRestAPIManager } from "./communication";
import { SocialUtilsManager } from "./utilsManager";
import { ISocialEventManagerRead, NostrEventManagerRead } from "./eventManagerRead";

class NostrEventManagerReadV2 extends NostrEventManagerRead implements ISocialEventManagerRead {
    protected _nostrCommunicationManager: INostrRestAPIManager;

    constructor(manager: INostrRestAPIManager) {
        super(manager);
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
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-thread-posts', msg);
        return fetchEventsResponse.events;
    }

    async fetchTrendingCacheEvents(pubKey?: string) {
        let msg: any = {
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-trending-posts', msg);
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
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-profile-feed', msg);
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
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-profile-replies', msg);
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
        if (pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
            msg.pubKey = decodedPubKey;
        }
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-home-feed', msg);
        return fetchEventsResponse.events;
    }

    async fetchUserProfileCacheEvents(pubKeys: string[]) {
        const decodedPubKeys = pubKeys.map(pubKey => pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey);
        let msg: any = {
            pubkeys: decodedPubKeys
        };
        console.log('fetchUserProfileCacheEvents', msg);
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-profiles', msg);
        return fetchEventsResponse.events;
    }

    async fetchUserProfileDetailCacheEvents(pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg: any = {
            pubkey: decodedPubKey
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-profile-detail', msg);
        return fetchEventsResponse.events;
    }

    async fetchContactListCacheEvents(pubKey: string, detailIncluded: boolean = true) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg: any = {
            pubkey: decodedPubKey,
            detailIncluded: detailIncluded,
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-contact-list', msg);
        return fetchEventsResponse.events;
    }    

    async fetchUserRelays(pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg: any = {
            pubkey: decodedPubKey
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-relays', msg);
        return fetchEventsResponse.events;
    }

    async fetchFollowersCacheEvents(pubKey: string) {
        const decodedPubKey = pubKey.startsWith('npub1') ? Nip19.decode(pubKey).data : pubKey;
        let msg: any = {
            pubkey: decodedPubKey
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-followers', msg);
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
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-channel-messages', msg);
        return fetchEventsResponse.events;        
    }

    async fetchChannelInfoMessages(channelId: string) {
        const decodedChannelId = channelId.startsWith('npub1') ? Nip19.decode(channelId).data : channelId;
        let msg: any = {
            channelId: decodedChannelId,
            limit: 20
        };
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-channel-info-messages', msg);
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
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-direct-messages-stats', msg);
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
        const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-direct-messages', msg);
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

    async searchUsers(query: string) {
        return [];
    }

    async fetchPaymentRequestEvent(paymentRequest: string) {
        return null;
    }

    async fetchPaymentActivitiesForRecipient(pubkey: string, since: number = 0, until: number = 0) {
        return [];
    }

    async fetchPaymentActivitiesForSender(pubkey: string, since: number = 0, until: number = 0) {
        return [];
    }

    async fetchUserFollowingFeed(pubKey: string, until: number = 0) {
        return [];
    }
}

export {
    NostrEventManagerReadV2
}