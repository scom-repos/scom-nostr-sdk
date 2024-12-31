import { SocialUtilsManager } from "../utilsManager";
import { ICryptocurrency, ICurrency, IRegion } from "../../interfaces";

export class SystemDataManager {
    private _publicIndexingRelay: string;
    private _privateKey: string;

    constructor(publicIndexingRelay: string) {
        this._publicIndexingRelay = publicIndexingRelay;
    }

    get privateKey() {
        return this._privateKey;
    }
    
    set privateKey(privateKey: string) {
        this._privateKey = privateKey;
    }

    private async fetchListOfValues(url: string) {
        const authHeader = SocialUtilsManager.constructAuthHeader(this._privateKey);
        let response = await fetch(url, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: authHeader
            }
        });
        let result = await response.json();
        if (result.requestId) {
            const { data } = await SocialUtilsManager.getPollResult(this._publicIndexingRelay, result.requestId, authHeader);
            if (data) result.data = data;
        }
        return result;
    }

    async fetchRegions() {
        let regions: IRegion[] = [];
        const url = `${this._publicIndexingRelay}/regions`;
        const result = await this.fetchListOfValues(url);
        if (result.success) {
            regions = result.data;
        }
        return regions;
    }

    async fetchCurrencies() {
        let currencies: ICurrency[] = [];
        const url = `${this._publicIndexingRelay}/currencies`;
        const result = await this.fetchListOfValues(url);
        if (result.success) {
            currencies = result.data;
        }
        return currencies;
    }

    async fetchCryptocurrencies() {
        let cryptocurrencies: ICryptocurrency[] = [];
        const url = `${this._publicIndexingRelay}/cryptocurrencies`;
        const result = await this.fetchListOfValues(url);
        if (result.success) {
            cryptocurrencies = result.data;
        }
        return cryptocurrencies;
    }
}