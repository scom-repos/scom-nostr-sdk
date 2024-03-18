import { Event } from "../core/index";
type LNURLResponse = {
    status: "OK";
} | {
    status: "ERROR";
    reason: string;
};
export type LnurlStep3Response = LNURLResponse & {
    callback: string;
    minSendable: number;
    maxSendable: number;
    nostrPubkey: string;
    allowsNostr: boolean;
    commentAllowed: number;
};
export type LnurlStep6Response = LNURLResponse & {
    pr: string;
    routes: string[];
};
export declare class LightningWalletManager {
    private _privateKey;
    private webln;
    constructor();
    set privateKey(privateKey: string);
    makeInvoice(amount: string, defaultMemo: string): Promise<any>;
    sendPayment(paymentRequest: string): Promise<any>;
    createNip57Event(comment: string, relays: string[], amount: number, lnurl: string, recipient: string, eventId?: string): Event.Event;
    zap(recipient: string, lnAddress: string, amount: number, comment: string, relays: string[], eventId?: string): Promise<any>;
}
export {};
