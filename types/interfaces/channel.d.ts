import { INostrEvent, IConversationPath } from "./common";
import { ICommunityInfo } from "./community";
export interface IChannelScpData {
    communityUri?: string;
    publicKey?: string;
}
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
export interface IChannelInfo {
    id?: string;
    name: string;
    about?: string;
    picture?: string;
    scpData?: IChannelScpData;
    eventData?: INostrEvent;
    communityInfo?: ICommunityInfo;
}
export interface IAllUserRelatedChannels {
    channels: IChannelInfo[];
    channelMetadataMap: Record<string, IChannelInfo>;
    channelIdToCommunityMap: Record<string, ICommunityInfo>;
}
export interface IRetrieveChannelMessageKeysOptions {
    creatorId: string;
    channelId: string;
    privateKey?: string;
    gatekeeperUrl?: string;
    message?: string;
    signature?: string;
}
