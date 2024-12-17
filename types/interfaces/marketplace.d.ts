import { INostrEvent } from "./common";
import { IPaymentActivityV2, IUserProfile } from "./misc";
export declare enum MarketplaceProductType {
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
    amountWithOthers?: number;
}
export interface ICryptoPayoutOption {
    cryptoCode: string;
    networkCode: string;
    tokenAddress?: string;
    walletAddress: string;
}
export interface IPayoutSettings {
    cryptoOptions: ICryptoPayoutOption[];
}
export interface IMarketplaceStall {
    id: string;
    name: string;
    description?: string;
    currency: string;
    shipping?: IMarketplaceStallShipping[];
    payout?: IPayoutSettings;
}
export interface IMarketplaceProduct {
    id: string;
    stallId: string;
    productType: MarketplaceProductType;
    name: string;
    description?: string;
    images?: string[];
    thumbnail?: string;
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
export interface ICryptocurrency {
    cryptoCode: string;
    networkCode: string;
    cryptoName: string;
    networkName: string;
    chainId?: string;
    tokenAddress?: string;
    tokenDecimals?: number;
}
export interface IMarketplaceOrderItem {
    productId: string;
    productName?: string;
    quantity: number;
    price?: number;
}
export interface IMarketplaceOrder {
    id: string;
    name?: string;
    address?: string;
    message?: string;
    contact: {
        nostr: string;
        phone?: string;
        email?: string;
    };
    items: IMarketplaceOrderItem[];
    currency?: string;
    shippingId?: string;
    shippingCost?: number;
    totalAmount?: number;
}
export interface IRetrievedMarketplaceOrder extends IMarketplaceOrder {
    stallId?: string;
    stallName?: string;
    createdAt: number;
    orderStatus?: SellerOrderStatus;
    items: IMarketplaceOrderItem[];
    userProfile?: IUserProfile;
    paymentActivity?: IPaymentActivityV2;
}
export interface IRetrievedBuyerOrder extends IRetrievedMarketplaceOrder {
    status: BuyerOrderStatus;
    productDetails?: IMarketplaceProduct[];
}
export interface IMarketplaceOrderPaymentOption {
    type: string;
    link: string;
}
export interface IMarketplaceOrderPaymentRequest {
    id: string;
    message?: string;
    paymentOptions: IMarketplaceOrderPaymentOption[];
}
export interface IMarketplaceOrderUpdateInfo {
    id: string;
    message?: string;
    status: SellerOrderStatus;
    shippingDetails?: {
        carrier?: string;
        trackingNumber?: string;
        estimatedDeliveryDate?: number;
    };
    cancellationDetails?: {
        reason: string;
        refundedAmount?: number;
    };
}
export declare enum SellerOrderStatus {
    Pending = "pending",
    Processing = "processing",
    Shipped = "shipped",
    Delivered = "delivered",
    Canceled = "canceled"
}
export declare enum BuyerOrderStatus {
    Unpaid = "unpaid",
    Paid = "paid",
    Shipped = "shipped",
    Delivered = "delivered",
    Canceled = "canceled"
}
