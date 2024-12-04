export interface INostrEvent {
    id: string;
    pubkey: string;
    created_at: number;
    kind: number;
    tags: string[][];
    content: string;
    sig: string;
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
