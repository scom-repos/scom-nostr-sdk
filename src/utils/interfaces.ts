
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
	requestId?: string;
}

export interface INostrSubmitResponse {
	relay: string;
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
	eth_wallet?: string;
	telegram_account?: string;
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
	ethWallet?: string;
	telegramAccount?: string;
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
	community?: INoteCommunity;
}

export interface INoteCommunity {
	communityUri?: string;
	creatorId?: string;
	communityId?: string;
	photoUrl?: string;
	privateRelay?: string;
	parentCommunityUri?: string;
	isExclusive?: boolean;
	isWhitelist?: boolean;
	policies?: IProtectedMembershipPolicy[];
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

export enum PaymentModel {
	OneTimePurchase = 'OneTimePurchase',
	Subscription = 'Subscription'
}

export enum PaymentMethod {
	EVM = "EVM",
	TON = "TON",
	Telegram = "Telegram"
}

export enum CampaignActivityType {
	LuckySpin = "LuckySpin",
	Quest = "Quest",
	BlindBox = "BlindBox",
	Quiz = "Quiz"
}

export enum SubscriptionBundleType {
	NoDiscount = "NoDiscount",
	MinimumDuration = "MinimumDuration",
	ValidityPeriod = "ValidityPeriod"
}

export enum MarketplaceProductType {
	Physical = "Physical",
	Digital = "Digital",
	Course = "Course",
	Ebook = "Ebook",
	Membership = "Membership",
	Bundle = "Bundle"
}

export interface ISubscriptionDiscountRule {
	id: number;
	name: string;
	isDisplayAsTitle: boolean;
	bundleType: SubscriptionBundleType;
	startTime: number;
	endTime: number;
	minDuration?: number;
	discountType?: 'Percentage' | 'FixedAmount';
	discountPercentage?: number;
	fixedPrice?: number;
	discountApplication: number; // 0: FirstTimeOnly, 1: RenewalsOnly, 2: All
}

export interface IProtectedMembershipPolicy {
	policyType: ProtectedMembershipPolicyType;
	name?: string;
	isExistingNFT?: boolean;
	paymentModel?: PaymentModel;
	paymentMethod?: PaymentMethod;
	chainId?: number;
	tokenAddress?: string;
	tokenType?: TokenType;
	tokenId?: number;
	tokenAmount?: string;
	currency?: string;
	durationInDays?: number;
	memberIds?: string[];
	discountRules?: ISubscriptionDiscountRule[];
	commissionRate?: number;
	affiliates?: string[];
    recipient?: string;
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

export interface ICommunityPostStatusOption {
	status: string;
	isDefault?: boolean;
}

export interface ICommunityCampaign {
	name: string;
	bannerImgUrl?: string;
	startTime?: number;
	endTime?: number;
	activities?: Array<ILuckySpin>;
}

export interface IQuest {
	title: string;
	link: string;
	isCompleted?: boolean;
	point: number;
}

export interface ICommunityCampaignActivity {
	type?: CampaignActivityType;
}

export interface ILuckySpin extends ICommunityCampaignActivity {
	rewards?: ILuckySpinReward[];
	startTime?: number;
	endTime?: number;
	cost?: number;
	currency?: string;
}

export interface ILuckySpinReward {
	name: string;
	icon?: string;
	weight?: number;
}

export interface ICampaignQuest extends ICommunityCampaignActivity {
	quests?: IQuest[];
	startTime?: number;
	endTime?: number;
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
	telegramBotUsername?: string;
	// memberIds?: string[];
	memberKeyMap?: Record<string, string>;
	privateRelay?: string;
	gatekeeperNpub?: string;
	policies?: IProtectedMembershipPolicy[];
	pointSystem?: ICommunityPointSystem;
	collectibles?: ICommunityCollectible[];
	enableLeaderboard?: boolean;
	parentCommunityUri?: string;
	postStatusOptions?: ICommunityPostStatusOption[];
	campaigns?: ICommunityCampaign[];
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
	telegramBotUsername?: string;
	// memberIds?: string[];
	privateRelay?: string;
	gatekeeperNpub?: string;
	policies?: IProtectedMembershipPolicy[];
	pointSystem?: ICommunityPointSystem;
	collectibles?: ICommunityCollectible[];
	enableLeaderboard?: boolean;
	parentCommunityUri?: string;
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
	alt?: string;
}

export interface IRetrieveCommunityPostKeysOptions {
	communityInfo: ICommunityInfo;
	noteInfoList: INoteInfo[];
	policies?: IProtectedMembershipPolicy[];
	gatekeeperUrl?: string;
	message?: string;
	signature?: string;
	since?: number;
	until?: number;
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
	// gatekeepers: ICommunityGatekeeperInfo[];
}

export interface IRetrieveCommunityThreadPostKeysOptions {
	communityInfo: ICommunityInfo;
	noteInfoList: INoteInfo[];
	focusedNoteId: string;
	gatekeeperUrl?: string;
	message?: string;
	signature?: string;
}

export interface ICheckIfUserHasAccessToCommunityOptions {
	communityInfo: ICommunityInfo;
	gatekeeperUrl: string;
	walletAddresses: string[];
}

export interface IPostStats {
	replies?: number;
	reposts?: number;
	upvotes?: number;
	downvotes?: number;
	views?: number;
	satszapped?: number;
	status?: string;
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
	memberCount?: number;
}

export interface ITrendingCommunityInfo extends ICommunityInfo {
	memberCount: number;
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

export interface IMqttClientOptions {
	username: string;
	password: string;
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
	mqttClientOptions?: IMqttClientOptions;
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

export interface ICommunityStats {
	notesCount: number;
	subcommunitiesCount: number;
	membersCount: number;
}

export interface ICommunityDetailMetadata {
	info: ICommunityInfo;
	stats: ICommunityStats;
}

export interface ISendTempMessageOptions {
	receiverId: string;
	message: string;
	replyToEventId?: string;
	widgetId?: string;
}

export interface IDecryptPostPrivateKeyForCommunityOptions {
	event: INostrEvent;
	selfPubkey?: string;
	communityUri: string;
	communityPublicKey?: string;
	communityPrivateKey: string;
}

export interface INftSubscription {
	nftId: number;
	startTime: number;
	endTime: number;
}

export interface ICommunitySubscription {
	start: number;
    end: number;
	currency: string;
    chainId?: string;
    nftAddress?: string;
    nftId?: number;
    txHash?: string;
}

export interface IUpdateCommunitySubscription {
	communityCreatorId: string;
	communityId: string;
	start: number;
	end: number;
	chainId?: string;
	currency: string;
	txHash: string;
}

export interface IMarketplaceStallShipping {
	id: string;
	name?: string;
	cost: number;
	regions?: string[];
}

export interface IMarketplaceStall {
	id: string;
	name: string;
	description?: string;
	currency: string;
	shipping: IMarketplaceStallShipping[];
}

export interface IMarketplaceProduct {
	id: string;
	stallId: string;
	productType: MarketplaceProductType;
	name: string;
	description?: string;
	images?: string[];
	currency: string;
	price: number;
	quantity: number;
	specs?: string[][];
	shipping?: IMarketplaceStallShipping[];
}

export interface ICommunityStallInfo extends IMarketplaceStall {
	communityUri?: string;
	eventData?: INostrEvent;
}

export interface ICommunityProductInfo extends IMarketplaceProduct {
	communityUri?: string;
	stallUri?: string;
	eventData?: INostrEvent;
}

export interface IRegion {
	code: string;
	name: string;
}

export interface ICurrency {
	code: string;
	name: string;
}

export interface INostrCommunicationManager {
	url: string;
    fetchEvents(...requests: any): Promise<INostrFetchEventsResponse>;
    fetchCachedEvents(eventType: string, msg: any): Promise<INostrFetchEventsResponse>;
    submitEvent(event: Event.VerifiedEvent<number>, authHeader?: string): Promise<INostrSubmitResponse>;
}
export interface ISocialEventManagerReadResult {
	error?: string;
	events?: INostrEvent[];
	data?: any;
}

export interface ISocialEventManagerWriteResult {
	relayResponse: INostrSubmitResponse;
	event: INostrEvent;
}

export namespace SocialDataManagerOptions {
	export interface IFetchUserEthWalletAccountsInfoOptions {
		walletHash?: string;
		pubKey?: string;
	}
}

export namespace SocialEventManagerReadOptions {
	export interface IFetchThreadCacheEvents {
		id: string;
		pubKey?: string;
	}
	export interface IFetchTrendingCacheEvents {
		pubKey?: string;
	}
	export interface IFetchProfileFeedCacheEvents {
		userPubkey: string;
		pubKey: string;
		since?: number;
		until?: number;
	}
	export interface IFetchProfileRepliesCacheEvents {
		userPubkey: string;
		pubKey: string;
		since?: number;
		until?: number;
	}
	export interface IFetchHomeFeedCacheEvents {
		pubKey?: string;
		since?: number;
		until?: number;
	}
	export interface IFetchUserProfileCacheEvents {
		pubKeys: string[];
	}
	export interface IFetchUserProfileDetailEvents {
		pubKey?: string;
		telegramAccount?: string;
	}
	export interface IFetchContactListCacheEvents {
		pubKey: string;
		detailIncluded?: boolean;
	}
	export interface IFetchUserRelays {
		pubKey: string;
	}
	export interface IFetchFollowersCacheEvents {
		pubKey: string;
	}
	export interface IFetchCommunities {
		pubkeyToCommunityIdsMap?: Record<string, string[]>;
		query?: string; //Not supported for eventManagerRead
	}
	export interface IFetchAllUserRelatedCommunities {
		pubKey: string;
	}
	export interface IFetchAllUserRelatedCommunitiesFeed {
		pubKey: string;
		since?: number;
		until?: number;
	}
	export interface IFetchUserBookmarkedCommunities {
		pubKey: string;
		excludedCommunity?: ICommunityInfo;
	}
	export interface IFetchCommunity extends ICommunityBasicInfo {}
	export interface IFetchCommunityFeed {
		communityUri: string;
		since?: number;
		until?: number;
	}
	export interface IFetchCommunitiesFeed {
		communityUriArr: string[];
		since?: number;
		until?: number;
	}
	export interface IFetchCommunityDetailMetadata {
		communityCreatorId: string;
		communityName: string;
	}
	export interface IFetchCommunitiesGeneralMembers {
		communities: ICommunityBasicInfo[];
	}
	export interface IFetchNotes {
		options: IFetchNotesOptions;
	}
	export interface IFetchEventsByIds {
		ids: string[];
	}
	export interface IFetchTempEvents {
		ids: string[];
	}
	export interface IFetchAllUserRelatedChannels {
		pubKey: string;
	}
	export interface IFetchUserBookmarkedChannelEventIds {
		pubKey: string;
	}
	export interface IFetchChannelMessages {
		channelId: string;
		since?: number;
		until?: number;
	}
	export interface IFetchChannelInfoMessages {
		channelId: string;
	}
	export interface IFetchMessageContactsCacheEvents {
		pubKey: string;
	}
	export interface IFetchDirectMessages {
		pubKey: string;
		sender: string;
		since?: number;
		until?: number;
	}
	export interface IResetMessageCount {
		pubKey: string;
		sender: string;
	}
	export interface IFetchGroupKeys {
		identifiers: string[];
	}
	export interface IFetchUserGroupInvitations {
		groupKinds: number[];
		pubKey: string;
	}
	export interface IFetchCalendarEventPosts {
		calendarEventUri: string;
	}
	export interface IFetchCalendarEvents {
		start: number;
		end?: number;
		limit?: number;
		previousEventId?: string;
	}
	export interface IFetchCalendarEvent {
		address: Nip19.AddressPointer;
	}
	export interface IFetchCalendarEventRSVPs {
		calendarEventUri: string;
		pubkey?: string;
	}
	export interface IFetchLongFormContentEvents {
		pubKey?: string;
		since?: number;
		until?: number;
	}
	export interface ISearchUsers {
		query: string;
	}
	export interface IFetchPaymentRequestEvent {
		paymentRequest: string;
	}
	export interface IFetchPaymentReceiptEvent {
		requestEventId: string;
	}
	export interface IFetchPaymentActivitiesForRecipient {
		pubkey: string;
		since?: number;
		until?: number;
	}
	export interface IFetchPaymentActivitiesForSender {
		pubkey: string;
		since?: number;
		until?: number;
	}
	export interface IFetchUserFollowingFeed {
		pubKey: string;
		until?: number;
	}
	export interface IFetchCommunityPinnedNotesEvents extends ICommunityBasicInfo {}
	export interface IFetchCommunityPinnedNoteIds extends ICommunityBasicInfo {}
	export interface IFetchUserPinnedNotes {
		pubKey: string;
	}
	export interface IFetchUserBookmarks {
		pubKey: string;
	}
	export interface IFetchUserEthWalletAccountsInfo {
		walletHash?: string;
		pubKey?: string;
	}
	export interface IFetchSubcommunites {
		communityCreatorId: string;
		communityName: string;
	}
	export interface IFetchCommunityStalls extends ICommunityBasicInfo {}
	export interface IFetchCommunityProducts extends ICommunityBasicInfo {
		stallId?: string;
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
	fetchUserProfileDetailEvents(options: SocialEventManagerReadOptions.IFetchUserProfileDetailEvents): Promise<INostrEvent[]>;
	fetchContactListCacheEvents(options: SocialEventManagerReadOptions.IFetchContactListCacheEvents): Promise<INostrEvent[]>;
	fetchUserRelays(options: SocialEventManagerReadOptions.IFetchUserRelays): Promise<INostrEvent[]>;
	fetchFollowersCacheEvents(options: SocialEventManagerReadOptions.IFetchFollowersCacheEvents): Promise<INostrEvent[]>;
	fetchCommunities(options: SocialEventManagerReadOptions.IFetchCommunities): Promise<INostrEvent[]>;
	fetchAllUserRelatedCommunities(options: SocialEventManagerReadOptions.IFetchAllUserRelatedCommunities): Promise<INostrEvent[]>;
	fetchAllUserRelatedCommunitiesFeed(options: SocialEventManagerReadOptions.IFetchAllUserRelatedCommunitiesFeed): Promise<INostrEvent[]>;
	fetchUserBookmarkedCommunities(options: SocialEventManagerReadOptions.IFetchUserBookmarkedCommunities): Promise<ICommunityBasicInfo[]>;
	fetchCommunity(options: SocialEventManagerReadOptions.IFetchCommunity): Promise<INostrEvent[]>;
	fetchCommunityFeed(options: SocialEventManagerReadOptions.IFetchCommunityFeed): Promise<INostrEvent[]>;
	fetchCommunityDetailMetadata(options: SocialEventManagerReadOptions.IFetchCommunityDetailMetadata): Promise<INostrEvent[]>;
	// fetchCommunitiesFeed(options: SocialEventManagerReadOptions.IFetchCommunitiesFeed): Promise<INostrEvent[]>;
	// fetchNotes(options: IFetchNotesOptions): Promise<INostrEvent[]>;
	fetchEventsByIds(options: SocialEventManagerReadOptions.IFetchEventsByIds): Promise<INostrEvent[]>;
	fetchTempEvents(options: SocialEventManagerReadOptions.IFetchTempEvents): Promise<INostrEvent[]>;
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
	fetchCommunityPinnedNotesEvents(options: SocialEventManagerReadOptions.IFetchCommunityPinnedNotesEvents): Promise<INostrEvent[]>;
	fetchCommunityPinnedNoteIds(options: SocialEventManagerReadOptions.IFetchCommunityPinnedNoteIds): Promise<string[]>;
	fetchUserPinnedNotes(options: SocialEventManagerReadOptions.IFetchUserPinnedNotes): Promise<INostrEvent>;
	fetchUserBookmarks(options: SocialEventManagerReadOptions.IFetchUserBookmarks): Promise<INostrEvent>;
	fetchTrendingCommunities(): Promise<INostrEvent[]>;
	fetchUserEthWalletAccountsInfo(options: SocialEventManagerReadOptions.IFetchUserEthWalletAccountsInfo): Promise<INostrEvent>;
	fetchSubcommunites(options: SocialEventManagerReadOptions.IFetchSubcommunites): Promise<INostrEvent[]>;
	getCommunityUriToMembersMap(communities: ICommunityInfo[]): Promise<Record<string, ICommunityMember[]>>;
	fetchCommunityStalls(options: SocialEventManagerReadOptions.IFetchCommunityStalls): Promise<INostrEvent[]>;
	fetchCommunityProducts(options: SocialEventManagerReadOptions.IFetchCommunityProducts): Promise<INostrEvent[]>;
	// fetchMetadata(options: IFetchMetadataOptions): Promise<INostrEvent[]>;
    // fetchReplies(options: IFetchRepliesOptions): Promise<INostrEvent[]>;
    // fetchFollowing(npubs: string[]): Promise<INostrEvent[]>;
	// fetchLikes(eventId: string): Promise<INostrEvent[]>;
}

export namespace SocialEventManagerWriteOptions {
	export interface IUpdateUserEthWalletAccountsInfo {
		masterWalletSignature: string;
		socialWalletSignature: string;
		encryptedKey: string;
		masterWalletHash: string;
	}

