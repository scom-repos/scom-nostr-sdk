"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarEventType = exports.CommunityRole = exports.ProtectedMembershipPolicyType = exports.MembershipType = exports.ScpStandardId = exports.TokenType = exports.NftType = void 0;
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
