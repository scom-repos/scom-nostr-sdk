import { Nip19, Event } from "../core/index";
export interface IFetchNotesOptions {
    authors?: string[];
    ids?: string[];
}
export interface INostrEvent {
    id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
    sig: string;
}
export interface INostrFetchEventsResponse {
    error?: string;
    events?: INostrEvent[];
    data?: any;
}
export interface INostrSubmitResponse {
    eventId: string;
    success: boolean;
    message?: string;
    relay?: string;
}
export interface INostrMetadataContent {
    name: string;
    display_name: string;
    displayName?: string;
    username?: string;
    website?: string;
    picture?: string;
    about?: string;
    banner?: string;
    lud16?: string;
    nip05?: string;
}
export interface INostrMetadata {
    id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    sig: string;
    content: INostrMetadataContent;
}
export interface IUserProfile {
    id: string;
    username: string;
    description: string;
    avatar: string;
    npub: string;
    pubkey: string;
    displayName?: string;
    website?: string;
    banner?: string;
    internetIdentifier: string;
    followers?: number;
    lud16?: string;
    metadata?: INostrMetadata;
}
export interface IUserActivityStats {
    notes: number;
    replies: number;
    followers: number;
    following: number;
    relays: number;
    timeJoined: number;
}
export interface INoteInfo {
    eventData: INostrEvent;
    stats?: IPostStats;
    actions?: INoteActions;
}
export interface IAuthor {
    id: string;
    username: string;
    description: string;
    avatar: string;
    pubKey?: string;
    displayName?: string;
    internetIdentifier: string;
}
export interface INoteInfoExtended extends INoteInfo {
    parentAuthor?: IAuthor;
    repost?: IAuthor;
    community?: Omit<INoteCommunityInfo, "eventData">;
}
export interface INoteCommunityInfo {
    eventData: INostrEvent;
    communityUri?: string;
    creatorId?: string;
    communityId?: string;
}
export declare enum NftType {
    ERC721 = "ERC721",
    ERC1155 = "ERC1155"
}
export declare enum TokenType {
    ERC20 = "ERC20",
    ERC721 = "ERC721",
    ERC1155 = "ERC1155"
}
export declare enum ScpStandardId {
    Community = "1",
    CommunityPost = "2",
    Channel = "3",
    ChannelMessage = "4",
    GroupKeys = "5"
}
export declare enum MembershipType {
    Open = "Open",
    Protected = "Protected"
}
export declare enum ProtectedMembershipPolicyType {
    TokenExclusive = "TokenExclusive",
    Whitelist = "Whitelist"
}
export interface IProtectedMembershipPolicy {
    policyType: ProtectedMembershipPolicyType;
    chainId?: number;
    tokenAddress?: string;
    tokenType?: TokenType;
    tokenId?: number;
    tokenAmount?: string;
    memberIds?: string[];
}
export interface ICommunityScpData {
    publicKey?: string;
    encryptedKey?: string;
    gatekeeperPublicKey?: string;
    channelEventId?: string;
}
export interface ICommunityPostScpData {
    communityUri: string;
    encryptedKey?: string;
}
export interface IChannelScpData {
    communityUri?: string;
    publicKey?: string;
}
export interface IChannelMessageScpData {
    channelId: string;
    encryptedKey?: string;
}
export interface ICommunityBasicInfo {
    creatorId: string;
    communityId: string;
}
export interface ICommunityPointSystem {
    createPost: number;
    reply: number;
    like: number;
    repost: number;
}
interface ICommunityCollectibleAction {
    mint?: boolean;
    redeem?: boolean;
}
export interface ICommunityCollectible {
    name: string;
    image?: string;
    description?: string;
    link?: string;
    requiredPoints: number;
    actions?: ICommunityCollectibleAction;
}
export interface ICommunityInfo extends ICommunityBasicInfo {
    communityUri: string;
    description?: string;
    rules?: string;
    bannerImgUrl?: string;
    avatarImgUrl?: string;
    scpData?: ICommunityScpData;
    moderatorIds?: string[];
    eventData?: INostrEvent;
    membershipType: MembershipType;
    memberKeyMap?: Record<string, string>;
    privateRelay?: string;
    gatekeeperNpub?: string;
    policies?: IProtectedMembershipPolicy[];
    pointSystem?: ICommunityPointSystem;
    collectibles?: ICommunityCollectible[];
    enableLeaderboard?: boolean;
    parentCommunityUri?: string;
}
export interface ICommunityLeaderboard {
    npub: string;
    username: string;
    displayName?: string;
    avatar?: string;
    internetIdentifier?: string;
    point: number;
}
export interface INewCommunityInfo {
    name: string;
    description?: string;
    bannerImgUrl?: string;
    avatarImgUrl?: string;
    moderatorIds?: string[];
    rules?: string;
    scpData?: ICommunityScpData;
    membershipType: MembershipType;
    privateRelay?: string;
    gatekeeperNpub?: string;
    policies?: IProtectedMembershipPolicy[];
    pointSystem?: ICommunityPointSystem;
    collectibles?: ICommunityCollectible[];
    enableLeaderboard?: boolean;
}
export interface IChannelInfo {
    id?: string;
    name: string;
    about?: string;
    picture?: string;
    scpData?: IChannelScpData;
    eventData?: INostrEvent;
    communityInfo?: ICommunityInfo;
}
export interface INewChannelMessageInfo {
    channelId: string;
    message: string;
    conversationPath?: IConversationPath;
    scpData?: IChannelMessageScpData;
}
export interface IRetrieveChannelMessageKeysOptions {
    creatorId: string;
    channelId: string;
    privateKey?: string;
    gatekeeperUrl?: string;
    message?: string;
    signature?: string;
}
export interface IConversationPath {
    noteIds: string[];
    authorIds: string[];
}
export interface INewCommunityPostInfo {
    community: ICommunityInfo;
    message: string;
    timestamp?: number;
    conversationPath?: IConversationPath;
    scpData?: ICommunityPostScpData;
}
export interface IRetrieveCommunityPostKeysOptions {
    creatorId: string;
    communityId: string;
    policies?: IProtectedMembershipPolicy[];
    gatekeeperUrl?: string;
    message?: string;
    signature?: string;
}
export interface ICommunityGatekeeperInfo {
    name: string;
    npub: string;
    url: string;
}
export interface IRetrieveCommunityPostKeysByNoteEventsOptions {
    notes: INostrEvent[];
    pubKey: string;
    message: string;
    getSignature: (message: string) => Promise<string>;
    gatekeeperUrl?: string;
}
export interface IRetrieveCommunityThreadPostKeysOptions {
    communityInfo: ICommunityInfo;
    noteEvents: INostrEvent[];
    focusedNoteId: string;
    gatekeeperUrl?: string;
    message?: string;
    signature?: string;
}
export interface IPostStats {
    replies?: number;
    reposts?: number;
    upvotes?: number;
    downvotes?: number;
    views?: number;
    satszapped?: number;
}
export interface INoteActions {
    liked?: boolean;
    replied?: boolean;
    reposted?: boolean;
    zapped?: boolean;
    bookmarked?: boolean;
}
export interface IMessageContactInfo {
    id: string;
    pubKey: string;
    creatorId: string;
    username: string;
    displayName: string;
    avatar?: string;
    banner?: string;
    latestAt?: number;
    cnt?: number;
    isGroup?: boolean;
    channelInfo?: IChannelInfo;
}
export declare enum CommunityRole {
    Creator = "creator",
    Moderator = "moderator",
    GeneralMember = "generalMember",
    None = "none"
}
export interface ICommunityMember {
    id?: string;
    name?: string;
    profileImageUrl?: string;
    username?: string;
    internetIdentifier?: string;
    role: CommunityRole;
}
export interface ICommunity extends ICommunityInfo {
    members: ICommunityMember[];
}
export interface ITrendingCommunityInfo extends ICommunityInfo {
    memberCount: number;
}
export declare enum CalendarEventType {
    DateBased = "dateBased",
    TimeBased = "timeBased"
}
export interface ICalendarEventBasicInfo {
    id: string;
    title: string;
    description: string;
    start: number;
    end?: number;
    startTzid?: string;
    endTzid?: string;
    type: CalendarEventType;
    location?: string;
    latitude?: number;
    longitude?: number;
    city?: string;
    image?: string;
}
export interface ICalendarEventInfo extends ICalendarEventBasicInfo {
    naddr: string;
    eventData?: INostrEvent;
    geohash?: string;
}
export interface IUpdateCalendarEventInfo extends ICalendarEventBasicInfo {
    geohash?: string;
    hostIds?: string[];
}
export interface ICalendarEventHost {
    pubkey: string;
    userProfile?: IUserProfile;
}
export interface ICalendarEventAttendee {
    pubkey: string;
    userProfile?: IUserProfile;
    rsvpEventData?: INostrEvent;
}
export interface ICalendarEventDetailInfo extends ICalendarEventInfo {
    hosts?: ICalendarEventHost[];
    attendees?: ICalendarEventAttendee[];
    notes?: INoteInfo[];
}
export interface INewCalendarEventPostInfo {
    calendarEventUri: string;
    message: string;
    conversationPath?: IConversationPath;
}
export interface ILocationCoordinates {
    latitude: number;
    longitude: number;
}
export interface ISocialDataManagerConfig {
    version?: 1 | 1.5 | 2;
    writeRelays?: string[];
    readRelay?: string;
    readManager?: ISocialEventManagerRead;
    publicIndexingRelay?: string;
    apiBaseUrl?: string;
    ipLocationServiceBaseUrl?: string;
    ipLocationServiceApiKey?: string;
    mqttBrokerUrl?: string;
    mqttSubscriptions?: string[];
    mqttMessageCallback?: (topic: string, message: string) => void;
    enableLightningWallet?: boolean;
}
export interface ILongFormContentInfo {
    id: string;
    content: string;
    markdownContent: string;
    title?: string;
    image?: string;
    summary?: string;
    createdAt?: number;
    publishedAt?: number;
    eventData?: INostrEvent;
    hashtags?: string[];
}
export interface IAllUserRelatedChannels {
    channels: IChannelInfo[];
    channelMetadataMap: Record<string, IChannelInfo>;
    channelIdToCommunityMap: Record<string, ICommunityInfo>;
}
export interface IRelayConfig {
    read: boolean;
    write: boolean;
}
export interface IPaymentActivity {
    paymentHash: string;
    sender: string;
    recipient: string;
    amount: string;
    status: string;
    createdAt: number;
}
export interface IEthWalletAccountsInfo {
    masterWalletSignature: string;
    socialWalletSignature: string;
    encryptedKey: string;
    masterWalletHash: string;
    eventData?: INostrEvent;
}
export interface INostrCommunicationManager {
    fetchEvents(...requests: any): Promise<INostrFetchEventsResponse>;
    fetchCachedEvents(eventType: string, msg: any): Promise<INostrFetchEventsResponse>;
    submitEvent(event: Event.VerifiedEvent<number>): Promise<INostrSubmitResponse>;
}
export interface ISocialEventManagerReadResult {
    error?: string;
    events?: INostrEvent[];
    data?: any;
}
export declare namespace SocialDataManagerOptions {
    interface IFetchUserEthWalletAccountsInfoOptions {
        walletHash?: string;
        pubKey?: string;
    }
}
export declare namespace SocialEventManagerReadOptions {
    interface IFetchThreadCacheEvents {
        id: string;
        pubKey?: string;
    }
    interface IFetchTrendingCacheEvents {
        pubKey?: string;
    }
    interface IFetchProfileFeedCacheEvents {
        userPubkey: string;
        pubKey: string;
        since?: number;
        until?: number;
    }
    interface IFetchProfileRepliesCacheEvents {
        userPubkey: string;
        pubKey: string;
        since?: number;
        until?: number;
    }
    interface IFetchHomeFeedCacheEvents {
        pubKey?: string;
        since?: number;
        until?: number;
    }
    interface IFetchUserProfileCacheEvents {
        pubKeys: string[];
    }
    interface IFetchUserProfileDetailCacheEvents {
        pubKey: string;
    }
    interface IFetchContactListCacheEvents {
        pubKey: string;
        detailIncluded?: boolean;
    }
    interface IFetchUserRelays {
        pubKey: string;
    }
    interface IFetchFollowersCacheEvents {
        pubKey: string;
    }
    interface IFetchCommunities {
        pubkeyToCommunityIdsMap?: Record<string, string[]>;
        query?: string;
    }
    interface IFetchAllUserRelatedCommunities {
        pubKey: string;
    }
    interface IFetchAllUserRelatedCommunitiesFeed {
        pubKey: string;
        since?: number;
        until?: number;
    }
    interface IFetchUserBookmarkedCommunities {
        pubKey: string;
        excludedCommunity?: ICommunityInfo;
    }
    interface IFetchCommunity {
        creatorId: string;
        communityId: string;
    }
    interface IFetchCommunitiesMetadataFeed {
        communities?: ICommunityBasicInfo[];
        since?: number;
        until?: number;
        noteCountsIncluded?: boolean;
    }
    interface IFetchCommunityMetadataFeed {
        since?: number;
        until?: number;
        statsIncluded?: boolean;
        communityCreatorId?: string;
        communityName?: string;
    }
    interface IFetchCommunityFeed {
        communityUri: string;
        since?: number;
        until?: number;
    }
    interface IFetchCommunitiesFeed {
        communityUriArr: string[];
        since?: number;
        until?: number;
    }
    interface IFetchCommunitiesGeneralMembers {
        communities: ICommunityBasicInfo[];
    }
    interface IFetchNotes {
        options: IFetchNotesOptions;
    }
    interface IFetchEventsByIds {
        ids: string[];
    }
    interface IFetchAllUserRelatedChannels {
        pubKey: string;
    }
    interface IFetchUserBookmarkedChannelEventIds {
        pubKey: string;
    }
    interface IFetchChannelMessages {
        channelId: string;
        since?: number;
        until?: number;
    }
    interface IFetchChannelInfoMessages {
        channelId: string;
    }
    interface IFetchMessageContactsCacheEvents {
        pubKey: string;
    }
    interface IFetchDirectMessages {
        pubKey: string;
        sender: string;
        since?: number;
        until?: number;
    }
    interface IResetMessageCount {
        pubKey: string;
        sender: string;
    }
    interface IFetchGroupKeys {
        identifiers: string[];
    }
    interface IFetchUserGroupInvitations {
        groupKinds: number[];
        pubKey: string;
    }
    interface IFetchCalendarEventPosts {
        calendarEventUri: string;
    }
    interface IFetchCalendarEvents {
        start: number;
        end?: number;
        limit?: number;
        previousEventId?: string;
    }
    interface IFetchCalendarEvent {
        address: Nip19.AddressPointer;
    }
    interface IFetchCalendarEventRSVPs {
        calendarEventUri: string;
        pubkey?: string;
    }
    interface IFetchLongFormContentEvents {
        pubKey?: string;
        since?: number;
        until?: number;
    }
    interface ISearchUsers {
        query: string;
    }
    interface IFetchPaymentRequestEvent {
        paymentRequest: string;
    }
    interface IFetchPaymentReceiptEvent {
        requestEventId: string;
    }
    interface IFetchPaymentActivitiesForRecipient {
        pubkey: string;
        since?: number;
        until?: number;
    }
    interface IFetchPaymentActivitiesForSender {
        pubkey: string;
        since?: number;
        until?: number;
    }
    interface IFetchUserFollowingFeed {
        pubKey: string;
        until?: number;
    }
    interface IFetchCommunityPinnedNotesEvent {
        creatorId: string;
        communityId: string;
    }
    interface IFetchCommunityPinnedNoteIds {
        creatorId: string;
        communityId: string;
    }
    interface IFetchUserPinnedNotes {
        pubKey: string;
    }
    interface IFetchUserBookmarks {
        pubKey: string;
    }
    interface IFetchUserEthWalletAccountsInfo {
        walletHash?: string;
        pubKey?: string;
    }
}
export interface ISocialEventManagerRead {
    nostrCommunicationManager: INostrCommunicationManager | INostrRestAPIManager;
    privateKey: string;
    fetchThreadCacheEvents(options: SocialEventManagerReadOptions.IFetchThreadCacheEvents): Promise<INostrEvent[]>;
    fetchTrendingCacheEvents(options: SocialEventManagerReadOptions.IFetchTrendingCacheEvents): Promise<INostrEvent[]>;
    fetchProfileFeedCacheEvents(options: SocialEventManagerReadOptions.IFetchProfileFeedCacheEvents): Promise<INostrEvent[]>;
    fetchProfileRepliesCacheEvents(options: SocialEventManagerReadOptions.IFetchProfileRepliesCacheEvents): Promise<INostrEvent[]>;
    fetchHomeFeedCacheEvents(options: SocialEventManagerReadOptions.IFetchHomeFeedCacheEvents): Promise<INostrEvent[]>;
    fetchUserProfileCacheEvents(options: SocialEventManagerReadOptions.IFetchUserProfileCacheEvents): Promise<INostrEvent[]>;
    fetchUserProfileDetailCacheEvents(options: SocialEventManagerReadOptions.IFetchUserProfileDetailCacheEvents): Promise<INostrEvent[]>;
    fetchContactListCacheEvents(options: SocialEventManagerReadOptions.IFetchContactListCacheEvents): Promise<INostrEvent[]>;
    fetchUserRelays(options: SocialEventManagerReadOptions.IFetchUserRelays): Promise<INostrEvent[]>;
    fetchFollowersCacheEvents(options: SocialEventManagerReadOptions.IFetchFollowersCacheEvents): Promise<INostrEvent[]>;
    fetchCommunities(options: SocialEventManagerReadOptions.IFetchCommunities): Promise<INostrEvent[]>;
    fetchAllUserRelatedCommunities(options: SocialEventManagerReadOptions.IFetchAllUserRelatedCommunities): Promise<INostrEvent[]>;
    fetchAllUserRelatedCommunitiesFeed(options: SocialEventManagerReadOptions.IFetchAllUserRelatedCommunitiesFeed): Promise<INostrEvent[]>;
    fetchUserBookmarkedCommunities(options: SocialEventManagerReadOptions.IFetchUserBookmarkedCommunities): Promise<ICommunityBasicInfo[]>;
    fetchCommunity(options: SocialEventManagerReadOptions.IFetchCommunity): Promise<INostrEvent[]>;
    fetchCommunitiesMetadataFeed(options: SocialEventManagerReadOptions.IFetchCommunitiesMetadataFeed): Promise<INostrEvent[]>;
    fetchCommunityMetadataFeed(options: SocialEventManagerReadOptions.IFetchCommunityMetadataFeed): Promise<INostrEvent[]>;
    fetchCommunityFeed(options: SocialEventManagerReadOptions.IFetchCommunityFeed): Promise<INostrEvent[]>;
    fetchCommunitiesGeneralMembers(options: SocialEventManagerReadOptions.IFetchCommunitiesGeneralMembers): Promise<INostrEvent[]>;
    fetchEventsByIds(options: SocialEventManagerReadOptions.IFetchEventsByIds): Promise<INostrEvent[]>;
    fetchAllUserRelatedChannels(options: SocialEventManagerReadOptions.IFetchAllUserRelatedChannels): Promise<IAllUserRelatedChannels>;
    fetchUserBookmarkedChannelEventIds(options: SocialEventManagerReadOptions.IFetchUserBookmarkedChannelEventIds): Promise<string[]>;
    fetchChannelMessages(options: SocialEventManagerReadOptions.IFetchChannelMessages): Promise<INostrEvent[]>;
    fetchChannelInfoMessages(options: SocialEventManagerReadOptions.IFetchChannelInfoMessages): Promise<INostrEvent[]>;
    fetchMessageContactsCacheEvents(options: SocialEventManagerReadOptions.IFetchMessageContactsCacheEvents): Promise<INostrEvent[]>;
    fetchDirectMessages(options: SocialEventManagerReadOptions.IFetchDirectMessages): Promise<INostrEvent[]>;
    resetMessageCount(options: SocialEventManagerReadOptions.IResetMessageCount): Promise<void>;
    fetchGroupKeys(options: SocialEventManagerReadOptions.IFetchGroupKeys): Promise<INostrEvent[]>;
    fetchUserGroupInvitations(options: SocialEventManagerReadOptions.IFetchUserGroupInvitations): Promise<INostrEvent[]>;
    fetchCalendarEventPosts(options: SocialEventManagerReadOptions.IFetchCalendarEventPosts): Promise<INostrEvent[]>;
    fetchCalendarEvents(options: SocialEventManagerReadOptions.IFetchCalendarEvents): Promise<ISocialEventManagerReadResult>;
    fetchCalendarEvent(options: SocialEventManagerReadOptions.IFetchCalendarEvent): Promise<INostrEvent | null>;
    fetchCalendarEventRSVPs(options: SocialEventManagerReadOptions.IFetchCalendarEventRSVPs): Promise<INostrEvent[]>;
    fetchLongFormContentEvents(options: SocialEventManagerReadOptions.IFetchLongFormContentEvents): Promise<INostrEvent[]>;
    searchUsers(options: SocialEventManagerReadOptions.ISearchUsers): Promise<INostrEvent[]>;
    fetchPaymentRequestEvent(options: SocialEventManagerReadOptions.IFetchPaymentRequestEvent): Promise<INostrEvent>;
    fetchPaymentReceiptEvent(options: SocialEventManagerReadOptions.IFetchPaymentReceiptEvent): Promise<INostrEvent>;
    fetchPaymentActivitiesForRecipient(options: SocialEventManagerReadOptions.IFetchPaymentActivitiesForRecipient): Promise<IPaymentActivity[]>;
    fetchPaymentActivitiesForSender(options: SocialEventManagerReadOptions.IFetchPaymentActivitiesForSender): Promise<IPaymentActivity[]>;
    fetchUserFollowingFeed(options: SocialEventManagerReadOptions.IFetchUserFollowingFeed): Promise<INostrEvent[]>;
    fetchCommunityPinnedNotesEvent(options: SocialEventManagerReadOptions.IFetchCommunityPinnedNotesEvent): Promise<INostrEvent>;
    fetchCommunityPinnedNoteIds(options: SocialEventManagerReadOptions.IFetchCommunityPinnedNoteIds): Promise<string[]>;
    fetchUserPinnedNotes(options: SocialEventManagerReadOptions.IFetchUserPinnedNotes): Promise<INostrEvent>;
    fetchUserBookmarks(options: SocialEventManagerReadOptions.IFetchUserBookmarks): Promise<INostrEvent>;
    fetchTrendingCommunities(): Promise<INostrEvent[]>;
    fetchUserEthWalletAccountsInfo(options: SocialEventManagerReadOptions.IFetchUserEthWalletAccountsInfo): Promise<INostrEvent>;
}
export declare namespace SocialEventManagerWriteOptions {
    interface IUpdateUserEthWalletAccountsInfo {
        masterWalletSignature: string;
        socialWalletSignature: string;
        encryptedKey: string;
        masterWalletHash: string;
    }
}
export interface ISocialEventManagerWrite {
    nostrCommunicationManagers: INostrCommunicationManager[];
    privateKey: string;
    updateContactList(content: string, contactPubKeys: string[]): Promise<void>;
    postNote(content: string, conversationPath?: IConversationPath, createdAt?: number): Promise<string>;
    deleteEvents(eventIds: string[]): Promise<INostrSubmitResponse[]>;
    updateCommunity(info: ICommunityInfo): Promise<INostrSubmitResponse[]>;
    updateChannel(info: IChannelInfo): Promise<INostrSubmitResponse[]>;
    updateUserBookmarkedChannels(channelEventIds: string[]): Promise<void>;
    submitChannelMessage(info: INewChannelMessageInfo): Promise<void>;
    updateUserBookmarkedCommunities(communities: ICommunityBasicInfo[]): Promise<void>;
    submitCommunityPost(info: INewCommunityPostInfo): Promise<INostrSubmitResponse[]>;
    updateUserProfile(content: INostrMetadataContent): Promise<void>;
    sendMessage(receiver: string, encryptedMessage: string, replyToEventId?: string): Promise<void>;
    updateGroupKeys(identifier: string, groupKind: number, keys: string, invitees: string[]): Promise<INostrSubmitResponse[]>;
    updateCalendarEvent(info: IUpdateCalendarEventInfo): Promise<INostrSubmitResponse[]>;
    createCalendarEventRSVP(rsvpId: string, calendarEventUri: string, accepted: boolean): Promise<INostrSubmitResponse[]>;
    submitCalendarEventPost(info: INewCalendarEventPostInfo): Promise<INostrSubmitResponse[]>;
    submitLongFormContentEvents(info: ILongFormContentInfo): Promise<string>;
    submitLike(tags: string[][]): Promise<void>;
    submitRepost(content: string, tags: string[][]): Promise<void>;
    updateRelayList(relays: Record<string, IRelayConfig>): Promise<void>;
    createPaymentRequestEvent(paymentRequest: string, amount: string, comment: string, isLightningInvoice?: boolean): Promise<void>;
    createPaymentReceiptEvent(requestEventId: string, recipient: string, comment: string, preimage?: string, tx?: string): Promise<void>;
    updateCommunityPinnedNotes(creatorId: string, communityId: string, eventIds: string[]): Promise<void>;
    updateUserPinnedNotes(eventIds: string[]): Promise<void>;
    updateUserBookmarks(tags: string[][]): Promise<void>;
    updateUserEthWalletAccountsInfo(options: SocialEventManagerWriteOptions.IUpdateUserEthWalletAccountsInfo, privateKey?: string): Promise<INostrSubmitResponse[]>;
}
export interface INostrRestAPIManager extends INostrCommunicationManager {
    fetchEventsFromAPI(endpoint: string, msg: any): Promise<INostrFetchEventsResponse>;
}
export {};
