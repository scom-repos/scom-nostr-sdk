export interface INostrEvent {
    id: string;  // 32-bytes lowercase hex-encoded sha256
    pubkey: string;  // 32-bytes lowercase hex-encoded public key
    created_at: number;  // Unix timestamp in seconds
    kind: number;  // Integer between 0 and 65535
    tags: string[][];  // Array of arrays of arbitrary strings
    content: string;  // Arbitrary string
    sig: string;  // 64-bytes lowercase hex of signature
}

export interface INostrSubmitResponse {
	eventId: string;
	success: boolean;
	message?: string;
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

export enum NftType {
	ERC721 = 'ERC721',
    ERC1155	= 'ERC1155'
}

export enum ScpStandardId {
	Community = '1',
	CommunityPost = '2',
	Channel = '3',
	ChannelMessage = '4'
}

//SCP-1
export interface ICommunityScpData {
	chainId: number;
	nftAddress: string;
	nftType: NftType;
	nftId?: number;
	publicKey?: string;
	encryptedKey?: string;
	gatekeeperPublicKey?: string;
	channelEventId?: string;
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

export interface INewCommunityInfo {
	name: string;
	description?: string;
	bannerImgUrl?: string;
	moderatorIds?: string[];
	rules?: string;
	gatekeeperNpub?: string;
	scpData?: ICommunityScpData;
}

//SCP-3
export interface IChannelScpData {
	communityId: string;
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

//SCP-4
export interface IChannelMessageScpData {
	channelId: string;
	encryptedKey?: string;
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

//SCP-2
export interface ICommunityPostScpData {
	communityUri: string;
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
	getSignature: (message: string) => Promise<string>
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

export interface IMessageContactInfo {
	id: string;
	pubKey: string;
	username: string;
	displayName: string;
	avatar?: string;
	banner?: string;
	latestAt?: number;
	cnt?: number;
	isGroup?: boolean;
	communityInfo?: ICommunityInfo;
}