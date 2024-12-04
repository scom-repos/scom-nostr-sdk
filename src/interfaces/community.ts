import { IConversationPath, INostrEvent, INoteInfo } from "./common";

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

export enum NftType {
	ERC721 = 'ERC721',
    ERC1155	= 'ERC1155'
}

export enum TokenType {
	ERC20 = 'ERC20',
	ERC721	= 'ERC721',
	ERC1155	= 'ERC1155'
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

export interface ICommunity extends ICommunityInfo {
	members: ICommunityMember[];
	memberCount?: number;
}

export interface ITrendingCommunityInfo extends ICommunityInfo {
	memberCount: number;
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

export interface ICommunityStats {
	notesCount: number;
	subcommunitiesCount: number;
	membersCount: number;
}

export interface ICommunityDetailMetadata {
	info: ICommunityInfo;
	stats: ICommunityStats;
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