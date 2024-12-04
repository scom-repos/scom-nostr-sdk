"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityRole = exports.SubscriptionBundleType = exports.CampaignActivityType = exports.TokenType = exports.NftType = exports.PaymentMethod = exports.PaymentModel = exports.ProtectedMembershipPolicyType = exports.MembershipType = void 0;
var MembershipType;
(function (MembershipType) {
    MembershipType["Open"] = "Open";
    MembershipType["Protected"] = "Protected";
})(MembershipType = exports.MembershipType || (exports.MembershipType = {}));
var ProtectedMembershipPolicyType;
(function (ProtectedMembershipPolicyType) {
    ProtectedMembershipPolicyType["TokenExclusive"] = "TokenExclusive";
    ProtectedMembershipPolicyType["Whitelist"] = "Whitelist";
})(ProtectedMembershipPolicyType = exports.ProtectedMembershipPolicyType || (exports.ProtectedMembershipPolicyType = {}));
var PaymentModel;
(function (PaymentModel) {
    PaymentModel["OneTimePurchase"] = "OneTimePurchase";
    PaymentModel["Subscription"] = "Subscription";
})(PaymentModel = exports.PaymentModel || (exports.PaymentModel = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["EVM"] = "EVM";
    PaymentMethod["TON"] = "TON";
    PaymentMethod["Telegram"] = "Telegram";
})(PaymentMethod = exports.PaymentMethod || (exports.PaymentMethod = {}));
var NftType;
(function (NftType) {
    NftType["ERC721"] = "ERC721";
    NftType["ERC1155"] = "ERC1155";
})(NftType = exports.NftType || (exports.NftType = {}));
var TokenType;
(function (TokenType) {
    TokenType["ERC20"] = "ERC20";
    TokenType["ERC721"] = "ERC721";
    TokenType["ERC1155"] = "ERC1155";
})(TokenType = exports.TokenType || (exports.TokenType = {}));
var CampaignActivityType;
(function (CampaignActivityType) {
    CampaignActivityType["LuckySpin"] = "LuckySpin";
    CampaignActivityType["Quest"] = "Quest";
    CampaignActivityType["BlindBox"] = "BlindBox";
    CampaignActivityType["Quiz"] = "Quiz";
})(CampaignActivityType = exports.CampaignActivityType || (exports.CampaignActivityType = {}));
var SubscriptionBundleType;
(function (SubscriptionBundleType) {
    SubscriptionBundleType["NoDiscount"] = "NoDiscount";
    SubscriptionBundleType["MinimumDuration"] = "MinimumDuration";
    SubscriptionBundleType["ValidityPeriod"] = "ValidityPeriod";
})(SubscriptionBundleType = exports.SubscriptionBundleType || (exports.SubscriptionBundleType = {}));
var CommunityRole;
(function (CommunityRole) {
    CommunityRole["Creator"] = "creator";
    CommunityRole["Moderator"] = "moderator";
    CommunityRole["GeneralMember"] = "generalMember";
    CommunityRole["None"] = "none";
})(CommunityRole = exports.CommunityRole || (exports.CommunityRole = {}));
