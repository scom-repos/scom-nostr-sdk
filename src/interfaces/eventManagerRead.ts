import { IFetchPaymentActivitiesOptions, IPaymentActivity } from "./misc";
import { Nip19 } from "../core/index";
import { ICommunityBasicInfo, ICommunityInfo, ICommunityMember } from "./community";
import { IAllUserRelatedChannels } from "./channel";
import { INostrCommunicationManager, INostrRestAPIManager, INostrEvent } from "./common";
import { BuyerOrderStatus, SellerOrderStatus } from "./marketplace";

export interface IFetchNotesOptions {
	authors?: string[];
	ids?: string[];
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

	export interface IFetchCommunityOrders extends ICommunityBasicInfo {
		stallId?: string;
		since?: number;
		until?: number;
		status?: SellerOrderStatus;
	}

	export interface IFetchBuyerOrders {
		pubkey: string;
		since?: number;
		until?: number;
		status?: BuyerOrderStatus;
	}

	export interface IFetchMarketplaceOrderDetails {
		orderId: string;
	}

	export interface IFetchMarketplaceProductDetails {
		stallId: string;
		productIds: string[];
	}

	export interface IFetchPaymentActivities extends IFetchPaymentActivitiesOptions {}

	export interface IFetchMarketplaceProductKey {
		sellerPubkey: string;
		productId: string;
	}
	export interface IFetchProductPurchaseStatus {
		sellerPubkey: string;
		productId: string;	
	}
}

export interface ISocialEventManagerReadResult {
	error?: string;
	events?: INostrEvent[];
	data?: any;
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
	fetchCommunityOrders(options: SocialEventManagerReadOptions.IFetchCommunityOrders): Promise<INostrEvent[]>;
	fetchBuyerOrders(options: SocialEventManagerReadOptions.IFetchBuyerOrders): Promise<INostrEvent[]>;
	fetchMarketplaceOrderDetails(options: SocialEventManagerReadOptions.IFetchMarketplaceOrderDetails): Promise<INostrEvent[]>;
	fetchMarketplaceProductDetails(options: SocialEventManagerReadOptions.IFetchMarketplaceProductDetails): Promise<INostrEvent[]>;
	fetchPaymentActivities(options: SocialEventManagerReadOptions.IFetchPaymentActivities): Promise<INostrEvent[]>;
	fetchMarketplaceProductKey(options: SocialEventManagerReadOptions.IFetchMarketplaceProductKey): Promise<string>;
	fetchProductPurchaseStatus(options: SocialEventManagerReadOptions.IFetchProductPurchaseStatus): Promise<boolean>;
	// fetchMetadata(options: IFetchMetadataOptions): Promise<INostrEvent[]>;
    // fetchReplies(options: IFetchRepliesOptions): Promise<INostrEvent[]>;
    // fetchFollowing(npubs: string[]): Promise<INostrEvent[]>;
	// fetchLikes(eventId: string): Promise<INostrEvent[]>;
}