import { INostrEvent } from "./common";

export enum MarketplaceProductType {
	Physical = "Physical",
	Digital = "Digital",
	Course = "Course",
	Ebook = "Ebook",
	Membership = "Membership",
	Bundle = "Bundle"
}

export interface IMarketplaceStallShipping {
	id: string;
	name?: string;
	cost: number;
	regions?: string[];
}

export interface IMarketplaceStall {
	id: string;
	name: string;
	description?: string;
	currency: string;
	shipping: IMarketplaceStallShipping[];
}

export interface IMarketplaceProduct {
	id: string;
	stallId: string;
	productType: MarketplaceProductType;
	name: string;
	description?: string;
	images?: string[];
	currency: string;
	price: number;
	quantity: number;
	specs?: string[][];
	shipping?: IMarketplaceStallShipping[];
}

export interface ICommunityStallInfo extends IMarketplaceStall {
	communityUri?: string;
	eventData?: INostrEvent;
}

export interface ICommunityProductInfo extends IMarketplaceProduct {
	communityUri?: string;
	stallUri?: string;
	eventData?: INostrEvent;
}

export interface IRegion {
	code: string;
	name: string;
}

export interface ICurrency {
	code: string;
	name: string;
}