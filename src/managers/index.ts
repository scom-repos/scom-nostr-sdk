import { Nip19, Event, Keys } from "../core/index";
import { CalendarEventType, CommunityRole, ICalendarEventAttendee, ICalendarEventDetailInfo, ICalendarEventHost, ICalendarEventInfo, IChannelInfo, IChannelScpData, ICommunity, ICommunityBasicInfo, ICommunityInfo, ICommunityLeaderboard, ICommunityMember, ICommunityPostScpData, IConversationPath, ILocationCoordinates, ILongFormContentInfo, IMessageContactInfo, INewCalendarEventPostInfo, INewChannelMessageInfo, INewCommunityInfo, INewCommunityPostInfo, INostrEvent, INostrMetadata, INostrMetadataContent, INoteActions, INoteCommunityInfo, INoteInfo, INoteInfoExtended, IPostStats, IRelayConfig, IRetrieveChannelMessageKeysOptions, IRetrieveCommunityPostKeysByNoteEventsOptions, IRetrieveCommunityPostKeysOptions, IRetrieveCommunityThreadPostKeysOptions, ISocialDataManagerConfig, IUpdateCalendarEventInfo, IUserActivityStats, IUserProfile, MembershipType, ProtectedMembershipPolicyType, ScpStandardId } from "../utils/interfaces";
import {
    INostrCommunicationManager,
    NostrRestAPIManager,
    NostrWebSocketManager
} from "./communication";
import Geohash from '../utils/geohash';
import { MqttManager } from "../utils/mqtt";
import { LightningWalletManager } from "../utils/lightningWallet";
import { SocialUtilsManager } from "./utilsManager";
import { ISocialEventManagerWrite, NostrEventManagerWrite } from "./eventManagerWrite";
import { ISocialEventManagerRead, NostrEventManagerRead } from "./eventManagerRead";
import { NostrEventManagerReadV2 } from "./eventManagerReadV2";
import { NostrEventManagerReadV1o5 } from "./eventManagerReadV1o5";
import {Crypto} from "@scom/scom-signer";
import { Contracts, TransactionReceipt, Utils, Wallet } from "@ijstech/eth-wallet";

//FIXME: remove this when compiler is fixed
function flatMap<T, U>(array: T[], callback: (item: T) => U[]): U[] {
    return array.reduce((acc, item) => {
        return acc.concat(callback(item));
    }, [] as U[]);
}

class SocialDataManager {
    private _writeRelays: string[];
    private _publicIndexingRelay: string;
    private _apiBaseUrl: string;
    private _ipLocationServiceBaseUrl: string;
    private _socialEventManagerRead: ISocialEventManagerRead;
    private _socialEventManagerWrite: ISocialEventManagerWrite;
    private _privateKey: string;
    private mqttManager: MqttManager;
    private lightningWalletManager: LightningWalletManager;

    constructor(config: ISocialDataManagerConfig) {
        this._apiBaseUrl = config.apiBaseUrl;
        this._ipLocationServiceBaseUrl = config.ipLocationServiceBaseUrl;
        let nostrCommunicationManagers: INostrCommunicationManager[] = [];
        this._publicIndexingRelay = config.publicIndexingRelay;
        this._writeRelays = config.writeRelays;
        for (let relay of config.writeRelays) {
            if (relay.startsWith('wss://')) {
                nostrCommunicationManagers.push(new NostrWebSocketManager(relay));
            }
            else {
                nostrCommunicationManagers.push(new NostrRestAPIManager(relay));
            }
        }
        let nostrReadRelayManager = new NostrRestAPIManager(config.readRelay);
        if (config.version === 2) {
            this._socialEventManagerRead = new NostrEventManagerReadV2(
                nostrReadRelayManager as NostrRestAPIManager
            );
        }
        else if (config.version === 1.5) {
            this._socialEventManagerRead = new NostrEventManagerReadV1o5(
                nostrReadRelayManager as NostrRestAPIManager
            );
        }        
        else {
            this._socialEventManagerRead = new NostrEventManagerRead(
                nostrReadRelayManager
            );
        }

        this._socialEventManagerWrite = new NostrEventManagerWrite(
            nostrCommunicationManagers
        );
        if (config.mqttBrokerUrl) {
            try {
                this.mqttManager = new MqttManager({
                    brokerUrl: config.mqttBrokerUrl,
                    subscriptions: config.mqttSubscriptions,
                    messageCallback: config.mqttMessageCallback
                });
            } 
            catch (e) {
                console.error('Failed to connect to MQTT broker', e);
            }
        }
        if (config.enableLightningWallet) {
            this.lightningWalletManager = new LightningWalletManager();
        }
    }

    public async dispose() {
        if (this.mqttManager) {
            await this.mqttManager.disconnect();
            this.mqttManager = null;
        }
    }

    set privateKey(privateKey: string) {
        this._privateKey = privateKey;
        this._socialEventManagerRead.privateKey = privateKey;
        this._socialEventManagerWrite.privateKey = privateKey;
        if (this.lightningWalletManager) {
            this.lightningWalletManager.privateKey = privateKey;
        }
    }

    get socialEventManagerRead() {
        return this._socialEventManagerRead;
    }

    get socialEventManagerWrite() {
        return this._socialEventManagerWrite;
    }

    set relays(value: string[]) {
        this._setRelays(value);
    }

    private _setRelays(relays: string[]) {
        this._writeRelays = relays;
        let nostrCommunicationManagers: INostrCommunicationManager[] = [];
        for (let relay of relays) {
            if (relay.startsWith('wss://')) {
                nostrCommunicationManagers.push(new NostrWebSocketManager(relay));
            }
            else {
                nostrCommunicationManagers.push(new NostrRestAPIManager(relay));
            }
        }
        this._socialEventManagerWrite.nostrCommunicationManagers = nostrCommunicationManagers;
    }

    subscribeToMqttTopics(topics: string[]) {
        this.mqttManager.subscribe(topics);
    }

    unsubscribeFromMqttTopics(topics: string[]) {
        this.mqttManager.unsubscribe(topics);
    }

    publishToMqttTopic(topic: string, message: string) {
        this.mqttManager.publish(topic, message);
    }

    async retrieveCommunityEvents(creatorId: string, communityId: string) {
        const feedEvents = await this._socialEventManagerRead.fetchCommunityFeed(creatorId, communityId);
        const {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap
        } = this.createNoteEventMappings(feedEvents);
        const communityEvent = feedEvents.find(event => event.kind === 34550);
        if (!communityEvent) throw new Error('No info event found');
        const communityInfo = SocialUtilsManager.extractCommunityInfo(communityEvent);
        if (!communityInfo) throw new Error('No info event found');

        const keyEvent = await this._socialEventManagerRead.fetchGroupKeys(communityInfo.communityUri + ':keys');
        if (keyEvent) {
            communityInfo.memberKeyMap = JSON.parse(keyEvent.content);
        }

        return {
            notes,
            info: communityInfo
        }
    }

    retrieveCommunityUri(noteEvent: INostrEvent, scpData: ICommunityPostScpData) {
        let communityUri: string | null = null;
        if (scpData?.communityUri) {
            communityUri = scpData.communityUri;
        }
        else {
            const replaceableTag = noteEvent.tags.find(tag => tag[0] === 'a');
            if (replaceableTag) {
                const replaceableTagArr = replaceableTag[1].split(':');
                if (replaceableTagArr[0] === '34550') {
                    communityUri = replaceableTag[1];
                }
            }
        }
        return communityUri;
    }

    async retrievePostPrivateKey(event: INostrEvent, communityUri: string, communityPrivateKey: string) {
        let key: string | null = null;
        let postScpData = SocialUtilsManager.extractScpData(event, ScpStandardId.CommunityPost);
        try {
            const postPrivateKey = await SocialUtilsManager.decryptMessage(communityPrivateKey, event.pubkey, postScpData.encryptedKey);
            const messageContentStr = await SocialUtilsManager.decryptMessage(postPrivateKey, event.pubkey, event.content);
            const messageContent = JSON.parse(messageContentStr);
            if (communityUri === messageContent.communityUri) {
                key = postPrivateKey;
            }
        }
        catch (e) {
            // console.error(e);
        }
        return key;
    }

    async retrieveChannelMessagePrivateKey(event: INostrEvent, channelId: string, communityPrivateKey: string) {
        let key: string | null = null;
        let messageScpData = SocialUtilsManager.extractScpData(event, ScpStandardId.ChannelMessage);
        try {
            const messagePrivateKey = await SocialUtilsManager.decryptMessage(communityPrivateKey, event.pubkey, messageScpData.encryptedKey);
            const messageContentStr = await SocialUtilsManager.decryptMessage(messagePrivateKey, event.pubkey, event.content);
            const messageContent = JSON.parse(messageContentStr);
            if (channelId === messageContent.channelId) {
                key = messagePrivateKey;
            }
        }
        catch (e) {
            // console.error(e);
        }
        return key;
    }

    async retrieveCommunityPrivateKey(communityInfo: ICommunityInfo, selfPrivateKey: string) {
        let communityPrivateKey: string;
        const creatorPubkey = communityInfo.eventData.pubkey;
        const pubkey = SocialUtilsManager.convertPrivateKeyToPubkey(selfPrivateKey);
        const encryptedKey = communityInfo.memberKeyMap?.[pubkey];
        if (encryptedKey) {
            communityPrivateKey = await SocialUtilsManager.decryptMessage(selfPrivateKey, creatorPubkey, encryptedKey);
        }
        else {
            communityPrivateKey = await SocialUtilsManager.decryptMessage(selfPrivateKey, communityInfo.scpData.gatekeeperPublicKey, communityInfo.scpData.encryptedKey);
        }
        return communityPrivateKey;
    }

    private async constructCommunityNoteIdToPrivateKeyMap(creatorId: string, communityId: string) {
        let noteIdToPrivateKey: Record<string, string> = {};
        const communityEvents = await this.retrieveCommunityEvents(creatorId, communityId);
        const communityInfo = communityEvents.info;
        const notes = communityEvents.notes;
        let communityPrivateKey = await this.retrieveCommunityPrivateKey(communityInfo, this._privateKey);
        if (!communityPrivateKey) return noteIdToPrivateKey;
        for (const note of notes) {
            const postPrivateKey = await this.retrievePostPrivateKey(note.eventData, communityInfo.communityUri, communityPrivateKey);
            if (postPrivateKey) {
                noteIdToPrivateKey[note.eventData.id] = postPrivateKey;
            }
        }
        return noteIdToPrivateKey;
    }

