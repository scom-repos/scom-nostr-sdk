import { Event } from "../core/index";
import { IChannelInfo, ICommunityBasicInfo, ICommunityInfo, IConversationPath, ILongFormContentInfo, INewCalendarEventPostInfo, INewChannelMessageInfo, INewCommunityPostInfo, INostrMetadataContent, INostrRestAPIManager, INostrSubmitResponse, IRelayConfig, ISocialEventManagerWrite, IUpdateCalendarEventInfo, SocialEventManagerWriteOptions } from "../utils/interfaces";
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
        relayResponse: INostrSubmitResponse;
    }>;
    postNote(content: string, conversationPath?: IConversationPath, createdAt?: number): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
    deleteEvents(eventIds: string[]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
    updateChannel(info: IChannelInfo): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
    updateUserBookmarkedChannels(channelEventIds: string[]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
    updateCommunity(info: ICommunityInfo): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
    updateUserBookmarkedCommunities(communities: ICommunityBasicInfo[]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
    submitCommunityPost(info: INewCommunityPostInfo): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
    submitChannelMessage(info: INewChannelMessageInfo): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
    updateUserProfile(content: INostrMetadataContent): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
    sendMessage(receiver: string, encryptedMessage: string, replyToEventId?: string): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
    sendTempMessage(options: SocialEventManagerWriteOptions.ISendTempMessage): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
    updateGroupKeys(identifier: string, groupKind: number, keys: string, invitees: string[]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
    updateCalendarEvent(info: IUpdateCalendarEventInfo): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
    createCalendarEventRSVP(rsvpId: string, calendarEventUri: string, accepted: boolean): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
    submitCalendarEventPost(info: INewCalendarEventPostInfo): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
    submitLongFormContentEvents(info: ILongFormContentInfo): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
    submitLike(tags: string[][]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
    submitRepost(content: string, tags: string[][]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
    updateRelayList(relays: Record<string, IRelayConfig>): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
    createPaymentRequestEvent(paymentRequest: string, amount: string, comment: string, isLightningInvoice?: boolean): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
    createPaymentReceiptEvent(requestEventId: string, recipient: string, comment: string, preimage?: string, tx?: string): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
    updateCommunityPinnedNotes(creatorId: string, communityId: string, eventIds: string[]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
    updateUserPinnedNotes(eventIds: string[]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
    updateUserBookmarks(tags: string[][]): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
    updateUserEthWalletAccountsInfo(options: SocialEventManagerWriteOptions.IUpdateUserEthWalletAccountsInfo, privateKey?: string): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
    updateNoteStatus(noteId: string, status: string): Promise<{
        event: Event.VerifiedEvent<number>;
        relayResponse: INostrSubmitResponse;
    }>;
}
export { NostrEventManagerWrite };
