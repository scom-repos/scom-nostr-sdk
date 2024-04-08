export declare function generatePrivateKey(): string;
export declare function getPublicKey(privateKey: string): string;
export declare function getPublicKeyY(privateKey: string): string;
export declare function getSharedSecret(privateKey: string, publicKey: string): string;
export declare function decompressPublicKey(publicKey: string): string;
