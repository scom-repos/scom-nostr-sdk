import { IUpdateCalendarEventInfo, INewCalendarEventPostInfo, ILongFormContentInfo, IRelayConfig } from "./misc";
import { IMarketplaceProduct, IMarketplaceStall } from "./marketplace";
import { ICommunityBasicInfo, ICommunityInfo, INewCommunityPostInfo } from "./community";
import { IChannelInfo, INewChannelMessageInfo } from "./channel";
import { INostrMetadataContent, INostrCommunicationManager, IConversationPath, INostrEvent, INostrSubmitResponse } from "./common";
export declare namespace SocialEventManagerWriteOptions {
    interface IUpdateUserEthWalletAccountsInfo {
        masterWalletSignature: string;
        socialWalletSignature: string;
        encryptedKey: string;
        masterWalletHash: string;
    }
    interface ISendTempMessage {
        receiver: string;
        encryptedMessage: string;
        replyToEventId?: string;
        widgetId?: string;
    }
}
export interface ISocialEventManagerWriteResult {
    relayResponse: INostrSubmitResponse;
    event: INostrEvent;
}
export interface ISocialEventManagerWrite {
    nostrCommunicationManagers: INostrCommunicationManager[];
    privateKey: string;
    updateContactList(content: string, contactPubKeys: string[]): Promise<ISocialEventManagerWriteResult>;
    postNote(content: string, conversationPath?: IConversationPath, createdAt?: number): Promise<ISocialEventManagerWriteResult>;
    deleteEvents(eventIds: string[]): Promise<ISocialEventManagerWriteResult>;
    updateCommunity(info: ICommunityInfo): Promise<ISocialEventManagerWriteResult>;
    updateChannel(info: IChannelInfo): Promise<ISocialEventManagerWriteResult>;
    updateUserBookmarkedChannels(channelEventIds: string[]): Promise<ISocialEventManagerWriteResult>;
    submitChannelMessage(info: INewChannelMessageInfo): Promise<ISocialEventManagerWriteResult>;
    updateUserBookmarkedCommunities(communities: ICommunityBasicInfo[]): Promise<ISocialEventManagerWriteResult>;
    submitCommunityPost(info: INewCommunityPostInfo): Promise<ISocialEventManagerWriteResult>;
    updateUserProfile(content: INostrMetadataContent): Promise<ISocialEventManagerWriteResult>;
    sendMessage(receiver: string, encryptedMessage: string, replyToEventId?: string): Promise<ISocialEventManagerWriteResult>;
    sendTempMessage(options: SocialEventManagerWriteOptions.ISendTempMessage): Promise<ISocialEventManagerWriteResult>;
    updateGroupKeys(identifier: string, groupKind: number, keys: string, invitees: string[]): Promise<ISocialEventManagerWriteResult>;
    updateCalendarEvent(info: IUpdateCalendarEventInfo): Promise<ISocialEventManagerWriteResult>;
    createCalendarEventRSVP(rsvpId: string, calendarEventUri: string, accepted: boolean): Promise<ISocialEventManagerWriteResult>;
    submitCalendarEventPost(info: INewCalendarEventPostInfo): Promise<ISocialEventManagerWriteResult>;
    submitLongFormContentEvents(info: ILongFormContentInfo): Promise<ISocialEventManagerWriteResult>;
    submitLike(tags: string[][]): Promise<ISocialEventManagerWriteResult>;
    submitRepost(content: string, tags: string[][]): Promise<ISocialEventManagerWriteResult>;
    updateRelayList(relays: Record<string, IRelayConfig>): Promise<ISocialEventManagerWriteResult>;
    createPaymentRequestEvent(paymentRequest: string, amount: string, comment: string, isLightningInvoice?: boolean): Promise<ISocialEventManagerWriteResult>;
    createPaymentReceiptEvent(requestEventId: string, recipient: string, comment: string, preimage?: string, tx?: string): Promise<ISocialEventManagerWriteResult>;
    updateCommunityPinnedNotes(creatorId: string, communityId: string, eventIds: string[]): Promise<ISocialEventManagerWriteResult>;
    updateUserPinnedNotes(eventIds: string[]): Promise<ISocialEventManagerWriteResult>;
    updateUserBookmarks(tags: string[][]): Promise<ISocialEventManagerWriteResult>;
    updateUserEthWalletAccountsInfo(options: SocialEventManagerWriteOptions.IUpdateUserEthWalletAccountsInfo, privateKey?: string): Promise<ISocialEventManagerWriteResult>;
    updateNoteStatus(noteId: string, status: string): Promise<ISocialEventManagerWriteResult>;
    updateCommunityStall(creatorId: string, communityId: string, stall: IMarketplaceStall): Promise<ISocialEventManagerWriteResult>;
    updateCommunityProduct(creatorId: string, communityId: string, product: IMarketplaceProduct): Promise<ISocialEventManagerWriteResult>;
}
