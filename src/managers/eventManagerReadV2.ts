import { Nip19, Event, Keys } from "../core/index";
import { IAllUserRelatedChannels, IChannelInfo, ICommunityBasicInfo, ICommunityInfo, INostrEvent, IPaymentActivity } from "../utils/interfaces";
import { INostrRestAPIManager } from "./communication";
import { SocialUtilsManager } from "./utilsManager";
import { ISocialEventManagerRead } from "./eventManagerRead";
import { NostrEventManagerReadV1o5 } from "./eventManagerReadV1o5";

class NostrEventManagerReadV2 extends NostrEventManagerReadV1o5 implements ISocialEventManagerRead {
    protected _nostrCommunicationManager: INostrRestAPIManager;

    constructor(manager: INostrRestAPIManager) {
        super(manager);
    }

    set nostrCommunicationManager(manager: INostrRestAPIManager) {
        this._nostrCommunicationManager = manager;
    }

    protected augmentWithAuthInfo(obj: Record<string, any>) {
        return SocialUtilsManager.augmentWithAuthInfo(obj, this._privateKey);
    }

    async searchUsers(query: string) {
        return [];
    }

    async fetchPaymentRequestEvent(paymentRequest: string) {
        return null;
    }

    async fetchPaymentActivitiesForRecipient(pubkey: string, since: number = 0, until: number = 0) {
        return [];
    }

    async fetchPaymentActivitiesForSender(pubkey: string, since: number = 0, until: number = 0) {
        return [];
    }

    async fetchUserFollowingFeed(pubKey: string, until: number = 0) {
        return [];
    }
}

export {
    NostrEventManagerReadV2
}