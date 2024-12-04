import { IMqttClientOptions } from "./common";
import { ISocialEventManagerRead } from "./eventManagerRead";
export declare namespace SocialDataManagerOptions {
    interface IFetchUserEthWalletAccountsInfoOptions {
        walletHash?: string;
        pubKey?: string;
    }
}
export interface ISocialDataManagerConfig {
    version?: 1 | 1.5 | 2;
    writeRelays?: string[];
    readRelay?: string;
    readManager?: ISocialEventManagerRead;
    publicIndexingRelay?: string;
    apiBaseUrl?: string;
    ipLocationServiceBaseUrl?: string;
    ipLocationServiceApiKey?: string;
    mqttBrokerUrl?: string;
    mqttClientOptions?: IMqttClientOptions;
    mqttSubscriptions?: string[];
    mqttMessageCallback?: (topic: string, message: string) => void;
    enableLightningWallet?: boolean;
}
