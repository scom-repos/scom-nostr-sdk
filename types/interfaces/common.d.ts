import { Event } from "../core/index";
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
export interface IConversationPath {
    noteIds: string[];
    authorIds: string[];
}
export interface IPostStats {
    replies?: number;
    reposts?: number;
    upvotes?: number;
    downvotes?: number;
    views?: number;
    satszapped?: number;
    status?: string;
}
export interface INoteActions {
    liked?: boolean;
    replied?: boolean;
    reposted?: boolean;
    zapped?: boolean;
    bookmarked?: boolean;
}
export interface INoteInfo {
    eventData: INostrEvent;
    stats?: IPostStats;
    actions?: INoteActions;
}
export interface IMqttClientOptions {
    username: string;
    password: string;
}
export interface INostrSubmitResponse {
    relay: string;
    success: boolean;
    message?: string;
}
export interface INostrFetchEventsResponse {
    error?: string;
    events?: INostrEvent[];
    data?: any;
    requestId?: string;
}
export interface INostrCommunicationManager {
    url: string;
    fetchEvents(...requests: any): Promise<INostrFetchEventsResponse>;
    fetchCachedEvents(eventType: string, msg: any): Promise<INostrFetchEventsResponse>;
    submitEvent(event: Event.VerifiedEvent<number>, authHeader?: string): Promise<INostrSubmitResponse>;
}
export interface INostrRestAPIManager extends INostrCommunicationManager {
    fetchEventsFromAPI(endpoint: string, msg: any, authHeader?: string): Promise<INostrFetchEventsResponse>;
}
