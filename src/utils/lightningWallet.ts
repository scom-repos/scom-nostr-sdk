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
    async makeInvoice(amount: string, defaultMemo: string) {
        const response = await this.webln.makeInvoice({
            amount,
            defaultMemo
        });
        return response as any;
    }
    async sendPayment(paymentRequest: string) {
        const response = await this.webln.sendPayment(paymentRequest)
        return response as any;
    }
    createNip57Event(comment: string, relays: string[], amount: number, lnurl: string, recipient: string, eventId?: string/*event?:Nostr.Event.Event*/): Event.Event {
        let nip57: any = {
            kind: 9734,
            content: comment,
            tags: [
                ["relays"].concat(relays),
                ["amount", amount.toString()],
                // ["lnurl", Bech32.bech32.encode("lnurl", Bech32.bech32.toWords(new TextEncoder().encode(lnurl)))],
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
    async zap(recipient: string, lnAddress: string, amount: number, comment = '', relays: string[], eventId?: string) {
        if (!lnAddress) {
            return null;
        }

        let response: any;
        let lnurl;
        let [name, domain] = lnAddress.split('@');
        lnurl = `https://${domain}/.well-known/lnurlp/${name}`;

        let lud06Res1: LnurlStep3Response = await (await fetch(lnurl)).json();

        // if (lud06Res1.status != "OK") {
        //     throw new Error("status no OK");
        // }
        if (!lud06Res1.allowsNostr) {
            throw new Error("nostr not allowed");
        }
        if (!lud06Res1.callback) {
            throw new Error("missing callback");
        }
        // if (amount < lud06Res1.minSendable || amount > lud06Res1.maxSendable) {
        //     throw new Error("amount out of range");
        // }
        if (lud06Res1.commentAllowed && lud06Res1.commentAllowed < comment.length) {
            throw new Error("comment too long");
        }

        let nip57 = this.createNip57Event(comment, relays, amount, lnurl, recipient, eventId)
        let lnurl2 = `${lud06Res1.callback}?amount=${amount}&nostr=${encodeURI(JSON.stringify(nip57))}`;

        let lud06Res2: LnurlStep6Response;
        try {
            let r = await fetch(lnurl2);
            lud06Res2 = await r.json();
        } catch (e) {
            throw e;
        }

        try {
            response = await this.webln.sendPayment(lud06Res2.pr);
        } catch (e) {
            throw e;
        }
        return response;
    }
}
