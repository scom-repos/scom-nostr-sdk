import { ICommunityBasicInfo, ICommunityInfo, IConversationPath, INewCommunityPostInfo, INostrMetadataContent, IRetrieveCommunityPostKeysOptions } from "./interfaces";
interface INostrEvent {
    id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
    sig: string;
}
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
}
declare class SocialDataManager {
    private _socialEventManager;
    constructor(relays: string[], cachedServer: string);
    get socialEventManager(): ISocialEventManager;
    hexStringToUint8Array(hexString: string): Uint8Array;
    base64ToUtf8(base64: string): string;
    decryptMessage(ourPrivateKey: string, theirPublicKey: string, encryptedData: string): Promise<string>;
    extractCommunityInfo(event: INostrEvent): {
        creatorId: `npub1${string}`;
        moderatorIds: `npub1${string}`[];
        communityUri: string;
        communityId: string;
        description: string;
        bannerImgUrl: string;
        scpData: any;
        eventData: INostrEvent;
    };
    retrieveCommunityEvents(creatorId: string, communityId: string): Promise<{
        notes: INostrEvent[];
        info: {
            creatorId: `npub1${string}`;
            moderatorIds: `npub1${string}`[];
            communityUri: string;
            communityId: string;
            description: string;
            bannerImgUrl: string;
            scpData: any;
            eventData: INostrEvent;
        };
    }>;
    extractPostScpData(noteEvent: INostrEvent): any;
    retrievePostPrivateKey(noteEvent: INostrEvent, communityUri: string, communityPrivateKey: string): Promise<string>;
    retrieveCommunityPostKeys(options: IRetrieveCommunityPostKeysOptions): Promise<Record<string, string>>;
}
export { INostrEvent, NostrEventManager, ISocialEventManager, SocialDataManager };
