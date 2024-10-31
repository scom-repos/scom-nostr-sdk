import { Nip19, Event, Keys } from "../core/index";
import { ICheckIfUserHasAccessToCommunityOptions, ICommunity, ICommunityDetailMetadata, ICommunityInfo, ICommunityPostScpData, ICommunityStats, ICommunitySubscription, IConversationPath, IDecryptPostPrivateKeyForCommunityOptions, IEthWalletAccountsInfo, ILongFormContentInfo, INewCommunityInfo, INewCommunityPostInfo, INostrEvent, INostrMetadata, INostrMetadataContent, INoteActions, INoteCommunity, INoteCommunityInfo, INoteInfo, INoteInfoExtended, IPostStats, IRelayConfig, IRetrieveCommunityPostKeysByNoteEventsOptions, IRetrieveCommunityPostKeysOptions, IRetrieveCommunityThreadPostKeysOptions, ISendTempMessageOptions, ISocialDataManagerConfig, ISocialEventManagerRead, ISocialEventManagerWrite, ITrendingCommunityInfo, IUpdateCommunitySubscription, IUserActivityStats, IUserProfile, MembershipType, ProtectedMembershipPolicyType, ScpStandardId, SocialDataManagerOptions } from "../utils/interfaces";
import {
    INostrCommunicationManager,
    INostrRestAPIManager,
    NostrRestAPIManager,
    NostrWebSocketManager,
} from "./communication";
import { SocialUtilsManager } from "./utilsManager";
import {  NostrEventManagerWrite } from "./eventManagerWrite";
import { NostrEventManagerReadV1o5 } from "./eventManagerReadV1o5";

class SocialDataManagerTG {
    private _writeRelays: string[];
    private _publicIndexingRelay: string;
    private _socialEventManagerRead: ISocialEventManagerRead;
    private _socialEventManagerWrite: ISocialEventManagerWrite;
    private _privateKey: string;

    constructor(config: ISocialDataManagerConfig) {
        this._publicIndexingRelay = config.publicIndexingRelay;
        const writeRelaysManagers = this._initializeWriteRelaysManagers(config.writeRelays);
        if (config.readManager) {
            this._socialEventManagerRead = config.readManager;
        }
        else {
            let nostrReadRelayManager = new NostrRestAPIManager(config.readRelay);
            this._socialEventManagerRead = new NostrEventManagerReadV1o5(
                nostrReadRelayManager as NostrRestAPIManager
            );
        }
        this._socialEventManagerWrite = new NostrEventManagerWrite(
            writeRelaysManagers,
            this._publicIndexingRelay
        );
    }

    public async dispose() {
    }

    set privateKey(privateKey: string) {
        this._privateKey = privateKey;
        this._socialEventManagerRead.privateKey = privateKey;
        this._socialEventManagerWrite.privateKey = privateKey;
    }

    get socialEventManagerRead() {
        return this._socialEventManagerRead;
    }

    get socialEventManagerWrite() {
        return this._socialEventManagerWrite;
    }

    set relays(value: string[]) {
        const writeRelaysManagers = this._initializeWriteRelaysManagers(value);
        this._socialEventManagerWrite.nostrCommunicationManagers = writeRelaysManagers;
    }

    get privateKey() {
        return this._privateKey;
    }

    private _initializeWriteRelaysManagers(relays: string[]) {
        if (!relays || relays.length === 0) {
            this._writeRelays = [];
            return [];
        }
        this._writeRelays = [this._publicIndexingRelay, ...relays];
        this._writeRelays = Array.from(new Set(this._writeRelays));
        let nostrCommunicationManagers: INostrCommunicationManager[] = [];
        for (let relay of this._writeRelays) {
            if (relay.startsWith('wss://')) {
                nostrCommunicationManagers.push(new NostrWebSocketManager(relay));
            }
            else {
                nostrCommunicationManagers.push(new NostrRestAPIManager(relay));
            }
        }
        return nostrCommunicationManagers;
    }

    async fetchCommunityFeedInfo(creatorId: string, communityId: string, since?: number, until?: number) {
        const communityUri = SocialUtilsManager.getCommunityUri(creatorId, communityId);
        const events = await this._socialEventManagerRead.fetchCommunityFeed({
            communityUri,
            since,
            until
        });
        const {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap
        } = this.createNoteEventMappings(events);
        return {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap
        }
    }

    retrieveCommunityUri(noteEvent: INostrEvent, scpData: ICommunityPostScpData) {
        let communityUri: string | null = null;
        if (scpData?.communityUri) {
            communityUri = scpData.communityUri;
        }
        else {
            const replaceableTag = noteEvent.tags.find(tag => tag[0] === 'a');
            if (replaceableTag) {
                const replaceableTagArr = replaceableTag[1].split(':');
                if (replaceableTagArr[0] === '34550') {
                    communityUri = replaceableTag[1];
                }
            }
        }
        return communityUri;
    }

    async decryptPostPrivateKeyForCommunity(options: IDecryptPostPrivateKeyForCommunityOptions) {
        const { event, selfPubkey, communityUri, communityPublicKey, communityPrivateKey } = options;
        let key: string | null = null;
        let postScpData = SocialUtilsManager.extractScpData(event, ScpStandardId.CommunityPost);
        if (!postScpData) return key;
        try {
            if (selfPubkey && communityPublicKey && event.pubkey === selfPubkey) {
                key = await SocialUtilsManager.decryptMessage(this._privateKey, communityPublicKey, postScpData.encryptedKey);
            }
            else if (communityPrivateKey) {
                const postPrivateKey = await SocialUtilsManager.decryptMessage(communityPrivateKey, event.pubkey, postScpData.encryptedKey);
                const messageContentStr = await SocialUtilsManager.decryptMessage(postPrivateKey, event.pubkey, event.content);
                const messageContent = JSON.parse(messageContentStr);
                if (communityUri === messageContent.communityUri) {
                    key = postPrivateKey;
                }
            }
        }
        catch (e) {
            // console.error(e);
        }
        return key;
    }

    async retrieveCommunityPrivateKey(communityInfo: ICommunityInfo, selfPrivateKey: string) {
        if (!communityInfo.scpData?.gatekeeperPublicKey) return null;
        const encryptedKey = communityInfo.scpData.encryptedKey || communityInfo.memberKeyMap?.[communityInfo.scpData.gatekeeperPublicKey];
        if (!encryptedKey) return null;
        let communityPrivateKey: string;
        const creatorPubkey = communityInfo.eventData.pubkey;
        const selfPubkey = SocialUtilsManager.convertPrivateKeyToPubkey(selfPrivateKey);
        if (selfPubkey === communityInfo.scpData.gatekeeperPublicKey) {
            communityPrivateKey = await SocialUtilsManager.decryptMessage(selfPrivateKey, creatorPubkey, encryptedKey);
        }
        else if (selfPubkey === creatorPubkey) {
            communityPrivateKey = await SocialUtilsManager.decryptMessage(selfPrivateKey, communityInfo.scpData.gatekeeperPublicKey, encryptedKey);
        }
        return communityPrivateKey;
    }

    private async constructCommunityNoteIdToPrivateKeyMap(communityInfo: ICommunityInfo, noteInfoList: INoteInfo[]) {
        let noteIdToPrivateKey: Record<string, string> = {};
        let communityPrivateKey = await this.retrieveCommunityPrivateKey(communityInfo, this._privateKey);
        const pubkey = SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        for (const note of noteInfoList) {
            let postPrivateKey = await this.decryptPostPrivateKeyForCommunity({
                event: note.eventData, 
                selfPubkey: pubkey, 
                communityUri: communityInfo.communityUri, 
                communityPublicKey: communityInfo.scpData.publicKey, 
                communityPrivateKey
            });
            if (postPrivateKey) {
                noteIdToPrivateKey[note.eventData.id] = postPrivateKey;
            }
        }
        return noteIdToPrivateKey;
    }

