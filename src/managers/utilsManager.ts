import { Utils } from "@ijstech/eth-wallet";
import { Nip19, Event, Keys } from "../core/index";
import { IChannelInfo, ICommunityBasicInfo, ICommunityInfo, ICommunityPostStatusOption, INostrEvent, INostrMetadata, IUserProfile, MembershipType, ScpStandardId } from "../utils/interfaces";
import { Signer } from "@scom/scom-signer";

class SocialUtilsManager {
    static hexStringToUint8Array(hexString: string): Uint8Array {
        return new Uint8Array(hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    }

    static base64ToUtf8(base64: string): string {
        if (typeof window !== "undefined"){
            return atob(base64);
        }
        else {
            // @ts-ignore
            return Buffer.from(base64, 'base64').toString('utf8');
        }
    }

    static utf8ToBase64(utf8: string): string {
        if (typeof window !== "undefined"){
            return btoa(utf8);
        }
        else {
            // @ts-ignore
            return Buffer.from(utf8).toString('base64');
        }
    }

    static convertPrivateKeyToPubkey(privateKey: string) {
        if (!privateKey) return null;
        if (privateKey.startsWith('0x')) privateKey = privateKey.replace('0x', '');
        let pub = Utils.padLeft(Keys.getPublicKey(privateKey), 64);
        return pub;
    }

    static async encryptMessage(ourPrivateKey: string, theirPublicKey: string, text: string): Promise<string> {
        const sharedSecret = Keys.getSharedSecret(ourPrivateKey, '02' + theirPublicKey);
        const sharedX = SocialUtilsManager.hexStringToUint8Array(sharedSecret.slice(2));
        
        let encryptedMessage;
        let ivBase64;
        if (typeof window !== "undefined"){
            const iv = crypto.getRandomValues(new Uint8Array(16));
            const key = await crypto.subtle.importKey('raw', sharedX, { name: 'AES-CBC' }, false, ['encrypt']);
            const encryptedBuffer = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, new TextEncoder().encode(text));
            encryptedMessage = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
            ivBase64 = btoa(String.fromCharCode(...iv));
        }
        else {
            // @ts-ignore
            const crypto = require('crypto');
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-cbc', sharedX, iv);
            encryptedMessage = cipher.update(text, 'utf8', 'base64');
            encryptedMessage += cipher.final('base64');
            ivBase64 = iv.toString('base64');
        }
        return `${encryptedMessage}?iv=${ivBase64}`;
    }

