export interface INostrMetadataContent {
    name: string;
    display_name: string;
    website?: string;
    picture?: string;
    about?: string;
    banner?: string;
    lud16?: string;
    nip05?: string;
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
    description?: string;
    rules?: string;
    bannerImgUrl?: string;
    gatekeeperNpub?: string;
    scpData?: ICommunityScpData;
    moderatorIds?: string[];
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
