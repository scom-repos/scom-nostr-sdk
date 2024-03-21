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
    async makeZapInvoice(recipient, lnAddress, amount, comment, relays, eventId) {
        if (!lnAddress) {
            return null;
        }
        const zapEndpoint = await this.getZapEndpoint(lnAddress);
        if (!zapEndpoint) {
            throw new Error("no zap endpoint");
        }
        const millisats = Math.round(amount * 1000);
        let nip57 = this.createNip57Event(comment, relays, millisats, recipient, eventId);
        let lnurl2 = `${zapEndpoint}?amount=${millisats}&nostr=${encodeURI(JSON.stringify(nip57))}`;
        let lud06Res2;
        try {
            let r = await fetch(lnurl2);
            lud06Res2 = await r.json();
        }
        catch (e) {
            throw e;
        }
        return lud06Res2.pr;
    }
    async makeInvoice(amount, comment) {
        const invoice = await this.webln.makeInvoice({
            amount,
            defaultMemo: comment
        });
        return invoice.paymentRequest;
    }
    async sendPayment(paymentRequest) {
        const response = await this.webln.sendPayment(paymentRequest);
        return response.preimage;
    }
    createNip57Event(comment, relays, amount, recipient, eventId) {
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
    async getZapEndpoint(lnAddress) {
        let lnurl;
        let [name, domain] = lnAddress.split('@');
        lnurl = `https://${domain}/.well-known/lnurlp/${name}`;
        let lud06Res1 = await (await fetch(lnurl)).json();
        if (lud06Res1.allowsNostr && lud06Res1.nostrPubkey) {
            return lud06Res1.callback;
        }
        return null;
    }
    async zap(recipient, lnAddress, amount, comment, relays, eventId) {
        let paymentRequest = await this.makeZapInvoice(recipient, lnAddress, amount, comment, relays, eventId);
        if (!paymentRequest) {
            throw new Error("no payment request");
        }
        let response;
        try {
            response = await this.webln.sendPayment(paymentRequest);
        }
        catch (e) {
            throw e;
        }
        return response;
    }
    async getBalance() {
        const balance = this.webln.getBalance();
        return balance;
    }
}
exports.LightningWalletManager = LightningWalletManager;