	export interface ISendTempMessage {
		receiver: string;
		encryptedMessage: string;
		replyToEventId?: string;
		widgetId?: string;
	}
}

export interface ISocialEventManagerWrite {
    nostrCommunicationManagers: INostrCommunicationManager[];
    privateKey: string;
    updateContactList(content: string, contactPubKeys: string[]): Promise<ISocialEventManagerWriteResult>;
    postNote(content: string, conversationPath?: IConversationPath, createdAt?: number): Promise<ISocialEventManagerWriteResult>;
    deleteEvents(eventIds: string[]): Promise<ISocialEventManagerWriteResult>;
    updateCommunity(info: ICommunityInfo): Promise<ISocialEventManagerWriteResult>;
    updateChannel(info: IChannelInfo): Promise<ISocialEventManagerWriteResult>;
    updateUserBookmarkedChannels(channelEventIds: string[]): Promise<ISocialEventManagerWriteResult>;
    submitChannelMessage(info: INewChannelMessageInfo): Promise<ISocialEventManagerWriteResult>;
    updateUserBookmarkedCommunities(communities: ICommunityBasicInfo[]): Promise<ISocialEventManagerWriteResult>;
    submitCommunityPost(info: INewCommunityPostInfo): Promise<ISocialEventManagerWriteResult>;
    updateUserProfile(content: INostrMetadataContent): Promise<ISocialEventManagerWriteResult>;
    sendMessage(receiver: string, encryptedMessage: string, replyToEventId?: string): Promise<ISocialEventManagerWriteResult>;
	sendTempMessage(options: SocialEventManagerWriteOptions.ISendTempMessage): Promise<ISocialEventManagerWriteResult>;
    updateGroupKeys(identifier: string, groupKind: number, keys: string, invitees: string[]): Promise<ISocialEventManagerWriteResult>;
    updateCalendarEvent(info: IUpdateCalendarEventInfo): Promise<ISocialEventManagerWriteResult>;
    createCalendarEventRSVP(rsvpId: string, calendarEventUri: string, accepted: boolean): Promise<ISocialEventManagerWriteResult>;
    submitCalendarEventPost(info: INewCalendarEventPostInfo): Promise<ISocialEventManagerWriteResult>;
    submitLongFormContentEvents(info: ILongFormContentInfo): Promise<ISocialEventManagerWriteResult>;
    submitLike(tags: string[][]): Promise<ISocialEventManagerWriteResult>;
    submitRepost(content: string, tags: string[][]): Promise<ISocialEventManagerWriteResult>;
    updateRelayList(relays: Record<string, IRelayConfig>): Promise<ISocialEventManagerWriteResult>;
    createPaymentRequestEvent(paymentRequest: string, amount: string, comment: string, isLightningInvoice?: boolean): Promise<ISocialEventManagerWriteResult>;
    createPaymentReceiptEvent(requestEventId: string, recipient: string, comment: string, preimage?: string, tx?: string): Promise<ISocialEventManagerWriteResult>;
    updateCommunityPinnedNotes(creatorId: string, communityId: string, eventIds: string[]): Promise<ISocialEventManagerWriteResult>;
    updateUserPinnedNotes(eventIds: string[]): Promise<ISocialEventManagerWriteResult>;
    updateUserBookmarks(tags: string[][]): Promise<ISocialEventManagerWriteResult>;
	updateUserEthWalletAccountsInfo(options: SocialEventManagerWriteOptions.IUpdateUserEthWalletAccountsInfo, privateKey?: string): Promise<ISocialEventManagerWriteResult>;
	updateNoteStatus(noteId: string, status: string): Promise<ISocialEventManagerWriteResult>;
	updateCommunityStall(creatorId: string, communityId: string, stall: IMarketplaceStall): Promise<ISocialEventManagerWriteResult>;
	updateCommunityProduct(creatorId: string, communityId: string, product: IMarketplaceProduct): Promise<ISocialEventManagerWriteResult>;
}

export interface INostrRestAPIManager extends INostrCommunicationManager {
    fetchEventsFromAPI(endpoint: string, msg: any, authHeader?: string): Promise<INostrFetchEventsResponse>;
}