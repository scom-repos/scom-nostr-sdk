import { WebLN } from "@ijstech/ln-wallet";
import { Bech32, Event } from "../core/index";

type LNURLResponse =
    | {
        status: "OK";
    }
    | { status: "ERROR"; reason: string };
export type LnurlStep3Response = LNURLResponse & {
    callback: string;
    minSendable: number;
    maxSendable: number;
    nostrPubkey: string;
    allowsNostr: boolean;
    commentAllowed: number;
}
export type LnurlStep6Response = LNURLResponse & {
    pr: string;
    routes: string[];
}
export class LightningWalletManager {
    private _privateKey: string;
    private webln: WebLN;
    constructor() {
        this.webln = new WebLN();
    }
    set privateKey(privateKey: string) {
        this._privateKey = privateKey;
    }
    async isAvailable() {
        return typeof this.webln.provider !== "undefined";
    }
    async makeZapInvoice(recipient: string, lnAddress: string, amount: number, comment: string, relays: string[], eventId?: string) {
        if (!lnAddress) {
            return null;
        }
        const zapEndpoint = await this.getZapEndpoint(lnAddress);
        if (!zapEndpoint) {
            throw new Error("no zap endpoint");
        }
        const millisats = Math.round(amount * 1000);

        let nip57 = this.createNip57Event(comment, relays, millisats, recipient, eventId)
        let lnurl2 = `${zapEndpoint}?amount=${millisats}&nostr=${encodeURI(JSON.stringify(nip57))}`;

        let lud06Res2: LnurlStep6Response;
        try {
            let r = await fetch(lnurl2);
            lud06Res2 = await r.json();
        } catch (e) {
            throw e;
        }

        return lud06Res2.pr;
    }
    async makeInvoice(amount: number, comment: string) {
        const invoice = await this.webln.makeInvoice({
            amount,
            defaultMemo: comment
        });
        return invoice.paymentRequest;
    }
    async sendPayment(paymentRequest: string) {
        const response = await this.webln.sendPayment(paymentRequest)
        return response.preimage;
    }
    private createNip57Event(comment: string, relays: string[], amount: number, recipient: string, eventId?: string): Event.Event {
        let nip57: any = {
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
            // if (recipient != event.pubkey) {
            //     throw new Error("recipient != event.pubkey");
            // }
            nip57.tags.push(["e", eventId/*event.pubkey*/]);
        }

        nip57 = Event.finishEvent(nip57, this._privateKey);

        return nip57;
    }

    private async getZapEndpoint(lnAddress: string) {
        let lnurl;
        let [name, domain] = lnAddress.split('@');
        lnurl = `https://${domain}/.well-known/lnurlp/${name}`;
        let lud06Res1: LnurlStep3Response = await (await fetch(lnurl)).json();

        // if (lud06Res1.status != "OK") {
        //     throw new Error("status no OK");
        // }
        // if (!lud06Res1.allowsNostr) {
        //     throw new Error("nostr not allowed");
        // }
        // if (!lud06Res1.callback) {
        //     throw new Error("missing callback");
        // }
        // if (millisats < lud06Res1.minSendable || millisats > lud06Res1.maxSendable) {
        //     throw new Error("amount out of range");
        // }
        // if (lud06Res1.commentAllowed && lud06Res1.commentAllowed < comment.length) {
        //     throw new Error("comment too long");
        // }
        if (lud06Res1.allowsNostr && lud06Res1.nostrPubkey) {
            return lud06Res1.callback;
        }
        return null;
    }

    async zap(recipient: string, lnAddress: string, amount: number, comment: string, relays: string[], eventId?: string) {
        let paymentRequest = await this.makeZapInvoice(recipient, lnAddress, amount, comment, relays, eventId);
        if (!paymentRequest) {
            throw new Error("no payment request");
        }
        let response: any;
        try {
            response = await this.webln.sendPayment(paymentRequest);
        } catch (e) {
            throw e;
        }
        return response;
    }

    async getBalance() {
        const balance = this.webln.getBalance();
        return balance as any;
    }
}
