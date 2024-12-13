"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuyerOrderStatus = exports.SellerOrderStatus = exports.MarketplaceProductType = void 0;
var MarketplaceProductType;
(function (MarketplaceProductType) {
    MarketplaceProductType["Physical"] = "Physical";
    MarketplaceProductType["Digital"] = "Digital";
    MarketplaceProductType["Course"] = "Course";
    MarketplaceProductType["Ebook"] = "Ebook";
    MarketplaceProductType["Membership"] = "Membership";
    MarketplaceProductType["Bundle"] = "Bundle";
})(MarketplaceProductType = exports.MarketplaceProductType || (exports.MarketplaceProductType = {}));
var SellerOrderStatus;
(function (SellerOrderStatus) {
    SellerOrderStatus["Pending"] = "pending";
    SellerOrderStatus["Processing"] = "processing";
    SellerOrderStatus["Shipped"] = "shipped";
    SellerOrderStatus["Delivered"] = "delivered";
    SellerOrderStatus["Canceled"] = "canceled";
})(SellerOrderStatus = exports.SellerOrderStatus || (exports.SellerOrderStatus = {}));
var BuyerOrderStatus;
(function (BuyerOrderStatus) {
    BuyerOrderStatus["Unpaid"] = "unpaid";
    BuyerOrderStatus["Paid"] = "paid";
    BuyerOrderStatus["Shipped"] = "shipped";
    BuyerOrderStatus["Delivered"] = "delivered";
    BuyerOrderStatus["Canceled"] = "canceled";
})(BuyerOrderStatus = exports.BuyerOrderStatus || (exports.BuyerOrderStatus = {}));
