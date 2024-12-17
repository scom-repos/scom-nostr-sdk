import { BuyerOrderStatus, CommunityRole, ICalendarEventDetailInfo, ICalendarEventInfo, IChannelInfo, ICheckIfUserHasAccessToCommunityOptions, ICommunity, ICommunityDetailMetadata, ICommunityInfo, ICommunityLeaderboard, ICommunityMember, ICommunityPostScpData, ICommunityProductInfo, ICommunityStallInfo, ICommunitySubscription, IConversationPath, ICurrency, IDecryptPostPrivateKeyForCommunityOptions, IEthWalletAccountsInfo, IFetchPaymentActivitiesOptions, ILocationCoordinates, ILongFormContentInfo, IMarketplaceOrder, IMarketplaceOrderUpdateInfo, IMarketplaceProduct, IMarketplaceStall, IMessageContactInfo, INewCommunityInfo, INostrEvent, INostrMetadata, INostrMetadataContent, INoteActions, INoteCommunityInfo, INoteInfo, INoteInfoExtended, IPaymentActivityV2, IPostStats, IRegion, IRetrieveChannelMessageKeysOptions, IRetrieveCommunityPostKeysByNoteEventsOptions, IRetrieveCommunityPostKeysOptions, IRetrieveCommunityThreadPostKeysOptions, IRetrievedBuyerOrder, IRetrievedMarketplaceOrder, ISendTempMessageOptions, ISocialDataManagerConfig, ISocialEventManagerRead, ISocialEventManagerWrite, ITrendingCommunityInfo, IUpdateCalendarEventInfo, IUpdateCommunitySubscription, IUserActivityStats, IUserProfile, SellerOrderStatus, SocialDataManagerOptions } from "../../interfaces";
declare class SocialDataManager {
    private _writeRelays;
    private _publicIndexingRelay;
    private _apiBaseUrl;
    private _ipLocationServiceBaseUrl;
    private _socialEventManagerRead;
    private _socialEventManagerWrite;
    private _privateKey;
    private _selfPubkey;
    private mqttManager;
    private lightningWalletManager;
    private systemDataManager;
    constructor(config: ISocialDataManagerConfig);
    dispose(): Promise<void>;
    set privateKey(privateKey: string);
    get socialEventManagerRead(): ISocialEventManagerRead;
    get socialEventManagerWrite(): ISocialEventManagerWrite;
    set relays(value: string[]);
    get privateKey(): string;
    get selfPubkey(): string;
    private _initializeWriteRelaysManagers;
    subscribeToMqttTopics(topics: string[]): void;
    unsubscribeFromMqttTopics(topics: string[]): void;
    publishToMqttTopic(topic: string, message: string): void;
    fetchCommunityFeedInfo(creatorId: string, communityId: string, since?: number, until?: number): Promise<{
        notes: INoteInfo[];
        metadataByPubKeyMap: Record<string, INostrMetadata>;
        quotedNotesMap: Record<string, INoteInfo>;
    }>;
    retrieveCommunityUri(noteEvent: INostrEvent, scpData: ICommunityPostScpData): string;
    retrievePostPrivateKey(event: INostrEvent, communityUri: string, communityPrivateKey: string): Promise<string>;
    decryptPostPrivateKeyForCommunity(options: IDecryptPostPrivateKeyForCommunityOptions): Promise<string>;
    retrieveChannelMessagePrivateKey(event: INostrEvent, channelId: string, communityPrivateKey: string): Promise<string>;
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
    updateUserProfileV2(profile: Partial<IUserProfile>): Promise<void>;
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
    private getRandomInt;
    private constructLeaderboard;
    fetchCommunityLeaderboard(community: ICommunityInfo): Promise<{
        allTime: ICommunityLeaderboard[];
        monthly: ICommunityLeaderboard[];
        weekly: ICommunityLeaderboard[];
    }>;
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
    retrieveUserProfileDetail(options: {
        pubKey?: string;
        telegramAccount?: string;
    }): Promise<{
        userProfile: IUserProfile;
        stats: IUserActivityStats;
    }>;
    fetchUserContactList(pubKey: string): Promise<IUserProfile[]>;
    fetchUserFollowersList(pubKey: string): Promise<IUserProfile[]>;
    fetchUserRelayList(pubKey: string): Promise<string[]>;
    followUser(userPubKey: string): Promise<void>;
    unfollowUser(userPubKey: string): Promise<void>;
    generateGroupKeys(privateKey: string, encryptionPublicKeys: string[]): Promise<{
        groupPrivateKey: string;
        groupPublicKey: string;
        encryptedGroupKeys: Record<string, string>;
    }>;
    createCommunity(newInfo: INewCommunityInfo, creatorId: string): Promise<ICommunityInfo>;
    updateCommunity(info: ICommunityInfo): Promise<ICommunityInfo>;
    updateCommunityChannel(communityInfo: ICommunityInfo): Promise<import("../../interfaces").ISocialEventManagerWriteResult>;
    createChannel(channelInfo: IChannelInfo, memberIds: string[]): Promise<IChannelInfo>;
    updateChannel(channelInfo: IChannelInfo): Promise<import("../../interfaces").ISocialEventManagerWriteResult>;
    fetchCommunitiesMembers(communities: ICommunityInfo[]): Promise<Record<string, ICommunityMember[]>>;
    private getEventIdToMemberMap;
    fetchCommunities(query?: string): Promise<ICommunity[]>;
    fetchMyCommunities(pubKey: string): Promise<ICommunity[]>;
    fetchUserRoleInCommunity(community: ICommunityInfo, pubKey: string): Promise<CommunityRole>;
    joinCommunity(community: ICommunityInfo, pubKey: string): Promise<void>;
    leaveCommunity(community: ICommunityInfo, pubKey: string): Promise<void>;
    private encryptGroupMessage;
    submitCommunityPost(message: string, info: ICommunityInfo, conversationPath?: IConversationPath, timestamp?: number, alt?: string, isPublicPost?: boolean): Promise<import("../../interfaces").ISocialEventManagerWriteResult>;
    fetchAllUserRelatedChannels(pubKey: string): Promise<IChannelInfo[]>;
    retrieveChannelMessages(channelId: string, since?: number, until?: number): Promise<INostrEvent[]>;
    retrieveChannelEvents(creatorId: string, channelId: string): Promise<{
        messageEvents: INostrEvent[];
        info: IChannelInfo;
    }>;
    retrieveChannelMessageKeys(options: IRetrieveChannelMessageKeysOptions): Promise<Record<string, string>>;
    submitChannelMessage(message: string, channelId: string, communityPublicKey: string, conversationPath?: IConversationPath): Promise<void>;
    fetchDirectMessagesBySender(selfPubKey: string, senderPubKey: string, since?: number, until?: number): Promise<{
        decodedSenderPubKey: string;
        encryptedMessages: any[];
        metadataByPubKeyMap: Record<string, INostrMetadata>;
    }>;
    sendDirectMessage(chatId: string, message: string, replyToEventId?: string): Promise<import("../../interfaces").ISocialEventManagerWriteResult>;
    sendTempMessage(options: ISendTempMessageOptions): Promise<import("../../interfaces").ISocialEventManagerWriteResult>;
    resetMessageCount(selfPubKey: string, senderPubKey: string): Promise<void>;
    fetchMessageContacts(pubKey: string): Promise<IMessageContactInfo[]>;
    fetchUserGroupInvitations(pubKey: string): Promise<string[]>;
    updateCalendarEvent(updateCalendarEventInfo: IUpdateCalendarEventInfo): Promise<string>;
    retrieveCalendarEventsByDateRange(start: number, end?: number, limit?: number, previousEventId?: string): Promise<{
        calendarEventInfoList: ICalendarEventInfo[];
        startDates: number[];
    }>;
    retrieveCalendarEvent(naddr: string): Promise<ICalendarEventDetailInfo>;
    acceptCalendarEvent(rsvpId: string, naddr: string): Promise<void>;
    declineCalendarEvent(rsvpId: string, naddr: string): Promise<void>;
    submitCalendarEventPost(naddr: string, message: string, conversationPath?: IConversationPath): Promise<any>;
    fetchTimezones(): Promise<any[]>;
    fetchCitiesByKeyword(keyword: string): Promise<any[]>;
    fetchCitiesByCoordinates(latitude: number, longitude: number): Promise<any[]>;
    fetchLocationInfoFromIP(): Promise<ILocationCoordinates>;
    getAccountBalance(walletAddress: string): Promise<any>;
    getNFTsByOwner(walletAddress: string): Promise<any>;
    submitMessage(message: string, conversationPath?: IConversationPath, createdAt?: number): Promise<import("../../interfaces").ISocialEventManagerWriteResult>;
    submitLongFormContent(info: ILongFormContentInfo): Promise<import("../../interfaces").ISocialEventManagerWriteResult>;
    submitLike(postEventData: INostrEvent): Promise<void>;
    submitRepost(postEventData: INostrEvent): Promise<void>;
    sendPingRequest(pubkey: string, relayUrl?: string): Promise<any>;
    checkRelayStatus(pubkey: string, relayUrl?: string): Promise<any>;
    searchUsers(query: string): Promise<IUserProfile[]>;
    addRelay(url: string): Promise<void>;
    removeRelay(url: string): Promise<void>;
    updateRelays(add: string[], remove: string[], defaultRelays: string[]): Promise<string[]>;
    makeInvoice(amount: string, comment: string): Promise<string>;
    createPaymentRequest(chainId: number, token: any, amount: string, to: string, comment: string): Promise<string>;
    parsePaymentRequest(paymentRequest: string): any;
    private sendToken;
    private isLightningInvoice;
    sendPayment(paymentRequest: string, comment: string): Promise<string>;
    zap(pubkey: string, lud16: string, amount: string, noteId: string): Promise<any>;
    fetchUserPaymentActivities(pubkey: string, since?: number, until?: number): Promise<import("../../interfaces").IPaymentActivity[]>;
    fetchPaymentReceiptInfo(paymentRequest: string): Promise<{
        status: 'pending' | 'completed';
        preimage?: string;
        tx?: string;
    }>;
    getLightningBalance(): Promise<any>;
    isLightningAvailable(): boolean;
    getBitcoinPrice(): Promise<any>;
    fetchUserPrivateRelay(pubkey: string): Promise<any>;
    fetchApps(keyword?: string): Promise<any>;
    fetchApp(pubkey: string, id: string): Promise<any>;
    fetchInstalledByPubKey(pubkey: string): Promise<any>;
    fetchInstalledApps(pubkey: string): Promise<any>;
    installApp(pubkey: string, appId: string, appVersionId: string): Promise<any>;
    fetchCommunityPinnedNotes(creatorId: string, communityId: string): Promise<{
        notes: INoteInfo[];
        metadataByPubKeyMap: Record<string, INostrMetadata>;
    }>;
    pinCommunityNote(creatorId: string, communityId: string, noteId: string): Promise<void>;
    unpinCommunityNote(creatorId: string, communityId: string, noteId: string): Promise<void>;
    fetchUserPinnedNotes(pubKey: string): Promise<INostrEvent[]>;
    pinUserNote(pubKey: string, noteId: string): Promise<void>;
    unpinUserNote(pubKey: string, noteId: string): Promise<void>;
    fetchUserBookmarks(pubKey: string): Promise<string[]>;
    addBookmark(pubKey: string, eventId: string, isArticle?: boolean): Promise<void>;
    removeBookmark(pubKey: string, eventId: string, isArticle?: boolean): Promise<void>;
    deleteEvents(eventIds: string[]): Promise<void>;
    fetchTrendingCommunities(): Promise<ITrendingCommunityInfo[]>;
    fetchUserEthWalletAccountsInfo(options: SocialDataManagerOptions.IFetchUserEthWalletAccountsInfoOptions): Promise<IEthWalletAccountsInfo>;
    updateUserEthWalletAccountsInfo(info: IEthWalletAccountsInfo, privateKey?: string): Promise<any>;
    fetchSubCommunities(creatorId: string, communityId: string): Promise<ICommunityInfo[]>;
    fetchCommunityDetailMetadata(creatorId: string, communityId: string): Promise<ICommunityDetailMetadata>;
    updateNoteStatus(noteId: string, status: string): Promise<import("../../interfaces").ISocialEventManagerWriteResult>;
    updateCommunitySubscription(options: IUpdateCommunitySubscription): Promise<any>;
    fetchCommunityStalls(creatorId: string, communityId: string): Promise<ICommunityStallInfo[]>;
    fetchCommunityProducts(creatorId: string, communityId: string, stallId?: string): Promise<ICommunityProductInfo[]>;
    updateCommunityStall(creatorId: string, communityId: string, stall: IMarketplaceStall): Promise<import("../../interfaces").ISocialEventManagerWriteResult>;
    updateCommunityProduct(creatorId: string, communityId: string, product: IMarketplaceProduct): Promise<import("../../interfaces").ISocialEventManagerWriteResult>;
    placeMarketplaceOrder(merchantId: string, stallId: string, order: IMarketplaceOrder): Promise<import("../../interfaces").ISocialEventManagerWriteResult>;
    recordPaymentActivity(paymentActivity: IPaymentActivityV2): Promise<import("../../interfaces").ISocialEventManagerWriteResult>;
    updateMarketplaceOrderStatus(merchantId: string, stallId: string, updateInfo: IMarketplaceOrderUpdateInfo): Promise<import("../../interfaces").ISocialEventManagerWriteResult>;
    fetchPaymentActivities(options: IFetchPaymentActivitiesOptions): Promise<IPaymentActivityV2[]>;
    fetchCommunityOrders(creatorId: string, communityId: string, stallId?: string, status?: SellerOrderStatus): Promise<IRetrievedMarketplaceOrder[]>;
    fetchBuyerOrders(pubkey: string, status?: BuyerOrderStatus): Promise<IRetrievedBuyerOrder[]>;
    fetchMarketplaceOrderDetails(orderId: string): Promise<IRetrievedBuyerOrder>;
    fetchRegions(): Promise<IRegion[]>;
    fetchCurrencies(): Promise<ICurrency[]>;
    fetchCryptocurrencies(): Promise<import("../../interfaces").ICryptocurrency[]>;
}
export { SocialDataManager };
