import { ICryptocurrency, ICurrency, IRegion } from "../../interfaces";
export declare class SystemDataManager {
    private _publicIndexingRelay;
    private _privateKey;
    constructor(publicIndexingRelay: string);
    set privateKey(privateKey: string);
    private fetchListOfValues;
    fetchRegions(): Promise<IRegion[]>;
    fetchCurrencies(): Promise<ICurrency[]>;
    fetchCryptocurrencies(): Promise<ICryptocurrency[]>;
}
