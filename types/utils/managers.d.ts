import { CommunityRole, IChannelInfo, ICommunityBasicInfo, ICommunityInfo, IConversationPath, IMessageContactInfo, INewChannelMessageInfo, INewCommunityInfo, INewCommunityPostInfo, INostrEvent, INostrMetadata, INostrMetadataContent, INostrSubmitResponse, INoteCommunityInfo, INoteInfo, IPostStats, IRetrieveChannelMessageKeysOptions, IRetrieveCommunityPostKeysByNoteEventsOptions, IRetrieveCommunityPostKeysOptions, IRetrieveCommunityThreadPostKeysOptions, IUserActivityStats, IUserProfile } from "./interfaces";
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
    deleteEvents(eventIds: string[], privateKey: string): Promise<INostrSubmitResponse>;
    updateChannel(info: IChannelInfo, privateKey: string): Promise<INostrSubmitResponse>;
    updateUserBookmarkedChannels(channelEventIds: string[], privateKey: string): Promise<void>;
    fetchAllUserRelatedChannels(pubKey: string): Promise<INostrEvent[]>;
    fetchUserBookmarkedChannels(pubKey: string): Promise<INostrEvent[]>;
    fetchChannels(channelEventIds: string[]): Promise<INostrEvent[]>;
    fetchChannelMessages(channelId: string, since?: number, until?: number): Promise<INostrEvent[]>;
    fetchChannelInfoMessages(creatorId: string, channelId: string): Promise<INostrEvent[]>;
    updateCommunity(info: ICommunityInfo, privateKey: string): Promise<INostrSubmitResponse>;
    updateUserBookmarkedCommunities(communities: ICommunityBasicInfo[], privateKey: string): Promise<void>;
    submitCommunityPost(info: INewCommunityPostInfo, privateKey: string): Promise<void>;
    submitChannelMessage(info: INewChannelMessageInfo, privateKey: string): Promise<void>;
    updateUserProfile(content: INostrMetadataContent, privateKey: string): Promise<void>;
    fetchMessageContactsCacheEvents(pubKey: string): Promise<INostrEvent[]>;
    fetchDirectMessages(pubKey: string, sender: string, since?: number, until?: number): Promise<INostrEvent[]>;
    sendMessage(receiver: string, encryptedMessage: string, privateKey: string): Promise<void>;
    resetMessageCount(pubKey: string, sender: string, privateKey: string): Promise<void>;
    fetchGroupKeys(identifier: string): Promise<INostrEvent>;
    fetchUserGroupInvitations(groupKinds: number[], pubKey: string): Promise<INostrEvent[]>;
    updateGroupKeys(identifier: string, groupKind: number, keys: string, invitees: string[], privateKey: string): Promise<INostrSubmitResponse>;
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
    deleteEvents(eventIds: string[], privateKey: string): Promise<INostrSubmitResponse>;
    updateCommunity(info: ICommunityInfo, privateKey: string): Promise<INostrSubmitResponse>;
    updateChannel(info: IChannelInfo, privateKey: string): Promise<INostrSubmitResponse>;
    fetchChannels(channelEventIds: string[]): Promise<INostrEvent[]>;
    updateUserBookmarkedChannels(channelEventIds: string[], privateKey: string): Promise<void>;
    fetchAllUserRelatedChannels(pubKey: string): Promise<INostrEvent[]>;
    fetchUserBookmarkedChannels(pubKey: string): Promise<INostrEvent[]>;
    submitChannelMessage(info: INewChannelMessageInfo, privateKey: string): Promise<void>;
    fetchChannelMessages(channelId: string, since?: number, until?: number): Promise<INostrEvent[]>;
    fetchChannelInfoMessages(creatorId: string, channelId: string): Promise<INostrEvent[]>;
    updateUserBookmarkedCommunities(communities: ICommunityBasicInfo[], privateKey: string): Promise<void>;
    submitCommunityPost(info: INewCommunityPostInfo, privateKey: string): Promise<void>;
    updateUserProfile(content: INostrMetadataContent, privateKey: string): Promise<void>;
    fetchMessageContactsCacheEvents(pubKey: string): Promise<INostrEvent[]>;
    fetchDirectMessages(pubKey: string, sender: string, since?: number, until?: number): Promise<INostrEvent[]>;
    sendMessage(receiver: string, encryptedMessage: string, privateKey: string): Promise<void>;
    resetMessageCount(pubKey: string, sender: string, privateKey: string): Promise<void>;
    fetchGroupKeys(identifier: string): Promise<INostrEvent>;
    fetchUserGroupInvitations(groupKinds: number[], pubKey: string): Promise<INostrEvent[]>;
    updateGroupKeys(identifier: string, groupKind: number, keys: string, invitees: string[], privateKey: string): Promise<INostrSubmitResponse>;
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
    private extractScpData;
    retrievePostPrivateKey(event: INostrEvent, communityUri: string, communityPrivateKey: string): Promise<string>;
    retrieveChannelMessagePrivateKey(event: INostrEvent, channelId: string, communityPrivateKey: string): Promise<string>;
    retrieveCommunityPrivateKey(communityInfo: ICommunityInfo, selfPrivateKey: string): Promise<string>;
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
    fetchCommunityInfo(creatorId: string, communityId: string): Promise<ICommunityInfo>;
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
    private constructUserProfile;
    fetchUserContactList(pubKey: string): Promise<IUserProfile[]>;
    fetchUserFollowersList(pubKey: string): Promise<IUserProfile[]>;
    fetchUserRelayList(pubKey: string): Promise<string[]>;
    getCommunityUri(creatorId: string, communityId: string): string;
    generateGroupKeys(privateKey: string, encryptionPublicKeys: string[]): Promise<{
        groupPrivateKey: string;
        groupPublicKey: string;
        encryptedGroupKeys: Record<string, string>;
    }>;
    createCommunity(newInfo: INewCommunityInfo, creatorId: string, privateKey: string): Promise<ICommunityInfo>;
    updateCommunity(info: ICommunityInfo, privateKey: string): Promise<ICommunityInfo>;
    updateCommunityChannel(communityInfo: ICommunityInfo, privateKey: string): Promise<INostrSubmitResponse>;
    createChannel(channelInfo: IChannelInfo, memberIds: string[], privateKey: string): Promise<IChannelInfo>;
    fetchMyCommunities(pubKey: string): Promise<ICommunityInfo[]>;
    extractBookmarkedCommunities(event: INostrEvent, excludedCommunity?: ICommunityInfo): ICommunityBasicInfo[];
    extractBookmarkedChannels(event: INostrEvent): string[];
    joinCommunity(community: ICommunityInfo, pubKey: string, privateKey: string): Promise<void>;
    leaveCommunity(community: ICommunityInfo, pubKey: string, privateKey: string): Promise<void>;
    private encryptGroupMessage;
    submitCommunityPost(message: string, info: ICommunityInfo, privateKey: string, conversationPath?: IConversationPath): Promise<void>;
    extractChannelInfo(event: INostrEvent): IChannelInfo;
    fetchAllUserRelatedChannels(pubKey: string): Promise<IChannelInfo[]>;
    retrieveChannelMessages(channelId: string, since?: number, until?: number): Promise<INostrEvent[]>;
    retrieveChannelEvents(creatorId: string, channelId: string): Promise<{
        messageEvents: INostrEvent[];
        info: IChannelInfo;
    }>;
    convertPrivateKeyToPubkey(privateKey: string): string;
    retrieveChannelMessageKeys(options: IRetrieveChannelMessageKeysOptions): Promise<Record<string, string>>;
    submitChannelMessage(message: string, channelId: string, privateKey: string, communityPublicKey: string, conversationPath?: IConversationPath): Promise<void>;
    fetchMessageContacts(pubKey: string): Promise<IMessageContactInfo[]>;
    fetchUserGroupInvitations(pubKey: string): Promise<string[]>;
    mapCommunityUriToMemberIdRoleCombo(communities: ICommunityInfo[]): Promise<Record<string, {
        id: string;
        role: CommunityRole;
    }[]>>;
}
export { NostrEventManager, ISocialEventManager, SocialDataManager };
