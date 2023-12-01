import { ICommunityBasicInfo, ICommunityInfo, IConversationPath, INewCommunityPostInfo, INostrEvent, INostrMetadata, INostrMetadataContent, IRetrieveCommunityPostKeysOptions, IRetrieveCommunityThreadPostKeysOptions } from "./interfaces";
interface IFetchNotesOptions {
    authors?: string[];
    ids?: string[];
    decodedIds?: string[];
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
    fetchHomeFeedCacheEvents(pubKey?: string): Promise<INostrEvent[]>;
    fetchUserProfileCacheEvents(pubKeys: string[]): Promise<INostrEvent[]>;
    fetchCommunities(pubkeyToCommunityIdsMap?: Record<string, string[]>): Promise<any>;
    fetchUserCommunities(pubKey: string): Promise<INostrEvent[]>;
    fetchUserSubscribedCommunities(pubKey: string): Promise<INostrEvent[]>;
    fetchCommunity(creatorId: string, communityId: string): Promise<INostrEvent[]>;
    fetchCommunityFeed(creatorId: string, communityId: string): Promise<INostrEvent[]>;
    fetchCommunitiesGeneralMembers(communities: ICommunityBasicInfo[]): Promise<INostrEvent[]>;
    fetchNotes(options: IFetchNotesOptions): Promise<INostrEvent[]>;
    fetchMetadata(options: IFetchMetadataOptions): Promise<INostrEvent[]>;
    fetchReplies(options: IFetchRepliesOptions): Promise<INostrEvent[]>;
    fetchFollowing(npubs: string[]): Promise<INostrEvent[]>;
    postNote(content: string, privateKey: string, conversationPath?: IConversationPath): Promise<void>;
    calculateConversationPathTags(conversationPath: IConversationPath): string[][];
    updateCommunity(info: ICommunityInfo, privateKey: string): Promise<void>;
    updateUserCommunities(communities: ICommunityBasicInfo[], privateKey: string): Promise<void>;
    submitCommunityPost(info: INewCommunityPostInfo, privateKey: string): Promise<void>;
    submitNewAccount(content: INostrMetadataContent, privateKey: string): Promise<void>;
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
    fetchHomeFeedCacheEvents(pubKey?: string): Promise<INostrEvent[]>;
    fetchUserProfileCacheEvents(pubKeys: string[]): Promise<INostrEvent[]>;
    fetchCommunities(pubkeyToCommunityIdsMap?: Record<string, string[]>): Promise<INostrEvent[]>;
    fetchUserCommunities(pubKey: string): Promise<INostrEvent[]>;
    fetchUserSubscribedCommunities(pubKey: string): Promise<INostrEvent[]>;
    fetchCommunity(creatorId: string, communityId: string): Promise<INostrEvent[]>;
    fetchCommunityFeed(creatorId: string, communityId: string): Promise<INostrEvent[]>;
    fetchCommunitiesGeneralMembers(communities: ICommunityBasicInfo[]): Promise<INostrEvent[]>;
    fetchNotes(options: IFetchNotesOptions): Promise<INostrEvent[]>;
    fetchMetadata(options: IFetchMetadataOptions): Promise<INostrEvent[]>;
    fetchReplies(options: IFetchRepliesOptions): Promise<INostrEvent[]>;
    fetchFollowing(npubs: string[]): Promise<INostrEvent[]>;
    postNote(content: string, privateKey: string, conversationPath?: IConversationPath): Promise<void>;
    updateCommunity(info: ICommunityInfo, privateKey: string): Promise<void>;
    updateUserCommunities(communities: ICommunityBasicInfo[], privateKey: string): Promise<void>;
    submitCommunityPost(info: INewCommunityPostInfo, privateKey: string): Promise<void>;
    submitNewAccount(content: INostrMetadataContent, privateKey: string): Promise<void>;
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
    retrieveCommunityUri(noteEvent: INostrEvent, scpData: any): Promise<string>;
    extractPostScpData(noteEvent: INostrEvent): any;
    retrievePostPrivateKey(noteEvent: INostrEvent, communityUri: string, communityPrivateKey: string): Promise<string>;
    retrieveCommunityPostKeys(options: IRetrieveCommunityPostKeysOptions): Promise<Record<string, string>>;
    retrieveCommunityThreadPostKeys(options: IRetrieveCommunityThreadPostKeysOptions): Promise<Record<string, string>>;
    constructMetadataByPubKeyMap(notes: INostrEvent[]): Promise<Record<string, INostrMetadata>>;
    fetchThreadNotesInfo(focusedNoteId: string, fetchFromCache?: boolean): Promise<{
        focusedNote: INostrEvent;
        ancestorNotes: INostrEvent[];
        replies: INostrEvent[];
        metadataByPubKeyMap: Record<string, INostrMetadata>;
        quotedNotesMap: Record<string, INostrEvent>;
        childReplyEventTagIds: string[];
        communityInfo: ICommunityInfo;
    }>;
}
export { NostrEventManager, ISocialEventManager, SocialDataManager };
