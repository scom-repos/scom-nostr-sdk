
import { Nip19, Event } from "../core/index";
export interface IFetchNotesOptions {
	authors?: string[];
	ids?: string[];
}

export interface INostrEvent {
    id: string;  // 32-bytes lowercase hex-encoded sha256
    pubkey: string;  // 32-bytes lowercase hex-encoded public key
    created_at: number;  // Unix timestamp in seconds
    kind: number;  // Integer between 0 and 65535
    tags: string[][];  // Array of arrays of arbitrary strings
    content: string;  // Arbitrary string
    sig: string;  // 64-bytes lowercase hex of signature
}

export interface INostrFetchEventsResponse {
	error?: string;
	events?: INostrEvent[];
	data?: any
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

export enum NftType {
	ERC721 = 'ERC721',
    ERC1155	= 'ERC1155'
}

export enum TokenType {
	ERC20 = 'ERC20',
	ERC721	= 'ERC721',
	ERC1155	= 'ERC1155'
}

export enum ScpStandardId {
	Community = '1',
	CommunityPost = '2',
	Channel = '3',
	ChannelMessage = '4',
	GroupKeys = '5',
}

export enum MembershipType {
	Open = 'Open',
	Protected = 'Protected'
}

export enum ProtectedMembershipPolicyType {
	TokenExclusive = 'TokenExclusive',
	Whitelist = 'Whitelist'
}

export interface IProtectedMembershipPolicy {
	type: ProtectedMembershipPolicyType;
	chainId?: number;
	tokenAddress?: string;
	tokenType?: TokenType;
	tokenId?: number;
	tokenAmount?: string;
	memberIds?: string[];
}

//SCP-1 Kind 34550
export interface ICommunityScpData {
	publicKey?: string;
	encryptedKey?: string;
	gatekeeperPublicKey?: string;
	channelEventId?: string;
}

//SCP-2 Kind 1
export interface ICommunityPostScpData {
	communityUri: string;
	encryptedKey?: string;
}

//SCP-3 Kind 40
export interface IChannelScpData {
	communityUri?: string; //For community channels
	publicKey?: string;
}

//SCP-4 Kind 42
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
	// memberIds?: string[];
	memberKeyMap?: Record<string, string>;
	privateRelay?: string;
	gatekeeperNpub?: string;
	policies?: IProtectedMembershipPolicy[];
	pointSystem?: ICommunityPointSystem;
	collectibles?: ICommunityCollectible[];
	enableLeaderboard?: boolean;
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
	// memberIds?: string[];
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
	getSignature: (message: string) => Promise<string>
	// gatekeepers: ICommunityGatekeeperInfo[];
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

export enum CommunityRole {
	Creator = 'creator',
	Moderator = 'moderator',
	GeneralMember = 'generalMember',
	None = 'none'
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

export enum CalendarEventType {
	DateBased = 'dateBased',
	TimeBased = 'timeBased'
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
export interface INostrCommunicationManager {
    fetchEvents(...requests: any): Promise<INostrFetchEventsResponse>;
    fetchCachedEvents(eventType: string, msg: any): Promise<INostrFetchEventsResponse>;
    submitEvent(event: Event.VerifiedEvent<number>): Promise<INostrSubmitResponse>;
}
export interface ISocialEventManagerRead {
    nostrCommunicationManager: INostrCommunicationManager | INostrRestAPIManager;
    privateKey: string;
    fetchThreadCacheEvents(id: string, pubKey?: string): Promise<INostrEvent[]>;
    fetchTrendingCacheEvents(pubKey?: string): Promise<INostrEvent[]>;
    fetchProfileFeedCacheEvents(userPubkey: string, pubKey: string, since?: number, until?: number): Promise<INostrEvent[]>;
    fetchProfileRepliesCacheEvents(userPubkey: string, pubKey: string, since?: number, until?: number): Promise<INostrEvent[]>;
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
    fetchCommunitiesMetadataFeed(communities: ICommunityBasicInfo[]): Promise<INostrEvent[]>;
    fetchCommunityFeed(communityUri: string, since?: number, until?: number): Promise<INostrEvent[]>;
    fetchCommunitiesFeed(communityUriArr: string[]): Promise<INostrEvent[]>;
    fetchCommunitiesGeneralMembers(communities: ICommunityBasicInfo[]): Promise<INostrEvent[]>;
    fetchNotes(options: IFetchNotesOptions): Promise<INostrEvent[]>;
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
    resetMessageCount(pubKey: string, sender: string): Promise<void>;
    fetchGroupKeys(identifier: string): Promise<INostrEvent>;
    fetchUserGroupInvitations(groupKinds: number[], pubKey: string): Promise<INostrEvent[]>;
    fetchCalendarEventPosts(calendarEventUri: string): Promise<INostrEvent[]>;
    fetchCalendarEvents(start: number, end?: number, limit?: number, previousEventId?: string): Promise<INostrEvent[]>;
    fetchCalendarEvent(address: Nip19.AddressPointer): Promise<INostrEvent | null>;
    fetchCalendarEventRSVPs(calendarEventUri: string, pubkey?: string): Promise<INostrEvent[]>;
    fetchLongFormContentEvents(pubKey?: string, since?: number, until?: number): Promise<INostrEvent[]>;
    // fetchLikes(eventId: string): Promise<INostrEvent[]>;
    searchUsers(query: string): Promise<INostrEvent[]>;
    fetchPaymentRequestEvent(paymentRequest: string): Promise<INostrEvent>;
    fetchPaymentReceiptEvent(requestEventId: string): Promise<INostrEvent>;
    fetchPaymentActivitiesForRecipient(pubkey: string, since?: number, until?: number): Promise<IPaymentActivity[]>;
    fetchPaymentActivitiesForSender(pubKey: string, since?: number, until?: number): Promise<IPaymentActivity[]>;
    fetchUserFollowingFeed(pubKey: string, until?: number): Promise<INostrEvent[]>;
    fetchCommunityPinnedNotes(creatorId: string, communityId: string): Promise<INostrEvent>;
    fetchUserPinnedNotes(pubKey: string): Promise<INostrEvent>;
}

export interface INostrRestAPIManager extends INostrCommunicationManager {
    fetchEventsFromAPI(endpoint: string, msg: any): Promise<INostrFetchEventsResponse>;
}