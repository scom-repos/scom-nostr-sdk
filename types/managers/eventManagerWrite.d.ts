import { Event } from "../core/index";
import { IChannelInfo, ICommunityBasicInfo, ICommunityInfo, IConversationPath, ILongFormContentInfo, INewCalendarEventPostInfo, INewChannelMessageInfo, INewCommunityPostInfo, INostrMetadataContent, INostrRestAPIManager, IRelayConfig, ISocialEventManagerWrite, IMarketplaceStall, IUpdateCalendarEventInfo, SocialEventManagerWriteOptions, IMarketplaceProduct } from "../utils";
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
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    postNote(content: string, conversationPath?: IConversationPath, createdAt?: number): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    deleteEvents(eventIds: string[]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    updateChannel(info: IChannelInfo): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    updateUserBookmarkedChannels(channelEventIds: string[]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    updateCommunity(info: ICommunityInfo): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    updateUserBookmarkedCommunities(communities: ICommunityBasicInfo[]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    submitCommunityPost(info: INewCommunityPostInfo): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    submitChannelMessage(info: INewChannelMessageInfo): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    updateUserProfile(content: INostrMetadataContent): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    sendMessage(receiver: string, encryptedMessage: string, replyToEventId?: string): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    sendTempMessage(options: SocialEventManagerWriteOptions.ISendTempMessage): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    updateGroupKeys(identifier: string, groupKind: number, keys: string, invitees: string[]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    updateCalendarEvent(info: IUpdateCalendarEventInfo): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    createCalendarEventRSVP(rsvpId: string, calendarEventUri: string, accepted: boolean): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    submitCalendarEventPost(info: INewCalendarEventPostInfo): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    submitLongFormContentEvents(info: ILongFormContentInfo): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    submitLike(tags: string[][]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    submitRepost(content: string, tags: string[][]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    updateRelayList(relays: Record<string, IRelayConfig>): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    createPaymentRequestEvent(paymentRequest: string, amount: string, comment: string, isLightningInvoice?: boolean): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    createPaymentReceiptEvent(requestEventId: string, recipient: string, comment: string, preimage?: string, tx?: string): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    updateCommunityPinnedNotes(creatorId: string, communityId: string, eventIds: string[]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    updateUserPinnedNotes(eventIds: string[]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    updateUserBookmarks(tags: string[][]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    updateUserEthWalletAccountsInfo(options: SocialEventManagerWriteOptions.IUpdateUserEthWalletAccountsInfo, privateKey?: string): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    updateNoteStatus(noteId: string, status: string): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    updateCommunityStall(creatorId: string, communityId: string, stall: IMarketplaceStall): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
    updateCommunityProduct(creatorId: string, communityId: string, product: IMarketplaceProduct): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: import("../utils").INostrSubmitResponse;
    }>;
}
export { NostrEventManagerWrite };
