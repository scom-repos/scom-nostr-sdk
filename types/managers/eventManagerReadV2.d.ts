import { INostrRestAPIManager } from "./communication";
import { ISocialEventManagerRead } from "./eventManagerRead";
import { NostrEventManagerReadV1o5 } from "./eventManagerReadV1o5";
declare class NostrEventManagerReadV2 extends NostrEventManagerReadV1o5 implements ISocialEventManagerRead {
    protected _nostrCommunicationManager: INostrRestAPIManager;
    constructor(manager: INostrRestAPIManager);
    set nostrCommunicationManager(manager: INostrRestAPIManager);
    protected augmentWithAuthInfo(obj: Record<string, any>): Record<string, any>;
    searchUsers(query: string): Promise<any[]>;
    fetchPaymentRequestEvent(paymentRequest: string): Promise<any>;
    fetchPaymentActivitiesForRecipient(pubkey: string, since?: number, until?: number): Promise<any[]>;
    fetchPaymentActivitiesForSender(pubkey: string, since?: number, until?: number): Promise<any[]>;
    fetchUserFollowingFeed(pubKey: string, until?: number): Promise<any[]>;
}
export { NostrEventManagerReadV2 };
