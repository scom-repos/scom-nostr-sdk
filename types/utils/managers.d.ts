import { IChannelInfo, ICommunityBasicInfo, ICommunityInfo, IConversationPath, INewChannelMessageInfo, INewCommunityInfo, INewCommunityPostInfo, INostrEvent, INostrMetadata, INostrMetadataContent, INostrSubmitResponse, INoteInfo, IPostStats, IRetrieveCommunityPostKeysByNoteEventsOptions, IRetrieveCommunityPostKeysOptions, IRetrieveCommunityThreadPostKeysOptions, IUserActivityStats, IUserProfile } from "./interfaces";
interface IFetchNotesOptions {
    authors?: string[];
    ids?: string[];
}
interface IFetchMetadataOptions {
    authors?: string[];
    decodedAuthors?: string[];
}
interface IFetchRepliesOptions {
    noteIds?: string[];
    decodedIds?: string[];
}
declare class NostrEventManager {
    private _relays;
    private _cachedServer;
    private _websocketManager;
    private _cachedWebsocketManager;
    constructor(relays: string[], cachedServer: string);
    fetchThreadCacheEvents(id: string, pubKey?: string): Promise<INostrEvent[]>;
    fetchTrendingCacheEvents(pubKey?: string): Promise<INostrEvent[]>;
    fetchProfileFeedCacheEvents(pubKey: string): Promise<INostrEvent[]>;
    fetchProfileRepliesCacheEvents(pubKey: string): Promise<INostrEvent[]>;
    fetchHomeFeedCacheEvents(pubKey?: string): Promise<INostrEvent[]>;
    fetchUserProfileCacheEvents(pubKeys: string[]): Promise<INostrEvent[]>;
    fetchUserProfileDetailCacheEvents(pubKey: string): Promise<INostrEvent[]>;
    fetchContactListCacheEvents(pubKey: string): Promise<INostrEvent[]>;
    fetchFollowersCacheEvents(pubKey: string): Promise<INostrEvent[]>;
    fetchRelaysCacheEvents(pubKey: string): Promise<INostrEvent[]>;
    fetchCommunities(pubkeyToCommunityIdsMap?: Record<string, string[]>): Promise<any>;
    fetchAllUserRelatedCommunities(pubKey: string): Promise<INostrEvent[]>;
    fetchUserBookmarkedCommunities(pubKey: string): Promise<INostrEvent[]>;
    fetchCommunity(creatorId: string, communityId: string): Promise<INostrEvent[]>;
    fetchCommunityFeed(creatorId: string, communityId: string): Promise<INostrEvent[]>;
    fetchCommunitiesGeneralMembers(communities: ICommunityBasicInfo[]): Promise<INostrEvent[]>;
    fetchNotes(options: IFetchNotesOptions): Promise<INostrEvent[]>;
    fetchMetadata(options: IFetchMetadataOptions): Promise<INostrEvent[]>;
    fetchReplies(options: IFetchRepliesOptions): Promise<INostrEvent[]>;
    fetchFollowing(npubs: string[]): Promise<INostrEvent[]>;
    postNote(content: string, privateKey: string, conversationPath?: IConversationPath): Promise<void>;
    calculateConversationPathTags(conversationPath: IConversationPath): string[][];
    updateChannel(info: IChannelInfo, privateKey: string): Promise<INostrSubmitResponse>;
    updateUserBookmarkedChannels(channelEventIds: string[], privateKey: string): Promise<void>;
    fetchAllUserRelatedChannels(pubKey: string): Promise<INostrEvent[]>;
    fetchUserBookmarkedChannels(pubKey: string): Promise<INostrEvent[]>;
    fetchChannels(channelEventIds: string[]): Promise<INostrEvent[]>;
    fetchChannelInfoMessages(creatorId: string, channelId: string): Promise<INostrEvent[]>;
    updateCommunity(info: ICommunityInfo, privateKey: string): Promise<INostrSubmitResponse>;
    updateUserBookmarkedCommunities(communities: ICommunityBasicInfo[], privateKey: string): Promise<void>;
    submitCommunityPost(info: INewCommunityPostInfo, privateKey: string): Promise<void>;
    submitChannelMessage(info: INewChannelMessageInfo, privateKey: string): Promise<void>;
    updateUserProfile(content: INostrMetadataContent, privateKey: string): Promise<void>;
    fetchMessageCountsCacheEvents(pubKey: string): Promise<INostrEvent[]>;
    fetchOldMessages(pubKey: string, sender: string, until?: number): Promise<INostrEvent[]>;
    fetchNewMessages(pubKey: string, sender: string, since?: number): Promise<INostrEvent[]>;
    sendMessage(receiver: string, encryptedMessage: string, privateKey: string): Promise<void>;
    resetMessageCount(pubKey: string, sender: string, privateKey: string): Promise<void>;
}
interface ISocialEventManager {
    fetchThreadCacheEvents(id: string, pubKey?: string): Promise<INostrEvent[]>;
    fetchTrendingCacheEvents(pubKey?: string): Promise<INostrEvent[]>;
    fetchProfileFeedCacheEvents(pubKey: string): Promise<INostrEvent[]>;
    fetchProfileRepliesCacheEvents(pubKey: string): Promise<INostrEvent[]>;
    fetchHomeFeedCacheEvents(pubKey?: string): Promise<INostrEvent[]>;
    fetchUserProfileCacheEvents(pubKeys: string[]): Promise<INostrEvent[]>;
    fetchUserProfileDetailCacheEvents(pubKey: string): Promise<INostrEvent[]>;
    fetchContactListCacheEvents(pubKey: string): Promise<INostrEvent[]>;
    fetchFollowersCacheEvents(pubKey: string): Promise<INostrEvent[]>;
    fetchRelaysCacheEvents(pubKey: string): Promise<INostrEvent[]>;
    fetchCommunities(pubkeyToCommunityIdsMap?: Record<string, string[]>): Promise<INostrEvent[]>;
    fetchAllUserRelatedCommunities(pubKey: string): Promise<INostrEvent[]>;
    fetchUserBookmarkedCommunities(pubKey: string): Promise<INostrEvent[]>;
    fetchCommunity(creatorId: string, communityId: string): Promise<INostrEvent[]>;
    fetchCommunityFeed(creatorId: string, communityId: string): Promise<INostrEvent[]>;
    fetchCommunitiesGeneralMembers(communities: ICommunityBasicInfo[]): Promise<INostrEvent[]>;
    fetchNotes(options: IFetchNotesOptions): Promise<INostrEvent[]>;
    fetchMetadata(options: IFetchMetadataOptions): Promise<INostrEvent[]>;
    fetchReplies(options: IFetchRepliesOptions): Promise<INostrEvent[]>;
    fetchFollowing(npubs: string[]): Promise<INostrEvent[]>;
    postNote(content: string, privateKey: string, conversationPath?: IConversationPath): Promise<void>;
    updateCommunity(info: ICommunityInfo, privateKey: string): Promise<INostrSubmitResponse>;
    updateChannel(info: IChannelInfo, privateKey: string): Promise<INostrSubmitResponse>;
    fetchChannels(channelEventIds: string[]): Promise<INostrEvent[]>;
    updateUserBookmarkedChannels(channelEventIds: string[], privateKey: string): Promise<void>;
    fetchAllUserRelatedChannels(pubKey: string): Promise<INostrEvent[]>;
    fetchUserBookmarkedChannels(pubKey: string): Promise<INostrEvent[]>;
    submitChannelMessage(info: INewChannelMessageInfo, privateKey: string): Promise<void>;
    fetchChannelInfoMessages(creatorId: string, channelId: string): Promise<INostrEvent[]>;
    updateUserBookmarkedCommunities(communities: ICommunityBasicInfo[], privateKey: string): Promise<void>;
    submitCommunityPost(info: INewCommunityPostInfo, privateKey: string): Promise<void>;
    updateUserProfile(content: INostrMetadataContent, privateKey: string): Promise<void>;
    fetchMessageCountsCacheEvents(pubKey: string): Promise<INostrEvent[]>;
    fetchOldMessages(pubKey: string, sender: string, until?: number): Promise<INostrEvent[]>;
    fetchNewMessages(pubKey: string, sender: string, since?: number): Promise<INostrEvent[]>;
    sendMessage(receiver: string, encryptedMessage: string, privateKey: string): Promise<void>;
    resetMessageCount(pubKey: string, sender: string, privateKey: string): Promise<void>;
}
declare class SocialDataManager {
    private _socialEventManager;
    constructor(relays: string[], cachedServer: string);
    get socialEventManager(): ISocialEventManager;
    hexStringToUint8Array(hexString: string): Uint8Array;
    base64ToUtf8(base64: string): string;
    encryptMessage(ourPrivateKey: string, theirPublicKey: string, text: string): Promise<string>;
    decryptMessage(ourPrivateKey: string, theirPublicKey: string, encryptedData: string): Promise<string>;
    extractCommunityInfo(event: INostrEvent): ICommunityInfo;
    retrieveCommunityEvents(creatorId: string, communityId: string): Promise<{
        notes: INostrEvent[];
        info: ICommunityInfo;
    }>;
    retrieveCommunityUri(noteEvent: INostrEvent, scpData: any): string;
    extractPostScpData(noteEvent: INostrEvent): any;
    retrievePostPrivateKey(noteEvent: INostrEvent, communityUri: string, communityPrivateKey: string): Promise<string>;
    retrieveCommunityPostKeys(options: IRetrieveCommunityPostKeysOptions): Promise<Record<string, string>>;
    retrieveCommunityThreadPostKeys(options: IRetrieveCommunityThreadPostKeysOptions): Promise<Record<string, string>>;
    retrieveCommunityPostKeysByNoteEvents(options: IRetrieveCommunityPostKeysByNoteEventsOptions): Promise<Record<string, string>>;
    constructMetadataByPubKeyMap(notes: INostrEvent[]): Promise<Record<string, INostrMetadata>>;
    createNoteEventMappings(events: INostrEvent[], parentAuthorsInfo?: boolean): {
        notes: INoteInfo[];
        metadataByPubKeyMap: Record<string, INostrMetadata>;
        quotedNotesMap: Record<string, INoteInfo>;
        noteToParentAuthorIdMap: Record<string, string>;
        noteStatsMap: Record<string, IPostStats>;
    };
    fetchThreadNotesInfo(focusedNoteId: string): Promise<{
        focusedNote: INoteInfo;
        ancestorNotes: INoteInfo[];
        replies: INoteInfo[];
        quotedNotesMap: Record<string, INoteInfo>;
        metadataByPubKeyMap: Record<string, INostrMetadata>;
        childReplyEventTagIds: string[];
        communityInfo: ICommunityInfo;
    }>;
    private createNoteCommunityMappings;
    retrieveUserProfileDetail(pubKey: string): Promise<{
        userProfile: IUserProfile;
        stats: IUserActivityStats;
    }>;
    private constructUserProfile;
    fetchUserContactList(pubKey: string): Promise<IUserProfile[]>;
    fetchUserFollowersList(pubKey: string): Promise<IUserProfile[]>;
    fetchUserRelayList(pubKey: string): Promise<string[]>;
    getCommunityUri(creatorId: string, communityId: string): string;
    generateGroupKeys(privateKey: string, gatekeeperPublicKey: string): Promise<{
        groupPrivateKey: string;
        groupPublicKey: string;
        encryptedGroupKey: string;
    }>;
    createCommunity(info: INewCommunityInfo, creatorId: string, privateKey: string): Promise<ICommunityInfo>;
    fetchMyCommunities(pubKey: string): Promise<ICommunityInfo[]>;
    extractBookmarkedCommunities(event: INostrEvent, excludedCommunity?: ICommunityInfo): ICommunityBasicInfo[];
    extractBookmarkedChannels(event: INostrEvent): string[];
    joinCommunity(community: ICommunityInfo, pubKey: string, privateKey: string): Promise<void>;
    leaveCommunity(community: ICommunityInfo, pubKey: string, privateKey: string): Promise<void>;
    extractChannelInfo(event: INostrEvent): IChannelInfo;
    fetchAllUserRelatedChannels(pubKey: string): Promise<IChannelInfo[]>;
    retrieveChannelEvents(creatorId: string, channelId: string): Promise<{
        messageEvents: INostrEvent[];
        info: IChannelInfo;
    }>;
}
export { NostrEventManager, ISocialEventManager, SocialDataManager };