    async retrieveCommunityPostKeys(options: IRetrieveCommunityPostKeysOptions) {
        let noteIdToPrivateKey: Record<string, string> = {};
        if (options.gatekeeperUrl) {
            let bodyData = {
                creatorId: options.creatorId,
                communityId: options.communityId,
                message: options.message,
                signature: options.signature
            };
            let url = `${options.gatekeeperUrl}/api/communities/v0/post-keys`;
            let response = await fetch(url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bodyData)
            });
            let result = await response.json();
            if (result.success) {
                noteIdToPrivateKey = result.data;
            }
        }
        else {
            const inviteOnlyNoteIdToPrivateKey = await this.constructCommunityNoteIdToPrivateKeyMap(options.creatorId, options.communityId);
            noteIdToPrivateKey = {
                ...noteIdToPrivateKey,
                ...inviteOnlyNoteIdToPrivateKey
            };
        }
        return noteIdToPrivateKey;
    }

    async retrieveCommunityThreadPostKeys(options: IRetrieveCommunityThreadPostKeysOptions) {
        const communityInfo = options.communityInfo;
        let noteIdToPrivateKey: Record<string, string> = {};
        if (options.gatekeeperUrl) {
            let bodyData = {
                creatorId: communityInfo.creatorId,
                communityId: communityInfo.communityId,
                focusedNoteId: options.focusedNoteId,
                message: options.message,
                signature: options.signature
            };
            let url = `${options.gatekeeperUrl}/api/communities/v0/post-keys`;
            let response = await fetch(url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bodyData)
            });
            let result = await response.json();
            if (result.success) {
                noteIdToPrivateKey = result.data;
            }
        }
        else {
            let communityPrivateKey = await this.retrieveCommunityPrivateKey(communityInfo, this._privateKey);
            if (!communityPrivateKey) return noteIdToPrivateKey;
            for (const note of options.noteEvents) {
                const postPrivateKey = await this.retrievePostPrivateKey(note, communityInfo.communityUri, communityPrivateKey);
                if (postPrivateKey) {
                    noteIdToPrivateKey[note.id] = postPrivateKey;
                }
            }
        }
        return noteIdToPrivateKey;
    }

    async retrieveCommunityPostKeysByNoteEvents(options: IRetrieveCommunityPostKeysByNoteEventsOptions) {
        let noteIdToPrivateKey: Record<string, string> = {};
        let communityPrivateKeyMap: Record<string, string> = {};
        const noteCommunityMappings = await this.createNoteCommunityMappings(options.notes);
        if (noteCommunityMappings.noteCommunityInfoList.length === 0) return noteIdToPrivateKey;
        const communityInfoMap: Record<string, ICommunityInfo> = {};
        for (let communityInfo of noteCommunityMappings.communityInfoList) {
            if (options.pubKey === communityInfo.creatorId) {
                let communityPrivateKey = await SocialUtilsManager.decryptMessage(this._privateKey, communityInfo.scpData.gatekeeperPublicKey, communityInfo.scpData.encryptedKey);
                if (communityPrivateKey) {
                    communityPrivateKeyMap[communityInfo.communityUri] = communityPrivateKey;
                }
            }
            communityInfoMap[communityInfo.communityUri] = communityInfo;
        }
        let gatekeeperNpubToNotesMap: Record<string, INoteCommunityInfo[]> = {};
        let inviteOnlyCommunityNotesMap: Record<string, INoteCommunityInfo[]> = {};
        let relayToNotesMap: Record<string, INoteCommunityInfo[]> = {};
        for (let noteCommunityInfo of noteCommunityMappings.noteCommunityInfoList) {
            const communityPrivateKey = communityPrivateKeyMap[noteCommunityInfo.communityUri];
            if (communityPrivateKey)  {
                const postPrivateKey = await this.retrievePostPrivateKey(noteCommunityInfo.eventData, noteCommunityInfo.communityUri, communityPrivateKey);
                if (postPrivateKey) {
                    noteIdToPrivateKey[noteCommunityInfo.eventData.id] = postPrivateKey;
                }
            }
            else {
                const communityInfo = communityInfoMap[noteCommunityInfo.communityUri];
                if (!communityInfo) continue;
                if (communityInfo.privateRelay) {
                    relayToNotesMap[communityInfo.privateRelay] = relayToNotesMap[communityInfo.privateRelay] || [];
                    relayToNotesMap[communityInfo.privateRelay].push(noteCommunityInfo);
                }
                // else if (communityInfo.membershipType === MembershipType.InviteOnly) {
                //     inviteOnlyCommunityNotesMap[communityInfo.communityUri] = inviteOnlyCommunityNotesMap[communityInfo.communityUri] || [];
                //     inviteOnlyCommunityNotesMap[communityInfo.communityUri].push(noteCommunityInfo);
                // }
                // else if (communityInfo.gatekeeperNpub) {
                //     gatekeeperNpubToNotesMap[communityInfo.gatekeeperNpub] = gatekeeperNpubToNotesMap[communityInfo.gatekeeperNpub] || [];
                //     gatekeeperNpubToNotesMap[communityInfo.gatekeeperNpub].push(noteCommunityInfo);
                // }
            }
        }
        if (Object.keys(relayToNotesMap).length > 0) {
            for (let relay in relayToNotesMap) {
                const noteIds = relayToNotesMap[relay].map(v => v.eventData.id);
                const signature = await options.getSignature(options.pubKey);
                let bodyData = {
                    noteIds: noteIds.join(','),
                    message: options.pubKey,
                    signature: signature
                };
                let url = `${relay}/api/communities/v0/post-keys`;
                let response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(bodyData)
                });
                let result = await response.json();
                if (result.success) {
                    noteIdToPrivateKey = {
                        ...noteIdToPrivateKey,
                        ...result.data
                    };
                }
            }
        }
        // if (Object.keys(gatekeeperNpubToNotesMap).length > 0) {
        //     for (let gatekeeperNpub in gatekeeperNpubToNotesMap) {
        //         const gatekeeperUrl = options.gatekeepers.find(v => v.npub === gatekeeperNpub)?.url;
        //         if (gatekeeperUrl) {
        //             const noteIds = gatekeeperNpubToNotesMap[gatekeeperNpub].map(v => v.eventData.id);
        //             const signature = await options.getSignature(options.pubKey);
        //             let bodyData = {
        //                 noteIds: noteIds.join(','),
        //                 message: options.pubKey,
        //                 signature: signature
        //             };
        //             let url = `${gatekeeperUrl}/api/communities/v0/post-keys`;
        //             let response = await fetch(url, {
        //                 method: 'POST',
        //                 headers: {
        //                     Accept: 'application/json',
        //                     'Content-Type': 'application/json',
        //                 },
        //                 body: JSON.stringify(bodyData)
        //             });
        //             let result = await response.json();
        //             if (result.success) {
        //                 noteIdToPrivateKey = {
        //                     ...noteIdToPrivateKey,
        //                     ...result.data
        //                 };
        //             }
        //         }
        //     }
        // }
        // for (let communityUri in inviteOnlyCommunityNotesMap) {
        //     for (let noteCommunityInfo of inviteOnlyCommunityNotesMap[communityUri]) {
        //         const inviteOnlyNoteIdToPrivateKey = await this.constructCommunityNoteIdToPrivateKeyMap(noteCommunityInfo.creatorId, noteCommunityInfo.communityId);
        //         noteIdToPrivateKey = {
        //             ...noteIdToPrivateKey,
        //             ...inviteOnlyNoteIdToPrivateKey
        //         };
        //     }
        // }
        return noteIdToPrivateKey;
    }

    async constructMetadataByPubKeyMap(notes: INostrEvent[]) {
        let mentionAuthorSet = new Set();
        for (let i = 0; i < notes.length; i++) {
            const mentionTags = notes[i].tags.filter(tag => tag[0] === 'p' && tag[1] !== notes[i].pubkey)?.map(tag => tag[1]) || [];
            if (mentionTags.length) {
                mentionTags.forEach(tag => mentionAuthorSet.add(tag));
            }
        }
        const uniqueKeys = Array.from(mentionAuthorSet) as string[];
        const npubs = notes.map(note => note.pubkey).filter((value, index, self) => self.indexOf(value) === index);
        const metadata = await this._socialEventManagerRead.fetchUserProfileCacheEvents([...npubs, ...uniqueKeys]);

        const metadataByPubKeyMap: Record<string, INostrMetadata> = metadata.reduce((acc, cur) => {
            const content = JSON.parse(cur.content);
            if (cur.pubkey) {
                acc[cur.pubkey] = {
                    ...cur,
                    content
                };
            }
            return acc;
        }, {});
        return metadataByPubKeyMap;
    }

    async fetchUserProfiles(pubKeys: string[]): Promise<IUserProfile[]> {
        const fetchFromCache = true;
        let metadataArr: INostrMetadata[] = [];
        let followersCountMap: Record<string, number> = {};
        const fetchData = async () => {
            if (fetchFromCache) {
                const events = await this._socialEventManagerRead.fetchUserProfileCacheEvents(pubKeys);
                for (let event of events) {
                    if (event.kind === 0) {
                        metadataArr.push({
                            ...event,
                            content: SocialUtilsManager.parseContent(event.content)
                        });
                    }
                    else if (event.kind === 10000108) {
                        followersCountMap = SocialUtilsManager.parseContent(event.content);
                    }
                }
            }
            // else {
            //     const metadataEvents = await this._socialEventManagerRead.fetchMetadata({
            //         authors: pubKeys
            //     });
            //     if (metadataEvents.length === 0) return null;
            //     metadataArr.push({
            //         ...metadataEvents[0],
            //         content: JSON.parse(metadataEvents[0].content)
            //     });
            // }
            // if (metadataArr.length == 0) {
            //     throw new Error(`Metadata not found`);
            // }
        };
        try {
            // await SocialUtilsManager.exponentialBackoffRetry(fetchData, 5, 1000, 16000, 2);
            await fetchData();
        }
        catch (error) {
            console.error('fetchUserProfiles', error);
        }
        if (metadataArr.length == 0) return null;
        const userProfiles: IUserProfile[] = [];
        for (let metadata of metadataArr) {
            let userProfile = this.constructUserProfile(metadata, followersCountMap);
            userProfiles.push(userProfile);
        }
        return userProfiles;
    }

    async updateUserProfile(content: INostrMetadataContent) {
        await this._socialEventManagerWrite.updateUserProfile(content)
    }

    async fetchTrendingNotesInfo() {
        let notes: INoteInfo[] = [];
        let metadataByPubKeyMap: Record<string, INostrMetadata> = {};
        const events = await this._socialEventManagerRead.fetchTrendingCacheEvents();
        for (let event of events) {
            if (event.kind === 0) {
                metadataByPubKeyMap[event.pubkey] = {
                    ...event,
                    content: SocialUtilsManager.parseContent(event.content)
                };
            }
            else if (event.kind === 1) {
                notes.push({
                    eventData: event
                });
            }
        }
        return {
            notes,
            metadataByPubKeyMap
        };
    }

    async fetchProfileFeedInfo(pubKey: string, since: number = 0, until?: number) {
        const selfPubkey = this._privateKey ? SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey) : null;
        const events = await this._socialEventManagerRead.fetchProfileFeedCacheEvents(selfPubkey, pubKey, since, until);
        const earliest = this.getEarliestEventTimestamp(events.filter(v => v.created_at));
        const {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            noteToRepostIdMap
        } = this.createNoteEventMappings(events);
        for (let note of notes as INoteInfoExtended[]) {
            if (note.eventData.tags?.length) {
                const communityUri = note.eventData.tags.find(tag => tag[0] === 'a')?.[1];
                if (communityUri) {
                    const {creatorId, communityId} = SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                    note.community = {
                        communityUri,
                        communityId,
                        creatorId: Nip19.npubEncode(creatorId)
                    };
                }
            }
            const noteId = note.eventData.id;
            const repostId = noteToRepostIdMap[noteId];
            if (!repostId) continue;
            const metadata = metadataByPubKeyMap[repostId];
            if (!metadata) continue;
            const metadataContent = metadata.content;
            const encodedPubkey = Nip19.npubEncode(metadata.pubkey);
            const internetIdentifier = typeof metadataContent.nip05 === 'string' ? metadataContent.nip05?.replace('_@', '') || '' : '';
            note.repost = {
                id: encodedPubkey,
                username: '',
                description: metadataContent.about,
                avatar: metadataContent.picture,
                pubKey: encodedPubkey,
                displayName: metadataContent.display_name || metadataContent.name,
                internetIdentifier: internetIdentifier
            };
        }
        return {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            earliest
        };
    }

    async fetchProfileRepliesInfo(pubKey: string, since: number = 0, until?: number) {
        const selfPubkey = this._privateKey ? SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey) : null;
        const events = await this._socialEventManagerRead.fetchProfileRepliesCacheEvents(selfPubkey, pubKey, since, until);
        const earliest = this.getEarliestEventTimestamp(events.filter(v => v.created_at));
        const {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            noteToParentAuthorIdMap
        } = this.createNoteEventMappings(events, true);
        for (let note of notes as INoteInfoExtended[]) {
            const noteId = note.eventData.id;
            const parentAuthorId = noteToParentAuthorIdMap[noteId];
            if (!parentAuthorId) continue;
            const metadata = metadataByPubKeyMap[parentAuthorId];
            if (!metadata) continue;
            const metadataContent = metadata.content;
            const encodedPubkey = Nip19.npubEncode(metadata.pubkey);
            const internetIdentifier = typeof metadataContent.nip05 === 'string' ? metadataContent.nip05?.replace('_@', '') || '' : '';
            note.parentAuthor = {
                id: encodedPubkey,
                username: '',
                description: metadataContent.about,
                avatar: metadataContent.picture,
                pubKey: encodedPubkey,
                displayName: metadataContent.display_name || metadataContent.name,
                internetIdentifier: internetIdentifier
            };
        }

        return {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            earliest
        };
    }

    async fetchNotesByIds(ids: string[]) {
        const noteEvents = await this._socialEventManagerRead.fetchEventsByIds(ids);
        return noteEvents;
    }

    private getEarliestEventTimestamp(events: INostrEvent[]) {
        if (!events || events.length === 0) {
            return 0;
        }
        return events.reduce((createdAt, event) => {
            return Math.min(createdAt, event.created_at);
        }, events[0].created_at);
    }

    async fetchHomeFeedInfo(pubKey: string, since: number = 0, until?: number) {
        let events: INostrEvent[] = await this._socialEventManagerRead.fetchHomeFeedCacheEvents(pubKey, since, until);
        const earliest = this.getEarliestEventTimestamp(events.filter(v => v.created_at));
        const {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap
        } = this.createNoteEventMappings(events);
        return {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            earliest
        }
    }
    async fetchUserFollowingFeedInfo(pubKey: string, until?: number) {
        let events: INostrEvent[] = await this._socialEventManagerRead.fetchUserFollowingFeed(pubKey, until);
        const earliest = this.getEarliestEventTimestamp(events.filter(v => (v.kind === 1 || v.kind === 6) && v.created_at));
        const {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap
        } = this.createNoteEventMappings(events);
        return {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            earliest
        }
    }
    createNoteEventMappings(events: INostrEvent[], parentAuthorsInfo: boolean = false) {
        let notes: INoteInfo[] = [];
        let metadataByPubKeyMap: Record<string, INostrMetadata> = {};
        let quotedNotesMap: Record<string, INoteInfo> = {};
        let noteToParentAuthorIdMap: Record<string, string> = {};
        let noteToRepostIdMap: Record<string, string> = {};
        let noteStatsMap: Record<string, IPostStats> = {};
        let noteActionsMap: Record<string, INoteActions> = {}
        for (let event of events) {
            if (event.kind === 0) {
                metadataByPubKeyMap[event.pubkey] = {
                    ...event,
                    content: SocialUtilsManager.parseContent(event.content)
                };
            }
            else if (event.kind === 10000107) {
                const noteEvent = SocialUtilsManager.parseContent(event.content) as INostrEvent;
                quotedNotesMap[noteEvent.id] = {
                    eventData: noteEvent
                }
            }
            else if (event.kind === 1) {
                notes.push({
                    eventData: event
                });
                if (parentAuthorsInfo) {
                    const parentAuthors = event.tags.filter(tag => tag[0] === 'p')?.map(tag => tag[1]) || [];
                    if (parentAuthors.length > 0) {
                        noteToParentAuthorIdMap[event.id] = parentAuthors[parentAuthors.length - 1];
                    }
                }
            }
            else if (event.kind === 6) {
                if (!event.content) continue;
                const originalNoteContent = SocialUtilsManager.parseContent(event.content);
                notes.push({
                    eventData: originalNoteContent
                });
                if (originalNoteContent?.id)
                    noteToRepostIdMap[originalNoteContent.id] = event.pubkey;
                if (parentAuthorsInfo) {
                    const parentAuthors = event.tags.filter(tag => tag[0] === 'p')?.map(tag => tag[1]) || [];
                    if (parentAuthors.length > 0) {
                        noteToParentAuthorIdMap[event.id] = parentAuthors[parentAuthors.length - 1];
                    }
                }
            }
            else if (event.kind === 10000100) {
                const content = SocialUtilsManager.parseContent(event.content);
                noteStatsMap[content.event_id] = {
                    upvotes: content.likes,
                    replies: content.replies,
                    reposts: content.reposts,
                    satszapped: content.satszapped
                }
            }
            else if (event.kind === 10000113) {
                //"{\"since\":1700034697,\"until\":1700044097,\"order_by\":\"created_at\"}"
                const timeInfo = SocialUtilsManager.parseContent(event.content);
            }
            else if (event.kind === 10000115) {
                const content = SocialUtilsManager.parseContent(event.content);
                noteActionsMap[content.event_id] = {
                    liked: content.liked,
                    replied: content.replied,
                    reposted: content.reposted,
                    zapped: content.zapped
                }
            }
        }
        for (let note of notes) {
            const noteId = note.eventData?.id;
            note.stats = noteStatsMap[noteId];
            note.actions = noteActionsMap[noteId];
        }
        return {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            noteToParentAuthorIdMap,
            noteStatsMap,
            noteToRepostIdMap,
            noteActionsMap
        }
    }

    async fetchCommunityInfo(creatorId: string, communityId: string) {
        const communityEvents = await this._socialEventManagerRead.fetchCommunity(creatorId, communityId);
        const communityEvent = communityEvents.find(event => event.kind === 34550);
        if(!communityEvent) return null;
        let communityInfo = SocialUtilsManager.extractCommunityInfo(communityEvent);
        const keyEvent = await this._socialEventManagerRead.fetchGroupKeys(communityInfo.communityUri + ':keys');
        if (keyEvent) {
            communityInfo.memberKeyMap = JSON.parse(keyEvent.content);
        }
        return communityInfo;
    }

    private getRandomInt(min: number, max: number) {
        const minCeiled = Math.ceil(min);
        const maxFloored = Math.floor(max);
        return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
    }

    private constructLeaderboard(members: ICommunityMember[], min: number, max: number) {
        const data: ICommunityLeaderboard[] = members.map(m => ({
            npub: m.id,
            username: m.username,
            displayName: m.name,
            avatar: m.profileImageUrl,
            internetIdentifier: m.internetIdentifier,
            point: this.getRandomInt(min, max)
        })).sort((a,b) => b.point - a.point).slice(0, 10);
        return data;
    }

    async fetchCommunityLeaderboard(community: ICommunityInfo) {
        const communityUriToMembersMap = await this.fetchCommunitiesMembers([community]);
        const members = communityUriToMembersMap[community.communityUri] || [];
        const allTime = this.constructLeaderboard(members, 100, 600);
        const monthly = this.constructLeaderboard(members, 40, 99);
        const weekly = this.constructLeaderboard(members, 1, 39);
        return {
            allTime,
            monthly,
            weekly
        }
    }

    async fetchCommunityFeedInfo() {
        let result: { info: ICommunityInfo, notes: INostrEvent[] }[] = [];
        const suggestedCommunities = [
            {
                creatorId: 'npub1rjc54ve4sahunm7r0kpchg58eut7ttwvevst7m2fl8dfd9w4y33q0w0qw2',
                communityId: 'Photography'
            },
            {
                creatorId: 'npub1c6dhrhzkflwr2zkdmlujnujawgp2c9rsep6gscyt6mvcusnt5a3srnzmx3',
                communityId: 'Vegan_Consciousness'
            },
            // {
            //     creatorId: 'npub17nd4yu9anyd3004pumgrtazaacujjxwzj36thtqsxskjy0r5urgqf6950x',
            //     communityId: 'Art'
            // }
        ];
        for (let community of suggestedCommunities) {
            const feedEvents = await this._socialEventManagerRead.fetchCommunityFeed(community.creatorId, community.communityId);
            const notes = feedEvents.filter(event => event.kind === 1);
            const communityEvent = feedEvents.find(event => event.kind === 34550);
            if (!communityEvent) throw new Error('No info event found');
            const communityInfo = SocialUtilsManager.extractCommunityInfo(communityEvent);
            if (!communityInfo) throw new Error('No info event found');
            const keyEvent = await this._socialEventManagerRead.fetchGroupKeys(communityInfo.communityUri + ':keys');
            if (keyEvent) {
                communityInfo.memberKeyMap = JSON.parse(keyEvent.content);
            }
            result.push({
                info: communityInfo,
                notes
            });
        }

        return result
    }

    async fetchUserRelatedCommunityFeedInfo(pubKey: string) {
        let communityUriArr: string[] = [];
        let communityEventsMap: Record<string, { info: ICommunityInfo, notes: INostrEvent[] }> = {};

        const events = await this._socialEventManagerRead.fetchAllUserRelatedCommunities(pubKey);
        for (let event of events) {
            if (event.kind === 34550) {
                const communityInfo = SocialUtilsManager.extractCommunityInfo(event);
                const keyEvent = await this._socialEventManagerRead.fetchGroupKeys(communityInfo.communityUri + ':keys');
                if (keyEvent) {
                    communityInfo.memberKeyMap = JSON.parse(keyEvent.content);
                }
                communityUriArr.push(communityInfo.communityUri);
                communityEventsMap[communityInfo.communityUri] = { info: communityInfo, notes: [] };
            }
        }
        if (communityUriArr.length > 0) {
            const feedEvents = await this._socialEventManagerRead.fetchCommunitiesFeed(communityUriArr);
            for (let event of feedEvents) {
                const communityUri = event.tags.find(tag => tag[0] === 'a')?.[1];
                if (communityEventsMap[communityUri]) communityEventsMap[communityUri].notes.push(event);
            }
        }

        return Object.values(communityEventsMap);
    }

    async fetchThreadNotesInfo(focusedNoteId: string) {
        let focusedNote: INoteInfo;
        let ancestorNotes: INoteInfo[] = [];
        let replies: INoteInfo[] = [];
        let childReplyEventTagIds: string[] = [];
        //Ancestor posts -> Focused post -> Child replies
        let decodedFocusedNoteId = focusedNoteId.startsWith('note1') ? Nip19.decode(focusedNoteId).data as string : focusedNoteId;
        const selfPubkey = this._privateKey ? SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey) : null;
        const threadEvents = await this._socialEventManagerRead.fetchThreadCacheEvents(decodedFocusedNoteId, selfPubkey);
        const {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap
        } = this.createNoteEventMappings(threadEvents);
        for (let note of notes as INoteInfoExtended[]) {
            if (note.eventData.tags?.length) {
                const communityUri = note.eventData.tags.find(tag => tag[0] === 'a')?.[1];
                if (communityUri) {
                    const {creatorId, communityId} = SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                    note.community = {
                        communityUri,
                        communityId,
                        creatorId: Nip19.npubEncode(creatorId)
                    };
                }
            }
            if (note.eventData.id === decodedFocusedNoteId) {
                focusedNote = note;
            }
            else if (note.eventData.tags.some(tag => tag[0] === 'e' && tag[1] === decodedFocusedNoteId)) {
                replies.push(note);
            }
            else {
                ancestorNotes.push(note);
            }
        }
        replies = replies.sort((a, b) => b.eventData.created_at - a.eventData.created_at);
        ancestorNotes = ancestorNotes.sort((a, b) => a.eventData.created_at - b.eventData.created_at);
        let communityInfo: ICommunityInfo | null = null;
        let scpData = SocialUtilsManager.extractScpData(focusedNote.eventData, ScpStandardId.CommunityPost);
        if (scpData) {
            const communityUri = this.retrieveCommunityUri(focusedNote.eventData, scpData);
            if (communityUri) {
                const {creatorId, communityId} = SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                communityInfo = await this.fetchCommunityInfo(creatorId, communityId);
            }
        }
        return {
            focusedNote,
            ancestorNotes,
            replies,
            quotedNotesMap,
            metadataByPubKeyMap,
            childReplyEventTagIds,
            communityInfo
        };
    }

    async createNoteCommunityMappings(notes: INostrEvent[]) {
        let noteCommunityInfoList: INoteCommunityInfo[] = [];
        let pubkeyToCommunityIdsMap: Record<string, string[]> = {};
        let communityInfoList: ICommunityInfo[] = [];
        for (let note of notes) {
            let scpData = SocialUtilsManager.extractScpData(note, ScpStandardId.CommunityPost);
            if (scpData) {
                const communityUri = this.retrieveCommunityUri(note, scpData);
                if (communityUri) {
                    const {creatorId, communityId} = SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                    pubkeyToCommunityIdsMap[creatorId] = pubkeyToCommunityIdsMap[creatorId] || [];
                    if (!pubkeyToCommunityIdsMap[creatorId].includes(communityId)) {
                        pubkeyToCommunityIdsMap[creatorId].push(communityId);
                    }
                    noteCommunityInfoList.push({
                        eventData: note,
                        communityUri,
                        communityId,
                        creatorId
                    });
                }
            }
        }

        if (noteCommunityInfoList.length > 0) {
            const communityEvents = await this._socialEventManagerRead.fetchCommunities(pubkeyToCommunityIdsMap);
            for (let event of communityEvents) {
                let communityInfo = SocialUtilsManager.extractCommunityInfo(event);
                communityInfoList.push(communityInfo);
            }
        }

        return {
            noteCommunityInfoList,
            communityInfoList
        }
    }

    async retrieveUserProfileDetail(pubKey: string) {
        let metadata: INostrMetadata;
        let stats: IUserActivityStats;
        const userContactEvents = await this._socialEventManagerRead.fetchUserProfileDetailCacheEvents(pubKey);
        for (let event of userContactEvents) {
            if (event.kind === 0) {
                metadata = {
                    ...event,
                    content: SocialUtilsManager.parseContent(event.content)
                };
            }
            else if (event.kind === 10000105) {
                let content = SocialUtilsManager.parseContent(event.content);
                stats = {
                    notes: content.note_count,
                    replies: content.reply_count,
                    followers: content.followers_count,
                    following: content.follows_count,
                    relays: content.relay_count,
                    timeJoined: content.time_joined
                }
            }
        }
        if (!metadata) return null;
        let userProfile = this.constructUserProfile(metadata);
        return {
            userProfile,
            stats
        }
    }

    private constructUserProfile(metadata: INostrMetadata, followersCountMap?: Record<string, number>) {
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
            metadata,
        }
        return userProfile;
    }

    async fetchUserContactList(pubKey: string) {
        let metadataArr: INostrMetadata[] = [];
        let followersCountMap: Record<string, number> = {};
        const userContactEvents = await this._socialEventManagerRead.fetchContactListCacheEvents(pubKey, true);
        for (let event of userContactEvents) {
            if (event.kind === 0) {
                metadataArr.push({
                    ...event,
                    content: SocialUtilsManager.parseContent(event.content)
                });
            }
            else if (event.kind === 10000108) {
                followersCountMap = SocialUtilsManager.parseContent(event.content);
            }
        }
        const userProfiles: IUserProfile[] = [];
        for (let metadata of metadataArr) {
            let userProfile = this.constructUserProfile(metadata, followersCountMap);
            userProfiles.push(userProfile);
        }
        return userProfiles;
    }

    async fetchUserFollowersList(pubKey: string) {
        let metadataArr: INostrMetadata[] = [];
        let followersCountMap: Record<string, number> = {};
        const userFollowersEvents = await this._socialEventManagerRead.fetchFollowersCacheEvents(pubKey);
        for (let event of userFollowersEvents) {
            if (event.kind === 0) {
                metadataArr.push({
                    ...event,
                    content: SocialUtilsManager.parseContent(event.content)
                });
            }
            else if (event.kind === 10000108) {
                followersCountMap = SocialUtilsManager.parseContent(event.content);
            }
        }
        const userProfiles: IUserProfile[] = [];
        for (let metadata of metadataArr) {
            let userProfile = this.constructUserProfile(metadata, followersCountMap);
            userProfiles.push(userProfile);
        }
        return userProfiles;
    }

    async fetchUserRelayList(pubKey: string) {
        let relayList: string[] = [];
        const relaysEvents = await this._socialEventManagerRead.fetchUserRelays(pubKey);
        const relaysEvent = relaysEvents.find(event => event.kind === 10000139);
        if (!relaysEvent) return relayList;
        relayList = relaysEvent.tags.filter(tag => tag[0] === 'r')?.map(tag => tag[1]) || [];
        relayList = Array.from(new Set(relayList));
        return relayList;
    }

    async followUser(userPubKey: string) {
        const decodedUserPubKey = userPubKey.startsWith('npub1') ? Nip19.decode(userPubKey).data as string : userPubKey;
        const selfPubkey = SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const contactListEvents = await this._socialEventManagerRead.fetchContactListCacheEvents(selfPubkey, false);
        let content = '';
        let contactPubKeys: Set<string> = new Set();
        let contactListEvent = contactListEvents.find(event => event.kind === 3);
        if (contactListEvent) {
            content = contactListEvent.content;
            contactPubKeys = new Set(contactListEvent.tags.filter(tag => tag[0] === 'p')?.map(tag => tag[1]) || []);
        }
        contactPubKeys.add(decodedUserPubKey);
        await this._socialEventManagerWrite.updateContactList(content, Array.from(contactPubKeys));
    }

    async unfollowUser(userPubKey: string) {
        const decodedUserPubKey = userPubKey.startsWith('npub1') ? Nip19.decode(userPubKey).data as string : userPubKey;
        const selfPubkey = SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const contactListEvents = await this._socialEventManagerRead.fetchContactListCacheEvents(selfPubkey, false);
        let content = '';
        let contactPubKeys: Set<string> = new Set();
        const contactListEvent = contactListEvents.find(event => event.kind === 3);
        if (contactListEvent) {
            content = contactListEvent.content;
            for (let tag of contactListEvent.tags) {
                if (tag[0] === 'p' && tag[1] !== decodedUserPubKey) {
                    contactPubKeys.add(tag[1]);
                }
            }
        }
        await this._socialEventManagerWrite.updateContactList(content, Array.from(contactPubKeys));
    }

    async generateGroupKeys(privateKey: string, encryptionPublicKeys: string[]) {
        const groupPrivateKey = Keys.generatePrivateKey();
        const groupPublicKey = Keys.getPublicKey(groupPrivateKey);
        let encryptedGroupKeys: Record<string, string> = {};
        for (let encryptionPublicKey of encryptionPublicKeys) {
            const encryptedGroupKey = await SocialUtilsManager.encryptMessage(privateKey, encryptionPublicKey, groupPrivateKey);
            encryptedGroupKeys[encryptionPublicKey] = encryptedGroupKey;
        }
        return {
            groupPrivateKey,
            groupPublicKey,
            encryptedGroupKeys
        }
    }

    async createCommunity(newInfo: INewCommunityInfo, creatorId: string) {
        const communityUri = SocialUtilsManager.getCommunityUri(creatorId, newInfo.name);
        let communityInfo: ICommunityInfo = {
            communityUri,
            communityId: newInfo.name,
            creatorId,
            description: newInfo.description,
            rules: newInfo.rules,
            bannerImgUrl: newInfo.bannerImgUrl,
            avatarImgUrl: newInfo.avatarImgUrl,
            moderatorIds: newInfo.moderatorIds,
            scpData: newInfo.scpData,
            membershipType: newInfo.membershipType,
            privateRelay: newInfo.privateRelay,
            gatekeeperNpub: newInfo.gatekeeperNpub,
            policies: newInfo.policies,
            pointSystem: newInfo.pointSystem,
            collectibles: newInfo.collectibles
        }

        if (communityInfo.membershipType === MembershipType.Protected) {
            const gatekeeperPublicKey = Nip19.decode(communityInfo.gatekeeperNpub).data as string;
            const creatorPubkey = Nip19.decode(communityInfo.creatorId).data as string;
            let encryptionPublicKeys = [creatorPubkey, gatekeeperPublicKey];
            let memberIds: string[] = [communityInfo.creatorId, communityInfo.gatekeeperNpub];
            for (let policy of communityInfo.policies) {
                if (policy.type === ProtectedMembershipPolicyType.TokenExclusive) {
                }
                else if (policy.type === ProtectedMembershipPolicyType.Whitelist) {
                    for (let memberId of policy.memberIds) {
                        const memberPublicKey = Nip19.decode(memberId).data as string;
                        encryptionPublicKeys.push(memberPublicKey);
                    }
                    memberIds = [...memberIds, ...policy.memberIds];
                }
            }
            const communityKeys = await this.generateGroupKeys(this._privateKey, encryptionPublicKeys);
            communityInfo.scpData = {
                ...communityInfo.scpData,
                publicKey: communityKeys.groupPublicKey,
                gatekeeperPublicKey
            }
            memberIds = Array.from(new Set(memberIds));
            await this._socialEventManagerWrite.updateGroupKeys(
                communityUri + ':keys',
                34550,
                JSON.stringify(communityKeys.encryptedGroupKeys),
                memberIds
            );
            if (communityInfo.scpData) {
                const updateChannelResponses = await this.updateCommunityChannel(communityInfo);
                //FIXME: fix this when the relay is fixed
                const updateChannelResponse = updateChannelResponses.find(v => v.success && !!v.eventId);
                if (updateChannelResponse?.eventId) {
                    communityInfo.scpData.channelEventId = updateChannelResponse.eventId;
                }
            }
        }
        await this._socialEventManagerWrite.updateCommunity(communityInfo);

        return communityInfo;
    }

    async updateCommunity(info: ICommunityInfo) {
        if (info.membershipType === MembershipType.Protected) {
            const gatekeeperPublicKey = Nip19.decode(info.gatekeeperNpub).data as string;
            const creatorPubkey = Nip19.decode(info.creatorId).data as string;
            let encryptionPublicKeys = [creatorPubkey, gatekeeperPublicKey];
            let memberIds: string[] = [info.creatorId, info.gatekeeperNpub];
            for (let policy of info.policies) {
                if (policy.type === ProtectedMembershipPolicyType.TokenExclusive) {
                }
                else if (policy.type === ProtectedMembershipPolicyType.Whitelist) {
                    for (let memberId of policy.memberIds) {
                        const memberPublicKey = Nip19.decode(memberId).data as string;
                        encryptionPublicKeys.push(memberPublicKey);
                    }
                    memberIds = [...memberIds, ...policy.memberIds];
                }
            }
            const groupPrivateKey = await this.retrieveCommunityPrivateKey(info, this._privateKey);
            let encryptedGroupKeys: Record<string, string> = {};
            for (let encryptionPublicKey of encryptionPublicKeys) {
                const encryptedGroupKey = await SocialUtilsManager.encryptMessage(this._privateKey, encryptionPublicKey, groupPrivateKey);
                encryptedGroupKeys[encryptionPublicKey] = encryptedGroupKey;
            }
            // const communityKeys = await this.generateGroupKeys(this._privateKey, encryptionPublicKeys);
            // info.scpData = {
            //     ...info.scpData,
            //     publicKey: communityKeys.groupPublicKey,
            //     gatekeeperPublicKey
            // }
            memberIds = Array.from(new Set(memberIds));
            const response = await this._socialEventManagerWrite.updateGroupKeys(
                info.communityUri + ':keys',
                34550,
                JSON.stringify(encryptedGroupKeys),
                memberIds
            );
        }
        await this._socialEventManagerWrite.updateCommunity(info);
        return info;
    }

    async updateCommunityChannel(communityInfo: ICommunityInfo) {
        let channelScpData: IChannelScpData = {
            communityUri: communityInfo.communityUri
        }
        let channelInfo: IChannelInfo = {
            name: communityInfo.communityId,
            about: communityInfo.description,
            scpData: channelScpData
        }
        const updateChannelResponse = await this._socialEventManagerWrite.updateChannel(channelInfo);
        return updateChannelResponse;
    }

    async createChannel(channelInfo: IChannelInfo, memberIds: string[]) {
        let encryptionPublicKeys: string[] = [];
        for (let memberId of memberIds) {
            const memberPublicKey = Nip19.decode(memberId).data as string;
            encryptionPublicKeys.push(memberPublicKey);
        }
        const channelKeys = await this.generateGroupKeys(this._privateKey, encryptionPublicKeys);
        channelInfo.scpData = {
            ...channelInfo.scpData,
            publicKey: channelKeys.groupPublicKey
        }
        const updateChannelResponses = await this._socialEventManagerWrite.updateChannel(channelInfo);
        //FIXME: fix this when the relay is fixed
        const updateChannelResponse = updateChannelResponses.find(v => v.success && !!v.eventId);
        if (updateChannelResponse?.eventId) {
            const channelUri = `40:${updateChannelResponse.eventId}`;
            await this._socialEventManagerWrite.updateGroupKeys(
                channelUri + ':keys',
                40,
                JSON.stringify(channelKeys.encryptedGroupKeys),
                memberIds
            );
        }
        return channelInfo;
    }

    async updateChannel(channelInfo: IChannelInfo) {
        const updateChannelResponses = await this._socialEventManagerWrite.updateChannel(channelInfo);
        return updateChannelResponses;
    }

    async fetchCommunitiesMembers(communities: ICommunityInfo[]) {
        if (communities.length === 0) return {};
        const communityUriToMemberIdRoleComboMap = await this.mapCommunityUriToMemberIdRoleCombo(communities);
        let pubkeys = new Set(flatMap(Object.values(communityUriToMemberIdRoleComboMap), combo => combo.map(c => c.id)));
        const communityUriToMembersMap: Record<string, ICommunityMember[]> = {};
        if (pubkeys.size > 0) {
            const userProfiles = await this.fetchUserProfiles(Array.from(pubkeys));
            if (!userProfiles) return communityUriToMembersMap;
            for (let community of communities) {
                const memberIds = communityUriToMemberIdRoleComboMap[community.communityUri];
                if (!memberIds) continue;
                const communityMembers: ICommunityMember[] = [];
                for (let memberIdRoleCombo of memberIds) {
                    const userProfile = userProfiles.find(profile => profile.npub === memberIdRoleCombo.id);
                    if (!userProfile) continue;
                    let communityMember: ICommunityMember = {
                        id: userProfile.npub,
                        name: userProfile.displayName,
                        profileImageUrl: userProfile.avatar,
                        username: userProfile.username,
                        internetIdentifier: userProfile.internetIdentifier,
                        role: memberIdRoleCombo.role
                    }
                    communityMembers.push(communityMember);
                }
                communityUriToMembersMap[community.communityUri] = communityMembers;
            }
        }
        return communityUriToMembersMap;
    }

    async fetchCommunities() {
        let communities: ICommunity[] = [];
        const events = await this._socialEventManagerRead.fetchCommunities();
        for (let event of events) {
            const communityInfo = SocialUtilsManager.extractCommunityInfo(event);
            let community: ICommunity = {
                ...communityInfo,
                members: []
            }
            communities.push(community);
        }
        const communityUriToMembersMap = await this.fetchCommunitiesMembers(communities);
        for (let community of communities) {
            community.members = communityUriToMembersMap[community.communityUri];
        }
        return communities;
    }

    async fetchMyCommunities(pubKey: string) {
        let communities: ICommunity[] = [];
        const events = await this._socialEventManagerRead.fetchAllUserRelatedCommunities(pubKey);
        for (let event of events) {
            if (event.kind === 34550) {
                const communityInfo = SocialUtilsManager.extractCommunityInfo(event);
                communities.push({ ...communityInfo, members: [] });
            }
        }
        const communityUriToMembersMap = await this.fetchCommunitiesMembers(communities);
        for (let community of communities) {
            community.members = communityUriToMembersMap[community.communityUri];
        }
        return communities;
    }

    async joinCommunity(community: ICommunityInfo, pubKey: string) {
        const communities = await this._socialEventManagerRead.fetchUserBookmarkedCommunities(pubKey);
        communities.push(community);
        await this._socialEventManagerWrite.updateUserBookmarkedCommunities(communities);
        if (community.scpData?.channelEventId) {
            const channelEventIds = await this._socialEventManagerRead.fetchUserBookmarkedChannelEventIds(pubKey);
            channelEventIds.push(community.scpData.channelEventId);
            await this._socialEventManagerWrite.updateUserBookmarkedChannels(channelEventIds);
        }
    }

    async leaveCommunity(community: ICommunityInfo, pubKey: string) {
        const communities = await this._socialEventManagerRead.fetchUserBookmarkedCommunities(pubKey, community);
        await this._socialEventManagerWrite.updateUserBookmarkedCommunities(communities);
        if (community.scpData?.channelEventId) {
            const channelEventIds = await this._socialEventManagerRead.fetchUserBookmarkedChannelEventIds(pubKey);
            const index = channelEventIds.indexOf(community.scpData.channelEventId);
            if (index > -1) {
                channelEventIds.splice(index, 1);
            }
            await this._socialEventManagerWrite.updateUserBookmarkedChannels(channelEventIds);
        }
    }

    private async encryptGroupMessage(privateKey: string, groupPublicKey: string, message: string) {
        const messagePrivateKey = Keys.generatePrivateKey();
        const messagePublicKey = Keys.getPublicKey(messagePrivateKey);
        const encryptedGroupKey = await SocialUtilsManager.encryptMessage(privateKey, groupPublicKey, messagePrivateKey);
        const encryptedMessage = await SocialUtilsManager.encryptMessage(privateKey, messagePublicKey, message);
        return {
            encryptedMessage,
            encryptedGroupKey
        }
    }

    async submitCommunityPost(message: string, info: ICommunityInfo, conversationPath?: IConversationPath) {
        const messageContent = {
            communityUri: info.communityUri,
            message,
        }
        let newCommunityPostInfo: INewCommunityPostInfo;
        if (info.membershipType === MembershipType.Open) {
            newCommunityPostInfo = {
                community: info,
                message,
                conversationPath
            }
        }
        else {
            const {
                encryptedMessage,
                encryptedGroupKey
            } = await this.encryptGroupMessage(this._privateKey, info.scpData.publicKey, JSON.stringify(messageContent));
            newCommunityPostInfo = {
                community: info,
                message: encryptedMessage,
                conversationPath,
                scpData: {
                    encryptedKey: encryptedGroupKey,
                    communityUri: info.communityUri
                }
            }
        }
        await this._socialEventManagerWrite.submitCommunityPost(newCommunityPostInfo);
    }

    async fetchAllUserRelatedChannels(pubKey: string) {
        const {
            channels,
            channelMetadataMap,
            channelIdToCommunityMap
        } = await this._socialEventManagerRead.fetchAllUserRelatedChannels(pubKey);

        let outputChannels: IChannelInfo[] = [];
        for (let channel of channels) {
            const channelMetadata = channelMetadataMap[channel.id];
            const communityInfo = channelIdToCommunityMap[channel.id];
            if (channelMetadata) {
                outputChannels.push({
                    ...channel,
                    ...channelMetadata,
                    communityInfo: communityInfo
                });
            }
            else {
                outputChannels.push({
                    ...channel,
                    communityInfo: communityInfo
                });
            }
        }

        return outputChannels;
    }

    async retrieveChannelMessages(channelId: string, since?: number, until?: number) {
        const events = await this._socialEventManagerRead.fetchChannelMessages(channelId, since, until);
        const messageEvents = events.filter(event => event.kind === 42);
        return messageEvents;
    }

    async retrieveChannelEvents(creatorId: string, channelId: string) {
        const channelEvents = await this._socialEventManagerRead.fetchChannelInfoMessages(channelId);
        const messageEvents = channelEvents.filter(event => event.kind === 42);
        const channelCreationEvent = channelEvents.find(event => event.kind === 40);
        if (!channelCreationEvent) throw new Error('No info event found');
        const channelMetadataEvent = channelEvents.find(event => event.kind === 41);
        let channelInfo: IChannelInfo;
        if (channelMetadataEvent) {
            channelInfo = SocialUtilsManager.extractChannelInfo(channelMetadataEvent);
        }
        else {
            channelInfo = SocialUtilsManager.extractChannelInfo(channelCreationEvent);
        }
        if (!channelInfo) throw new Error('No info event found');

        return {
            messageEvents,
            info: channelInfo
        }
    }

    async retrieveChannelMessageKeys(options: IRetrieveChannelMessageKeysOptions) {
        let messageIdToPrivateKey: Record<string, string> = {};
        if (options.gatekeeperUrl) {
            let bodyData = {
                creatorId: options.creatorId,
                channelId: options.channelId,
                message: options.message,
                signature: options.signature
            };
            let url = `${options.gatekeeperUrl}/api/channels/v0/message-keys`;
            let response = await fetch(url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bodyData)
            });
            let result = await response.json();
            if (result.success) {
                messageIdToPrivateKey = result.data;
            }
        }
        else if (options.privateKey) {
            let groupPrivateKey;
            const channelEvents = await this.retrieveChannelEvents(options.creatorId, options.channelId);
            const channelInfo = channelEvents.info;
            const messageEvents = channelEvents.messageEvents;
            if (channelInfo.scpData.communityUri) {
                const {communityId} = SocialUtilsManager.getCommunityBasicInfoFromUri(channelInfo.scpData.communityUri);
                const communityInfo = await this.fetchCommunityInfo(channelInfo.eventData.pubkey, communityId);
                groupPrivateKey = await this.retrieveCommunityPrivateKey(communityInfo, options.privateKey);
                if (!groupPrivateKey) return messageIdToPrivateKey;
            }
            else {
                const groupUri = `40:${channelInfo.id}`;
                const keyEvent = await this._socialEventManagerRead.fetchGroupKeys(groupUri + ':keys');
                if (keyEvent) {
                    const creatorPubkey = channelInfo.eventData.pubkey;
                    const pubkey = SocialUtilsManager.convertPrivateKeyToPubkey(options.privateKey);
                    const memberKeyMap = JSON.parse(keyEvent.content);
                    const encryptedKey = memberKeyMap?.[pubkey];
                    if (encryptedKey) {
                        groupPrivateKey = await SocialUtilsManager.decryptMessage(options.privateKey, creatorPubkey, encryptedKey);
                    }
                }
            }
            for (const messageEvent of messageEvents) {
                const messagePrivateKey = await this.retrieveChannelMessagePrivateKey(messageEvent, channelInfo.id, groupPrivateKey);
                if (messagePrivateKey) {
                    messageIdToPrivateKey[messageEvent.id] = messagePrivateKey;
                }
            }
        }
        return messageIdToPrivateKey;
    }

    async submitChannelMessage(
        message: string,
        channelId: string,
        communityPublicKey: string,
        conversationPath?: IConversationPath
    ) {
        const messageContent = {
            channelId,
            message,
        }
        const {
            encryptedMessage,
            encryptedGroupKey
        } = await this.encryptGroupMessage(this._privateKey, communityPublicKey, JSON.stringify(messageContent));
        const newChannelMessageInfo: INewChannelMessageInfo = {
            channelId: channelId,
            message: encryptedMessage,
            conversationPath,
            scpData: {
                encryptedKey: encryptedGroupKey,
                channelId: channelId
            }
        }
        await this._socialEventManagerWrite.submitChannelMessage(newChannelMessageInfo);
    }

    async fetchDirectMessagesBySender(selfPubKey: string, senderPubKey: string, since?: number, until?: number) {
        const decodedSenderPubKey = Nip19.decode(senderPubKey).data as string;
        const events = await this._socialEventManagerRead.fetchDirectMessages(selfPubKey, decodedSenderPubKey, since, until);
        let metadataByPubKeyMap: Record<string, INostrMetadata> = {};
        const encryptedMessages = [];
        for (let event of events) {
            if (event.kind === 0) {
                metadataByPubKeyMap[event.pubkey] = {
                    ...event,
                    content: SocialUtilsManager.parseContent(event.content)
                };
            } else if (event.kind === 4) {
                encryptedMessages.push(event);
            }
        }
        return {
            decodedSenderPubKey,
            encryptedMessages,
            metadataByPubKeyMap
        };
    }

    async sendDirectMessage(chatId: string, message: string, replyToEventId?: string) {
        const decodedReceiverPubKey = Nip19.decode(chatId).data as string;
        const content = await SocialUtilsManager.encryptMessage(this._privateKey, decodedReceiverPubKey, message);
        await this._socialEventManagerWrite.sendMessage(decodedReceiverPubKey, content, replyToEventId);
    }

    async resetMessageCount(selfPubKey: string, senderPubKey: string) {
        await this._socialEventManagerRead.resetMessageCount(selfPubKey, senderPubKey);
    }

    async fetchMessageContacts(pubKey: string) {
        const events = await this._socialEventManagerRead.fetchMessageContactsCacheEvents(pubKey);
        const pubkeyToMessageInfoMap: Record<string, { cnt: number, latest_at: number, latest_event_id: string }> = {};
        let metadataByPubKeyMap: Record<string, INostrMetadata> = {};
        for (let event of events) {
            if (event.kind === 10000118) {
                const content = SocialUtilsManager.parseContent(event.content);
                Object.keys(content).forEach(pubkey => {
                    pubkeyToMessageInfoMap[pubkey] = content[pubkey];
                })
            }
            if (event.kind === 0) {
                metadataByPubKeyMap[event.pubkey] = {
                    ...event,
                    content: SocialUtilsManager.parseContent(event.content)
                };
            }
        }
        let profiles: IMessageContactInfo[] = Object.entries(metadataByPubKeyMap).map(([k, v]) => {
            const encodedPubkey = Nip19.npubEncode(k);
            return {
                id: encodedPubkey,
                pubKey: k,
                creatorId: encodedPubkey,
                username: v.content.name,
                displayName: v.content.display_name,
                avatar: v.content.picture,
                banner: v.content.banner,
                latestAt: pubkeyToMessageInfoMap[k].latest_at,
                cnt: pubkeyToMessageInfoMap[k].cnt
            }
        });

        const channels = await this.fetchAllUserRelatedChannels(pubKey);
        for (let channel of channels) {
            let creatorId = Nip19.npubEncode(channel.eventData.pubkey);
            profiles.push({
                id: channel.id,
                pubKey: channel.eventData.pubkey,
                creatorId,
                username: channel.name,
                displayName: channel.name,
                avatar: channel.picture || channel.communityInfo?.avatarImgUrl,
                banner: '',
                latestAt: 0,
                cnt: 0,
                isGroup: true,
                channelInfo: channel
            });
        }
        const invitations = await this.fetchUserGroupInvitations(pubKey);
        console.log('invitations', invitations);
        return profiles;
    }

    async fetchUserGroupInvitations(pubKey: string) {
        const identifiers: string[] = [];
        const events = await this._socialEventManagerRead.fetchUserGroupInvitations([40, 34550], pubKey);
        for (let event of events) {
            const identifier = event.tags.find(tag => tag[0] === 'd')?.[1];
            if (identifier) {
                identifiers.push(identifier);
            }
        }
        return identifiers;
    }

    private async mapCommunityUriToMemberIdRoleCombo(communities: ICommunityInfo[]) {
        const communityUriToMemberIdRoleComboMap: Record<string, { id: string; role: CommunityRole }[]> = {};
        const communityUriToCreatorOrModeratorIdsMap: Record<string, Set<string>> = {};
        for (let community of communities) {
            const communityUri = community.communityUri;
            communityUriToMemberIdRoleComboMap[communityUri] = [];
            communityUriToMemberIdRoleComboMap[communityUri].push({
                id: community.creatorId,
                role: CommunityRole.Creator
            });
            communityUriToCreatorOrModeratorIdsMap[communityUri] = new Set<string>();
            communityUriToCreatorOrModeratorIdsMap[communityUri].add(community.creatorId);
            if (community.moderatorIds) {
                if (community.moderatorIds.includes(community.creatorId)) continue;
                for (let moderator of community.moderatorIds) {
                    communityUriToMemberIdRoleComboMap[communityUri].push({
                        id: moderator,
                        role: CommunityRole.Moderator
                    });
                    communityUriToCreatorOrModeratorIdsMap[communityUri].add(moderator);
                }
            }
        }
        const generalMembersEvents = await this._socialEventManagerRead.fetchCommunitiesGeneralMembers(communities);
        for (let event of generalMembersEvents) {
            const communityUriArr = event.tags.filter(tag => tag[0] === 'a')?.map(tag => tag[1]) || [];
            for (let communityUri of communityUriArr) {
                if (!communityUriToMemberIdRoleComboMap[communityUri]) continue;
                const pubkey = Nip19.npubEncode(event.pubkey);
                if (communityUriToCreatorOrModeratorIdsMap[communityUri].has(pubkey)) continue;
                communityUriToMemberIdRoleComboMap[communityUri].push({
                    id: pubkey,
                    role: CommunityRole.GeneralMember
                });
            }
        }
        return communityUriToMemberIdRoleComboMap;
    }

    private extractCalendarEventInfo(event: INostrEvent) {
        const description = event.content;
        const id = event.tags.find(tag => tag[0] === 'd')?.[1];
        const name = event.tags.find(tag => tag[0] === 'name')?.[1]; //deprecated
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
            lonlat = Geohash.decode(geohash);
        }
        const image = event.tags.find(tag => tag[0] === 'image')?.[1];
        let type;
        let startTime;
        let endTime;
        if (event.kind === 31922) {
            type = CalendarEventType.DateBased;
            const startDate = new Date(start);
            startTime = startDate.getTime() / 1000;
            if (end) {
                const endDate = new Date(end);
                endTime = endDate.getTime() / 1000;
            }
        }
        else if (event.kind === 31923) {
            type = CalendarEventType.TimeBased;
            startTime = Number(start);
            if (end) {
                endTime = Number(end);
            }
        }
        const naddr = Nip19.naddrEncode({
            identifier: id,
            pubkey: event.pubkey,
            kind: event.kind,
            relays: []
        })
        let calendarEventInfo: ICalendarEventInfo = {
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
        }
        return calendarEventInfo;
    }

    async updateCalendarEvent(updateCalendarEventInfo: IUpdateCalendarEventInfo) {
        const geohash = Geohash.encode(updateCalendarEventInfo.latitude, updateCalendarEventInfo.longitude);
        updateCalendarEventInfo = {
            ...updateCalendarEventInfo,
            geohash
        }
        let naddr: string;
        const responses = await this._socialEventManagerWrite.updateCalendarEvent(updateCalendarEventInfo);
        const response = responses[0];
        if (response.success) {
            const pubkey = SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
            naddr = Nip19.naddrEncode({
                identifier: updateCalendarEventInfo.id,
                pubkey: pubkey,
                kind: updateCalendarEventInfo.type === CalendarEventType.DateBased ? 31922 : 31923,
                relays: []
            });
        }
        return naddr;
    }

    async retrieveCalendarEventsByDateRange(start: number, end?: number, limit?: number) {
        const events = await this._socialEventManagerRead.fetchCalendarEvents(start, end, limit);
        let calendarEventInfoList: ICalendarEventInfo[] = [];
        for (let event of events) {
            let calendarEventInfo = this.extractCalendarEventInfo(event);
            calendarEventInfoList.push(calendarEventInfo);
        }
        return calendarEventInfoList;
    }

    async retrieveCalendarEvent(naddr: string) {
        let address = Nip19.decode(naddr).data as Nip19.AddressPointer;
        const calendarEvent = await this._socialEventManagerRead.fetchCalendarEvent(address);
        if (!calendarEvent) return null;
        let calendarEventInfo = this.extractCalendarEventInfo(calendarEvent);
        let hostPubkeys = calendarEvent.tags.filter(tag => tag[0] === 'p' && tag[3] === 'host')?.map(tag => tag[1]) || [];
        const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
        let hosts: ICalendarEventHost[] = [];
        let attendees: ICalendarEventAttendee[] = [];
        let attendeePubkeys: string[] = [];
        let attendeePubkeyToEventMap: Record<string, INostrEvent> = {};
        const postEvents = await this._socialEventManagerRead.fetchCalendarEventPosts(calendarEventUri);
        const notes: INoteInfo[] = [];
        for (let postEvent of postEvents) {
            const note: INoteInfo = {
                eventData: postEvent
            }
            notes.push(note);
        }
        const rsvpEvents = await this._socialEventManagerRead.fetchCalendarEventRSVPs(calendarEventUri);
        for (let rsvpEvent of rsvpEvents) {
            if (attendeePubkeyToEventMap[rsvpEvent.pubkey]) continue;
            let attendanceStatus = rsvpEvent.tags.find(tag => tag[0] === 'l' && tag[2] === 'status')?.[1];
            if (attendanceStatus === 'accepted') {
                attendeePubkeyToEventMap[rsvpEvent.pubkey] = rsvpEvent;
                attendeePubkeys.push(rsvpEvent.pubkey);
            }
        }
        const userProfileEvents = await this._socialEventManagerRead.fetchUserProfileCacheEvents([
            ...hostPubkeys,
            ...attendeePubkeys
        ])
        for (let event of userProfileEvents) {
            if (event.kind === 0) {
                let metaData = {
                    ...event,
                    content: SocialUtilsManager.parseContent(event.content)
                };
                let userProfile = this.constructUserProfile(metaData);
                if (hostPubkeys.includes(event.pubkey)) {
                    let host: ICalendarEventHost = {
                        pubkey: event.pubkey,
                        userProfile
                    }
                    hosts.push(host);
                }
                else if (attendeePubkeyToEventMap[event.pubkey]) {
                    let attendee: ICalendarEventAttendee = {
                        pubkey: event.pubkey,
                        userProfile,
                        rsvpEventData: attendeePubkeyToEventMap[event.pubkey]
                    }
                    attendees.push(attendee);
                }
            }
        }
        let detailInfo: ICalendarEventDetailInfo = {
            ...calendarEventInfo,
            hosts,
            attendees,
            notes
        }
        return detailInfo;
    }

    async acceptCalendarEvent(rsvpId: string, naddr: string) {
        let address = Nip19.decode(naddr).data as Nip19.AddressPointer;
        const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
        const pubkey = SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const rsvpEvents = await this._socialEventManagerRead.fetchCalendarEventRSVPs(calendarEventUri, pubkey);
        if (rsvpEvents.length > 0) {
            rsvpId = rsvpEvents[0].tags.find(tag => tag[0] === 'd')?.[1];
        }
        await this._socialEventManagerWrite.createCalendarEventRSVP(rsvpId, calendarEventUri, true);
    }

    async declineCalendarEvent(rsvpId: string, naddr: string) {
        let address = Nip19.decode(naddr).data as Nip19.AddressPointer;
        const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
        const pubkey = SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const rsvpEvents = await this._socialEventManagerRead.fetchCalendarEventRSVPs(calendarEventUri, pubkey);
        if (rsvpEvents.length > 0) {
            rsvpId = rsvpEvents[0].tags.find(tag => tag[0] === 'd')?.[1];
        }
        await this._socialEventManagerWrite.createCalendarEventRSVP(rsvpId, calendarEventUri, false);
    }

    async submitCalendarEventPost(naddr: string, message: string, conversationPath?: IConversationPath) {
        let address = Nip19.decode(naddr).data as Nip19.AddressPointer;
        const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
        let info: INewCalendarEventPostInfo = {
            calendarEventUri,
            message,
            conversationPath
        }
        const responses = await this._socialEventManagerWrite.submitCalendarEventPost(info);
        const response = responses[0];
        return response.success ? response.eventId : null;
    }

    async fetchTimezones() {
        const apiUrl = `${this._apiBaseUrl}/timezones`;
        const apiResponse = await fetch(apiUrl);
        const apiResult = await apiResponse.json();
        if (!apiResult.success) throw new Error(apiResult.error.message);
        let timezones: any[] = [];
        for (let timezone of apiResult.data.timezones) {
            let gmtOffset = SocialUtilsManager.getGMTOffset(timezone.timezoneName);
            if (!gmtOffset) continue;
            timezones.push({
                timezoneName: timezone.timezoneName,
                description: timezone.description,
                gmtOffset: gmtOffset
            });
        }
        timezones.sort((a, b) => {
            if (a.gmtOffset.startsWith('GMT-') && b.gmtOffset.startsWith('GMT+')) return -1;
            if (a.gmtOffset.startsWith('GMT+') && b.gmtOffset.startsWith('GMT-')) return 1;
            if (a.gmtOffset.startsWith('GMT-')) {
                if (a.gmtOffset < b.gmtOffset) return 1;
                if (a.gmtOffset > b.gmtOffset) return -1;
            }
            else {
                if (a.gmtOffset > b.gmtOffset) return 1;
                if (a.gmtOffset < b.gmtOffset) return -1;
            }
            if (a.description < b.description) return -1;
            if (a.description > b.description) return 1;
            return 0;
        });
        return timezones;
    }

    async fetchCitiesByKeyword(keyword: string) {
        const apiUrl = `${this._apiBaseUrl}/cities?keyword=${keyword}`;
        const apiResponse = await fetch(apiUrl);
        const apiResult = await apiResponse.json();
        if (!apiResult.success) throw new Error(apiResult.error.message);
        let cities: any[] = [];
        for (let city of apiResult.data.cities) {
            cities.push({
                id: city.id,
                city: city.city,
                cityAscii: city.cityAscii,
                latitude: city.lat,
                longitude: city.lng,
                country: city.country
            });
        }
        return cities;
    }

    async fetchCitiesByCoordinates(latitude: number, longitude: number) {
        const apiUrl = `${this._apiBaseUrl}/cities?lat=${latitude}&lng=${longitude}`;
        const apiResponse = await fetch(apiUrl);
        const apiResult = await apiResponse.json();
        if (!apiResult.success) throw new Error(apiResult.error.message);
        let cities: any[] = [];
        for (let city of apiResult.data.cities) {
            cities.push({
                id: city.id,
                city: city.city,
                cityAscii: city.cityAscii,
                latitude: city.lat,
                longitude: city.lng,
                country: city.country
            });
        }
        return cities;
    }

    async fetchLocationInfoFromIP() {
        if (!this._ipLocationServiceBaseUrl) return null;
        const response = await fetch(this._ipLocationServiceBaseUrl);
        const result = await response.json();
        let locationInfo: ILocationCoordinates;
        if (result.success) {
            locationInfo = {
                latitude: result.data.lat,
                longitude: result.data.long
            }
        }
        return locationInfo;
    }

    private async fetchEventMetadataFromIPFS(ipfsBaseUrl: string, eventId: string) {
        const url = `${ipfsBaseUrl}/nostr/${eventId}`;
        const response = await fetch(url);
        const result = await response.json();
        return result;
    }

    async getAccountBalance(walletAddress: string) {
        const apiUrl = 'https://rpc.ankr.com/multichain/79258ce7f7ee046decc3b5292a24eb4bf7c910d7e39b691384c7ce0cfb839a01/?ankr_getAccountBalance';
        const bodyData = {
            jsonrpc: '2.0',
            method: 'ankr_getAccountBalance',
            params: {
                blockchain: [
                    'bsc',
                    'avalanche'
                ],
                walletAddress
            },
            id: 1
        }
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyData)
        });
        const data = await response.json();
        if (data.error) {
            console.log('error', data.error);
            return null;
        }
        return data.result;
    }

    async getNFTsByOwner(walletAddress: string) {
        const apiUrl = 'https://rpc.ankr.com/multichain/79258ce7f7ee046decc3b5292a24eb4bf7c910d7e39b691384c7ce0cfb839a01/?ankr_getNFTsByOwner';
        const bodyData = {
            jsonrpc: '2.0',
            method: 'ankr_getNFTsByOwner',
            params: {
                blockchain: [
                    'bsc',
                    'avalanche'
                ],
                walletAddress
            },
            id: 1
        }
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyData)
        });
        const data = await response.json();
        if (data.error) {
            console.log('error', data.error);
            return null;
        }
        return data.result;
    }

    async submitMessage(message: string, conversationPath?: IConversationPath) {
        return this._socialEventManagerWrite.postNote(message, conversationPath);
    }

    async submitLongFormContent(info: ILongFormContentInfo) {
        return this._socialEventManagerWrite.submitLongFormContentEvents(info);
    }

    async submitLike(postEventData: INostrEvent) {
        let tags: string[][] = postEventData.tags.filter(
            tag => tag.length >= 2 && (tag[0] === 'e' || tag[0] === 'p')
        );
        tags.push(['e', postEventData.id]);
        tags.push(['p', postEventData.pubkey]);
        tags.push(['k', postEventData.kind.toString()]);
        await this._socialEventManagerWrite.submitLike(tags);
    }

    async submitRepost(postEventData: INostrEvent) {
        let tags: string[][] = [
            [
                'e',
                postEventData.id
            ],
            [
                'p',
                postEventData.pubkey
            ]
        ]
        const content = JSON.stringify(postEventData);
        await this._socialEventManagerWrite.submitRepost(content, tags);
    }

    async sendPingRequest(pubkey: string, relayUrl: string = this._publicIndexingRelay) {
        const data = SocialUtilsManager.augmentWithAuthInfo({
            pubkey: pubkey,
        }, this._privateKey);
        let result
        try {
            let response = await fetch(relayUrl + '/ping', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            result = await response.json();
        }
        catch (err) {
        }
        return result;
    }

    async checkRelayStatus(pubkey: string, relayUrl?: string) {
        if (!relayUrl) relayUrl = this._publicIndexingRelay;
        const data = SocialUtilsManager.augmentWithAuthInfo({
            pubkey: pubkey,
        }, this._privateKey);
        let result
        try {
            let response = await fetch(relayUrl + '/check-status', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                result = await response.json();
            }
            else if (response.status === 401) {
                result = {
                    success: false,
                    error: 'Access Denied: You do not have permission to access this relay.'
                }
            }
        }
        catch (err) {
        }
        return result;
    }

    async fetchUnreadMessageCounts(pubkey: string) {
        if (!this._publicIndexingRelay) return null;
        let url = this._publicIndexingRelay + '/unread-message-counts?pubkey=' + pubkey;
        const response = await fetch(url);
        const result = await response.json();
        return result;
    }

    async updateMessageLastReadReceipt(pubkey: string, walletAddress: string, signature: string, fromId: string) {
        if (!this._publicIndexingRelay) return null;
        let msg = pubkey;
        const data = {
            fromId: fromId,
            msg: msg,
            signature: signature,
            pubkey: pubkey,
            walletAddress: walletAddress
        };
        let response = await fetch(this._publicIndexingRelay + '/update-message-last-read-receipt', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        let result = await response.json();
        return result;
    }

    async searchUsers(query: string) {
        const events = await this._socialEventManagerRead.searchUsers(query);
        let metadataArr: INostrMetadata[] = [];
        let followersCountMap: Record<string, number> = {};
        for (let event of events) {
            if (event.kind === 0) {
                metadataArr.push({
                    ...event,
                    content: SocialUtilsManager.parseContent(event.content)
                });
            }
            else if (event.kind === 10000108) {
                followersCountMap = SocialUtilsManager.parseContent(event.content);
            }
        }
        const userProfiles: IUserProfile[] = [];
        for (let metadata of metadataArr) {
            let userProfile = this.constructUserProfile(metadata, followersCountMap);
            userProfiles.push(userProfile);
        }
        return userProfiles;
    }

    async addRelay(url: string) {
        const selfPubkey = SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const relaysEvents = await this._socialEventManagerRead.fetchUserRelays(selfPubkey);
        const relaysEvent = relaysEvents.find(event => event.kind === 10000139);
        let relays: Record<string, IRelayConfig> = { [url]: { write: true, read: true } };
        if (relaysEvent) {
            for (let tag of relaysEvent.tags) {
                if (tag[0] !== 'r') continue;
                let config: IRelayConfig = { read: true, write: true };
                if (tag[2] === 'write') {
                    config.read = false;
                }
                if (tag[2] === 'read') {
                    config.write = false;
                }
                relays[tag[1]] = config;
            }
        }
        await this._socialEventManagerWrite.updateRelayList(relays);
    }

    async removeRelay(url: string) {
        const selfPubkey = SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const relaysEvents = await this._socialEventManagerRead.fetchUserRelays(selfPubkey);
        const relaysEvent = relaysEvents.find(event => event.kind === 10000139);
        let relays: Record<string, IRelayConfig> = {};
        if (relaysEvent) {
            for (let tag of relaysEvent.tags) {
                if (tag[0] !== 'r' || tag[1] === url) continue;
                let config: IRelayConfig = { read: true, write: true };
                if (tag[2] === 'write') {
                    config.read = false;
                }
                if (tag[2] === 'read') {
                    config.write = false;
                }
                relays[tag[1]] = config;
            }
        }
        await this._socialEventManagerWrite.updateRelayList(relays);
    }

    async updateRelays(add: string[], remove: string[], defaultRelays: string[]) {
        const selfPubkey = SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const relaysEvents = await this._socialEventManagerRead.fetchUserRelays(selfPubkey);
        const relaysEvent = relaysEvents.find(event => event.kind === 10000139);
        let relaysMap: Record<string, IRelayConfig> = {};
        for (let relay of add) {
            relaysMap[relay] = { read: true, write: true };
        }
        if (relaysEvent) {
            for (let tag of relaysEvent.tags) {
                if (tag[0] !== 'r' || remove.includes(tag[1])) continue;
                let config: IRelayConfig = { read: true, write: true };
                if (tag[2] === 'write') {
                    config.read = false;
                }
                if (tag[2] === 'read') {
                    config.write = false;
                }
                relaysMap[tag[1]] = config;
            }
        }
        let relayUrls = Object.keys(relaysMap);
        // this.relays = relayUrls.length > 0 ? relayUrls : defaultRelays;
        await this._socialEventManagerWrite.updateRelayList(relaysMap);
        return relayUrls;
    }

    async makeInvoice(amount: string, comment: string) {
        const paymentRequest = await this.lightningWalletManager.makeInvoice(Number(amount), comment);
        await this._socialEventManagerWrite.createPaymentRequestEvent(paymentRequest, amount, comment, true);
        return paymentRequest;
    }

    async createPaymentRequest(chainId: number, token: any, amount: string, to: string, comment: string) {
        const paymentRequest = btoa(JSON.stringify({
            chainId,
            token,
            amount,
            comment,
            to,
            createdAt: Math.round(Date.now() / 1000)
        }));
        await this._socialEventManagerWrite.createPaymentRequestEvent(paymentRequest, amount, comment);
        return paymentRequest;
    }

    parsePaymentRequest(paymentRequest: string) {
        const decoded = atob(paymentRequest);
        let data = JSON.parse(decoded);
        return data;
    }

    private async sendToken(paymentRequest: string) {
        let receipt: TransactionReceipt;
        try {
            let data = this.parsePaymentRequest(paymentRequest);
            const wallet = Wallet.getClientInstance();
            await wallet.init();
            if (data.chainId !== wallet.chainId) {
                await wallet.switchNetwork(data.chainId);
            }
            if (data.token.address) {
                const erc20 = new Contracts.ERC20(wallet, data.token.address);
                let amount = Utils.toDecimals(data.amount, data.token.decimals);
                receipt = await erc20.transfer({
                    to: data.to,
                    amount: amount
                });
            } else {
                receipt = await wallet.send(data.to, data.amount);
            }
        } catch (err) {
            throw new Error('Payment failed');
        }
        return receipt?.transactionHash;
    }

    private isLightningInvoice(value: string) {
        const lnRegex = /^(lnbc|lntb|lnbcrt|lnsb|lntbs)([0-9]+(m|u|n|p))?1\S+/g;
        return lnRegex.test(value);
    }

    async sendPayment(paymentRequest: string, comment: string) {
        let preimage: string;
        let tx: string;
        if (this.isLightningInvoice(paymentRequest)) {
            preimage = await this.lightningWalletManager.sendPayment(paymentRequest);
        } else {
            tx = await this.sendToken(paymentRequest);
        }
        const requestEvent = await this._socialEventManagerRead.fetchPaymentRequestEvent(paymentRequest);
        if (requestEvent) {
            await this._socialEventManagerWrite.createPaymentReceiptEvent(requestEvent.id, requestEvent.pubkey, comment, preimage, tx);
        }
        return preimage || tx;
    }

    async zap(pubkey: string, lud16: string, amount: string, noteId: string) {
        const response = await this.lightningWalletManager.zap(pubkey, lud16, Number(amount), '', this._writeRelays, noteId);
        return response as any;
    }

    async fetchUserPaymentActivities(pubkey: string, since?: number, until?: number) {
        const paymentActivitiesForSender = await this._socialEventManagerRead.fetchPaymentActivitiesForSender(pubkey, since, until);
        const paymentActivitiesForRecipient = await this._socialEventManagerRead.fetchPaymentActivitiesForRecipient(pubkey, since, until);
        const paymentActivities = [...paymentActivitiesForSender, ...paymentActivitiesForRecipient];
        return paymentActivities.sort((a, b) => b.createdAt - a.createdAt);
    }

    async fetchPaymentReceiptInfo(paymentRequest: string) {
        let info: {
            status: 'pending' | 'completed';
            preimage?: string;
            tx?: string;
        } = {
            status: 'pending'
        };
        const requestEvent = await this._socialEventManagerRead.fetchPaymentRequestEvent(paymentRequest);
        if (requestEvent) {
            const receiptEvent = await this._socialEventManagerRead.fetchPaymentReceiptEvent(requestEvent.id);
            const selfPubkey = this._privateKey ? SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey) : null;
            if (receiptEvent && receiptEvent.pubkey === selfPubkey) {
                info.status = 'completed';
                info.preimage = receiptEvent.tags.find(tag => tag[0] === 'preimage')?.[1];
                info.tx = receiptEvent.tags.find(tag => tag[0] === 'tx')?.[1];
            }
        }
        return info;
    }

    async getLightningBalance() {
        const response = await this.lightningWalletManager.getBalance();
        return response;
    }

    isLightningAvailable() {
        const isAvailable = this.lightningWalletManager.isAvailable();
        return isAvailable;
    }

    async getBitcoinPrice() {
        const response = await fetch('https://api.coinpaprika.com/v1/tickers/btc-bitcoin')
        const result = await response.json();
        const price = result.quotes.USD.price;
        return price;
    }

    async fetchUserPrivateRelay(pubkey: string) {
        const url = `${this._publicIndexingRelay}/private-relay?pubkey=${pubkey}`;
        const response = await fetch(url);
        const result = await response.json();
        return result.data.relay;
    }

    async fetchApps(keyword?: string) {
        let url = `${this._apiBaseUrl}/apps`;
        if(keyword !== undefined)
            url += `?keyword=${keyword}`;
        try {
            const response = await fetch(url);
            const result = await response.json();
            return result.data.apps;
        }
        catch(e) {
            console.log('e', e)
        }
    }

    async fetchApp(pubkey: string, id: string) {
        const installed = await this.fetchInstalledByPubKey(pubkey);
        let installedVersionId;
        if(installed)
            installedVersionId = installed[id];
        const url = `${this._apiBaseUrl}/app`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id,
                pubkey,
                installedVersionId
            })
        });
        const result = await response.json();
        return result.data.app;
    }

    async fetchInstalledByPubKey(pubkey: string) {
        const url = `${this._apiBaseUrl}/installed?pubkey=${pubkey}`;
        const response = await fetch(url);
        const result = await response.json();
        const installed = result.data.installed;
        // const decrypted = await SocialUtilsManager.decryptMessage(this._privateKey, pubkey, installed);
        if(!installed)
            return null;
        const decrypted = await Crypto.decryptWithPrivKey(this._privateKey, installed);
        console.log('decrypted', decrypted);
        return JSON.parse(decrypted);
    }

    async fetchInstalledApps(pubkey: string) {
        const installed = await this.fetchInstalledByPubKey(pubkey);
        if(!installed)
            return [];
        // const decrypted = await SocialUtilsManager.decryptMessage(this._privateKey, pubkey, installed);
        const url = `${this._apiBaseUrl}/installed-apps`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pubkey,
                decryptedInstalled: JSON.stringify(installed)
            })
        });
        const result = await response.json();
        return result.data.installedApps;
    }

    async installApp(pubkey: string, appId: string, appVersionId: string) {
        const url = `${this._apiBaseUrl}/install-app`;
        const installedApps = await this.fetchInstalledByPubKey(pubkey);
        // console.log('installed', installed);
        // const decryptedInstalled = await SocialUtilsManager.decryptMessage(this._privateKey, pubkey, installed);
        // console.log('decryptedInstalled', decryptedInstalled)
        // const installedApps =  JSON.parse(decryptedInstalled);
        // console.log('installedApps', installedApps);
        let newInstalledApps: any = {};
        if(installedApps)
            newInstalledApps = {...installedApps};
        newInstalledApps[appId] = appVersionId;

        // const encryptedInstalledAppList = await SocialUtilsManager.encryptMessage(this._privateKey, pubkey, JSON.stringify(newInstalledApps));
        const encryptedInstalledAppList = await Crypto.encryptWithPubKey(pubkey, JSON.stringify(newInstalledApps));
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pubkey,
                installedAppList: encryptedInstalledAppList
            })
        });
        const result = await response.json();
        return result;
    }
}

export {
    NostrEventManagerRead,
    NostrEventManagerReadV2,
    NostrEventManagerWrite,
    ISocialEventManagerRead,
    ISocialEventManagerWrite,
    SocialUtilsManager,
    SocialDataManager,
    NostrRestAPIManager,
    NostrWebSocketManager
}