    static async decryptMessage(ourPrivateKey: string, theirPublicKey: string, encryptedData: string): Promise<string> {
        let decryptedMessage = null;
        try {
            const [encryptedMessage, ivBase64] = encryptedData.split('?iv=');
            
            const sharedSecret = Keys.getSharedSecret(ourPrivateKey, '02' + theirPublicKey);
            const sharedX = SocialUtilsManager.hexStringToUint8Array(sharedSecret.slice(2)); 
            if (typeof window !== "undefined"){
                const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
                const key = await crypto.subtle.importKey('raw', sharedX, { name: 'AES-CBC' }, false, ['decrypt']);
                const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0)));
                decryptedMessage = new TextDecoder().decode(decryptedBuffer);
            }
            else {
                // @ts-ignore
                const crypto = require('crypto');
                // @ts-ignore
                const iv = Buffer.from(ivBase64, 'base64');
                const decipher = crypto.createDecipheriv('aes-256-cbc', sharedX, iv);
                // @ts-ignore
                let decrypted = decipher.update(Buffer.from(encryptedMessage, 'base64'));
                // @ts-ignore
                decrypted = Buffer.concat([decrypted, decipher.final()]);
                decryptedMessage = decrypted.toString('utf8');
            }
        }
        catch (e) {
        }
        return decryptedMessage;
    }

    private static pad(number: number): string {
        return number < 10 ? '0' + number : number.toString();
    }

    static getGMTOffset(timezone: string): string {
        let gmtOffset
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
        } catch (err) {
            console.error(err);
        }
        return gmtOffset;
    }

    static async exponentialBackoffRetry<T>(
        fn: () => Promise<T>, // Function to retry
        retries: number, // Maximum number of retries
        delay: number, // Initial delay duration in milliseconds
        maxDelay: number, // Maximum delay duration in milliseconds
        factor: number, // Exponential backoff factor
        stopCondition: (data: T) => boolean = () => true // Stop condition
    ): Promise<T> {
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

    static getCommunityUri(creatorId: string, communityId: string) {
        const decodedPubkey = creatorId.startsWith('npub1') ? Nip19.decode(creatorId).data as string : creatorId;
        return `34550:${decodedPubkey}:${communityId}`;
    }

    static getCommunityBasicInfoFromUri(communityUri: string): ICommunityBasicInfo {
        const parts = communityUri.split(':');
        return {
            creatorId: parts[1],
            communityId: parts[2]
        }
    }

    static extractCommunityInfo(event: INostrEvent) {
        const communityId = event.tags.find(tag => tag[0] === 'd')?.[1];
        const description = event.tags.find(tag => tag[0] === 'description')?.[1];
        const rules = event.tags.find(tag => tag[0] === 'rules')?.[1];
        const image = event.tags.find(tag => tag[0] === 'image')?.[1];
        const avatar = event.tags.find(tag => tag[0] === 'avatar')?.[1];
        const privateRelay = event.tags.find(tag => tag[0] === 'private_relay')?.[1];
        const creatorId = Nip19.npubEncode(event.pubkey);
        const moderatorIds = event.tags.filter(tag => tag[0] === 'p' && tag?.[3] === 'moderator').map(tag => Nip19.npubEncode(tag[1]));
        const scpTag = event.tags.find(tag => tag[0] === 'scp');
        const enableLeaderboard = event.tags.some(tag => tag[0] === 'leaderboard');
        const parentCommunityUri = event.tags.find(tag => tag[0] === 'a')?.[1];
        let policies = [];
        let scpData;
        let gatekeeperNpub;
        let membershipType: MembershipType = MembershipType.Open;
        let data: any = {};
        if (event.content) {
            try {
                data = JSON.parse(event.content)
            } catch {
                data = {};
            }
        }
        let pointSystem, collectibles, campaigns, postStatusOptions: ICommunityPostStatusOption[];
        if (scpTag && scpTag[1] === '1') {
            membershipType = MembershipType.Protected;
            policies = Array.isArray(data) ? data : data.policies || [];
            const scpDataStr = SocialUtilsManager.base64ToUtf8(scpTag[2]);
            if (!scpDataStr.startsWith('$scp:')) return null;
            scpData = JSON.parse(scpDataStr.substring(5));
            if (scpData.gatekeeperPublicKey) {
                gatekeeperNpub = Nip19.npubEncode(scpData.gatekeeperPublicKey);
            }
        }
        if (!Array.isArray(data)) {
            pointSystem = data.pointSystem;
            collectibles = data.collectibles;
            campaigns = data.campaigns;
            postStatusOptions = data.postStatuses?.length > 0 && typeof data.postStatuses[0] === 'string' ? data.postStatuses.map(status => ({ status })) : data.postStatuses;
        }
        const communityUri = SocialUtilsManager.getCommunityUri(creatorId, communityId);
        let communityInfo: ICommunityInfo = {
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
            privateRelay,
            policies,
            pointSystem,
            collectibles,
            campaigns,
            enableLeaderboard,
            parentCommunityUri,
            postStatusOptions
        }

        return communityInfo;
    }

    static extractBookmarkedCommunities(event: INostrEvent, excludedCommunity?: ICommunityInfo) {
        const communities: ICommunityBasicInfo[] = [];
        const communityUriArr = event?.tags.filter(tag => tag[0] === 'a')?.map(tag => tag[1]) || [];
        for (let communityUri of communityUriArr) {
            const basicInfo = SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
            if (excludedCommunity) {
                const decodedPubkey = Nip19.decode(excludedCommunity.creatorId).data as string;
                if (basicInfo.communityId === excludedCommunity.communityId && basicInfo.creatorId === decodedPubkey) continue;
            }
            communities.push({
                communityId: basicInfo.communityId,
                creatorId: basicInfo.creatorId
            });
        }
        return communities;
    }

    static extractBookmarkedChannels(event: INostrEvent) {
        const channelEventIds = event?.tags.filter(tag => tag[0] === 'a')?.map(tag => tag[1]) || [];
        return channelEventIds;
    }

    static extractScpData(event: INostrEvent, standardId: string) {
        const scpTag = event.tags.find(tag => tag[0] === 'scp');
        let scpData;
        if (scpTag && scpTag[1] === standardId) {
            const scpDataStr = SocialUtilsManager.base64ToUtf8(scpTag[2]);
            if (!scpDataStr.startsWith('$scp:')) return null;
            scpData = JSON.parse(scpDataStr.substring(5));
        }
        return scpData;
    }

    static parseContent(content: string): any {
        try{
            return JSON.parse(content);
        }
        catch(err){
            console.log('Error parsing content', content);
        };
    }

    static extractChannelInfo(event: INostrEvent) {
        const content = this.parseContent(event.content);
        let eventId;
        if (event.kind === 40) {
            eventId = event.id;
        }
        else if (event.kind === 41) {
            eventId = event.tags.find(tag => tag[0] === 'e')?.[1];
        }
        if (!eventId) return null;
        let scpData = this.extractScpData(event, ScpStandardId.Channel);
        let channelInfo: IChannelInfo = {
            id: eventId,
            name: content.name,
            about: content.about,
            picture: content.picture,
            scpData,
            eventData: event,
        }

        return channelInfo;
    }

    static constructAuthHeader(privateKey: string) {
        if (!privateKey) return null;
        const pubkey = Keys.getPublicKey(privateKey);
        const signature = Signer.getSignature({pubkey}, privateKey, {pubkey: 'string'});
        const authHeader = `Bearer ${pubkey}:${signature}`;
        return authHeader;
    }

    static constructUserProfile(metadata: INostrMetadata, followersCountMap?: Record<string, number>) {
        const followersCount = followersCountMap?.[metadata.pubkey] || 0;
        const encodedPubkey = Nip19.npubEncode(metadata.pubkey);
        const metadataContent = metadata.content;
        const internetIdentifier = typeof metadataContent.nip05 === 'string' ? metadataContent.nip05?.replace('_@', '') || '' : '';
        let userProfile: IUserProfile = {
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
            metadata,
        }
        return userProfile;
    }

    //FIXME: remove this when compiler is fixed
    static flatMap<T, U>(array: T[], callback: (item: T) => U[]): U[] {
        return array.reduce((acc, item) => {
            return acc.concat(callback(item));
        }, [] as U[]);
    }
}

export {
    SocialUtilsManager
}