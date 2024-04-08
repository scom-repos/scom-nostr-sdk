export declare function hexStringToUint8Array(hexString: string): Uint8Array;
export declare function encryptSharedMessage(ourPrivateKey: string, theirPublicKey: string, text: string): Promise<string>;
export declare function decryptSharedMessage(ourPrivateKey: string, theirPublicKey: string, encryptedData: string): Promise<string>;
export declare function encryptWithPubKey(publicKey: string, text: string): Promise<string>;
export declare function decryptWithPrivKey(privateKey: string, encryptedData: string): Promise<string>;
