import { Event } from "../core/index";
import { IChannelInfo, ICommunityBasicInfo, ICommunityInfo, IConversationPath, ILongFormContentInfo, INewCalendarEventPostInfo, INewChannelMessageInfo, INewCommunityPostInfo, INostrMetadataContent, INostrRestAPIManager, IRelayConfig, ISocialEventManagerWrite, IMarketplaceStall, IUpdateCalendarEventInfo, SocialEventManagerWriteOptions, IMarketplaceProduct } from "../interfaces";
import { INostrCommunicationManager } from "./communication";
declare class NostrEventManagerWrite implements ISocialEventManagerWrite {
    protected _nostrCommunicationManagers: INostrCommunicationManager[];
    protected _privateKey: string;
    protected _mainNostrRestAPIManager: INostrRestAPIManager;
    constructor(managers: INostrCommunicationManager[], mainRelay: string);
    set nostrCommunicationManagers(managers: INostrCommunicationManager[]);
    set privateKey(privateKey: string);
    protected calculateConversationPathTags(conversationPath: IConversationPath): string[][];
    private handleEventSubmission;
    updateContactList(content: string, contactPubKeys: string[]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    postNote(content: string, conversationPath?: IConversationPath, createdAt?: number): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    deleteEvents(eventIds: string[]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    updateChannel(info: IChannelInfo): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    updateUserBookmarkedChannels(channelEventIds: string[]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    updateCommunity(info: ICommunityInfo): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    updateUserBookmarkedCommunities(communities: ICommunityBasicInfo[]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    submitCommunityPost(info: INewCommunityPostInfo): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    submitChannelMessage(info: INewChannelMessageInfo): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    updateUserProfile(content: INostrMetadataContent): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    sendMessage(receiver: string, encryptedMessage: string, replyToEventId?: string): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    sendTempMessage(options: SocialEventManagerWriteOptions.ISendTempMessage): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    updateGroupKeys(identifier: string, groupKind: number, keys: string, invitees: string[]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    updateCalendarEvent(info: IUpdateCalendarEventInfo): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    createCalendarEventRSVP(rsvpId: string, calendarEventUri: string, accepted: boolean): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    submitCalendarEventPost(info: INewCalendarEventPostInfo): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    submitLongFormContentEvents(info: ILongFormContentInfo): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    submitLike(tags: string[][]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    submitRepost(content: string, tags: string[][]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    updateRelayList(relays: Record<string, IRelayConfig>): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    createPaymentRequestEvent(paymentRequest: string, amount: string, comment: string, isLightningInvoice?: boolean): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    createPaymentReceiptEvent(requestEventId: string, recipient: string, comment: string, preimage?: string, tx?: string): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    updateCommunityPinnedNotes(creatorId: string, communityId: string, eventIds: string[]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    updateUserPinnedNotes(eventIds: string[]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    updateUserBookmarks(tags: string[][]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    updateUserEthWalletAccountsInfo(options: SocialEventManagerWriteOptions.IUpdateUserEthWalletAccountsInfo, privateKey?: string): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    updateNoteStatus(noteId: string, status: string): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    updateCommunityStall(creatorId: string, communityId: string, stall: IMarketplaceStall): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
    updateCommunityProduct(creatorId: string, communityId: string, product: IMarketplaceProduct): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../interfaces").INostrSubmitResponse;
    }>;
}
export { NostrEventManagerWrite };
