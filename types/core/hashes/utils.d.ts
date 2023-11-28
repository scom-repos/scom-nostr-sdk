/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
export type TypedArray = Int8Array | Uint8ClampedArray | Uint8Array | Uint16Array | Int16Array | Uint32Array | Int32Array;
export declare const createView: (arr: TypedArray) => DataView;
export declare const rotr: (word: number, shift: number) => number;
export declare function bytesToHex(bytes: Uint8Array): string;
export declare function hexToBytes(hex: string): Uint8Array;
export declare function utf8ToBytes(str: string): Uint8Array;
export type Input = Uint8Array | string;
export declare function toBytes(data: Input): Uint8Array;
export declare function concatBytes(...arrays: Uint8Array[]): Uint8Array;
export declare abstract class Hash<T extends Hash<T>> {
    abstract blockLen: number;
    abstract outputLen: number;
    abstract update(buf: Input): this;
    abstract digestInto(buf: Uint8Array): void;
    abstract digest(): Uint8Array;
    abstract destroy(): void;
    abstract _cloneInto(to?: T): T;
    clone(): T;
}
export type CHash = ReturnType<typeof wrapConstructor>;
export declare function wrapConstructor<T extends Hash<T>>(hashCons: () => Hash<T>): {
    (msg: Input): Uint8Array;
    outputLen: number;
    blockLen: number;
    create(): Hash<T>;
};
export declare function randomBytes(bytesLength?: number): Uint8Array;
