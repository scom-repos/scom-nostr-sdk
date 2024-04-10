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
export declare enum ScpStandardId {
    Community = "1",
    CommunityPost = "2",
    Channel = "3",
    ChannelMessage = "4",
    GroupKeys = "5"
}
export declare enum MembershipType {
    Open = "Open",
    NFTExclusive = "NFTExclusive",
    InviteOnly = "InviteOnly"
}
export interface ICommunityScpData {
    chainId: number;
    nftAddress: string;
    nftType: NftType;
    nftId?: number;
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
export interface ICommunityInfo extends ICommunityBasicInfo {
    communityUri: string;
    description?: string;
    rules?: string;
    bannerImgUrl?: string;
    avatarImgUrl?: string;
    gatekeeperNpub?: string;
    scpData?: ICommunityScpData;
    moderatorIds?: string[];
    eventData?: INostrEvent;
    membershipType: MembershipType;
    memberIds?: string[];
    memberKeyMap?: Record<string, string>;
}
export interface INewCommunityInfo {
    name: string;
    description?: string;
    bannerImgUrl?: string;
    avatarImgUrl?: string;
    moderatorIds?: string[];
    rules?: string;
    gatekeeperNpub?: string;
    scpData?: ICommunityScpData;
    membershipType: MembershipType;
    memberIds?: string[];
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
    conversationPath?: IConversationPath;
    scpData?: ICommunityPostScpData;
}
export interface IRetrieveCommunityPostKeysOptions {
    creatorId: string;
    communityId: string;
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
    getSignature: (message: string) => Promise<string>;
    gatekeepers: ICommunityGatekeeperInfo[];
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
    version?: 1 | 2;
    writeRelays: string[];
    readRelay: string;
    publicIndexingRelay: string;
    apiBaseUrl: string;
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
    title?: string;
    image?: string;
    summary?: string;
    publishedAt?: number;
    eventData?: INostrEvent;
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
