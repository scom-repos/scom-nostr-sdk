export interface INostrEvent {
    id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
    sig: string;
}
export interface INostrMetadataContent {
    name: string;
    display_name: string;
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
    pubKey: string;
    displayName?: string;
    website?: string;
    banner?: string;
    internetIdentifier: string;
    followers?: number;
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
export interface ICommunityScpData {
    chainId: number;
    nftAddress: string;
    nftType: NftType;
    nftId?: number;
    publicKey?: string;
    encryptedKey?: string;
    gatekeeperPublicKey?: string;
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
    gatekeeperNpub?: string;
    scpData?: ICommunityScpData;
    moderatorIds?: string[];
    eventData?: INostrEvent;
}
export interface IConversationPath {
    noteIds: string[];
    authorIds: string[];
}
export interface ICommunityPostScpData {
    encryptedKey?: string;
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
    privateKey?: string;
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
    privateKey: string;
    getSignature: (message: string) => Promise<string>;
    gatekeepers: ICommunityGatekeeperInfo[];
}
export interface IRetrieveCommunityThreadPostKeysOptions {
    communityInfo: ICommunityInfo;
    noteEvents: INostrEvent[];
    focusedNoteId: string;
    privateKey?: string;
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
}
