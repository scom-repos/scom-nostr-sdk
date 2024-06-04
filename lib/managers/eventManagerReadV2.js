"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NostrEventManagerReadV2 = void 0;
const utilsManager_1 = require("./utilsManager");
const eventManagerReadV1o5_1 = require("./eventManagerReadV1o5");
class NostrEventManagerReadV2 extends eventManagerReadV1o5_1.NostrEventManagerReadV1o5 {
    constructor(manager) {
        super(manager);
    }
    set nostrCommunicationManager(manager) {
        this._nostrCommunicationManager = manager;
    }
    augmentWithAuthInfo(obj) {
        return utilsManager_1.SocialUtilsManager.augmentWithAuthInfo(obj, this._privateKey);
    }
    async searchUsers(query) {
        return [];
    }
    async fetchPaymentRequestEvent(paymentRequest) {
        return null;
    }
    async fetchPaymentActivitiesForRecipient(pubkey, since = 0, until = 0) {
        return [];
    }
    async fetchPaymentActivitiesForSender(pubkey, since = 0, until = 0) {
        return [];
    }
    async fetchUserFollowingFeed(pubKey, until = 0) {
        return [];
    }
}
exports.NostrEventManagerReadV2 = NostrEventManagerReadV2;
