"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LightningWalletManager = void 0;
const ln_wallet_1 = require("@ijstech/ln-wallet");
const index_1 = require("../core/index");
class LightningWalletManager {
    constructor() {
        this.webln = new ln_wallet_1.WebLN();
    }
    set privateKey(privateKey) {
        this._privateKey = privateKey;
    }
    async makeInvoice(amount, defaultMemo) {
        const response = await this.webln.makeInvoice({
            amount,
            defaultMemo
        });
        return response;
    }
    async sendPayment(paymentRequest) {
        const response = await this.webln.sendPayment(paymentRequest);
        return response;
    }
    createNip57Event(comment, relays, amount, lnurl, recipient, eventId) {
        let nip57 = {
            kind: 9734,
            content: comment,
            tags: [
                ["relays"].concat(relays),
                ["amount", amount.toString()],
                ["p", recipient]
            ],
            created_at: Math.round(Date.now() / 1000),
        };
        if (eventId) {
            nip57.tags.push(["e", eventId]);
        }
        nip57 = index_1.Event.finishEvent(nip57, this._privateKey);
        return nip57;
    }
    async zap(recipient, lnAddress, amount, comment = '', relays, eventId) {
        if (!lnAddress) {
            return null;
        }
        let response;
        let lnurl;
        let [name, domain] = lnAddress.split('@');
        lnurl = `https://${domain}/.well-known/lnurlp/${name}`;
        let lud06Res1 = await (await fetch(lnurl)).json();
        if (!lud06Res1.allowsNostr) {
            throw new Error("nostr not allowed");
        }
        if (!lud06Res1.callback) {
            throw new Error("missing callback");
        }
        if (lud06Res1.commentAllowed && lud06Res1.commentAllowed < comment.length) {
            throw new Error("comment too long");
        }
        let nip57 = this.createNip57Event(comment, relays, amount, lnurl, recipient, eventId);
        let lnurl2 = `${lud06Res1.callback}?amount=${amount}&nostr=${encodeURI(JSON.stringify(nip57))}`;
        let lud06Res2;
        try {
            let r = await fetch(lnurl2);
            lud06Res2 = await r.json();
        }
        catch (e) {
            throw e;
        }
        try {
            response = await this.webln.sendPayment(lud06Res2.pr);
        }
        catch (e) {
            throw e;
        }
        return response;
    }
}
exports.LightningWalletManager = LightningWalletManager;
