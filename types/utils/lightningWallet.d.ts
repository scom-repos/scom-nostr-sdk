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
    makeZapInvoice(recipient: string, lnAddress: string, amount: number, comment: string, relays: string[], eventId?: string): Promise<string>;
    makeInvoice(amount: number, comment: string): Promise<string>;
    sendPayment(paymentRequest: string): Promise<string>;
    private createNip57Event;
    private getZapEndpoint;
    zap(recipient: string, lnAddress: string, amount: number, comment: string, relays: string[], eventId?: string): Promise<any>;
    getBalance(): Promise<any>;
}
export {};
