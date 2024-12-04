
import { Event } from "../core/index";
import { IChannelInfo } from "./channel";
import { IConversationPath, INostrEvent, INoteInfo } from "./common";
import { INoteCommunity } from "./community";
import { ISocialEventManagerRead } from "./eventManagerRead";

export interface IFetchNotesOptions {
	authors?: string[];
	ids?: string[];
}

export interface INostrFetchEventsResponse {
	error?: string;
	events?: INostrEvent[];
	data?: any
	requestId?: string;
}

export interface INostrSubmitResponse {
	relay: string;
	success: boolean;
	message?: string;
}

export interface INostrMetadataContent {
    name: string;
    display_name: string;
	displayName?: string;
	username?: string;
    website?: string;
    picture?: string;
    about?: string;
    banner?: string;
    lud16?: string;
    nip05?: string;
	eth_wallet?: string;
	telegram_account?: string;
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
	npub: string;
	pubkey: string;
	displayName?: string;
	website?: string;
	banner?: string;
	internetIdentifier: string;
	followers?: number;
	lud16?: string;
	ethWallet?: string;
	telegramAccount?: string;
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

export interface IAuthor {
	id: string;
	username: string;
	description: string;
	avatar: string;
	pubKey?: string;
	displayName?: string;
	internetIdentifier: string;
}

export interface INoteInfoExtended extends INoteInfo {
	parentAuthor?: IAuthor;
	repost?: IAuthor;
	community?: INoteCommunity;
}

export enum ScpStandardId {
	Community = '1',
	CommunityPost = '2',
	Channel = '3',
	ChannelMessage = '4',
	GroupKeys = '5',
}

export interface IMessageContactInfo {
	id: string;
	pubKey: string;
	creatorId: string;
	username: string;
	displayName: string;
	avatar?: string;
	banner?: string;
	latestAt?: number;
	cnt?: number;
	isGroup?: boolean;
	channelInfo?: IChannelInfo;
}

export enum CalendarEventType {
	DateBased = 'dateBased',
	TimeBased = 'timeBased'
}

export interface ICalendarEventBasicInfo {
	id: string;
	title: string;
	description: string;
	start: number;
	end?: number;
	startTzid?: string;
	endTzid?: string;
	type: CalendarEventType;
	location?: string;
	latitude?: number;
	longitude?: number;
	city?: string;
	image?: string;
}

export interface ICalendarEventInfo extends ICalendarEventBasicInfo {
	naddr: string;
	eventData?: INostrEvent;
	geohash?: string;
}

export interface IUpdateCalendarEventInfo extends ICalendarEventBasicInfo {
	geohash?: string;
	hostIds?: string[];
}

export interface ICalendarEventHost {
	pubkey: string;
	userProfile?: IUserProfile;
}

export interface ICalendarEventAttendee {
	pubkey: string;
	userProfile?: IUserProfile;
	rsvpEventData?: INostrEvent;
}

export interface ICalendarEventDetailInfo extends ICalendarEventInfo {
	hosts?: ICalendarEventHost[];
	attendees?: ICalendarEventAttendee[];
	notes?: INoteInfo[];
}

export interface INewCalendarEventPostInfo {
	calendarEventUri: string;
	message: string;
	conversationPath?: IConversationPath;
}

export interface ILocationCoordinates {
	latitude: number;
	longitude: number;
}

export interface IMqttClientOptions {
	username: string;
	password: string;
}

export interface ISocialDataManagerConfig {
	version?: 1 | 1.5 | 2;
	writeRelays?: string[];
	readRelay?: string;
	readManager?: ISocialEventManagerRead;
	publicIndexingRelay?: string;
	apiBaseUrl?: string;
	ipLocationServiceBaseUrl?: string;
	ipLocationServiceApiKey?: string;
	mqttBrokerUrl?: string;
	mqttClientOptions?: IMqttClientOptions;
	mqttSubscriptions?: string[];
	mqttMessageCallback?: (topic: string, message: string) => void;
	enableLightningWallet?: boolean;
}

export interface ILongFormContentInfo {
	id: string;
	content: string;
	markdownContent: string;
	title?: string;
	image?: string;
	summary?: string;
	createdAt?: number;
	publishedAt?: number;
	eventData?: INostrEvent;
	hashtags?: string[];
}

export interface IRelayConfig {
	read: boolean;
	write: boolean;
}

export interface IPaymentActivity {
	paymentHash: string;
	sender: string;
	recipient: string;
	amount: string;
	status: string;
	createdAt: number;
}

export interface IEthWalletAccountsInfo {
	masterWalletSignature: string;
	socialWalletSignature: string;
	encryptedKey: string;
	masterWalletHash: string;
	eventData?: INostrEvent;
}

export interface ISendTempMessageOptions {
	receiverId: string;
	message: string;
	replyToEventId?: string;
	widgetId?: string;
}

export interface INostrCommunicationManager {
	url: string;
    fetchEvents(...requests: any): Promise<INostrFetchEventsResponse>;
    fetchCachedEvents(eventType: string, msg: any): Promise<INostrFetchEventsResponse>;
    submitEvent(event: Event.VerifiedEvent<number>, authHeader?: string): Promise<INostrSubmitResponse>;
}

export namespace SocialDataManagerOptions {
	export interface IFetchUserEthWalletAccountsInfoOptions {
		walletHash?: string;
		pubKey?: string;
	}
}

export interface INostrRestAPIManager extends INostrCommunicationManager {
    fetchEventsFromAPI(endpoint: string, msg: any, authHeader?: string): Promise<INostrFetchEventsResponse>;
}