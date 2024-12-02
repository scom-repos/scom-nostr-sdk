"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarEventType = exports.CommunityRole = exports.MarketplaceProductType = exports.SubscriptionBundleType = exports.CampaignActivityType = exports.PaymentMethod = exports.PaymentModel = exports.ProtectedMembershipPolicyType = exports.MembershipType = exports.ScpStandardId = exports.TokenType = exports.NftType = void 0;
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
var ScpStandardId;
(function (ScpStandardId) {
    ScpStandardId["Community"] = "1";
    ScpStandardId["CommunityPost"] = "2";
    ScpStandardId["Channel"] = "3";
    ScpStandardId["ChannelMessage"] = "4";
    ScpStandardId["GroupKeys"] = "5";
})(ScpStandardId = exports.ScpStandardId || (exports.ScpStandardId = {}));
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
var MarketplaceProductType;
(function (MarketplaceProductType) {
    MarketplaceProductType["Physical"] = "Physical";
    MarketplaceProductType["Digital"] = "Digital";
    MarketplaceProductType["Course"] = "Course";
    MarketplaceProductType["Ebook"] = "Ebook";
    MarketplaceProductType["Membership"] = "Membership";
    MarketplaceProductType["Bundle"] = "Bundle";
})(MarketplaceProductType = exports.MarketplaceProductType || (exports.MarketplaceProductType = {}));
var CommunityRole;
(function (CommunityRole) {
    CommunityRole["Creator"] = "creator";
    CommunityRole["Moderator"] = "moderator";
    CommunityRole["GeneralMember"] = "generalMember";
    CommunityRole["None"] = "none";
})(CommunityRole = exports.CommunityRole || (exports.CommunityRole = {}));
var CalendarEventType;
(function (CalendarEventType) {
    CalendarEventType["DateBased"] = "dateBased";
    CalendarEventType["TimeBased"] = "timeBased";
})(CalendarEventType = exports.CalendarEventType || (exports.CalendarEventType = {}));
