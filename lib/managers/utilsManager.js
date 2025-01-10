"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialUtilsManager = void 0;
const eth_wallet_1 = require("@ijstech/eth-wallet");
const index_1 = require("../core/index");
const interfaces_1 = require("../interfaces");
const scom_signer_1 = require("@scom/scom-signer");
const geohash_1 = __importDefault(require("../utils/geohash"));
class SocialUtilsManager {
    static hexStringToUint8Array(hexString) {
        return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    }
    static base64ToUtf8(base64) {
        if (typeof window !== "undefined") {
            return atob(base64);
        }
        else {
            return Buffer.from(base64, 'base64').toString('utf8');
        }
    }
    static utf8ToBase64(utf8) {
        if (typeof window !== "undefined") {
            return btoa(utf8);
        }
        else {
            return Buffer.from(utf8).toString('base64');
        }
    }
    static convertPrivateKeyToPubkey(privateKey) {
        if (!privateKey)
            return null;
        if (privateKey.startsWith('0x'))
            privateKey = privateKey.replace('0x', '');
        let pub = eth_wallet_1.Utils.padLeft(index_1.Keys.getPublicKey(privateKey), 64);
        return pub;
    }
    static async encryptMessage(ourPrivateKey, theirPublicKey, text) {
        const sharedSecret = index_1.Keys.getSharedSecret(ourPrivateKey, '02' + theirPublicKey);
        const sharedX = SocialUtilsManager.hexStringToUint8Array(sharedSecret.slice(2));
        let encryptedMessage;
        let ivBase64;
        if (typeof window !== "undefined") {
            const iv = crypto.getRandomValues(new Uint8Array(16));
            const key = await crypto.subtle.importKey('raw', sharedX, { name: 'AES-CBC' }, false, ['encrypt']);
            const encryptedBuffer = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, new TextEncoder().encode(text));
            encryptedMessage = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
            ivBase64 = btoa(String.fromCharCode(...iv));
        }
        else {
            const crypto = require('crypto');
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-cbc', sharedX, iv);
            encryptedMessage = cipher.update(text, 'utf8', 'base64');
            encryptedMessage += cipher.final('base64');
            ivBase64 = iv.toString('base64');
        }
        return `${encryptedMessage}?iv=${ivBase64}`;
    }
    static async decryptMessage(ourPrivateKey, theirPublicKey, encryptedData) {
        let decryptedMessage = null;
        try {
            const [encryptedMessage, ivBase64] = encryptedData.split('?iv=');
            const sharedSecret = index_1.Keys.getSharedSecret(ourPrivateKey, '02' + theirPublicKey);
            const sharedX = SocialUtilsManager.hexStringToUint8Array(sharedSecret.slice(2));
            if (typeof window !== "undefined") {
                const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
                const key = await crypto.subtle.importKey('raw', sharedX, { name: 'AES-CBC' }, false, ['decrypt']);
                const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0)));
                decryptedMessage = new TextDecoder().decode(decryptedBuffer);
            }
            else {
                const crypto = require('crypto');
                const iv = Buffer.from(ivBase64, 'base64');
                const decipher = crypto.createDecipheriv('aes-256-cbc', sharedX, iv);
                let decrypted = decipher.update(Buffer.from(encryptedMessage, 'base64'));
                decrypted = Buffer.concat([decrypted, decipher.final()]);
                decryptedMessage = decrypted.toString('utf8');
            }
        }
        catch (e) {
        }
        return decryptedMessage;
    }
    static pad(number) {
        return number < 10 ? '0' + number : number.toString();
    }
    static getGMTOffset(timezone) {
        let gmtOffset;
        try {
            const date = new Date();
            const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
            const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
            const offset = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
            const sign = offset < 0 ? '-' : '+';
            const absoluteOffset = Math.abs(offset);
            const hours = Math.floor(absoluteOffset);
            const minutes = (absoluteOffset - hours) * 60;
            gmtOffset = `GMT${sign}${this.pad(hours)}:${this.pad(minutes)}`;
        }
        catch (err) {
            console.error(err);
        }
        return gmtOffset;
    }
    static async exponentialBackoffRetry(fn, retries, delay, maxDelay, factor, stopCondition = () => true) {
        let currentDelay = delay;
        for (let i = 0; i < retries; i++) {
            try {
                const data = await fn();
                if (stopCondition(data)) {
                    return data;
                }
                else {
                    console.log(`Attempt ${i + 1} failed. Retrying in ${currentDelay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, currentDelay));
                    currentDelay = Math.min(maxDelay, currentDelay * factor);
                }
            }
            catch (error) {
                console.error('error', error);
                console.log(`Attempt ${i + 1} failed. Retrying in ${currentDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, currentDelay));
                currentDelay = Math.min(maxDelay, currentDelay * factor);
            }
        }
        throw new Error(`Failed after ${retries} retries`);
    }
    static getCommunityUri(creatorId, communityId) {
        const decodedPubkey = creatorId.startsWith('npub1') ? index_1.Nip19.decode(creatorId).data : creatorId;
        return `34550:${decodedPubkey}:${communityId}`;
    }
    static getMarketplaceStallUri(merchantId, stallId) {
        const decodedPubkey = merchantId.startsWith('npub1') ? index_1.Nip19.decode(merchantId).data : merchantId;
        return `30018:${decodedPubkey}:${stallId}`;
    }
    static getCommunityBasicInfoFromUri(communityUri) {
        const parts = communityUri.split(':');
        return {
            creatorId: parts[1],
            communityId: parts[2]
        };
    }
    static getMarketplaceStallBasicInfoFromUri(stallUri) {
        const parts = stallUri.split(':');
        return {
            merchantId: index_1.Nip19.npubEncode(parts[1]),
            stallId: parts[2]
        };
    }
    static extractCommunityInfo(event) {
        const communityId = event.tags.find(tag => tag[0] === 'd')?.[1];
        const description = event.tags.find(tag => tag[0] === 'description')?.[1];
        const rules = event.tags.find(tag => tag[0] === 'rules')?.[1];
        const image = event.tags.find(tag => tag[0] === 'image')?.[1];
        const avatar = event.tags.find(tag => tag[0] === 'avatar')?.[1];
        const privateRelay = event.tags.find(tag => tag[0] === 'private_relay')?.[1];
        const creatorId = index_1.Nip19.npubEncode(event.pubkey);
        const moderatorIds = event.tags.filter(tag => tag[0] === 'p' && tag?.[3] === 'moderator').map(tag => index_1.Nip19.npubEncode(tag[1]));
        const scpTag = event.tags.find(tag => tag[0] === 'scp');
        const enableLeaderboard = event.tags.some(tag => tag[0] === 'leaderboard');
        const parentCommunityUri = event.tags.find(tag => tag[0] === 'a')?.[1];
        let policies = [];
        let scpData;
        let gatekeeperNpub;
        let membershipType = interfaces_1.MembershipType.Open;
        let telegramBotUsername;
        let data = {};
        if (event.content) {
            try {
                data = JSON.parse(event.content);
            }
            catch {
                data = {};
            }
        }
        let pointSystem, collectibles, campaigns, postStatusOptions;
        if (scpTag && scpTag[1] === '1') {
            membershipType = interfaces_1.MembershipType.Protected;
            if (Array.isArray(data)) {
                policies = data;
            }
            else {
                if (data.policies) {
                    for (let policy of data.policies) {
                        let paymentMethod;
                        if (policy.paymentMethod) {
                            paymentMethod = policy.paymentMethod;
                        }
                        else if (policy.chainId) {
                            paymentMethod = interfaces_1.PaymentMethod.EVM;
                        }
                        else {
                            paymentMethod = policy.currency === 'TON' ? interfaces_1.PaymentMethod.TON : interfaces_1.PaymentMethod.Telegram;
                        }
                        policies.push({
                            ...policy,
                            paymentMethod
                        });
                    }
                }
            }
            const scpDataStr = SocialUtilsManager.base64ToUtf8(scpTag[2]);
            if (!scpDataStr.startsWith('$scp:'))
                return null;
            scpData = JSON.parse(scpDataStr.substring(5));
            if (scpData.gatekeeperPublicKey) {
                gatekeeperNpub = index_1.Nip19.npubEncode(scpData.gatekeeperPublicKey);
            }
        }
        if (!Array.isArray(data)) {
            telegramBotUsername = data.telegramBotUsername;
            pointSystem = data.pointSystem;
            collectibles = data.collectibles;
            campaigns = data.campaigns;
            postStatusOptions = data.postStatuses?.length > 0 && typeof data.postStatuses[0] === 'string' ? data.postStatuses.map(status => ({ status })) : data.postStatuses;
        }
        const communityUri = SocialUtilsManager.getCommunityUri(creatorId, communityId);
        let communityInfo = {
            creatorId,
            moderatorIds,
            communityUri,
            communityId,
            description,
            rules,
            bannerImgUrl: image,
            avatarImgUrl: avatar,
            scpData,
            eventData: event,
            gatekeeperNpub,
            membershipType,
            telegramBotUsername,
            privateRelay,
            policies,
            pointSystem,
            collectibles,
            campaigns,
            enableLeaderboard,
            parentCommunityUri,
            postStatusOptions
        };
        return communityInfo;
    }
    static extractCommunityStallInfo(event) {
        const stallId = event.tags.find(tag => tag[0] === 'd')?.[1];
        const communityUri = event.tags.find(tag => tag[0] === 'a')?.[1];
        let data = {};
        if (event.content) {
            try {
                data = JSON.parse(event.content);
            }
            catch {
                data = {};
            }
        }
        let communityStallInfo = {
            id: stallId,
            name: data.name,
            description: data.description,
            currency: data.currency,
            shipping: data.shipping,
            payout: data.payout,
            communityUri: communityUri,
            eventData: event
        };
        return communityStallInfo;
    }
    static extractCommunityProductInfo(event) {
        const productId = event.tags.find(tag => tag[0] === 'd')?.[1];
        const communityUri = event.tags.find(tag => tag[0] === 'a' && tag[1].startsWith('34550:'))?.[1];
        const stallUri = event.tags.find(tag => tag[0] === 'a' && tag[1].startsWith('30018:'))?.[1];
        let data = {};
        if (event.content) {
            try {
                data = JSON.parse(event.content);
            }
            catch {
                data = {};
            }
        }
        let communityProductInfo = {
            id: productId,
            stallId: data.stall_id,
            productType: data.product_type || interfaces_1.MarketplaceProductType.Physical,
            name: data.name,
            description: data.description,
            images: data.images,
            thumbnail: data.thumbnail,
            currency: data.currency,
            price: data.price,
            quantity: data.quantity,
            specs: data.specs,
            shipping: data.shipping,
            reservation: data.reservation,
            postPurchaseContent: data.postPurchaseContent,
            gatekeeperPubkey: data.gatekeeperPubkey,
            encryptedContentKey: data.encryptedContentKey,
            communityUri: communityUri,
            stallUri: stallUri,
            eventData: event,
        };
        return communityProductInfo;
    }
    static extractBookmarkedCommunities(event, excludedCommunity) {
        const communities = [];
        const communityUriArr = event?.tags.filter(tag => tag[0] === 'a')?.map(tag => tag[1]) || [];
        for (let communityUri of communityUriArr) {
            const basicInfo = SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
            if (excludedCommunity) {
                const decodedPubkey = index_1.Nip19.decode(excludedCommunity.creatorId).data;
                if (basicInfo.communityId === excludedCommunity.communityId && basicInfo.creatorId === decodedPubkey)
                    continue;
            }
            communities.push({
                communityId: basicInfo.communityId,
                creatorId: basicInfo.creatorId
            });
        }
        return communities;
    }
    static extractBookmarkedChannels(event) {
        const channelEventIds = event?.tags.filter(tag => tag[0] === 'a')?.map(tag => tag[1]) || [];
        return channelEventIds;
    }
    static extractScpData(event, standardId) {
        const scpTag = event.tags.find(tag => tag[0] === 'scp');
        let scpData;
        if (scpTag && scpTag[1] === standardId) {
            const scpDataStr = SocialUtilsManager.base64ToUtf8(scpTag[2]);
            if (!scpDataStr.startsWith('$scp:'))
                return null;
            scpData = JSON.parse(scpDataStr.substring(5));
        }
        return scpData;
    }
    static parseContent(content) {
        try {
            return JSON.parse(content);
        }
        catch (err) {
            console.log('Error parsing content', content);
        }
        ;
    }
    static extractChannelInfo(event) {
        const content = this.parseContent(event.content);
        let eventId;
        if (event.kind === 40) {
            eventId = event.id;
        }
        else if (event.kind === 41) {
            eventId = event.tags.find(tag => tag[0] === 'e')?.[1];
        }
        if (!eventId)
            return null;
        let scpData = this.extractScpData(event, interfaces_1.ScpStandardId.Channel);
        let channelInfo = {
            id: eventId,
            name: content.name,
            about: content.about,
            picture: content.picture,
            scpData,
            eventData: event,
        };
        return channelInfo;
    }
    static constructAuthHeader(privateKey) {
        if (!privateKey)
            return null;
        const pubkey = index_1.Keys.getPublicKey(privateKey);
        const signature = scom_signer_1.Signer.getSignature({ pubkey }, privateKey, { pubkey: 'string' });
        const authHeader = `Bearer ${pubkey}:${signature}`;
        return authHeader;
    }
    static constructUserProfile(metadata, followersCountMap) {
        const followersCount = followersCountMap?.[metadata.pubkey] || 0;
        const encodedPubkey = index_1.Nip19.npubEncode(metadata.pubkey);
        const metadataContent = metadata.content;
        const internetIdentifier = typeof metadataContent.nip05 === 'string' ? metadataContent.nip05?.replace('_@', '') || '' : '';
        let userProfile = {
            id: encodedPubkey,
            username: metadataContent.username || metadataContent.name,
            description: metadataContent.about,
            avatar: metadataContent.picture,
            npub: encodedPubkey,
            pubkey: metadata.pubkey,
            displayName: metadataContent.display_name || metadataContent.displayName || metadataContent.name,
            internetIdentifier,
            website: metadataContent.website,
            banner: metadataContent.banner,
            followers: followersCount,
            lud16: metadataContent.lud16,
            ethWallet: metadataContent.eth_wallet,
            telegramAccount: metadataContent.telegram_account,
            metadata,
        };
        return userProfile;
    }
    static extractCalendarEventInfo(event) {
        const description = event.content;
        const id = event.tags.find(tag => tag[0] === 'd')?.[1];
        const name = event.tags.find(tag => tag[0] === 'name')?.[1];
        const title = event.tags.find(tag => tag[0] === 'title')?.[1];
        const start = event.tags.find(tag => tag[0] === 'start')?.[1];
        const end = event.tags.find(tag => tag[0] === 'end')?.[1];
        const startTzid = event.tags.find(tag => tag[0] === 'start_tzid')?.[1];
        const endTzid = event.tags.find(tag => tag[0] === 'end_tzid')?.[1];
        const location = event.tags.find(tag => tag[0] === 'location')?.[1];
        const city = event.tags.find(tag => tag[0] === 'city')?.[1];
        let lonlat;
        const geohash = event.tags.find(tag => tag[0] === 'g')?.[1];
        if (geohash) {
            lonlat = geohash_1.default.decode(geohash);
        }
        const image = event.tags.find(tag => tag[0] === 'image')?.[1];
        let type;
        let startTime;
        let endTime;
        if (event.kind === 31922) {
            type = interfaces_1.CalendarEventType.DateBased;
            const startDate = new Date(start);
            startTime = startDate.getTime() / 1000;
            if (end) {
                const endDate = new Date(end);
                endTime = endDate.getTime() / 1000;
            }
        }
        else if (event.kind === 31923) {
            type = interfaces_1.CalendarEventType.TimeBased;
            startTime = Number(start);
            if (end) {
                endTime = Number(end);
            }
        }
        const naddr = index_1.Nip19.naddrEncode({
            identifier: id,
            pubkey: event.pubkey,
            kind: event.kind,
            relays: []
        });
        let calendarEventInfo = {
            naddr,
            type,
            id,
            title: title || name,
            description,
            start: startTime,
            end: endTime,
            startTzid,
            endTzid,
            location,
            city,
            latitude: lonlat?.latitude,
            longitude: lonlat?.longitude,
            geohash,
            image,
            eventData: event
        };
        return calendarEventInfo;
    }
    static async extractMarketplaceOrder(privateKey, event) {
        const encryptedContent = event.content;
        let order;
        try {
            const selfPubKey = index_1.Keys.getPublicKey(privateKey);
            const senderPubKey = event.pubkey;
            const recipientPubKey = event.tags.find(tag => tag[0] === 'p')?.[1];
            let contentStr;
            if (selfPubKey === senderPubKey) {
                contentStr = await SocialUtilsManager.decryptMessage(privateKey, recipientPubKey, encryptedContent);
            }
            else {
                contentStr = await SocialUtilsManager.decryptMessage(privateKey, senderPubKey, encryptedContent);
            }
            if (!contentStr?.length)
                return null;
            const content = this.parseContent(contentStr);
            const items = content.items?.map(item => ({
                productId: item.product_id,
                productName: item.product_name,
                quantity: item.quantity,
                price: item.price
            }));
            order = {
                id: content.id,
                name: content.name,
                address: content.address,
                message: content.message,
                contact: content.contact,
                items: items,
                currency: content.currency,
                shippingId: content.shipping_id,
                shippingCost: content.shipping_cost,
                totalAmount: content.total_amount,
                createdAt: event.created_at,
            };
        }
        catch (e) {
            console.warn("Failed to decrypt marketplace order", e);
        }
        return order;
    }
    static async extractPaymentActivity(privateKey, event) {
        const encryptedContent = event.content;
        let paymentActivity;
        try {
            const selfPubKey = index_1.Keys.getPublicKey(privateKey);
            const senderPubKey = event.pubkey;
            const recipientPubKey = event.tags.find(tag => tag[0] === 'p')?.[1];
            let contentStr;
            if (selfPubKey === senderPubKey) {
                contentStr = await SocialUtilsManager.decryptMessage(privateKey, recipientPubKey, encryptedContent);
            }
            else {
                contentStr = await SocialUtilsManager.decryptMessage(privateKey, senderPubKey, encryptedContent);
            }
            if (!contentStr?.length)
                return null;
            const content = this.parseContent(contentStr);
            paymentActivity = {
                id: content.id,
                sender: content.sender,
                recipient: content.recipient,
                amount: content.amount,
                currencyCode: content.currency_code,
                networkCode: content.network_code,
                stallId: content.stall_id,
                orderId: content.id,
                paymentMethod: content.payment_method,
                referenceId: content.reference_id,
                createdAt: event.created_at
            };
        }
        catch (e) {
            console.warn("Failed to decrypt payment activity", e);
        }
        return paymentActivity;
    }
    static flatMap(array, callback) {
        return array.reduce((acc, item) => {
            return acc.concat(callback(item));
        }, []);
    }
    static async getPollResult(readRelay, requestId, authHeader) {
        const pollFunction = async () => {
            const pollRequestInit = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            if (authHeader) {
                pollRequestInit.headers['Authorization'] = authHeader;
            }
            const pollResponse = await fetch(`${readRelay}/poll/${requestId}`, pollRequestInit);
            const pollResult = await pollResponse.json();
            return pollResult;
        };
        const stopPolling = (pollResult) => {
            return !!pollResult?.data;
        };
        const pollResult = await SocialUtilsManager.exponentialBackoffRetry(pollFunction, 10, 200, 10000, 2, stopPolling);
        console.log('pollResult', pollResult);
        return pollResult.data;
    }
}
exports.SocialUtilsManager = SocialUtilsManager;
