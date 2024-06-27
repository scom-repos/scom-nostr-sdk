import { ISocialEventManagerRead, SocialEventManagerReadOptions } from "../utils/interfaces";
import { INostrRestAPIManager } from "./communication";
import { NostrEventManagerReadV1o5 } from "./eventManagerReadV1o5";
declare class NostrEventManagerReadV2 extends NostrEventManagerReadV1o5 implements ISocialEventManagerRead {
    protected _nostrCommunicationManager: INostrRestAPIManager;
    constructor(manager: INostrRestAPIManager);
    set nostrCommunicationManager(manager: INostrRestAPIManager);
    protected augmentWithAuthInfo(obj: Record<string, any>): Record<string, any>;
    searchUsers(options: SocialEventManagerReadOptions.ISearchUsers): Promise<any[]>;
    fetchPaymentRequestEvent(options: SocialEventManagerReadOptions.IFetchPaymentRequestEvent): Promise<any>;
    fetchPaymentActivitiesForRecipient(options: SocialEventManagerReadOptions.IFetchPaymentActivitiesForRecipient): Promise<any[]>;
    fetchPaymentActivitiesForSender(options: SocialEventManagerReadOptions.IFetchPaymentActivitiesForSender): Promise<any[]>;
    fetchUserFollowingFeed(options: SocialEventManagerReadOptions.IFetchUserFollowingFeed): Promise<any[]>;
}
export { NostrEventManagerReadV2 };
