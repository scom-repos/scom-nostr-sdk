import { ICommunityBasicInfo, ICommunityInfo, IConversationPath, INewCommunityPostInfo, INostrMetadataContent } from "./interfaces";
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
export declare class NostrEventManager {
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
export { INostrEvent };
