import { ICheckIfUserHasAccessToCommunityOptions, ICommunity, ICommunityDetailMetadata, ICommunityInfo, ICommunityPostScpData, ICommunitySubscription, IConversationPath, IDecryptPostPrivateKeyForCommunityOptions, IEthWalletAccountsInfo, ILongFormContentInfo, INewCommunityInfo, INostrEvent, INostrMetadata, INostrMetadataContent, INoteActions, INoteCommunityInfo, INoteInfo, INoteInfoExtended, IPostStats, IRetrieveCommunityPostKeysByNoteEventsOptions, IRetrieveCommunityPostKeysOptions, IRetrieveCommunityThreadPostKeysOptions, ISocialDataManagerConfig, ISocialEventManagerRead, ISocialEventManagerWrite, ITrendingCommunityInfo, IUpdateCommunitySubscription, IUserActivityStats, IUserProfile, SocialDataManagerOptions } from "../utils/interfaces";
declare class SocialDataManagerTG {
    private _writeRelays;
    private _publicIndexingRelay;
    private _socialEventManagerRead;
    private _socialEventManagerWrite;
    private _privateKey;
    constructor(config: ISocialDataManagerConfig);
    dispose(): Promise<void>;
    set privateKey(privateKey: string);
    get socialEventManagerRead(): ISocialEventManagerRead;
    get socialEventManagerWrite(): ISocialEventManagerWrite;
    set relays(value: string[]);
    get privateKey(): string;
    private _initializeWriteRelaysManagers;
    fetchCommunityFeedInfo(creatorId: string, communityId: string, since?: number, until?: number): Promise<{
        notes: INoteInfo[];
        metadataByPubKeyMap: Record<string, INostrMetadata>;
        quotedNotesMap: Record<string, INoteInfo>;
    }>;
    retrieveCommunityUri(noteEvent: INostrEvent, scpData: ICommunityPostScpData): string;
    decryptPostPrivateKeyForCommunity(options: IDecryptPostPrivateKeyForCommunityOptions): Promise<string>;
    retrieveCommunityPrivateKey(communityInfo: ICommunityInfo, selfPrivateKey: string): Promise<string>;
    private constructCommunityNoteIdToPrivateKeyMap;
    retrieveCommunityPostKeys(options: IRetrieveCommunityPostKeysOptions): Promise<Record<string, string>>;
    retrieveCommunityThreadPostKeys(options: IRetrieveCommunityThreadPostKeysOptions): Promise<Record<string, string>>;
    retrieveCommunityPostKeysByNoteEvents(options: IRetrieveCommunityPostKeysByNoteEventsOptions): Promise<Record<string, string>>;
    checkIfUserHasAccessToCommunity(options: ICheckIfUserHasAccessToCommunityOptions): Promise<{
        hasAccess: boolean;
        subscriptions: ICommunitySubscription[];
        isWhiteListed: boolean;
    }>;
    constructMetadataByPubKeyMap(notes: INostrEvent[]): Promise<Record<string, INostrMetadata>>;
    fetchUserProfiles(pubKeys: string[]): Promise<IUserProfile[]>;
    updateUserProfile(content: INostrMetadataContent): Promise<void>;
    fetchTrendingNotesInfo(): Promise<{
        notes: INoteInfo[];
        metadataByPubKeyMap: Record<string, INostrMetadata>;
    }>;
    private constructNoteCommunity;
    fetchProfileFeedInfo(pubKey: string, since?: number, until?: number): Promise<{
        notes: INoteInfo[];
        metadataByPubKeyMap: Record<string, INostrMetadata>;
        quotedNotesMap: Record<string, INoteInfo>;
        earliest: number;
    }>;
    fetchProfileRepliesInfo(pubKey: string, since?: number, until?: number): Promise<{
        notes: INoteInfo[];
        metadataByPubKeyMap: Record<string, INostrMetadata>;
        quotedNotesMap: Record<string, INoteInfo>;
        earliest: number;
    }>;
    fetchEventsByIds(ids: string[]): Promise<INostrEvent[]>;
    fetchNotesByIds(ids: string[]): Promise<{
        notes: INoteInfo[];
        metadataByPubKeyMap: Record<string, INostrMetadata>;
        quotedNotesMap: Record<string, INoteInfo>;
    }>;
    fetchTempEvents(ids: string[]): Promise<INostrEvent[]>;
    private getEarliestEventTimestamp;
    fetchHomeFeedInfo(pubKey: string, since?: number, until?: number): Promise<{
        notes: INoteInfo[];
        metadataByPubKeyMap: Record<string, INostrMetadata>;
        quotedNotesMap: Record<string, INoteInfo>;
        earliest: number;
    }>;
    fetchUserFollowingFeedInfo(pubKey: string, until?: number): Promise<{
        notes: INoteInfo[];
        metadataByPubKeyMap: Record<string, INostrMetadata>;
        quotedNotesMap: Record<string, INoteInfo>;
        earliest: number;
    }>;
    createNoteEventMappings(events: INostrEvent[], parentAuthorsInfo?: boolean): {
        notes: INoteInfo[];
        metadataByPubKeyMap: Record<string, INostrMetadata>;
        quotedNotesMap: Record<string, INoteInfo>;
        noteToParentAuthorIdMap: Record<string, string>;
        noteStatsMap: Record<string, IPostStats>;
        noteToRepostIdMap: Record<string, string>;
        noteActionsMap: Record<string, INoteActions>;
        pubkeyToCommunityIdsMap: Record<string, string[]>;
    };
    fetchCommunityInfo(creatorId: string, communityId: string): Promise<ICommunityInfo>;
    fetchUserRelatedCommunityFeedInfo(pubKey: string, since?: number, until?: number): Promise<INoteInfoExtended[]>;
    fetchThreadNotesInfo(focusedNoteId: string): Promise<{
        focusedNote: INoteInfo;
        ancestorNotes: INoteInfo[];
        replies: INoteInfo[];
        quotedNotesMap: Record<string, INoteInfo>;
        metadataByPubKeyMap: Record<string, INostrMetadata>;
        childReplyEventTagIds: string[];
        communityInfo: ICommunityInfo;
    }>;
    createNoteCommunityMappings(notes: INostrEvent[]): Promise<{
        noteCommunityInfoList: INoteCommunityInfo[];
        communityInfoList: ICommunityInfo[];
    }>;
    retrieveUserProfileDetail(pubKey: string): Promise<{
        userProfile: IUserProfile;
        stats: IUserActivityStats;
    }>;
    fetchUserContactList(pubKey: string): Promise<IUserProfile[]>;
    fetchUserFollowersList(pubKey: string): Promise<IUserProfile[]>;
    fetchUserRelayList(pubKey: string): Promise<string[]>;
    followUser(userPubKey: string): Promise<void>;
    unfollowUser(userPubKey: string): Promise<void>;
    createCommunity(newInfo: INewCommunityInfo, creatorId: string): Promise<ICommunityInfo>;
    updateCommunity(info: ICommunityInfo): Promise<ICommunityInfo>;
    fetchCommunitiesMembers(communities: ICommunityInfo[]): Promise<Record<string, import("../utils/interfaces").ICommunityMember[]>>;
    private getEventIdToMemberMap;
    fetchCommunities(query?: string): Promise<ICommunity[]>;
    fetchMyCommunities(pubKey: string): Promise<ICommunity[]>;
    joinCommunity(community: ICommunityInfo, pubKey: string): Promise<void>;
    leaveCommunity(community: ICommunityInfo, pubKey: string): Promise<void>;
    private encryptGroupMessage;
    submitCommunityPost(message: string, info: ICommunityInfo, conversationPath?: IConversationPath, timestamp?: number, alt?: string, isPublicPost?: boolean): Promise<import("../utils/interfaces").ISocialEventManagerWriteResult>;
    getAccountBalance(walletAddress: string): Promise<any>;
    getNFTsByOwner(walletAddress: string): Promise<any>;
    submitMessage(message: string, conversationPath?: IConversationPath, createdAt?: number): Promise<import("../utils/interfaces").ISocialEventManagerWriteResult>;
    submitLongFormContent(info: ILongFormContentInfo): Promise<import("../utils/interfaces").ISocialEventManagerWriteResult>;
    submitLike(postEventData: INostrEvent): Promise<void>;
    submitRepost(postEventData: INostrEvent): Promise<void>;
    sendPingRequest(pubkey: string, relayUrl?: string): Promise<any>;
    checkRelayStatus(pubkey: string, relayUrl?: string): Promise<any>;
    searchUsers(query: string): Promise<IUserProfile[]>;
    addRelay(url: string): Promise<void>;
    removeRelay(url: string): Promise<void>;
    updateRelays(add: string[], remove: string[], defaultRelays: string[]): Promise<string[]>;
    fetchUserPrivateRelay(pubkey: string): Promise<any>;
    fetchCommunityPinnedNotes(creatorId: string, communityId: string): Promise<{
        notes: INoteInfo[];
        metadataByPubKeyMap: Record<string, INostrMetadata>;
    }>;
    pinCommunityNote(creatorId: string, communityId: string, noteId: string): Promise<void>;
    unpinCommunityNote(creatorId: string, communityId: string, noteId: string): Promise<void>;
    fetchUserPinnedNotes(pubKey: string): Promise<INostrEvent[]>;
    pinUserNote(pubKey: string, noteId: string): Promise<void>;
    unpinUserNote(pubKey: string, noteId: string): Promise<void>;
    deleteEvents(eventIds: string[]): Promise<void>;
    fetchTrendingCommunities(): Promise<ITrendingCommunityInfo[]>;
    fetchUserEthWalletAccountsInfo(options: SocialDataManagerOptions.IFetchUserEthWalletAccountsInfoOptions): Promise<IEthWalletAccountsInfo>;
    updateUserEthWalletAccountsInfo(info: IEthWalletAccountsInfo, privateKey?: string): Promise<any>;
    fetchSubCommunities(creatorId: string, communityId: string): Promise<ICommunityInfo[]>;
    fetchCommunityDetailMetadata(creatorId: string, communityId: string): Promise<ICommunityDetailMetadata>;
    updateNoteStatus(noteId: string, status: string): Promise<import("../utils/interfaces").ISocialEventManagerWriteResult>;
    updateCommunitySubscription(options: IUpdateCommunitySubscription): Promise<any>;
    checkCommunitySubscriptions(communityCreatorId: string, communityId: string): Promise<ICommunitySubscription[]>;
}
export { SocialDataManagerTG };
