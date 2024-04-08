import { SHA2 } from './_sha2';
declare class SHA256 extends SHA2<SHA256> {
    A: number;
    B: number;
    C: number;
    D: number;
    E: number;
    F: number;
    G: number;
    H: number;
    constructor();
    protected get(): [number, number, number, number, number, number, number, number];
    protected set(A: number, B: number, C: number, D: number, E: number, F: number, G: number, H: number): void;
    protected process(view: DataView, offset: number): void;
    protected roundClean(): void;
    destroy(): void;
}
export declare const sha256: {
    (msg: import("./utils").Input): Uint8Array;
    outputLen: number;
    blockLen: number;
    create(): import("./utils").Hash<SHA256>;
};
export declare const sha224: {
    (msg: import("./utils").Input): Uint8Array;
    outputLen: number;
    blockLen: number;
    create(): import("./utils").Hash<SHA256>;
};
export {};
