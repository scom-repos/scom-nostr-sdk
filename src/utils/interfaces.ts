export interface INostrEvent {
    id: string;  // 32-bytes lowercase hex-encoded sha256
    pubkey: string;  // 32-bytes lowercase hex-encoded public key
    created_at: number;  // Unix timestamp in seconds
    kind: number;  // Integer between 0 and 65535
    tags: string[][];  // Array of arrays of arbitrary strings
    content: string;  // Arbitrary string
    sig: string;  // 64-bytes lowercase hex of signature
}

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

export interface INostrMetadata {
    id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    sig: string;
    content: INostrMetadataContent;
}

export enum NftType {
	ERC721 = 'ERC721',
    ERC1155	= 'ERC1155'
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