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
    async searchUsers(options) {
        return [];
    }
    async fetchPaymentRequestEvent(options) {
        return null;
    }
    async fetchPaymentActivitiesForRecipient(options) {
        return [];
    }
    async fetchPaymentActivitiesForSender(options) {
        return [];
    }
    async fetchUserFollowingFeed(options) {
        return [];
    }
}
exports.NostrEventManagerReadV2 = NostrEventManagerReadV2;