    async retrieveCommunityPostKeys(options: IRetrieveCommunityPostKeysOptions) {
        const {communityInfo, noteInfoList} = options;
        let noteIdToPrivateKey: Record<string, string> = {};
        if (options.gatekeeperUrl) {
            const authHeader = SocialUtilsManager.constructAuthHeader(this._privateKey);
            let bodyData = {
                creatorId: communityInfo.creatorId,
                communityId: communityInfo.communityId,
                message: options.message,
                signature: options.signature,
                since: options.since,
                until: options.until
            };
            let url = `${options.gatekeeperUrl}/communities/post-keys`;
            let response = await fetch(url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify(bodyData)
            });
            let result = await response.json();
            if (result.success) {
                noteIdToPrivateKey = result.data;
            }
        }
        else {
            noteIdToPrivateKey = await this.constructCommunityNoteIdToPrivateKeyMap(
                communityInfo, 
                noteInfoList
            );
        }
        return noteIdToPrivateKey;
    }

    async retrieveCommunityThreadPostKeys(options: IRetrieveCommunityThreadPostKeysOptions) {
        const {communityInfo, noteInfoList} = options;
        let noteIdToPrivateKey: Record<string, string> = {};
        if (options.gatekeeperUrl) {
            const authHeader = SocialUtilsManager.constructAuthHeader(this._privateKey);
            let bodyData = {
                creatorId: communityInfo.creatorId,
                communityId: communityInfo.communityId,
                focusedNoteId: options.focusedNoteId,
                message: options.message,
                signature: options.signature
            };
            let url = `${options.gatekeeperUrl}/communities/post-keys`;
            let response = await fetch(url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify(bodyData)
            });
            let result = await response.json();
            if (result.success) {
                noteIdToPrivateKey = result.data;
            }
        }
        else {
            noteIdToPrivateKey = await this.constructCommunityNoteIdToPrivateKeyMap(
                communityInfo, 
                noteInfoList
            );
        }
        return noteIdToPrivateKey;
    }

    async retrieveCommunityPostKeysByNoteEvents(options: IRetrieveCommunityPostKeysByNoteEventsOptions) {
        let noteIdToPrivateKey: Record<string, string> = {};
        let communityPrivateKeyMap: Record<string, string> = {};
        const noteCommunityMappings = await this.createNoteCommunityMappings(options.notes);
        if (noteCommunityMappings.noteCommunityInfoList.length === 0) return noteIdToPrivateKey;
        const communityInfoMap: Record<string, ICommunityInfo> = {};
        for (let communityInfo of noteCommunityMappings.communityInfoList) {
            communityInfoMap[communityInfo.communityUri] = communityInfo;
            if (communityInfo.membershipType === MembershipType.Open) continue;
            let communityPrivateKey = await this.retrieveCommunityPrivateKey(communityInfo, this._privateKey);
            if (communityPrivateKey) {
                communityPrivateKeyMap[communityInfo.communityUri] = communityPrivateKey;
            }
        }
        let relayToNotesMap: Record<string, INoteCommunityInfo[]> = {};
        for (let noteCommunityInfo of noteCommunityMappings.noteCommunityInfoList) {
            const communityPrivateKey = communityPrivateKeyMap[noteCommunityInfo.communityUri];
            const communityInfo = communityInfoMap[noteCommunityInfo.communityUri];
            if (!communityInfo) continue;
            if (communityInfo.membershipType === MembershipType.Open) continue;
            let postPrivateKey = await this.decryptPostPrivateKeyForCommunity({
                event: noteCommunityInfo.eventData, 
                selfPubkey: options.pubKey, 
                communityUri: noteCommunityInfo.communityUri, 
                communityPublicKey: communityInfo.scpData.publicKey, 
                communityPrivateKey
            });
            if (postPrivateKey) {
                noteIdToPrivateKey[noteCommunityInfo.eventData.id] = postPrivateKey;
            }
            else {
                if (communityInfo.privateRelay) {
                    relayToNotesMap[communityInfo.privateRelay] = relayToNotesMap[communityInfo.privateRelay] || [];
                    relayToNotesMap[communityInfo.privateRelay].push(noteCommunityInfo);
                }
                else if (options.gatekeeperUrl) {
                    relayToNotesMap[options.gatekeeperUrl] = relayToNotesMap[options.gatekeeperUrl] || [];
                    relayToNotesMap[options.gatekeeperUrl].push(noteCommunityInfo);
                }
            }
        }
        if (Object.keys(relayToNotesMap).length > 0) {
            for (let relay in relayToNotesMap) {
                const noteIds = relayToNotesMap[relay].map(v => v.eventData.id);
                const signature = await options.getSignature(options.message);
                const authHeader = SocialUtilsManager.constructAuthHeader(this._privateKey);
                let bodyData = {
                    noteIds: noteIds.join(','),
                    message: options.message,
                    signature: signature
                };
                let url = `${relay}/communities/post-keys`;
                let response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': authHeader
                    },
                    body: JSON.stringify(bodyData)
                });
                let result = await response.json();
                if (result.success) {
                    noteIdToPrivateKey = {
                        ...noteIdToPrivateKey,
                        ...result.data
                    };
                }
            }
        }
        return noteIdToPrivateKey;
    }

    async checkIfUserHasAccessToCommunity(options: ICheckIfUserHasAccessToCommunityOptions) {
        const { communityInfo, gatekeeperUrl, walletAddresses } = options;
        let data: {
            hasAccess: boolean,
            subscriptions: ICommunitySubscription[],
            isWhiteListed: boolean
        } = { hasAccess: false, subscriptions: [], isWhiteListed: false };
        const pubkey = Keys.getPublicKey(this._privateKey);
        let bodyData = {
            creatorId: communityInfo.creatorId,
            communityId: communityInfo.communityId,
            pubkey,
            walletAddresses
        };
        let url = `${gatekeeperUrl}/communities/check-user-access`;
        let response = await fetch(url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyData)
        });
        let result = await response.json();
        if (result.success) {
            data = result.data;
        }
        return data;
    }

    async constructMetadataByPubKeyMap(notes: INostrEvent[]) {
        let mentionAuthorSet = new Set();
        for (let i = 0; i < notes.length; i++) {
            const mentionTags = notes[i].tags.filter(tag => tag[0] === 'p' && tag[1] !== notes[i].pubkey)?.map(tag => tag[1]) || [];
            if (mentionTags.length) {
                mentionTags.forEach(tag => mentionAuthorSet.add(tag));
            }
        }
        const uniqueKeys = Array.from(mentionAuthorSet) as string[];
        const npubs = notes.map(note => note.pubkey).filter((value, index, self) => self.indexOf(value) === index);
        const metadata = await this._socialEventManagerRead.fetchUserProfileCacheEvents({
            pubKeys: [...npubs, ...uniqueKeys]
        });

        const metadataByPubKeyMap: Record<string, INostrMetadata> = metadata.reduce((acc, cur) => {
            const content = JSON.parse(cur.content);
            if (cur.pubkey) {
                acc[cur.pubkey] = {
                    ...cur,
                    content
                };
            }
            return acc;
        }, {});
        return metadataByPubKeyMap;
    }

    async fetchUserProfiles(pubKeys: string[]): Promise<IUserProfile[]> {
        if (pubKeys.length === 0) return [];
        let metadataArr: INostrMetadata[] = [];
        let followersCountMap: Record<string, number> = {};
        try {
            const events = await this._socialEventManagerRead.fetchUserProfileCacheEvents({ pubKeys });
            for (let event of events) {
                if (event.kind === 0) {
                    metadataArr.push({
                        ...event,
                        content: SocialUtilsManager.parseContent(event.content)
                    });
                }
                else if (event.kind === 10000108) {
                    followersCountMap = SocialUtilsManager.parseContent(event.content);
                }
            }
        }
        catch (error) {
            console.error('fetchUserProfiles', error);
        }
        if (metadataArr.length == 0) return null;
        const userProfiles: IUserProfile[] = [];
        for (let metadata of metadataArr) {
            let userProfile = SocialUtilsManager.constructUserProfile(metadata, followersCountMap);
            userProfiles.push(userProfile);
        }
        return userProfiles;
    }

    async updateUserProfile(content: INostrMetadataContent) {
        await this._socialEventManagerWrite.updateUserProfile(content)
    }

    async fetchTrendingNotesInfo() {
        let notes: INoteInfo[] = [];
        let metadataByPubKeyMap: Record<string, INostrMetadata> = {};
        const events = await this._socialEventManagerRead.fetchTrendingCacheEvents({});
        for (let event of events) {
            if (event.kind === 0) {
                metadataByPubKeyMap[event.pubkey] = {
                    ...event,
                    content: SocialUtilsManager.parseContent(event.content)
                };
            }
            else if (event.kind === 1) {
                notes.push({
                    eventData: event
                });
            }
        }
        return {
            notes,
            metadataByPubKeyMap
        };
    }

    private constructNoteCommunity(noteEvent: INostrEvent, communityInfoMap: Record<string, ICommunityInfo>) {
        let community: INoteCommunity;
        if (noteEvent.tags?.length) {
            let scpData = SocialUtilsManager.extractScpData(noteEvent, ScpStandardId.CommunityPost);
            let communityUri = this.retrieveCommunityUri(noteEvent, scpData);
            if (communityUri) {
                const communityInfo = communityInfoMap[communityUri];
                const { creatorId, communityId } = SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                community = {
                    communityUri,
                    communityId: communityInfo?.communityId || communityId,
                    creatorId: communityInfo?.creatorId || Nip19.npubEncode(creatorId),
                    parentCommunityUri: communityInfo?.parentCommunityUri,
                    privateRelay: communityInfo?.privateRelay,
                    isExclusive: communityInfo?.membershipType === MembershipType.Protected,
                    isWhitelist: communityInfo?.policies?.[0]?.policyType === ProtectedMembershipPolicyType.Whitelist,
                    policies: communityInfo?.policies
                };
            }
        }
        return community;
    }

    async fetchProfileFeedInfo(pubKey: string, since: number = 0, until?: number) {
        const selfPubkey = this._privateKey ? SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey) : null;
        const events = await this._socialEventManagerRead.fetchProfileFeedCacheEvents({
            userPubkey: selfPubkey,
            pubKey,
            since,
            until
        });
        const earliest = this.getEarliestEventTimestamp(events.filter(v => v.created_at));
        const {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            noteToRepostIdMap,
            pubkeyToCommunityIdsMap
        } = this.createNoteEventMappings(events);
        const communityInfoMap: Record<string, ICommunityInfo> = {};
        if (Object.keys(pubkeyToCommunityIdsMap).length > 0) {
            const communityEvents = await this._socialEventManagerRead.fetchCommunities({
                pubkeyToCommunityIdsMap
            });
            for (let event of communityEvents) {
                let communityInfo = SocialUtilsManager.extractCommunityInfo(event);
                communityInfoMap[communityInfo.communityUri] = communityInfo;
            }
        }
        for (let note of notes as INoteInfoExtended[]) {
            note.community = this.constructNoteCommunity(note.eventData, communityInfoMap);
            const noteId = note.eventData.id;
            const repostId = noteToRepostIdMap[noteId];
            if (!repostId) continue;
            const metadata = metadataByPubKeyMap[repostId];
            if (!metadata) continue;
            const metadataContent = metadata.content;
            const encodedPubkey = Nip19.npubEncode(metadata.pubkey);
            const internetIdentifier = typeof metadataContent.nip05 === 'string' ? metadataContent.nip05?.replace('_@', '') || '' : '';
            note.repost = {
                id: encodedPubkey,
                username: '',
                description: metadataContent.about,
                avatar: metadataContent.picture,
                pubKey: encodedPubkey,
                displayName: metadataContent.display_name || metadataContent.name,
                internetIdentifier: internetIdentifier
            };
        }
        return {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            earliest
        };
    }

    async fetchProfileRepliesInfo(pubKey: string, since: number = 0, until?: number) {
        const selfPubkey = this._privateKey ? SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey) : null;
        const events = await this._socialEventManagerRead.fetchProfileRepliesCacheEvents({
            userPubkey: selfPubkey,
            pubKey,
            since,
            until
        });
        const earliest = this.getEarliestEventTimestamp(events.filter(v => v.created_at));
        const {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            noteToParentAuthorIdMap
        } = this.createNoteEventMappings(events, true);
        for (let note of notes as INoteInfoExtended[]) {
            const noteId = note.eventData.id;
            const parentAuthorId = noteToParentAuthorIdMap[noteId];
            if (!parentAuthorId) continue;
            const metadata = metadataByPubKeyMap[parentAuthorId];
            if (!metadata) continue;
            const metadataContent = metadata.content;
            const encodedPubkey = Nip19.npubEncode(metadata.pubkey);
            const internetIdentifier = typeof metadataContent.nip05 === 'string' ? metadataContent.nip05?.replace('_@', '') || '' : '';
            note.parentAuthor = {
                id: encodedPubkey,
                username: '',
                description: metadataContent.about,
                avatar: metadataContent.picture,
                pubKey: encodedPubkey,
                displayName: metadataContent.display_name || metadataContent.name,
                internetIdentifier: internetIdentifier
            };
        }

        return {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            earliest
        };
    }

    async fetchEventsByIds(ids: string[]) {
        const events = await this._socialEventManagerRead.fetchEventsByIds({ ids });
        return events;
    }

    async fetchNotesByIds(ids: string[]) {
        const noteEvents = await this._socialEventManagerRead.fetchEventsByIds({ ids });
        const {
            notes,
            quotedNotesMap,
            pubkeyToCommunityIdsMap
        } = this.createNoteEventMappings(noteEvents);
        let metadataByPubKeyMap = await this.constructMetadataByPubKeyMap(noteEvents);
        const communityInfoMap: Record<string, ICommunityInfo> = {};
        if (Object.keys(pubkeyToCommunityIdsMap).length > 0) {
            const communityEvents = await this._socialEventManagerRead.fetchCommunities({
                pubkeyToCommunityIdsMap
            });
            for (let event of communityEvents) {
                let communityInfo = SocialUtilsManager.extractCommunityInfo(event);
                communityInfoMap[communityInfo.communityUri] = communityInfo;
            }
        }
        for (let note of notes as INoteInfoExtended[]) {
            if (!note.actions) note.actions = {};
            note.actions.bookmarked = true;
            note.community = this.constructNoteCommunity(note.eventData, communityInfoMap);
        }
        return {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap
        }
    }

    async fetchTempEvents(ids: string[]) {
        const noteEvents = await this._socialEventManagerRead.fetchTempEvents({ ids });
        return noteEvents;
    }

    private getEarliestEventTimestamp(events: INostrEvent[]) {
        if (!events || events.length === 0) {
            return 0;
        }
        return events.reduce((createdAt, event) => {
            return Math.min(createdAt, event.created_at);
        }, events[0].created_at);
    }

    async fetchHomeFeedInfo(pubKey: string, since: number = 0, until?: number) {
        let events: INostrEvent[] = await this._socialEventManagerRead.fetchHomeFeedCacheEvents({
            pubKey,
            since,
            until
        });
        const earliest = this.getEarliestEventTimestamp(events.filter(v => v.kind === 1).filter(v => v.created_at));
        const {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            pubkeyToCommunityIdsMap
        } = this.createNoteEventMappings(events);
        const communityInfoMap: Record<string, ICommunityInfo> = {};
        if (Object.keys(pubkeyToCommunityIdsMap).length > 0) {
            const communityEvents = await this._socialEventManagerRead.fetchCommunities({
                pubkeyToCommunityIdsMap
            });
            for (let event of communityEvents) {
                let communityInfo = SocialUtilsManager.extractCommunityInfo(event);
                communityInfoMap[communityInfo.communityUri] = communityInfo;
            }
        }
        for (let note of notes as INoteInfoExtended[]) {
            note.community = this.constructNoteCommunity(note.eventData, communityInfoMap);
        }
        return {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            earliest
        }
    }
    async fetchUserFollowingFeedInfo(pubKey: string, until?: number) {
        let events: INostrEvent[] = await this._socialEventManagerRead.fetchUserFollowingFeed({
            pubKey,
            until
        });
        const earliest = this.getEarliestEventTimestamp(events.filter(v => (v.kind === 1 || v.kind === 6) && v.created_at));
        const {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            pubkeyToCommunityIdsMap
        } = this.createNoteEventMappings(events);
        const communityInfoMap: Record<string, ICommunityInfo> = {};
        if (Object.keys(pubkeyToCommunityIdsMap).length > 0) {
            const communityEvents = await this._socialEventManagerRead.fetchCommunities({
                pubkeyToCommunityIdsMap
            });
            for (let event of communityEvents) {
                let communityInfo = SocialUtilsManager.extractCommunityInfo(event);
                communityInfoMap[communityInfo.communityUri] = communityInfo;
            }
        }
        for (let note of notes as INoteInfoExtended[]) {
            note.community = this.constructNoteCommunity(note.eventData, communityInfoMap);
        }
        return {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            earliest
        }
    }
    createNoteEventMappings(events: INostrEvent[], parentAuthorsInfo: boolean = false) {
        let notes: INoteInfo[] = [];
        let metadataByPubKeyMap: Record<string, INostrMetadata> = {};
        let quotedNotesMap: Record<string, INoteInfo> = {};
        let noteToParentAuthorIdMap: Record<string, string> = {};
        let noteToRepostIdMap: Record<string, string> = {};
        let noteStatsMap: Record<string, IPostStats> = {};
        let noteActionsMap: Record<string, INoteActions> = {};
        let pubkeyToCommunityIdsMap: Record<string, string[]> = {};
        for (let event of events) {
            if (event.kind === 0) {
                metadataByPubKeyMap[event.pubkey] = {
                    ...event,
                    content: SocialUtilsManager.parseContent(event.content)
                };
            }
            else if (event.kind === 10000107) {
                if (!event.content) continue;
                const noteEvent = SocialUtilsManager.parseContent(event.content) as INostrEvent;
                quotedNotesMap[noteEvent.id] = {
                    eventData: noteEvent
                }
            }
            else if (event.kind === 1) {
                notes.push({
                    eventData: event
                });
                if (parentAuthorsInfo) {
                    const parentAuthors = event.tags.filter(tag => tag[0] === 'p')?.map(tag => tag[1]) || [];
                    if (parentAuthors.length > 0) {
                        noteToParentAuthorIdMap[event.id] = parentAuthors[parentAuthors.length - 1];
                    }
                }
            }
            else if (event.kind === 6) {
                if (!event.content) continue;
                const originalNoteContent = SocialUtilsManager.parseContent(event.content);
                notes.push({
                    eventData: originalNoteContent
                });
                if (originalNoteContent?.id)
                    noteToRepostIdMap[originalNoteContent.id] = event.pubkey;
                if (parentAuthorsInfo) {
                    const parentAuthors = event.tags.filter(tag => tag[0] === 'p')?.map(tag => tag[1]) || [];
                    if (parentAuthors.length > 0) {
                        noteToParentAuthorIdMap[event.id] = parentAuthors[parentAuthors.length - 1];
                    }
                }
            }
            else if (event.kind === 10000100) {
                if (!event.content) continue;
                const content = SocialUtilsManager.parseContent(event.content);
                noteStatsMap[content.event_id] = {
                    upvotes: content.likes,
                    replies: content.replies,
                    reposts: content.reposts,
                    satszapped: content.satszapped,
                    status: content.status
                }
            }
            else if (event.kind === 10000113) {
                //"{\"since\":1700034697,\"until\":1700044097,\"order_by\":\"created_at\"}"
                const timeInfo = SocialUtilsManager.parseContent(event.content);
            }
            else if (event.kind === 10000115) {
                if (!event.content) continue;
                const content = SocialUtilsManager.parseContent(event.content);
                noteActionsMap[content.event_id] = {
                    liked: content.liked,
                    replied: content.replied,
                    reposted: content.reposted,
                    zapped: content.zapped
                }
            }
        }
        for (let note of notes) {
            const noteId = note.eventData?.id;
            note.stats = noteStatsMap[noteId];
            note.actions = noteActionsMap[noteId];
            const communityUri = note.eventData?.tags?.find(tag => tag[0] === 'a')?.[1];
            if (communityUri) {
                const { creatorId, communityId } = SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                if (!pubkeyToCommunityIdsMap[creatorId]) {
                    pubkeyToCommunityIdsMap[creatorId] = [];
                }
                if (!pubkeyToCommunityIdsMap[creatorId].includes(communityId)) {
                    pubkeyToCommunityIdsMap[creatorId].push(communityId);
                }
            }
        }
        return {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            noteToParentAuthorIdMap,
            noteStatsMap,
            noteToRepostIdMap,
            noteActionsMap,
            pubkeyToCommunityIdsMap
        }
    }

    async fetchCommunityInfo(creatorId: string, communityId: string) {
        const communityEvents = await this._socialEventManagerRead.fetchCommunity({
            creatorId,
            communityId
        });
        const communityEvent = communityEvents.find(event => event.kind === 34550);
        if (!communityEvent) return null;
        let communityInfo = SocialUtilsManager.extractCommunityInfo(communityEvent);
        //Fetch group keys only when scpData.encryptedKey is undefined for backward compatibility
        if (communityInfo.membershipType === MembershipType.Protected && !communityInfo.scpData?.encryptedKey) {
            const keyEvents = await this._socialEventManagerRead.fetchGroupKeys({
                identifiers: [communityInfo.communityUri + ':keys']
            });
            const keyEvent = keyEvents[0];
            if (keyEvent) {
                communityInfo.memberKeyMap = JSON.parse(keyEvent.content);
            }
        }
        return communityInfo;
    }

    async fetchUserRelatedCommunityFeedInfo(pubKey: string, since?: number, until?: number) {
        let result: INoteInfoExtended[] = [];
        const events = await this._socialEventManagerRead.fetchAllUserRelatedCommunitiesFeed({ pubKey, since, until });
        const statsEvents = events.filter(event => event.kind === 10000100);

        // const {
        //     notes,
        //     metadataByPubKeyMap,
        //     quotedNotesMap
        // } = this.createNoteEventMappings(feedEvents);
        let noteStatsMap: Record<string, IPostStats> = {};
        for (let event of statsEvents) {
            const content = SocialUtilsManager.parseContent(event.content);
            noteStatsMap[content.event_id] = {
                upvotes: content.likes,
                replies: content.replies,
                reposts: content.reposts,
                satszapped: content.satszapped
            }
        }
        const notesEvents = events.filter(event => event.kind === 1);
        for (let noteEvent of notesEvents) {
            if (noteEvent.tags?.length) {
                const communityUri = noteEvent.tags.find(tag => tag[0] === 'a')?.[1];
                if (communityUri) {
                    const { creatorId, communityId } = SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                    const stats = noteStatsMap[noteEvent.id];
                    const noteInfo: INoteInfoExtended = {
                        eventData: noteEvent,
                        stats,
                        community: {
                            communityUri,
                            communityId,
                            creatorId: Nip19.npubEncode(creatorId)
                        }
                    };
                    result.push(noteInfo);
                }
            }
        }
        return result;
    }

    async fetchThreadNotesInfo(focusedNoteId: string) {
        let focusedNote: INoteInfo;
        let ancestorNotes: INoteInfo[] = [];
        let replies: INoteInfo[] = [];
        let childReplyEventTagIds: string[] = [];
        //Ancestor posts -> Focused post -> Child replies
        let decodedFocusedNoteId = focusedNoteId.startsWith('note1') ? Nip19.decode(focusedNoteId).data as string : focusedNoteId;
        const selfPubkey = this._privateKey ? SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey) : null;
        const threadEvents = await this._socialEventManagerRead.fetchThreadCacheEvents({
            id: decodedFocusedNoteId,
            pubKey: selfPubkey
        });
        const {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            pubkeyToCommunityIdsMap
        } = this.createNoteEventMappings(threadEvents);
        const communityInfoMap: Record<string, ICommunityInfo> = {};
        if (Object.keys(pubkeyToCommunityIdsMap).length > 0) {
            const communityEvents = await this._socialEventManagerRead.fetchCommunities({
                pubkeyToCommunityIdsMap
            });
            for (let event of communityEvents) {
                let communityInfo = SocialUtilsManager.extractCommunityInfo(event);
                communityInfoMap[communityInfo.communityUri] = communityInfo;
            }
        }
        const quotedPubKeys = [];
        for (let eventId in quotedNotesMap) {
            const pubKey = quotedNotesMap[eventId].eventData.pubkey;
            if (!metadataByPubKeyMap[pubKey]) quotedPubKeys.push(pubKey);
        }
        if (quotedPubKeys.length > 0) {
            const metadata = await this._socialEventManagerRead.fetchUserProfileCacheEvents({
                pubKeys: quotedPubKeys
            });
    
            const _metadataByPubKeyMap: Record<string, INostrMetadata> = metadata.reduce((acc, cur) => {
                const content = JSON.parse(cur.content);
                if (cur.pubkey) {
                    acc[cur.pubkey] = {
                        ...cur,
                        content
                    };
                }
                return acc;
            }, {});

            Object.assign(metadataByPubKeyMap, _metadataByPubKeyMap);
        }
        for (let note of notes as INoteInfoExtended[]) {
            note.community = this.constructNoteCommunity(note.eventData, communityInfoMap);
            if (note.eventData.id === decodedFocusedNoteId) {
                focusedNote = note;
            }
            else if (note.eventData.tags.some(tag => tag[0] === 'e' && tag[1] === decodedFocusedNoteId)) {
                replies.push(note);
            }
            else {
                ancestorNotes.push(note);
            }
        }
        replies = replies.sort((a, b) => b.eventData.created_at - a.eventData.created_at);
        ancestorNotes = ancestorNotes.sort((a, b) => a.eventData.created_at - b.eventData.created_at);
        let communityInfo: ICommunityInfo | null = null;
        let scpData = SocialUtilsManager.extractScpData(focusedNote.eventData, ScpStandardId.CommunityPost);
        if (scpData) {
            const communityUri = this.retrieveCommunityUri(focusedNote.eventData, scpData);
            if (communityUri) {
                const { creatorId, communityId } = SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                communityInfo = await this.fetchCommunityInfo(creatorId, communityId);
            }
        }
        return {
            focusedNote,
            ancestorNotes,
            replies,
            quotedNotesMap,
            metadataByPubKeyMap,
            childReplyEventTagIds,
            communityInfo
        };
    }

    async createNoteCommunityMappings(notes: INostrEvent[]) {
        let noteCommunityInfoList: INoteCommunityInfo[] = [];
        let pubkeyToCommunityIdsMap: Record<string, string[]> = {};
        let communityInfoList: ICommunityInfo[] = [];
        for (let note of notes) {
            let scpData = SocialUtilsManager.extractScpData(note, ScpStandardId.CommunityPost);
            if (scpData) {
                const communityUri = this.retrieveCommunityUri(note, scpData);
                if (communityUri) {
                    const { creatorId, communityId } = SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                    pubkeyToCommunityIdsMap[creatorId] = pubkeyToCommunityIdsMap[creatorId] || [];
                    if (!pubkeyToCommunityIdsMap[creatorId].includes(communityId)) {
                        pubkeyToCommunityIdsMap[creatorId].push(communityId);
                    }
                    noteCommunityInfoList.push({
                        eventData: note,
                        communityUri,
                        communityId,
                        creatorId,
                    });
                }
            }
        }

        if (noteCommunityInfoList.length > 0) {
            const communityEvents = await this._socialEventManagerRead.fetchCommunities({
                pubkeyToCommunityIdsMap
            });
            for (let event of communityEvents) {
                let communityInfo = SocialUtilsManager.extractCommunityInfo(event);
                communityInfoList.push(communityInfo);
            }

            //Fetch group keys only when scpData.encryptedKey is undefined for backward compatibility
            const keyEvents = await this._socialEventManagerRead.fetchGroupKeys({
                identifiers: communityInfoList.filter(v => !v.scpData?.encryptedKey).map(v => v.communityUri + ':keys')
            });

            for (let keyEvent of keyEvents) {
                const identifier = keyEvent.tags.find(tag => tag[0] === 'd')?.[1];
                const communityUri = identifier.replace(':keys', '');
                const communityInfo = communityInfoList.find(v => v.communityUri === communityUri);
                if (communityInfo) {
                    communityInfo.memberKeyMap = JSON.parse(keyEvent.content);
                }
            }
        }

        return {
            noteCommunityInfoList,
            communityInfoList
        }
    }

    async retrieveUserProfileDetail(pubKey: string) {
        let metadata: INostrMetadata;
        let stats: IUserActivityStats;
        const userContactEvents = await this._socialEventManagerRead.fetchUserProfileDetailCacheEvents({ pubKey });
        for (let event of userContactEvents) {
            if (event.kind === 0) {
                metadata = {
                    ...event,
                    content: SocialUtilsManager.parseContent(event.content)
                };
            }
            else if (event.kind === 10000105) {
                let content = SocialUtilsManager.parseContent(event.content);
                stats = {
                    notes: content.note_count,
                    replies: content.reply_count,
                    followers: content.followers_count,
                    following: content.follows_count,
                    relays: content.relay_count,
                    timeJoined: content.time_joined
                }
            }
        }
        if (!metadata) return null;
        let userProfile = SocialUtilsManager.constructUserProfile(metadata);
        return {
            userProfile,
            stats
        }
    }

    async fetchUserContactList(pubKey: string) {
        let metadataArr: INostrMetadata[] = [];
        let followersCountMap: Record<string, number> = {};
        const userContactEvents = await this._socialEventManagerRead.fetchContactListCacheEvents({
            pubKey,
            detailIncluded: true
        });
        for (let event of userContactEvents) {
            if (event.kind === 0) {
                metadataArr.push({
                    ...event,
                    content: SocialUtilsManager.parseContent(event.content)
                });
            }
            else if (event.kind === 10000108) {
                followersCountMap = SocialUtilsManager.parseContent(event.content);
            }
        }
        const userProfiles: IUserProfile[] = [];
        for (let metadata of metadataArr) {
            let userProfile = SocialUtilsManager.constructUserProfile(metadata, followersCountMap);
            userProfiles.push(userProfile);
        }
        return userProfiles;
    }

    async fetchUserFollowersList(pubKey: string) {
        let metadataArr: INostrMetadata[] = [];
        let followersCountMap: Record<string, number> = {};
        const userFollowersEvents = await this._socialEventManagerRead.fetchFollowersCacheEvents({ pubKey });
        for (let event of userFollowersEvents) {
            if (event.kind === 0) {
                metadataArr.push({
                    ...event,
                    content: SocialUtilsManager.parseContent(event.content)
                });
            }
            else if (event.kind === 10000108) {
                followersCountMap = SocialUtilsManager.parseContent(event.content);
            }
        }
        const userProfiles: IUserProfile[] = [];
        for (let metadata of metadataArr) {
            let userProfile = SocialUtilsManager.constructUserProfile(metadata, followersCountMap);
            userProfiles.push(userProfile);
        }
        return userProfiles;
    }

    async fetchUserRelayList(pubKey: string) {
        let relayList: string[] = [];
        const relaysEvents = await this._socialEventManagerRead.fetchUserRelays({ pubKey });
        const relaysEvent = relaysEvents.find(event => event.kind === 10000139);
        if (!relaysEvent) return relayList;
        relayList = relaysEvent.tags.filter(tag => tag[0] === 'r')?.map(tag => tag[1]) || [];
        relayList = Array.from(new Set(relayList));
        return relayList;
    }

    async followUser(userPubKey: string) {
        const decodedUserPubKey = userPubKey.startsWith('npub1') ? Nip19.decode(userPubKey).data as string : userPubKey;
        const selfPubkey = SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const contactListEvents = await this._socialEventManagerRead.fetchContactListCacheEvents({
            pubKey: selfPubkey,
            detailIncluded: false
        });
        let content = '';
        let contactPubKeys: Set<string> = new Set();
        let contactListEvent = contactListEvents.find(event => event.kind === 3);
        if (contactListEvent) {
            content = contactListEvent.content;
            contactPubKeys = new Set(contactListEvent.tags.filter(tag => tag[0] === 'p')?.map(tag => tag[1]) || []);
        }
        contactPubKeys.add(decodedUserPubKey);
        await this._socialEventManagerWrite.updateContactList(content, Array.from(contactPubKeys));
    }

    async unfollowUser(userPubKey: string) {
        const decodedUserPubKey = userPubKey.startsWith('npub1') ? Nip19.decode(userPubKey).data as string : userPubKey;
        const selfPubkey = SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const contactListEvents = await this._socialEventManagerRead.fetchContactListCacheEvents({
            pubKey: selfPubkey,
            detailIncluded: false
        });
        let content = '';
        let contactPubKeys: Set<string> = new Set();
        const contactListEvent = contactListEvents.find(event => event.kind === 3);
        if (contactListEvent) {
            content = contactListEvent.content;
            for (let tag of contactListEvent.tags) {
                if (tag[0] === 'p' && tag[1] !== decodedUserPubKey) {
                    contactPubKeys.add(tag[1]);
                }
            }
        }
        await this._socialEventManagerWrite.updateContactList(content, Array.from(contactPubKeys));
    }

    async createCommunity(newInfo: INewCommunityInfo, creatorId: string) {
        const communityUri = SocialUtilsManager.getCommunityUri(creatorId, newInfo.name);
        let communityInfo: ICommunityInfo = {
            communityUri,
            communityId: newInfo.name,
            creatorId,
            description: newInfo.description,
            rules: newInfo.rules,
            bannerImgUrl: newInfo.bannerImgUrl,
            avatarImgUrl: newInfo.avatarImgUrl,
            moderatorIds: newInfo.moderatorIds,
            scpData: newInfo.scpData,
            membershipType: newInfo.membershipType,
            privateRelay: newInfo.privateRelay,
            gatekeeperNpub: newInfo.gatekeeperNpub,
            policies: newInfo.policies,
            pointSystem: newInfo.pointSystem,
            collectibles: newInfo.collectibles,
            parentCommunityUri: newInfo.parentCommunityUri
        }

        if (communityInfo.membershipType === MembershipType.Protected) {
            const gatekeeperPublicKey = Nip19.decode(communityInfo.gatekeeperNpub).data as string;
            const groupPrivateKey = Keys.generatePrivateKey();
            const groupPublicKey = Keys.getPublicKey(groupPrivateKey);
            const encryptedGroupKey = await SocialUtilsManager.encryptMessage(this._privateKey, gatekeeperPublicKey, groupPrivateKey);
            communityInfo.scpData = {
                ...communityInfo.scpData,
                publicKey: groupPublicKey,
                gatekeeperPublicKey,
                encryptedKey: encryptedGroupKey
            }
        }
        await this._socialEventManagerWrite.updateCommunity(communityInfo);

        return communityInfo;
    }

    async updateCommunity(info: ICommunityInfo) {
        if (info.membershipType === MembershipType.Protected) {
            const gatekeeperPublicKey = Nip19.decode(info.gatekeeperNpub).data as string;
            if (info.scpData) {
                if (!info.scpData.encryptedKey || !info.scpData.gatekeeperPublicKey) {
                    const groupPrivateKey = await this.retrieveCommunityPrivateKey(info, this._privateKey);
                    const encryptedGroupKey = await SocialUtilsManager.encryptMessage(this._privateKey, gatekeeperPublicKey, groupPrivateKey);
                    info.scpData = {
                        ...info.scpData,
                        gatekeeperPublicKey,
                        encryptedKey: encryptedGroupKey
                    }
                }
            } 
            else {
                const groupPrivateKey = Keys.generatePrivateKey();
                const groupPublicKey = Keys.getPublicKey(groupPrivateKey);
                const encryptedGroupKey = await SocialUtilsManager.encryptMessage(this._privateKey, gatekeeperPublicKey, groupPrivateKey);
                info.scpData = {
                    ...info.scpData,
                    publicKey: groupPublicKey,
                    gatekeeperPublicKey,
                    encryptedKey: encryptedGroupKey
                }
            }
        }
        await this._socialEventManagerWrite.updateCommunity(info);
        return info;
    }

    async fetchCommunitiesMembers(communities: ICommunityInfo[]) {
        if (communities.length === 0) return {};
        const communityUriToMembersMap = await this._socialEventManagerRead.getCommunityUriToMembersMap(communities);
        return communityUriToMembersMap;
    }

    private getEventIdToMemberMap(events: INostrEvent[]) {
        const memberCountsEvents = events.filter(event => event.kind === 10000109);
        let eventIdToMemberCountMap: Record<string, number> = {};
        for (let event of memberCountsEvents) {
            const content = SocialUtilsManager.parseContent(event.content);
            eventIdToMemberCountMap[content.event_id] = content.member_count;
        }
        return eventIdToMemberCountMap;
    }

    async fetchCommunities(query?: string) {
        let communities: ICommunity[] = [];
        const events = await this._socialEventManagerRead.fetchCommunities({
            query
        });
        let eventIdToMemberCountMap = this.getEventIdToMemberMap(events);
        const communityEvents = events.filter(event => event.kind === 34550);
        for (let event of communityEvents) {
            const communityInfo = SocialUtilsManager.extractCommunityInfo(event);
            const memberCount = eventIdToMemberCountMap[event.id] || 0;
            let community: ICommunity = {
                ...communityInfo,
                members: [],
                memberCount
            }
            communities.push(community);
        }
        return communities;
    }

    async fetchMyCommunities(pubKey: string) {
        let communities: ICommunity[] = [];
        const events = await this._socialEventManagerRead.fetchAllUserRelatedCommunities({ pubKey });
        let eventIdToMemberCountMap = this.getEventIdToMemberMap(events);
        const communitiesEvents = events.filter(event => event.kind === 34550);
        for (let event of communitiesEvents) {
            const communityInfo = SocialUtilsManager.extractCommunityInfo(event);
            const memberCount = eventIdToMemberCountMap[event.id] || 0;
            let community: ICommunity = {
                ...communityInfo,
                members: [],
                memberCount
            }
            communities.push(community);
        }
        return communities;
    }

    async joinCommunity(community: ICommunityInfo, pubKey: string) {
        const communities = await this._socialEventManagerRead.fetchUserBookmarkedCommunities({ pubKey });
        communities.push(community);
        await this._socialEventManagerWrite.updateUserBookmarkedCommunities(communities);
        if (community.scpData?.channelEventId) {
            const channelEventIds = await this._socialEventManagerRead.fetchUserBookmarkedChannelEventIds({ pubKey });
            channelEventIds.push(community.scpData.channelEventId);
            await this._socialEventManagerWrite.updateUserBookmarkedChannels(channelEventIds);
        }
    }

    async leaveCommunity(community: ICommunityInfo, pubKey: string) {
        const communities = await this._socialEventManagerRead.fetchUserBookmarkedCommunities({
            pubKey,
            excludedCommunity: community
        });
        await this._socialEventManagerWrite.updateUserBookmarkedCommunities(communities);
        if (community.scpData?.channelEventId) {
            const channelEventIds = await this._socialEventManagerRead.fetchUserBookmarkedChannelEventIds({ pubKey });
            const index = channelEventIds.indexOf(community.scpData.channelEventId);
            if (index > -1) {
                channelEventIds.splice(index, 1);
            }
            await this._socialEventManagerWrite.updateUserBookmarkedChannels(channelEventIds);
        }
    }

    private async encryptGroupMessage(privateKey: string, groupPublicKey: string, message: string) {
        const messagePrivateKey = Keys.generatePrivateKey();
        const messagePublicKey = Keys.getPublicKey(messagePrivateKey);
        const encryptedGroupKey = await SocialUtilsManager.encryptMessage(privateKey, groupPublicKey, messagePrivateKey);
        const encryptedMessage = await SocialUtilsManager.encryptMessage(privateKey, messagePublicKey, message);
        return {
            encryptedMessage,
            encryptedGroupKey
        }
    }

    async submitCommunityPost(message: string, info: ICommunityInfo, conversationPath?: IConversationPath, timestamp?: number, alt?: string, isPublicPost: boolean = false) {
        const messageContent = {
            communityUri: info.communityUri,
            message,
        }
        let newCommunityPostInfo: INewCommunityPostInfo;
        if (info.membershipType === MembershipType.Open || isPublicPost) {
            newCommunityPostInfo = {
                community: info,
                message,
                timestamp,
                conversationPath
            }
        }
        else {
            const {
                encryptedMessage,
                encryptedGroupKey
            } = await this.encryptGroupMessage(this._privateKey, info.scpData.publicKey, JSON.stringify(messageContent));
            newCommunityPostInfo = {
                community: info,
                message: encryptedMessage,
                timestamp,
                conversationPath,
                scpData: {
                    encryptedKey: encryptedGroupKey,
                    communityUri: info.communityUri
                }
            }
        }
        if (alt) newCommunityPostInfo.alt = alt;
        const responses = await this._socialEventManagerWrite.submitCommunityPost(newCommunityPostInfo);
        return responses;
    }

    async getAccountBalance(walletAddress: string) {
        const apiUrl = 'https://rpc.ankr.com/multichain/79258ce7f7ee046decc3b5292a24eb4bf7c910d7e39b691384c7ce0cfb839a01/?ankr_getAccountBalance';
        const bodyData = {
            jsonrpc: '2.0',
            method: 'ankr_getAccountBalance',
            params: {
                blockchain: [
                    'bsc',
                    'avalanche'
                ],
                walletAddress
            },
            id: 1
        }
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyData)
        });
        const data = await response.json();
        if (data.error) {
            console.log('error', data.error);
            return null;
        }
        return data.result;
    }

    async getNFTsByOwner(walletAddress: string) {
        const apiUrl = 'https://rpc.ankr.com/multichain/79258ce7f7ee046decc3b5292a24eb4bf7c910d7e39b691384c7ce0cfb839a01/?ankr_getNFTsByOwner';
        const bodyData = {
            jsonrpc: '2.0',
            method: 'ankr_getNFTsByOwner',
            params: {
                blockchain: [
                    'bsc',
                    'avalanche'
                ],
                walletAddress
            },
            id: 1
        }
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyData)
        });
        const data = await response.json();
        if (data.error) {
            console.log('error', data.error);
            return null;
        }
        return data.result;
    }

    async submitMessage(message: string, conversationPath?: IConversationPath, createdAt?: number) {
        return this._socialEventManagerWrite.postNote(message, conversationPath, createdAt);
    }

    async submitLongFormContent(info: ILongFormContentInfo) {
        return this._socialEventManagerWrite.submitLongFormContentEvents(info);
    }

    async submitLike(postEventData: INostrEvent) {
        let tags: string[][] = postEventData.tags.filter(
            tag => tag.length >= 2 && (tag[0] === 'e' || tag[0] === 'p')
        );
        tags.push(['e', postEventData.id]);
        tags.push(['p', postEventData.pubkey]);
        tags.push(['k', postEventData.kind.toString()]);
        await this._socialEventManagerWrite.submitLike(tags);
    }

    async submitRepost(postEventData: INostrEvent) {
        let tags: string[][] = [
            [
                'e',
                postEventData.id
            ],
            [
                'p',
                postEventData.pubkey
            ]
        ]
        const content = JSON.stringify(postEventData);
        await this._socialEventManagerWrite.submitRepost(content, tags);
    }

    async sendPingRequest(pubkey: string, relayUrl: string = this._publicIndexingRelay) {
        const authHeader = SocialUtilsManager.constructAuthHeader(this._privateKey);
        const data = {
            pubkey: pubkey,
        };
        let result
        try {
            let response = await fetch(relayUrl + '/ping', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: authHeader
                },
                body: JSON.stringify(data)
            });
            result = await response.json();
        }
        catch (err) {
        }
        return result;
    }

    async checkRelayStatus(pubkey: string, relayUrl?: string) {
        if (!relayUrl) relayUrl = this._publicIndexingRelay;
        const authHeader = SocialUtilsManager.constructAuthHeader(this._privateKey);
        const data = {
            pubkey: pubkey,
        };
        let result
        try {
            let response = await fetch(relayUrl + '/check-status', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: authHeader
                },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                result = await response.json();
            }
            else if (response.status === 401) {
                result = {
                    success: false,
                    error: 'Access Denied: You do not have permission to access this relay.'
                }
            }
        }
        catch (err) {
        }
        return result;
    }

    async searchUsers(query: string) {
        const events = await this._socialEventManagerRead.searchUsers({ query });
        let metadataArr: INostrMetadata[] = [];
        let followersCountMap: Record<string, number> = {};
        for (let event of events) {
            if (event.kind === 0) {
                metadataArr.push({
                    ...event,
                    content: SocialUtilsManager.parseContent(event.content)
                });
            }
            else if (event.kind === 10000108) {
                followersCountMap = SocialUtilsManager.parseContent(event.content);
            }
        }
        const userProfiles: IUserProfile[] = [];
        for (let metadata of metadataArr) {
            let userProfile = SocialUtilsManager.constructUserProfile(metadata, followersCountMap);
            userProfiles.push(userProfile);
        }
        return userProfiles;
    }

    async addRelay(url: string) {
        const selfPubkey = SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const relaysEvents = await this._socialEventManagerRead.fetchUserRelays({
            pubKey: selfPubkey
        });
        const relaysEvent = relaysEvents.find(event => event.kind === 10000139);
        let relays: Record<string, IRelayConfig> = { [url]: { write: true, read: true } };
        if (relaysEvent) {
            for (let tag of relaysEvent.tags) {
                if (tag[0] !== 'r') continue;
                let config: IRelayConfig = { read: true, write: true };
                if (tag[2] === 'write') {
                    config.read = false;
                }
                if (tag[2] === 'read') {
                    config.write = false;
                }
                relays[tag[1]] = config;
            }
        }
        await this._socialEventManagerWrite.updateRelayList(relays);
    }

    async removeRelay(url: string) {
        const selfPubkey = SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const relaysEvents = await this._socialEventManagerRead.fetchUserRelays({
            pubKey: selfPubkey
        });
        const relaysEvent = relaysEvents.find(event => event.kind === 10000139);
        let relays: Record<string, IRelayConfig> = {};
        if (relaysEvent) {
            for (let tag of relaysEvent.tags) {
                if (tag[0] !== 'r' || tag[1] === url) continue;
                let config: IRelayConfig = { read: true, write: true };
                if (tag[2] === 'write') {
                    config.read = false;
                }
                if (tag[2] === 'read') {
                    config.write = false;
                }
                relays[tag[1]] = config;
            }
        }
        await this._socialEventManagerWrite.updateRelayList(relays);
    }

    async updateRelays(add: string[], remove: string[], defaultRelays: string[]) {
        const selfPubkey = SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const relaysEvents = await this._socialEventManagerRead.fetchUserRelays({
            pubKey: selfPubkey
        });
        const relaysEvent = relaysEvents.find(event => event.kind === 10000139);
        let relaysMap: Record<string, IRelayConfig> = {};
        for (let relay of add) {
            relaysMap[relay] = { read: true, write: true };
        }
        if (relaysEvent) {
            for (let tag of relaysEvent.tags) {
                if (tag[0] !== 'r' || remove.includes(tag[1])) continue;
                let config: IRelayConfig = { read: true, write: true };
                if (tag[2] === 'write') {
                    config.read = false;
                }
                if (tag[2] === 'read') {
                    config.write = false;
                }
                relaysMap[tag[1]] = config;
            }
        }
        let relayUrls = Object.keys(relaysMap);
        // this.relays = relayUrls.length > 0 ? relayUrls : defaultRelays;
        await this._socialEventManagerWrite.updateRelayList(relaysMap);
        return relayUrls;
    }

    async fetchUserPrivateRelay(pubkey: string) {
        const url = `${this._publicIndexingRelay}/private-relay?pubkey=${pubkey}`;
        const response = await fetch(url);
        const result = await response.json();
        return result.data.relay;
    }

    async fetchCommunityPinnedNotes(creatorId: string, communityId: string) {
        const events = await this._socialEventManagerRead.fetchCommunityPinnedNotesEvents({
            creatorId,
            communityId
        });
        const {
            notes,
            metadataByPubKeyMap
        } = this.createNoteEventMappings(events);
        return {
            notes,
            metadataByPubKeyMap
        }
    }

    async pinCommunityNote(creatorId: string, communityId: string, noteId: string) {
        let noteIds = await this._socialEventManagerRead.fetchCommunityPinnedNoteIds({
            creatorId,
            communityId
        });
        noteIds = Array.from(new Set([...noteIds, noteId]));
        await this._socialEventManagerWrite.updateCommunityPinnedNotes(creatorId, communityId, noteIds);
    }

    async unpinCommunityNote(creatorId: string, communityId: string, noteId: string) {
        let noteIds = await this._socialEventManagerRead.fetchCommunityPinnedNoteIds({
            creatorId,
            communityId
        });
        noteIds = Array.from(new Set(noteIds));
        const index = noteIds.indexOf(noteId);
        if (index > -1) {
            noteIds.splice(index, 1);
        }
        await this._socialEventManagerWrite.updateCommunityPinnedNotes(creatorId, communityId, noteIds);
    }

    async fetchUserPinnedNotes(pubKey: string) {
        const pinnedNotesEvent = await this._socialEventManagerRead.fetchUserPinnedNotes({ pubKey });
        let noteIds = [];
        if (pinnedNotesEvent) {
            for (let tag of pinnedNotesEvent.tags) {
                if (tag[0] === 'e') {
                    noteIds.push(tag[1]);
                }
            }
        }
        if (noteIds.length > 0)
            return this._socialEventManagerRead.fetchEventsByIds({ ids: noteIds });
        else
            return [];
    }

    async pinUserNote(pubKey: string, noteId: string) {
        const pinnedNotesEvent = await this._socialEventManagerRead.fetchUserPinnedNotes({ pubKey });
        let noteIds = [noteId];
        if (pinnedNotesEvent) {
            for (let tag of pinnedNotesEvent.tags) {
                if (tag[0] === 'e' && tag[1] !== noteId) {
                    noteIds.push(tag[1]);
                }
            }
        }
        await this._socialEventManagerWrite.updateUserPinnedNotes(noteIds);
    }

    async unpinUserNote(pubKey: string, noteId: string) {
        const pinnedNotesEvent = await this._socialEventManagerRead.fetchUserPinnedNotes({ pubKey });
        let noteIds = [];
        if (pinnedNotesEvent) {
            for (let tag of pinnedNotesEvent.tags) {
                if (tag[0] === 'e' && tag[1] !== noteId) {
                    noteIds.push(tag[1]);
                }
            }
        }
        await this._socialEventManagerWrite.updateUserPinnedNotes(noteIds);
    }
    
    async deleteEvents(eventIds: string[]) {
        await this._socialEventManagerWrite.deleteEvents(eventIds);
    }

    async fetchTrendingCommunities() {
        let communities: ITrendingCommunityInfo[] = [];
        const events = await this._socialEventManagerRead.fetchTrendingCommunities();
        let eventIdToMemberCountMap = this.getEventIdToMemberMap(events);
        const communitiesEvents = events.filter(event => event.kind === 34550);
        for (let event of communitiesEvents) {
            const communityInfo = SocialUtilsManager.extractCommunityInfo(event);
            const memberCount = eventIdToMemberCountMap[event.id] || 0;
            let community: ITrendingCommunityInfo = {
                ...communityInfo,
                memberCount
            }
            communities.push(community);
        }
        return communities;
    }

    async fetchUserEthWalletAccountsInfo(options: SocialDataManagerOptions.IFetchUserEthWalletAccountsInfoOptions) {
        const { walletHash, pubKey } = options;
        const event = await this._socialEventManagerRead.fetchUserEthWalletAccountsInfo({ walletHash, pubKey });
        if (!event) return null;
        const content = SocialUtilsManager.parseContent(event.content);
        let accountsInfo: IEthWalletAccountsInfo = {
            masterWalletSignature: content.master_wallet_signature,
            socialWalletSignature: content.social_wallet_signature,
            encryptedKey: content.encrypted_key,
            masterWalletHash: walletHash,
            eventData: event
        }
        return accountsInfo;
    }

    async updateUserEthWalletAccountsInfo(info: IEthWalletAccountsInfo, privateKey?: string) {
        const responses = await this._socialEventManagerWrite.updateUserEthWalletAccountsInfo(info, privateKey);
        const response = responses[0];
        return response.success ? response.eventId : null;
    }

    async fetchSubCommunities(creatorId: string, communityId: string) {
        let communities: ICommunityInfo[] = [];
        try {
            const events = await this._socialEventManagerRead.fetchSubcommunites({
                communityCreatorId: creatorId,
                communityName: communityId
            });
            for (let event of events) {
                const communityInfo = SocialUtilsManager.extractCommunityInfo(event);
                let community: ICommunity = {
                    ...communityInfo,
                    members: []
                }
                communities.push(community);
            }
        }
        catch (error) {
            console.error('fetchSubCommunities', error);
        }
        return communities;
    }

    async fetchCommunityDetailMetadata(creatorId: string, communityId: string) {
        const events = await this._socialEventManagerRead.fetchCommunityDetailMetadata({
            communityCreatorId: creatorId,
            communityName: communityId
        });

        const communityEvent = events.find(event => event.kind === 34550);
        if (!communityEvent) return null;
        const communityInfo = SocialUtilsManager.extractCommunityInfo(communityEvent);
        const statsEvent = events.find(event => event.kind === 10000105);
        let stats: ICommunityStats;
        if (statsEvent) {
            const content = SocialUtilsManager.parseContent(statsEvent.content);
            stats = {
                notesCount: content.note_count,
                membersCount: content.member_count,
                subcommunitiesCount: content.subcommunity_count 
            }
        }

        //Fetch group keys only when scpData.encryptedKey is undefined for backward compatibility
        if (communityInfo.membershipType === MembershipType.Protected && !communityInfo.scpData?.encryptedKey) {
            const keyEvents = await this._socialEventManagerRead.fetchGroupKeys({
                identifiers: [communityInfo.communityUri + ':keys']
            });
            const keyEvent = keyEvents[0];
            if (keyEvent) {
                communityInfo.memberKeyMap = JSON.parse(keyEvent.content);
            }
        }

        let detailMetadata: ICommunityDetailMetadata = {
            info: communityInfo,
            stats
        }
        
        return detailMetadata;
    }

    async updateNoteStatus(noteId: string, status: string) {
        const result = await this._socialEventManagerWrite.updateNoteStatus(noteId, status);
        return result;
    }

    async updateCommunitySubscription(options: IUpdateCommunitySubscription) {
        const selfPubkey = SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const communityPubkey = options.communityCreatorId.startsWith('npub1') ? Nip19.decode(options.communityCreatorId).data : options.communityCreatorId;
        const authHeader = SocialUtilsManager.constructAuthHeader(this._privateKey);
        let bodyData = {
            communityPubkey: communityPubkey,
            communityD: options.communityId,
            pubkey: selfPubkey,
            start: options.start,
            end: options.end,
            chainId: options.chainId || 'TON',
            txHash: options.txHash,
            timeCreated: Math.round(Date.now() / 1000)
        };
        const relayUrl = this._publicIndexingRelay;
        let url = `${relayUrl}/update-community-subscription`;
        let response = await fetch(url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: authHeader
            },
            body: JSON.stringify(bodyData)
        });
        let result = await response.json();
        return result;
    }
}

export {
    SocialDataManagerTG
}