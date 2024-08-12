"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NostrWebSocketManager = exports.NostrRestAPIManager = exports.SocialDataManager = exports.SocialUtilsManager = exports.NostrEventManagerWrite = exports.NostrEventManagerReadV2 = exports.NostrEventManagerRead = void 0;
const index_1 = require("../core/index");
const interfaces_1 = require("../utils/interfaces");
const communication_1 = require("./communication");
Object.defineProperty(exports, "NostrRestAPIManager", { enumerable: true, get: function () { return communication_1.NostrRestAPIManager; } });
Object.defineProperty(exports, "NostrWebSocketManager", { enumerable: true, get: function () { return communication_1.NostrWebSocketManager; } });
const geohash_1 = __importDefault(require("../utils/geohash"));
const scom_mqtt_1 = require("@scom/scom-mqtt");
const lightningWallet_1 = require("../utils/lightningWallet");
const utilsManager_1 = require("./utilsManager");
Object.defineProperty(exports, "SocialUtilsManager", { enumerable: true, get: function () { return utilsManager_1.SocialUtilsManager; } });
const eventManagerWrite_1 = require("./eventManagerWrite");
Object.defineProperty(exports, "NostrEventManagerWrite", { enumerable: true, get: function () { return eventManagerWrite_1.NostrEventManagerWrite; } });
const eventManagerRead_1 = require("./eventManagerRead");
Object.defineProperty(exports, "NostrEventManagerRead", { enumerable: true, get: function () { return eventManagerRead_1.NostrEventManagerRead; } });
const eventManagerReadV2_1 = require("./eventManagerReadV2");
Object.defineProperty(exports, "NostrEventManagerReadV2", { enumerable: true, get: function () { return eventManagerReadV2_1.NostrEventManagerReadV2; } });
const eventManagerReadV1o5_1 = require("./eventManagerReadV1o5");
const scom_signer_1 = require("@scom/scom-signer");
const eth_wallet_1 = require("@ijstech/eth-wallet");
class SocialDataManager {
    constructor(config) {
        this._apiBaseUrl = config.apiBaseUrl || '';
        this._ipLocationServiceBaseUrl = config.ipLocationServiceBaseUrl;
        this._publicIndexingRelay = config.publicIndexingRelay;
        const writeRelaysManagers = this._initializeWriteRelaysManagers(config.writeRelays);
        if (config.readManager) {
            this._socialEventManagerRead = config.readManager;
        }
        else {
            let nostrReadRelayManager = new communication_1.NostrRestAPIManager(config.readRelay);
            if (config.version === 2) {
                this._socialEventManagerRead = new eventManagerReadV2_1.NostrEventManagerReadV2(nostrReadRelayManager);
            }
            else if (config.version === 1.5) {
                this._socialEventManagerRead = new eventManagerReadV1o5_1.NostrEventManagerReadV1o5(nostrReadRelayManager);
            }
            else {
                this._socialEventManagerRead = new eventManagerRead_1.NostrEventManagerRead(nostrReadRelayManager);
            }
        }
        this._socialEventManagerWrite = new eventManagerWrite_1.NostrEventManagerWrite(writeRelaysManagers, this._publicIndexingRelay);
        if (config.mqttBrokerUrl) {
            try {
                this.mqttManager = new scom_mqtt_1.MqttManager({
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
            this.lightningWalletManager = new lightningWallet_1.LightningWalletManager();
        }
    }
    async dispose() {
        if (this.mqttManager) {
            await this.mqttManager.disconnect();
            this.mqttManager = null;
        }
    }
    set privateKey(privateKey) {
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
    set relays(value) {
        const writeRelaysManagers = this._initializeWriteRelaysManagers(value);
        this._socialEventManagerWrite.nostrCommunicationManagers = writeRelaysManagers;
    }
    get privateKey() {
        return this._privateKey;
    }
    _initializeWriteRelaysManagers(relays) {
        if (!relays || relays.length === 0) {
            this._writeRelays = [];
            return [];
        }
        this._writeRelays = [this._publicIndexingRelay, ...relays];
        this._writeRelays = Array.from(new Set(this._writeRelays));
        let nostrCommunicationManagers = [];
        for (let relay of this._writeRelays) {
            if (relay.startsWith('wss://')) {
                nostrCommunicationManagers.push(new communication_1.NostrWebSocketManager(relay));
            }
            else {
                nostrCommunicationManagers.push(new communication_1.NostrRestAPIManager(relay));
            }
        }
        return nostrCommunicationManagers;
    }
    subscribeToMqttTopics(topics) {
        this.mqttManager.subscribe(topics);
    }
    unsubscribeFromMqttTopics(topics) {
        this.mqttManager.unsubscribe(topics);
    }
    publishToMqttTopic(topic, message) {
        this.mqttManager.publish(topic, message);
    }
    async fetchCommunityFeedInfo(creatorId, communityId, since, until) {
        const communityUri = utilsManager_1.SocialUtilsManager.getCommunityUri(creatorId, communityId);
        const events = await this._socialEventManagerRead.fetchCommunityFeed({
            communityUri,
            since,
            until
        });
        const { notes, metadataByPubKeyMap, quotedNotesMap } = this.createNoteEventMappings(events);
        return {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap
        };
    }
    retrieveCommunityUri(noteEvent, scpData) {
        let communityUri = null;
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
    async retrievePostPrivateKey(event, communityUri, communityPrivateKey) {
        let key = null;
        let postScpData = utilsManager_1.SocialUtilsManager.extractScpData(event, interfaces_1.ScpStandardId.CommunityPost);
        if (!postScpData)
            return key;
        try {
            const postPrivateKey = await utilsManager_1.SocialUtilsManager.decryptMessage(communityPrivateKey, event.pubkey, postScpData.encryptedKey);
            const messageContentStr = await utilsManager_1.SocialUtilsManager.decryptMessage(postPrivateKey, event.pubkey, event.content);
            const messageContent = JSON.parse(messageContentStr);
            if (communityUri === messageContent.communityUri) {
                key = postPrivateKey;
            }
        }
        catch (e) {
        }
        return key;
    }
    async decryptPostPrivateKeyForCommunity(options) {
        const { event, selfPubkey, communityUri, communityPublicKey, communityPrivateKey } = options;
        let key = null;
        let postScpData = utilsManager_1.SocialUtilsManager.extractScpData(event, interfaces_1.ScpStandardId.CommunityPost);
        if (!postScpData)
            return key;
        try {
            if (selfPubkey && communityPublicKey && event.pubkey === selfPubkey) {
                key = await utilsManager_1.SocialUtilsManager.decryptMessage(this._privateKey, communityPublicKey, postScpData.encryptedKey);
            }
            else if (communityPrivateKey) {
                const postPrivateKey = await utilsManager_1.SocialUtilsManager.decryptMessage(communityPrivateKey, event.pubkey, postScpData.encryptedKey);
                const messageContentStr = await utilsManager_1.SocialUtilsManager.decryptMessage(postPrivateKey, event.pubkey, event.content);
                const messageContent = JSON.parse(messageContentStr);
                if (communityUri === messageContent.communityUri) {
                    key = postPrivateKey;
                }
            }
        }
        catch (e) {
        }
        return key;
    }
    async retrieveChannelMessagePrivateKey(event, channelId, communityPrivateKey) {
        let key = null;
        let messageScpData = utilsManager_1.SocialUtilsManager.extractScpData(event, interfaces_1.ScpStandardId.ChannelMessage);
        try {
            const messagePrivateKey = await utilsManager_1.SocialUtilsManager.decryptMessage(communityPrivateKey, event.pubkey, messageScpData.encryptedKey);
            const messageContentStr = await utilsManager_1.SocialUtilsManager.decryptMessage(messagePrivateKey, event.pubkey, event.content);
            const messageContent = JSON.parse(messageContentStr);
            if (channelId === messageContent.channelId) {
                key = messagePrivateKey;
            }
        }
        catch (e) {
        }
        return key;
    }
    async retrieveCommunityPrivateKey(communityInfo, selfPrivateKey) {
        if (!communityInfo.scpData?.gatekeeperPublicKey)
            return null;
        const encryptedKey = communityInfo.scpData.encryptedKey || communityInfo.memberKeyMap?.[communityInfo.scpData.gatekeeperPublicKey];
        if (!encryptedKey)
            return null;
        let communityPrivateKey;
        const creatorPubkey = communityInfo.eventData.pubkey;
        const selfPubkey = utilsManager_1.SocialUtilsManager.convertPrivateKeyToPubkey(selfPrivateKey);
        if (selfPubkey === communityInfo.scpData.gatekeeperPublicKey) {
            communityPrivateKey = await utilsManager_1.SocialUtilsManager.decryptMessage(selfPrivateKey, creatorPubkey, encryptedKey);
        }
        else if (selfPubkey === creatorPubkey) {
            communityPrivateKey = await utilsManager_1.SocialUtilsManager.decryptMessage(selfPrivateKey, communityInfo.scpData.gatekeeperPublicKey, encryptedKey);
        }
        return communityPrivateKey;
    }
    async constructCommunityNoteIdToPrivateKeyMap(communityInfo, noteInfoList) {
        let noteIdToPrivateKey = {};
        let communityPrivateKey = await this.retrieveCommunityPrivateKey(communityInfo, this._privateKey);
        const pubkey = utilsManager_1.SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        for (const note of noteInfoList) {
            let postPrivateKey = await this.decryptPostPrivateKeyForCommunity({
                event: note.eventData,
                selfPubkey: pubkey,
                communityUri: communityInfo.communityUri,
                communityPublicKey: communityInfo.scpData.publicKey,
                communityPrivateKey
            });
            if (postPrivateKey) {
                noteIdToPrivateKey[note.eventData.id] = postPrivateKey;
            }
        }
        return noteIdToPrivateKey;
    }
    async retrieveCommunityPostKeys(options) {
        const { communityInfo, noteInfoList } = options;
        let noteIdToPrivateKey = {};
        if (options.gatekeeperUrl) {
            let bodyData = utilsManager_1.SocialUtilsManager.augmentWithAuthInfo({
                creatorId: communityInfo.creatorId,
                communityId: communityInfo.communityId,
                message: options.message,
                signature: options.signature,
                since: options.since,
                until: options.until
            }, this._privateKey);
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
            noteIdToPrivateKey = await this.constructCommunityNoteIdToPrivateKeyMap(communityInfo, noteInfoList);
        }
        return noteIdToPrivateKey;
    }
    async retrieveCommunityThreadPostKeys(options) {
        const { communityInfo, noteInfoList } = options;
        let noteIdToPrivateKey = {};
        if (options.gatekeeperUrl) {
            let bodyData = utilsManager_1.SocialUtilsManager.augmentWithAuthInfo({
                creatorId: communityInfo.creatorId,
                communityId: communityInfo.communityId,
                focusedNoteId: options.focusedNoteId,
                message: options.message,
                signature: options.signature
            }, this._privateKey);
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
            noteIdToPrivateKey = await this.constructCommunityNoteIdToPrivateKeyMap(communityInfo, noteInfoList);
        }
        return noteIdToPrivateKey;
    }
    async retrieveCommunityPostKeysByNoteEvents(options) {
        let noteIdToPrivateKey = {};
        let communityPrivateKeyMap = {};
        const noteCommunityMappings = await this.createNoteCommunityMappings(options.notes);
        if (noteCommunityMappings.noteCommunityInfoList.length === 0)
            return noteIdToPrivateKey;
        const communityInfoMap = {};
        for (let communityInfo of noteCommunityMappings.communityInfoList) {
            communityInfoMap[communityInfo.communityUri] = communityInfo;
            if (communityInfo.membershipType === interfaces_1.MembershipType.Open)
                continue;
            let communityPrivateKey = await this.retrieveCommunityPrivateKey(communityInfo, this._privateKey);
            if (communityPrivateKey) {
                communityPrivateKeyMap[communityInfo.communityUri] = communityPrivateKey;
            }
        }
        let relayToNotesMap = {};
        for (let noteCommunityInfo of noteCommunityMappings.noteCommunityInfoList) {
            const communityPrivateKey = communityPrivateKeyMap[noteCommunityInfo.communityUri];
            const communityInfo = communityInfoMap[noteCommunityInfo.communityUri];
            if (!communityInfo)
                continue;
            if (communityInfo.membershipType === interfaces_1.MembershipType.Open)
                continue;
            let postPrivateKey = await this.decryptPostPrivateKeyForCommunity({
                event: noteCommunityInfo.eventData,
                selfPubkey: options.pubKey,
                communityUri: noteCommunityInfo.communityUri,
                communityPublicKey: communityInfo.scpData.publicKey,
                communityPrivateKey
            });
            if (postPrivateKey) {
                noteIdToPrivateKey[noteCommunityInfo.eventData.id] = postPrivateKey;
            }
            else {
                if (communityInfo.privateRelay) {
                    relayToNotesMap[communityInfo.privateRelay] = relayToNotesMap[communityInfo.privateRelay] || [];
                    relayToNotesMap[communityInfo.privateRelay].push(noteCommunityInfo);
                }
                else if (options.gatekeeperUrl) {
                    relayToNotesMap[options.gatekeeperUrl] = relayToNotesMap[options.gatekeeperUrl] || [];
                    relayToNotesMap[options.gatekeeperUrl].push(noteCommunityInfo);
                }
            }
        }
        if (Object.keys(relayToNotesMap).length > 0) {
            for (let relay in relayToNotesMap) {
                const noteIds = relayToNotesMap[relay].map(v => v.eventData.id);
                const signature = await options.getSignature(options.message);
                let bodyData = utilsManager_1.SocialUtilsManager.augmentWithAuthInfo({
                    noteIds: noteIds.join(','),
                    message: options.message,
                    signature: signature
                }, this._privateKey);
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
        return noteIdToPrivateKey;
    }
    async checkIfUserHasAccessToCommunity(options) {
        const { communityInfo, gatekeeperUrl, walletAddresses } = options;
        let hasAccess = false;
        const pubkey = index_1.Keys.getPublicKey(this._privateKey);
        let bodyData = {
            creatorId: communityInfo.creatorId,
            communityId: communityInfo.communityId,
            pubkey,
            walletAddresses
        };
        let url = `${gatekeeperUrl}/api/communities/v0/check-user-access`;
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
            hasAccess = result.data.hasAccess;
        }
        return hasAccess;
    }
    async constructMetadataByPubKeyMap(notes) {
        let mentionAuthorSet = new Set();
        for (let i = 0; i < notes.length; i++) {
            const mentionTags = notes[i].tags.filter(tag => tag[0] === 'p' && tag[1] !== notes[i].pubkey)?.map(tag => tag[1]) || [];
            if (mentionTags.length) {
                mentionTags.forEach(tag => mentionAuthorSet.add(tag));
            }
        }
        const uniqueKeys = Array.from(mentionAuthorSet);
        const npubs = notes.map(note => note.pubkey).filter((value, index, self) => self.indexOf(value) === index);
        const metadata = await this._socialEventManagerRead.fetchUserProfileCacheEvents({
            pubKeys: [...npubs, ...uniqueKeys]
        });
        const metadataByPubKeyMap = metadata.reduce((acc, cur) => {
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
    async fetchUserProfiles(pubKeys) {
        if (pubKeys.length === 0)
            return [];
        let metadataArr = [];
        let followersCountMap = {};
        try {
            const events = await this._socialEventManagerRead.fetchUserProfileCacheEvents({ pubKeys });
            for (let event of events) {
                if (event.kind === 0) {
                    metadataArr.push({
                        ...event,
                        content: utilsManager_1.SocialUtilsManager.parseContent(event.content)
                    });
                }
                else if (event.kind === 10000108) {
                    followersCountMap = utilsManager_1.SocialUtilsManager.parseContent(event.content);
                }
            }
        }
        catch (error) {
            console.error('fetchUserProfiles', error);
        }
        if (metadataArr.length == 0)
            return null;
        const userProfiles = [];
        for (let metadata of metadataArr) {
            let userProfile = utilsManager_1.SocialUtilsManager.constructUserProfile(metadata, followersCountMap);
            userProfiles.push(userProfile);
        }
        return userProfiles;
    }
    async updateUserProfile(content) {
        await this._socialEventManagerWrite.updateUserProfile(content);
    }
    async fetchTrendingNotesInfo() {
        let notes = [];
        let metadataByPubKeyMap = {};
        const events = await this._socialEventManagerRead.fetchTrendingCacheEvents({});
        for (let event of events) {
            if (event.kind === 0) {
                metadataByPubKeyMap[event.pubkey] = {
                    ...event,
                    content: utilsManager_1.SocialUtilsManager.parseContent(event.content)
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
    async fetchProfileFeedInfo(pubKey, since = 0, until) {
        const selfPubkey = this._privateKey ? utilsManager_1.SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey) : null;
        const events = await this._socialEventManagerRead.fetchProfileFeedCacheEvents({
            userPubkey: selfPubkey,
            pubKey,
            since,
            until
        });
        const earliest = this.getEarliestEventTimestamp(events.filter(v => v.created_at));
        const { notes, metadataByPubKeyMap, quotedNotesMap, noteToRepostIdMap, pubkeyToCommunityIdsMap } = this.createNoteEventMappings(events);
        const communityInfoMap = {};
        if (Object.keys(pubkeyToCommunityIdsMap).length > 0) {
            const communityEvents = await this._socialEventManagerRead.fetchCommunities({
                pubkeyToCommunityIdsMap
            });
            for (let event of communityEvents) {
                let communityInfo = utilsManager_1.SocialUtilsManager.extractCommunityInfo(event);
                communityInfoMap[communityInfo.communityUri] = communityInfo;
            }
        }
        for (let note of notes) {
            if (note.eventData.tags?.length) {
                const communityUri = note.eventData.tags.find(tag => tag[0] === 'a')?.[1];
                if (communityUri) {
                    const communityInfo = communityInfoMap[communityUri];
                    const { creatorId, communityId } = utilsManager_1.SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                    note.community = {
                        communityUri,
                        communityId: communityInfo?.communityId || communityId,
                        creatorId: communityInfo?.creatorId || index_1.Nip19.npubEncode(creatorId),
                        parentCommunityUri: communityInfo?.parentCommunityUri,
                        privateRelay: communityInfo?.privateRelay,
                        isExclusive: communityInfo?.membershipType === interfaces_1.MembershipType.Protected,
                        isWhitelist: communityInfo?.policies?.[0]?.policyType === interfaces_1.ProtectedMembershipPolicyType.Whitelist,
                        policies: communityInfo?.policies
                    };
                }
            }
            const noteId = note.eventData.id;
            const repostId = noteToRepostIdMap[noteId];
            if (!repostId)
                continue;
            const metadata = metadataByPubKeyMap[repostId];
            if (!metadata)
                continue;
            const metadataContent = metadata.content;
            const encodedPubkey = index_1.Nip19.npubEncode(metadata.pubkey);
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
    async fetchProfileRepliesInfo(pubKey, since = 0, until) {
        const selfPubkey = this._privateKey ? utilsManager_1.SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey) : null;
        const events = await this._socialEventManagerRead.fetchProfileRepliesCacheEvents({
            userPubkey: selfPubkey,
            pubKey,
            since,
            until
        });
        const earliest = this.getEarliestEventTimestamp(events.filter(v => v.created_at));
        const { notes, metadataByPubKeyMap, quotedNotesMap, noteToParentAuthorIdMap } = this.createNoteEventMappings(events, true);
        for (let note of notes) {
            const noteId = note.eventData.id;
            const parentAuthorId = noteToParentAuthorIdMap[noteId];
            if (!parentAuthorId)
                continue;
            const metadata = metadataByPubKeyMap[parentAuthorId];
            if (!metadata)
                continue;
            const metadataContent = metadata.content;
            const encodedPubkey = index_1.Nip19.npubEncode(metadata.pubkey);
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
    async fetchEventsByIds(ids) {
        const events = await this._socialEventManagerRead.fetchEventsByIds({ ids });
        return events;
    }
    async fetchNotesByIds(ids) {
        const noteEvents = await this._socialEventManagerRead.fetchEventsByIds({ ids });
        const { notes, quotedNotesMap, pubkeyToCommunityIdsMap } = this.createNoteEventMappings(noteEvents);
        let metadataByPubKeyMap = await this.constructMetadataByPubKeyMap(noteEvents);
        const communityInfoMap = {};
        if (Object.keys(pubkeyToCommunityIdsMap).length > 0) {
            const communityEvents = await this._socialEventManagerRead.fetchCommunities({
                pubkeyToCommunityIdsMap
            });
            for (let event of communityEvents) {
                let communityInfo = utilsManager_1.SocialUtilsManager.extractCommunityInfo(event);
                communityInfoMap[communityInfo.communityUri] = communityInfo;
            }
        }
        for (let note of notes) {
            if (!note.actions)
                note.actions = {};
            note.actions.bookmarked = true;
            if (note.eventData.tags?.length) {
                const communityUri = note.eventData.tags.find(tag => tag[0] === 'a')?.[1];
                if (communityUri) {
                    const communityInfo = communityInfoMap[communityUri];
                    const { creatorId, communityId } = utilsManager_1.SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                    note.community = {
                        communityUri,
                        communityId: communityInfo?.communityId || communityId,
                        creatorId: communityInfo?.creatorId || index_1.Nip19.npubEncode(creatorId),
                        parentCommunityUri: communityInfo?.parentCommunityUri,
                        privateRelay: communityInfo?.privateRelay,
                        isExclusive: communityInfo?.membershipType === interfaces_1.MembershipType.Protected,
                        isWhitelist: communityInfo?.policies?.[0]?.policyType === interfaces_1.ProtectedMembershipPolicyType.Whitelist,
                        policies: communityInfo?.policies
                    };
                }
            }
        }
        return {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap
        };
    }
    async fetchTempEvents(ids) {
        const noteEvents = await this._socialEventManagerRead.fetchTempEvents({ ids });
        return noteEvents;
    }
    getEarliestEventTimestamp(events) {
        if (!events || events.length === 0) {
            return 0;
        }
        return events.reduce((createdAt, event) => {
            return Math.min(createdAt, event.created_at);
        }, events[0].created_at);
    }
    async fetchHomeFeedInfo(pubKey, since = 0, until) {
        let events = await this._socialEventManagerRead.fetchHomeFeedCacheEvents({
            pubKey,
            since,
            until
        });
        const earliest = this.getEarliestEventTimestamp(events.filter(v => v.kind === 1).filter(v => v.created_at));
        const { notes, metadataByPubKeyMap, quotedNotesMap, pubkeyToCommunityIdsMap } = this.createNoteEventMappings(events);
        const communityInfoMap = {};
        if (Object.keys(pubkeyToCommunityIdsMap).length > 0) {
            const communityEvents = await this._socialEventManagerRead.fetchCommunities({
                pubkeyToCommunityIdsMap
            });
            for (let event of communityEvents) {
                let communityInfo = utilsManager_1.SocialUtilsManager.extractCommunityInfo(event);
                communityInfoMap[communityInfo.communityUri] = communityInfo;
            }
        }
        for (let note of notes) {
            if (note.eventData.tags?.length) {
                const communityUri = note.eventData.tags.find(tag => tag[0] === 'a')?.[1];
                if (communityUri) {
                    const communityInfo = communityInfoMap[communityUri];
                    const { creatorId, communityId } = utilsManager_1.SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                    note.community = {
                        communityUri,
                        communityId: communityInfo?.communityId || communityId,
                        creatorId: communityInfo?.creatorId || index_1.Nip19.npubEncode(creatorId),
                        parentCommunityUri: communityInfo?.parentCommunityUri,
                        privateRelay: communityInfo?.privateRelay,
                        isExclusive: communityInfo?.membershipType === interfaces_1.MembershipType.Protected,
                        isWhitelist: communityInfo?.policies?.[0]?.policyType === interfaces_1.ProtectedMembershipPolicyType.Whitelist,
                        policies: communityInfo?.policies
                    };
                }
            }
        }
        return {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            earliest
        };
    }
    async fetchUserFollowingFeedInfo(pubKey, until) {
        let events = await this._socialEventManagerRead.fetchUserFollowingFeed({
            pubKey,
            until
        });
        const earliest = this.getEarliestEventTimestamp(events.filter(v => (v.kind === 1 || v.kind === 6) && v.created_at));
        const { notes, metadataByPubKeyMap, quotedNotesMap, pubkeyToCommunityIdsMap } = this.createNoteEventMappings(events);
        const communityInfoMap = {};
        if (Object.keys(pubkeyToCommunityIdsMap).length > 0) {
            const communityEvents = await this._socialEventManagerRead.fetchCommunities({
                pubkeyToCommunityIdsMap
            });
            for (let event of communityEvents) {
                let communityInfo = utilsManager_1.SocialUtilsManager.extractCommunityInfo(event);
                communityInfoMap[communityInfo.communityUri] = communityInfo;
            }
        }
        for (let note of notes) {
            if (note.eventData.tags?.length) {
                const communityUri = note.eventData.tags.find(tag => tag[0] === 'a')?.[1];
                if (communityUri) {
                    const communityInfo = communityInfoMap[communityUri];
                    const { creatorId, communityId } = utilsManager_1.SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                    note.community = {
                        communityUri,
                        communityId: communityInfo?.communityId || communityId,
                        creatorId: communityInfo?.creatorId || index_1.Nip19.npubEncode(creatorId),
                        parentCommunityUri: communityInfo?.parentCommunityUri,
                        privateRelay: communityInfo?.privateRelay,
                        isExclusive: communityInfo?.membershipType === interfaces_1.MembershipType.Protected,
                        isWhitelist: communityInfo?.policies?.[0]?.policyType === interfaces_1.ProtectedMembershipPolicyType.Whitelist,
                        policies: communityInfo?.policies
                    };
                }
            }
        }
        return {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            earliest
        };
    }
    createNoteEventMappings(events, parentAuthorsInfo = false) {
        let notes = [];
        let metadataByPubKeyMap = {};
        let quotedNotesMap = {};
        let noteToParentAuthorIdMap = {};
        let noteToRepostIdMap = {};
        let noteStatsMap = {};
        let noteActionsMap = {};
        let pubkeyToCommunityIdsMap = {};
        for (let event of events) {
            if (event.kind === 0) {
                metadataByPubKeyMap[event.pubkey] = {
                    ...event,
                    content: utilsManager_1.SocialUtilsManager.parseContent(event.content)
                };
            }
            else if (event.kind === 10000107) {
                if (!event.content)
                    continue;
                const noteEvent = utilsManager_1.SocialUtilsManager.parseContent(event.content);
                quotedNotesMap[noteEvent.id] = {
                    eventData: noteEvent
                };
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
                if (!event.content)
                    continue;
                const originalNoteContent = utilsManager_1.SocialUtilsManager.parseContent(event.content);
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
                if (!event.content)
                    continue;
                const content = utilsManager_1.SocialUtilsManager.parseContent(event.content);
                noteStatsMap[content.event_id] = {
                    upvotes: content.likes,
                    replies: content.replies,
                    reposts: content.reposts,
                    satszapped: content.satszapped,
                    status: content.status
                };
            }
            else if (event.kind === 10000113) {
                const timeInfo = utilsManager_1.SocialUtilsManager.parseContent(event.content);
            }
            else if (event.kind === 10000115) {
                if (!event.content)
                    continue;
                const content = utilsManager_1.SocialUtilsManager.parseContent(event.content);
                noteActionsMap[content.event_id] = {
                    liked: content.liked,
                    replied: content.replied,
                    reposted: content.reposted,
                    zapped: content.zapped
                };
            }
        }
        for (let note of notes) {
            const noteId = note.eventData?.id;
            note.stats = noteStatsMap[noteId];
            note.actions = noteActionsMap[noteId];
            const communityUri = note.eventData?.tags?.find(tag => tag[0] === 'a')?.[1];
            if (communityUri) {
                const { creatorId, communityId } = utilsManager_1.SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                if (!pubkeyToCommunityIdsMap[creatorId]) {
                    pubkeyToCommunityIdsMap[creatorId] = [];
                }
                if (!pubkeyToCommunityIdsMap[creatorId].includes(communityId)) {
                    pubkeyToCommunityIdsMap[creatorId].push(communityId);
                }
            }
        }
        return {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            noteToParentAuthorIdMap,
            noteStatsMap,
            noteToRepostIdMap,
            noteActionsMap,
            pubkeyToCommunityIdsMap
        };
    }
    async fetchCommunityInfo(creatorId, communityId) {
        const communityEvents = await this._socialEventManagerRead.fetchCommunity({
            creatorId,
            communityId
        });
        const communityEvent = communityEvents.find(event => event.kind === 34550);
        if (!communityEvent)
            return null;
        let communityInfo = utilsManager_1.SocialUtilsManager.extractCommunityInfo(communityEvent);
        if (communityInfo.membershipType === interfaces_1.MembershipType.Protected && !communityInfo.scpData?.encryptedKey) {
            const keyEvents = await this._socialEventManagerRead.fetchGroupKeys({
                identifiers: [communityInfo.communityUri + ':keys']
            });
            const keyEvent = keyEvents[0];
            if (keyEvent) {
                communityInfo.memberKeyMap = JSON.parse(keyEvent.content);
            }
        }
        return communityInfo;
    }
    getRandomInt(min, max) {
        const minCeiled = Math.ceil(min);
        const maxFloored = Math.floor(max);
        return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
    }
    constructLeaderboard(members, min, max) {
        const data = members.map(m => ({
            npub: m.id,
            username: m.username,
            displayName: m.name,
            avatar: m.profileImageUrl,
            internetIdentifier: m.internetIdentifier,
            point: this.getRandomInt(min, max)
        })).sort((a, b) => b.point - a.point).slice(0, 10);
        return data;
    }
    async fetchCommunityLeaderboard(community) {
        const communityUriToMembersMap = await this.fetchCommunitiesMembers([community]);
        const members = communityUriToMembersMap[community.communityUri] || [];
        const allTime = this.constructLeaderboard(members, 100, 600);
        const monthly = this.constructLeaderboard(members, 40, 99);
        const weekly = this.constructLeaderboard(members, 1, 39);
        return {
            allTime,
            monthly,
            weekly
        };
    }
    async fetchCommunitiesFeedInfo(since, until) {
        let result = [];
        const communitiesMetadataFeedResult = await this._socialEventManagerRead.fetchCommunitiesMetadataFeed({
            since,
            until,
            noteCountsIncluded: false
        });
        const statsEvents = communitiesMetadataFeedResult.filter(event => event.kind === 10000100);
        let noteStatsMap = {};
        for (let event of statsEvents) {
            const content = utilsManager_1.SocialUtilsManager.parseContent(event.content);
            noteStatsMap[content.event_id] = {
                upvotes: content.likes,
                replies: content.replies,
                reposts: content.reposts,
                satszapped: content.satszapped
            };
        }
        const notesEvents = communitiesMetadataFeedResult.filter(event => event.kind === 1);
        for (let noteEvent of notesEvents) {
            if (noteEvent.tags?.length) {
                const communityUri = noteEvent.tags.find(tag => tag[0] === 'a')?.[1];
                if (communityUri) {
                    const { creatorId, communityId } = utilsManager_1.SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                    const stats = noteStatsMap[noteEvent.id];
                    const noteInfo = {
                        eventData: noteEvent,
                        stats,
                        community: {
                            communityUri,
                            communityId,
                            creatorId: index_1.Nip19.npubEncode(creatorId)
                        }
                    };
                    result.push(noteInfo);
                }
            }
        }
        return result;
    }
    async fetchUserRelatedCommunityFeedInfo(pubKey, since, until) {
        let result = [];
        const events = await this._socialEventManagerRead.fetchAllUserRelatedCommunitiesFeed({ pubKey, since, until });
        const statsEvents = events.filter(event => event.kind === 10000100);
        let noteStatsMap = {};
        for (let event of statsEvents) {
            const content = utilsManager_1.SocialUtilsManager.parseContent(event.content);
            noteStatsMap[content.event_id] = {
                upvotes: content.likes,
                replies: content.replies,
                reposts: content.reposts,
                satszapped: content.satszapped
            };
        }
        const notesEvents = events.filter(event => event.kind === 1);
        for (let noteEvent of notesEvents) {
            if (noteEvent.tags?.length) {
                const communityUri = noteEvent.tags.find(tag => tag[0] === 'a')?.[1];
                if (communityUri) {
                    const { creatorId, communityId } = utilsManager_1.SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                    const stats = noteStatsMap[noteEvent.id];
                    const noteInfo = {
                        eventData: noteEvent,
                        stats,
                        community: {
                            communityUri,
                            communityId,
                            creatorId: index_1.Nip19.npubEncode(creatorId)
                        }
                    };
                    result.push(noteInfo);
                }
            }
        }
        return result;
    }
    async fetchThreadNotesInfo(focusedNoteId) {
        let focusedNote;
        let ancestorNotes = [];
        let replies = [];
        let childReplyEventTagIds = [];
        let decodedFocusedNoteId = focusedNoteId.startsWith('note1') ? index_1.Nip19.decode(focusedNoteId).data : focusedNoteId;
        const selfPubkey = this._privateKey ? utilsManager_1.SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey) : null;
        const threadEvents = await this._socialEventManagerRead.fetchThreadCacheEvents({
            id: decodedFocusedNoteId,
            pubKey: selfPubkey
        });
        const { notes, metadataByPubKeyMap, quotedNotesMap, pubkeyToCommunityIdsMap } = this.createNoteEventMappings(threadEvents);
        const communityInfoMap = {};
        if (Object.keys(pubkeyToCommunityIdsMap).length > 0) {
            const communityEvents = await this._socialEventManagerRead.fetchCommunities({
                pubkeyToCommunityIdsMap
            });
            for (let event of communityEvents) {
                let communityInfo = utilsManager_1.SocialUtilsManager.extractCommunityInfo(event);
                communityInfoMap[communityInfo.communityUri] = communityInfo;
            }
        }
        const quotedPubKeys = [];
        for (let eventId in quotedNotesMap) {
            const pubKey = quotedNotesMap[eventId].eventData.pubkey;
            if (!metadataByPubKeyMap[pubKey])
                quotedPubKeys.push(pubKey);
        }
        if (quotedPubKeys.length > 0) {
            const metadata = await this._socialEventManagerRead.fetchUserProfileCacheEvents({
                pubKeys: quotedPubKeys
            });
            const _metadataByPubKeyMap = metadata.reduce((acc, cur) => {
                const content = JSON.parse(cur.content);
                if (cur.pubkey) {
                    acc[cur.pubkey] = {
                        ...cur,
                        content
                    };
                }
                return acc;
            }, {});
            Object.assign(metadataByPubKeyMap, _metadataByPubKeyMap);
        }
        for (let note of notes) {
            if (note.eventData.tags?.length) {
                const communityUri = note.eventData.tags.find(tag => tag[0] === 'a')?.[1];
                if (communityUri) {
                    const communityInfo = communityInfoMap[communityUri];
                    const { creatorId, communityId } = utilsManager_1.SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                    note.community = {
                        communityUri,
                        communityId: communityInfo?.communityId || communityId,
                        creatorId: communityInfo?.creatorId || index_1.Nip19.npubEncode(creatorId),
                        parentCommunityUri: communityInfo?.parentCommunityUri,
                        privateRelay: communityInfo?.privateRelay,
                        isExclusive: communityInfo?.membershipType === interfaces_1.MembershipType.Protected,
                        isWhitelist: communityInfo?.policies?.[0]?.policyType === interfaces_1.ProtectedMembershipPolicyType.Whitelist,
                        policies: communityInfo?.policies
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
        let communityInfo = null;
        let scpData = utilsManager_1.SocialUtilsManager.extractScpData(focusedNote.eventData, interfaces_1.ScpStandardId.CommunityPost);
        if (scpData) {
            const communityUri = this.retrieveCommunityUri(focusedNote.eventData, scpData);
            if (communityUri) {
                const { creatorId, communityId } = utilsManager_1.SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
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
    async createNoteCommunityMappings(notes) {
        let noteCommunityInfoList = [];
        let pubkeyToCommunityIdsMap = {};
        let communityInfoList = [];
        for (let note of notes) {
            let scpData = utilsManager_1.SocialUtilsManager.extractScpData(note, interfaces_1.ScpStandardId.CommunityPost);
            if (scpData) {
                const communityUri = this.retrieveCommunityUri(note, scpData);
                if (communityUri) {
                    const { creatorId, communityId } = utilsManager_1.SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                    pubkeyToCommunityIdsMap[creatorId] = pubkeyToCommunityIdsMap[creatorId] || [];
                    if (!pubkeyToCommunityIdsMap[creatorId].includes(communityId)) {
                        pubkeyToCommunityIdsMap[creatorId].push(communityId);
                    }
                    noteCommunityInfoList.push({
                        eventData: note,
                        communityUri,
                        communityId,
                        creatorId,
                    });
                }
            }
        }
        if (noteCommunityInfoList.length > 0) {
            const communityEvents = await this._socialEventManagerRead.fetchCommunities({
                pubkeyToCommunityIdsMap
            });
            for (let event of communityEvents) {
                let communityInfo = utilsManager_1.SocialUtilsManager.extractCommunityInfo(event);
                communityInfoList.push(communityInfo);
            }
            const keyEvents = await this._socialEventManagerRead.fetchGroupKeys({
                identifiers: communityInfoList.filter(v => !v.scpData?.encryptedKey).map(v => v.communityUri + ':keys')
            });
            for (let keyEvent of keyEvents) {
                const identifier = keyEvent.tags.find(tag => tag[0] === 'd')?.[1];
                const communityUri = identifier.replace(':keys', '');
                const communityInfo = communityInfoList.find(v => v.communityUri === communityUri);
                if (communityInfo) {
                    communityInfo.memberKeyMap = JSON.parse(keyEvent.content);
                }
            }
        }
        return {
            noteCommunityInfoList,
            communityInfoList
        };
    }
    async retrieveUserProfileDetail(pubKey) {
        let metadata;
        let stats;
        const userContactEvents = await this._socialEventManagerRead.fetchUserProfileDetailCacheEvents({ pubKey });
        for (let event of userContactEvents) {
            if (event.kind === 0) {
                metadata = {
                    ...event,
                    content: utilsManager_1.SocialUtilsManager.parseContent(event.content)
                };
            }
            else if (event.kind === 10000105) {
                let content = utilsManager_1.SocialUtilsManager.parseContent(event.content);
                stats = {
                    notes: content.note_count,
                    replies: content.reply_count,
                    followers: content.followers_count,
                    following: content.follows_count,
                    relays: content.relay_count,
                    timeJoined: content.time_joined
                };
            }
        }
        if (!metadata)
            return null;
        let userProfile = utilsManager_1.SocialUtilsManager.constructUserProfile(metadata);
        return {
            userProfile,
            stats
        };
    }
    async fetchUserContactList(pubKey) {
        let metadataArr = [];
        let followersCountMap = {};
        const userContactEvents = await this._socialEventManagerRead.fetchContactListCacheEvents({
            pubKey,
            detailIncluded: true
        });
        for (let event of userContactEvents) {
            if (event.kind === 0) {
                metadataArr.push({
                    ...event,
                    content: utilsManager_1.SocialUtilsManager.parseContent(event.content)
                });
            }
            else if (event.kind === 10000108) {
                followersCountMap = utilsManager_1.SocialUtilsManager.parseContent(event.content);
            }
        }
        const userProfiles = [];
        for (let metadata of metadataArr) {
            let userProfile = utilsManager_1.SocialUtilsManager.constructUserProfile(metadata, followersCountMap);
            userProfiles.push(userProfile);
        }
        return userProfiles;
    }
    async fetchUserFollowersList(pubKey) {
        let metadataArr = [];
        let followersCountMap = {};
        const userFollowersEvents = await this._socialEventManagerRead.fetchFollowersCacheEvents({ pubKey });
        for (let event of userFollowersEvents) {
            if (event.kind === 0) {
                metadataArr.push({
                    ...event,
                    content: utilsManager_1.SocialUtilsManager.parseContent(event.content)
                });
            }
            else if (event.kind === 10000108) {
                followersCountMap = utilsManager_1.SocialUtilsManager.parseContent(event.content);
            }
        }
        const userProfiles = [];
        for (let metadata of metadataArr) {
            let userProfile = utilsManager_1.SocialUtilsManager.constructUserProfile(metadata, followersCountMap);
            userProfiles.push(userProfile);
        }
        return userProfiles;
    }
    async fetchUserRelayList(pubKey) {
        let relayList = [];
        const relaysEvents = await this._socialEventManagerRead.fetchUserRelays({ pubKey });
        const relaysEvent = relaysEvents.find(event => event.kind === 10000139);
        if (!relaysEvent)
            return relayList;
        relayList = relaysEvent.tags.filter(tag => tag[0] === 'r')?.map(tag => tag[1]) || [];
        relayList = Array.from(new Set(relayList));
        return relayList;
    }
    async followUser(userPubKey) {
        const decodedUserPubKey = userPubKey.startsWith('npub1') ? index_1.Nip19.decode(userPubKey).data : userPubKey;
        const selfPubkey = utilsManager_1.SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const contactListEvents = await this._socialEventManagerRead.fetchContactListCacheEvents({
            pubKey: selfPubkey,
            detailIncluded: false
        });
        let content = '';
        let contactPubKeys = new Set();
        let contactListEvent = contactListEvents.find(event => event.kind === 3);
        if (contactListEvent) {
            content = contactListEvent.content;
            contactPubKeys = new Set(contactListEvent.tags.filter(tag => tag[0] === 'p')?.map(tag => tag[1]) || []);
        }
        contactPubKeys.add(decodedUserPubKey);
        await this._socialEventManagerWrite.updateContactList(content, Array.from(contactPubKeys));
    }
    async unfollowUser(userPubKey) {
        const decodedUserPubKey = userPubKey.startsWith('npub1') ? index_1.Nip19.decode(userPubKey).data : userPubKey;
        const selfPubkey = utilsManager_1.SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const contactListEvents = await this._socialEventManagerRead.fetchContactListCacheEvents({
            pubKey: selfPubkey,
            detailIncluded: false
        });
        let content = '';
        let contactPubKeys = new Set();
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
    async generateGroupKeys(privateKey, encryptionPublicKeys) {
        const groupPrivateKey = index_1.Keys.generatePrivateKey();
        const groupPublicKey = index_1.Keys.getPublicKey(groupPrivateKey);
        let encryptedGroupKeys = {};
        for (let encryptionPublicKey of encryptionPublicKeys) {
            const encryptedGroupKey = await utilsManager_1.SocialUtilsManager.encryptMessage(privateKey, encryptionPublicKey, groupPrivateKey);
            encryptedGroupKeys[encryptionPublicKey] = encryptedGroupKey;
        }
        return {
            groupPrivateKey,
            groupPublicKey,
            encryptedGroupKeys
        };
    }
    async createCommunity(newInfo, creatorId) {
        const communityUri = utilsManager_1.SocialUtilsManager.getCommunityUri(creatorId, newInfo.name);
        let communityInfo = {
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
            collectibles: newInfo.collectibles,
            parentCommunityUri: newInfo.parentCommunityUri
        };
        if (communityInfo.membershipType === interfaces_1.MembershipType.Protected) {
            const gatekeeperPublicKey = index_1.Nip19.decode(communityInfo.gatekeeperNpub).data;
            const groupPrivateKey = index_1.Keys.generatePrivateKey();
            const groupPublicKey = index_1.Keys.getPublicKey(groupPrivateKey);
            const encryptedGroupKey = await utilsManager_1.SocialUtilsManager.encryptMessage(this._privateKey, gatekeeperPublicKey, groupPrivateKey);
            communityInfo.scpData = {
                ...communityInfo.scpData,
                publicKey: groupPublicKey,
                gatekeeperPublicKey,
                encryptedKey: encryptedGroupKey
            };
            if (communityInfo.scpData) {
                const result = await this.updateCommunityChannel(communityInfo);
                if (result.event.id) {
                    communityInfo.scpData.channelEventId = result.event.id;
                }
            }
        }
        await this._socialEventManagerWrite.updateCommunity(communityInfo);
        return communityInfo;
    }
    async updateCommunity(info) {
        if (info.membershipType === interfaces_1.MembershipType.Protected) {
            const gatekeeperPublicKey = index_1.Nip19.decode(info.gatekeeperNpub).data;
            if (info.scpData) {
                if (!info.scpData.encryptedKey || !info.scpData.gatekeeperPublicKey) {
                    const groupPrivateKey = await this.retrieveCommunityPrivateKey(info, this._privateKey);
                    const encryptedGroupKey = await utilsManager_1.SocialUtilsManager.encryptMessage(this._privateKey, gatekeeperPublicKey, groupPrivateKey);
                    info.scpData = {
                        ...info.scpData,
                        gatekeeperPublicKey,
                        encryptedKey: encryptedGroupKey
                    };
                }
            }
            else {
                const groupPrivateKey = index_1.Keys.generatePrivateKey();
                const groupPublicKey = index_1.Keys.getPublicKey(groupPrivateKey);
                const encryptedGroupKey = await utilsManager_1.SocialUtilsManager.encryptMessage(this._privateKey, gatekeeperPublicKey, groupPrivateKey);
                info.scpData = {
                    ...info.scpData,
                    publicKey: groupPublicKey,
                    gatekeeperPublicKey,
                    encryptedKey: encryptedGroupKey
                };
            }
        }
        await this._socialEventManagerWrite.updateCommunity(info);
        return info;
    }
    async updateCommunityChannel(communityInfo) {
        let channelScpData = {
            communityUri: communityInfo.communityUri
        };
        let channelInfo = {
            name: communityInfo.communityId,
            about: communityInfo.description,
            scpData: channelScpData
        };
        const updateChannelResponse = await this._socialEventManagerWrite.updateChannel(channelInfo);
        return updateChannelResponse;
    }
    async createChannel(channelInfo, memberIds) {
        let encryptionPublicKeys = [];
        for (let memberId of memberIds) {
            const memberPublicKey = index_1.Nip19.decode(memberId).data;
            encryptionPublicKeys.push(memberPublicKey);
        }
        const channelKeys = await this.generateGroupKeys(this._privateKey, encryptionPublicKeys);
        channelInfo.scpData = {
            ...channelInfo.scpData,
            publicKey: channelKeys.groupPublicKey
        };
        const result = await this._socialEventManagerWrite.updateChannel(channelInfo);
        if (result.event.id) {
            const channelUri = `40:${result.event.id}`;
            await this._socialEventManagerWrite.updateGroupKeys(channelUri + ':keys', 40, JSON.stringify(channelKeys.encryptedGroupKeys), memberIds);
        }
        return channelInfo;
    }
    async updateChannel(channelInfo) {
        const updateChannelResponses = await this._socialEventManagerWrite.updateChannel(channelInfo);
        return updateChannelResponses;
    }
    async fetchCommunitiesMembers(communities) {
        if (communities.length === 0)
            return {};
        const communityUriToMembersMap = await this._socialEventManagerRead.getCommunityUriToMembersMap(communities);
        return communityUriToMembersMap;
    }
    getEventIdToMemberMap(events) {
        const memberCountsEvents = events.filter(event => event.kind === 10000109);
        let eventIdToMemberCountMap = {};
        for (let event of memberCountsEvents) {
            const content = utilsManager_1.SocialUtilsManager.parseContent(event.content);
            eventIdToMemberCountMap[content.event_id] = content.member_count;
        }
        return eventIdToMemberCountMap;
    }
    async fetchCommunities(query) {
        let communities = [];
        const events = await this._socialEventManagerRead.fetchCommunities({
            query
        });
        let eventIdToMemberCountMap = this.getEventIdToMemberMap(events);
        const communityEvents = events.filter(event => event.kind === 34550);
        for (let event of communityEvents) {
            const communityInfo = utilsManager_1.SocialUtilsManager.extractCommunityInfo(event);
            const memberCount = eventIdToMemberCountMap[event.id] || 0;
            let community = {
                ...communityInfo,
                members: [],
                memberCount
            };
            communities.push(community);
        }
        return communities;
    }
    async fetchMyCommunities(pubKey) {
        let communities = [];
        const events = await this._socialEventManagerRead.fetchAllUserRelatedCommunities({ pubKey });
        let eventIdToMemberCountMap = this.getEventIdToMemberMap(events);
        const communitiesEvents = events.filter(event => event.kind === 34550);
        for (let event of communitiesEvents) {
            const communityInfo = utilsManager_1.SocialUtilsManager.extractCommunityInfo(event);
            const memberCount = eventIdToMemberCountMap[event.id] || 0;
            let community = {
                ...communityInfo,
                members: [],
                memberCount
            };
            communities.push(community);
        }
        return communities;
    }
    async joinCommunity(community, pubKey) {
        const communities = await this._socialEventManagerRead.fetchUserBookmarkedCommunities({ pubKey });
        communities.push(community);
        await this._socialEventManagerWrite.updateUserBookmarkedCommunities(communities);
        if (community.scpData?.channelEventId) {
            const channelEventIds = await this._socialEventManagerRead.fetchUserBookmarkedChannelEventIds({ pubKey });
            channelEventIds.push(community.scpData.channelEventId);
            await this._socialEventManagerWrite.updateUserBookmarkedChannels(channelEventIds);
        }
    }
    async leaveCommunity(community, pubKey) {
        const communities = await this._socialEventManagerRead.fetchUserBookmarkedCommunities({
            pubKey,
            excludedCommunity: community
        });
        await this._socialEventManagerWrite.updateUserBookmarkedCommunities(communities);
        if (community.scpData?.channelEventId) {
            const channelEventIds = await this._socialEventManagerRead.fetchUserBookmarkedChannelEventIds({ pubKey });
            const index = channelEventIds.indexOf(community.scpData.channelEventId);
            if (index > -1) {
                channelEventIds.splice(index, 1);
            }
            await this._socialEventManagerWrite.updateUserBookmarkedChannels(channelEventIds);
        }
    }
    async encryptGroupMessage(privateKey, groupPublicKey, message) {
        const messagePrivateKey = index_1.Keys.generatePrivateKey();
        const messagePublicKey = index_1.Keys.getPublicKey(messagePrivateKey);
        const encryptedGroupKey = await utilsManager_1.SocialUtilsManager.encryptMessage(privateKey, groupPublicKey, messagePrivateKey);
        const encryptedMessage = await utilsManager_1.SocialUtilsManager.encryptMessage(privateKey, messagePublicKey, message);
        return {
            encryptedMessage,
            encryptedGroupKey
        };
    }
    async submitCommunityPost(message, info, conversationPath, timestamp, alt, isPublicPost = false) {
        const messageContent = {
            communityUri: info.communityUri,
            message,
        };
        let newCommunityPostInfo;
        if (info.membershipType === interfaces_1.MembershipType.Open || isPublicPost) {
            newCommunityPostInfo = {
                community: info,
                message,
                timestamp,
                conversationPath
            };
        }
        else {
            const { encryptedMessage, encryptedGroupKey } = await this.encryptGroupMessage(this._privateKey, info.scpData.publicKey, JSON.stringify(messageContent));
            newCommunityPostInfo = {
                community: info,
                message: encryptedMessage,
                timestamp,
                conversationPath,
                scpData: {
                    encryptedKey: encryptedGroupKey,
                    communityUri: info.communityUri
                }
            };
        }
        if (alt)
            newCommunityPostInfo.alt = alt;
        const responses = await this._socialEventManagerWrite.submitCommunityPost(newCommunityPostInfo);
        return responses;
    }
    async fetchAllUserRelatedChannels(pubKey) {
        const { channels, channelMetadataMap, channelIdToCommunityMap } = await this._socialEventManagerRead.fetchAllUserRelatedChannels({ pubKey });
        let outputChannels = [];
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
    async retrieveChannelMessages(channelId, since, until) {
        const events = await this._socialEventManagerRead.fetchChannelMessages({
            channelId,
            since,
            until
        });
        const messageEvents = events.filter(event => event.kind === 42);
        return messageEvents;
    }
    async retrieveChannelEvents(creatorId, channelId) {
        const channelEvents = await this._socialEventManagerRead.fetchChannelInfoMessages({ channelId });
        const messageEvents = channelEvents.filter(event => event.kind === 42);
        const channelCreationEvent = channelEvents.find(event => event.kind === 40);
        if (!channelCreationEvent)
            throw new Error('No info event found');
        const channelMetadataEvent = channelEvents.find(event => event.kind === 41);
        let channelInfo;
        if (channelMetadataEvent) {
            channelInfo = utilsManager_1.SocialUtilsManager.extractChannelInfo(channelMetadataEvent);
        }
        else {
            channelInfo = utilsManager_1.SocialUtilsManager.extractChannelInfo(channelCreationEvent);
        }
        if (!channelInfo)
            throw new Error('No info event found');
        return {
            messageEvents,
            info: channelInfo
        };
    }
    async retrieveChannelMessageKeys(options) {
        let messageIdToPrivateKey = {};
        if (options.gatekeeperUrl) {
            let bodyData = utilsManager_1.SocialUtilsManager.augmentWithAuthInfo({
                creatorId: options.creatorId,
                channelId: options.channelId,
                message: options.message,
                signature: options.signature
            }, this._privateKey);
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
                const { communityId } = utilsManager_1.SocialUtilsManager.getCommunityBasicInfoFromUri(channelInfo.scpData.communityUri);
                const communityInfo = await this.fetchCommunityInfo(channelInfo.eventData.pubkey, communityId);
                groupPrivateKey = await this.retrieveCommunityPrivateKey(communityInfo, options.privateKey);
                if (!groupPrivateKey)
                    return messageIdToPrivateKey;
            }
            else {
                const groupUri = `40:${channelInfo.id}`;
                const keyEvents = await this._socialEventManagerRead.fetchGroupKeys({
                    identifiers: [groupUri + ':keys']
                });
                const keyEvent = keyEvents[0];
                if (keyEvent) {
                    const creatorPubkey = channelInfo.eventData.pubkey;
                    const pubkey = utilsManager_1.SocialUtilsManager.convertPrivateKeyToPubkey(options.privateKey);
                    const memberKeyMap = JSON.parse(keyEvent.content);
                    const encryptedKey = memberKeyMap?.[pubkey];
                    if (encryptedKey) {
                        groupPrivateKey = await utilsManager_1.SocialUtilsManager.decryptMessage(options.privateKey, creatorPubkey, encryptedKey);
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
    async submitChannelMessage(message, channelId, communityPublicKey, conversationPath) {
        const messageContent = {
            channelId,
            message,
        };
        const { encryptedMessage, encryptedGroupKey } = await this.encryptGroupMessage(this._privateKey, communityPublicKey, JSON.stringify(messageContent));
        const newChannelMessageInfo = {
            channelId: channelId,
            message: encryptedMessage,
            conversationPath,
            scpData: {
                encryptedKey: encryptedGroupKey,
                channelId: channelId
            }
        };
        await this._socialEventManagerWrite.submitChannelMessage(newChannelMessageInfo);
    }
    async fetchDirectMessagesBySender(selfPubKey, senderPubKey, since, until) {
        const decodedSenderPubKey = index_1.Nip19.decode(senderPubKey).data;
        const events = await this._socialEventManagerRead.fetchDirectMessages({
            pubKey: selfPubKey,
            sender: decodedSenderPubKey,
            since,
            until
        });
        let metadataByPubKeyMap = {};
        const encryptedMessages = [];
        for (let event of events) {
            if (event.kind === 0) {
                metadataByPubKeyMap[event.pubkey] = {
                    ...event,
                    content: utilsManager_1.SocialUtilsManager.parseContent(event.content)
                };
            }
            else if (event.kind === 4) {
                encryptedMessages.push(event);
            }
        }
        return {
            decodedSenderPubKey,
            encryptedMessages,
            metadataByPubKeyMap
        };
    }
    async sendDirectMessage(chatId, message, replyToEventId) {
        const decodedReceiverPubKey = index_1.Nip19.decode(chatId).data;
        const content = await utilsManager_1.SocialUtilsManager.encryptMessage(this._privateKey, decodedReceiverPubKey, message);
        const result = await this._socialEventManagerWrite.sendMessage(decodedReceiverPubKey, content, replyToEventId);
        return result;
    }
    async sendTempMessage(options) {
        const { receiverId, message, replyToEventId, widgetId } = options;
        const decodedReceiverPubKey = index_1.Nip19.decode(receiverId).data;
        const content = await utilsManager_1.SocialUtilsManager.encryptMessage(this._privateKey, decodedReceiverPubKey, message);
        const result = await this._socialEventManagerWrite.sendTempMessage({
            receiver: decodedReceiverPubKey,
            encryptedMessage: content,
            replyToEventId,
            widgetId
        });
        return result;
    }
    async resetMessageCount(selfPubKey, senderPubKey) {
        await this._socialEventManagerRead.resetMessageCount({
            pubKey: selfPubKey,
            sender: senderPubKey
        });
    }
    async fetchMessageContacts(pubKey) {
        const events = await this._socialEventManagerRead.fetchMessageContactsCacheEvents({ pubKey });
        const pubkeyToMessageInfoMap = {};
        let metadataByPubKeyMap = {};
        for (let event of events) {
            if (event.kind === 10000118) {
                const content = utilsManager_1.SocialUtilsManager.parseContent(event.content);
                Object.keys(content).forEach(pubkey => {
                    pubkeyToMessageInfoMap[pubkey] = content[pubkey];
                });
            }
            if (event.kind === 0) {
                metadataByPubKeyMap[event.pubkey] = {
                    ...event,
                    content: utilsManager_1.SocialUtilsManager.parseContent(event.content)
                };
            }
        }
        let profiles = Object.entries(metadataByPubKeyMap).map(([k, v]) => {
            const encodedPubkey = index_1.Nip19.npubEncode(k);
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
            };
        });
        const channels = await this.fetchAllUserRelatedChannels(pubKey);
        for (let channel of channels) {
            let creatorId = index_1.Nip19.npubEncode(channel.eventData.pubkey);
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
    async fetchUserGroupInvitations(pubKey) {
        const identifiers = [];
        const events = await this._socialEventManagerRead.fetchUserGroupInvitations({
            groupKinds: [40, 34550],
            pubKey
        });
        for (let event of events) {
            const identifier = event.tags.find(tag => tag[0] === 'd')?.[1];
            if (identifier) {
                identifiers.push(identifier);
            }
        }
        return identifiers;
    }
    extractCalendarEventInfo(event) {
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
    async updateCalendarEvent(updateCalendarEventInfo) {
        const geohash = geohash_1.default.encode(updateCalendarEventInfo.latitude, updateCalendarEventInfo.longitude);
        updateCalendarEventInfo = {
            ...updateCalendarEventInfo,
            geohash
        };
        let naddr;
        const responses = await this._socialEventManagerWrite.updateCalendarEvent(updateCalendarEventInfo);
        const response = responses[0];
        if (response.success) {
            const pubkey = utilsManager_1.SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
            naddr = index_1.Nip19.naddrEncode({
                identifier: updateCalendarEventInfo.id,
                pubkey: pubkey,
                kind: updateCalendarEventInfo.type === interfaces_1.CalendarEventType.DateBased ? 31922 : 31923,
                relays: []
            });
        }
        return naddr;
    }
    async retrieveCalendarEventsByDateRange(start, end, limit, previousEventId) {
        const result = await this._socialEventManagerRead.fetchCalendarEvents({
            start,
            end,
            limit,
            previousEventId
        });
        let calendarEventInfoList = [];
        for (let event of result.events) {
            let calendarEventInfo = this.extractCalendarEventInfo(event);
            calendarEventInfoList.push(calendarEventInfo);
        }
        return {
            calendarEventInfoList,
            startDates: result.data?.dates
        };
    }
    async retrieveCalendarEvent(naddr) {
        let address = index_1.Nip19.decode(naddr).data;
        const calendarEvent = await this._socialEventManagerRead.fetchCalendarEvent({ address });
        if (!calendarEvent)
            return null;
        let calendarEventInfo = this.extractCalendarEventInfo(calendarEvent);
        let hostPubkeys = calendarEvent.tags.filter(tag => tag[0] === 'p' && tag[3] === 'host')?.map(tag => tag[1]) || [];
        const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
        let hosts = [];
        let attendees = [];
        let attendeePubkeys = [];
        let attendeePubkeyToEventMap = {};
        const postEvents = await this._socialEventManagerRead.fetchCalendarEventPosts({ calendarEventUri });
        const notes = [];
        for (let postEvent of postEvents) {
            const note = {
                eventData: postEvent
            };
            notes.push(note);
        }
        const rsvpEvents = await this._socialEventManagerRead.fetchCalendarEventRSVPs({ calendarEventUri });
        for (let rsvpEvent of rsvpEvents) {
            if (attendeePubkeyToEventMap[rsvpEvent.pubkey])
                continue;
            let attendanceStatus = rsvpEvent.tags.find(tag => tag[0] === 'l' && tag[2] === 'status')?.[1];
            if (attendanceStatus === 'accepted') {
                attendeePubkeyToEventMap[rsvpEvent.pubkey] = rsvpEvent;
                attendeePubkeys.push(rsvpEvent.pubkey);
            }
        }
        const userProfileEvents = await this._socialEventManagerRead.fetchUserProfileCacheEvents({
            pubKeys: [
                ...hostPubkeys,
                ...attendeePubkeys
            ]
        });
        for (let event of userProfileEvents) {
            if (event.kind === 0) {
                let metaData = {
                    ...event,
                    content: utilsManager_1.SocialUtilsManager.parseContent(event.content)
                };
                let userProfile = utilsManager_1.SocialUtilsManager.constructUserProfile(metaData);
                if (hostPubkeys.includes(event.pubkey)) {
                    let host = {
                        pubkey: event.pubkey,
                        userProfile
                    };
                    hosts.push(host);
                }
                else if (attendeePubkeyToEventMap[event.pubkey]) {
                    let attendee = {
                        pubkey: event.pubkey,
                        userProfile,
                        rsvpEventData: attendeePubkeyToEventMap[event.pubkey]
                    };
                    attendees.push(attendee);
                }
            }
        }
        let detailInfo = {
            ...calendarEventInfo,
            hosts,
            attendees,
            notes
        };
        return detailInfo;
    }
    async acceptCalendarEvent(rsvpId, naddr) {
        let address = index_1.Nip19.decode(naddr).data;
        const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
        const pubkey = utilsManager_1.SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const rsvpEvents = await this._socialEventManagerRead.fetchCalendarEventRSVPs({
            calendarEventUri,
            pubkey
        });
        if (rsvpEvents.length > 0) {
            rsvpId = rsvpEvents[0].tags.find(tag => tag[0] === 'd')?.[1];
        }
        await this._socialEventManagerWrite.createCalendarEventRSVP(rsvpId, calendarEventUri, true);
    }
    async declineCalendarEvent(rsvpId, naddr) {
        let address = index_1.Nip19.decode(naddr).data;
        const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
        const pubkey = utilsManager_1.SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const rsvpEvents = await this._socialEventManagerRead.fetchCalendarEventRSVPs({
            calendarEventUri,
            pubkey
        });
        if (rsvpEvents.length > 0) {
            rsvpId = rsvpEvents[0].tags.find(tag => tag[0] === 'd')?.[1];
        }
        await this._socialEventManagerWrite.createCalendarEventRSVP(rsvpId, calendarEventUri, false);
    }
    async submitCalendarEventPost(naddr, message, conversationPath) {
        let address = index_1.Nip19.decode(naddr).data;
        const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
        let info = {
            calendarEventUri,
            message,
            conversationPath
        };
        const responses = await this._socialEventManagerWrite.submitCalendarEventPost(info);
        const response = responses[0];
        return response.success ? response.eventId : null;
    }
    async fetchTimezones() {
        const apiUrl = `${this._apiBaseUrl}/timezones`;
        const apiResponse = await fetch(apiUrl);
        const apiResult = await apiResponse.json();
        if (!apiResult.success)
            throw new Error(apiResult.error.message);
        let timezones = [];
        for (let timezone of apiResult.data.timezones) {
            let gmtOffset = utilsManager_1.SocialUtilsManager.getGMTOffset(timezone.timezoneName);
            if (!gmtOffset)
                continue;
            timezones.push({
                timezoneName: timezone.timezoneName,
                description: timezone.description,
                gmtOffset: gmtOffset
            });
        }
        timezones.sort((a, b) => {
            if (a.gmtOffset.startsWith('GMT-') && b.gmtOffset.startsWith('GMT+'))
                return -1;
            if (a.gmtOffset.startsWith('GMT+') && b.gmtOffset.startsWith('GMT-'))
                return 1;
            if (a.gmtOffset.startsWith('GMT-')) {
                if (a.gmtOffset < b.gmtOffset)
                    return 1;
                if (a.gmtOffset > b.gmtOffset)
                    return -1;
            }
            else {
                if (a.gmtOffset > b.gmtOffset)
                    return 1;
                if (a.gmtOffset < b.gmtOffset)
                    return -1;
            }
            if (a.description < b.description)
                return -1;
            if (a.description > b.description)
                return 1;
            return 0;
        });
        return timezones;
    }
    async fetchCitiesByKeyword(keyword) {
        const apiUrl = `${this._apiBaseUrl}/cities?keyword=${keyword}`;
        const apiResponse = await fetch(apiUrl);
        const apiResult = await apiResponse.json();
        if (!apiResult.success)
            throw new Error(apiResult.error.message);
        let cities = [];
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
    async fetchCitiesByCoordinates(latitude, longitude) {
        const apiUrl = `${this._apiBaseUrl}/cities?lat=${latitude}&lng=${longitude}`;
        const apiResponse = await fetch(apiUrl);
        const apiResult = await apiResponse.json();
        if (!apiResult.success)
            throw new Error(apiResult.error.message);
        let cities = [];
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
        if (!this._ipLocationServiceBaseUrl)
            return null;
        const response = await fetch(this._ipLocationServiceBaseUrl);
        const result = await response.json();
        let locationInfo;
        if (result.success) {
            locationInfo = {
                latitude: result.data.lat,
                longitude: result.data.long
            };
        }
        return locationInfo;
    }
    async fetchEventMetadataFromIPFS(ipfsBaseUrl, eventId) {
        const url = `${ipfsBaseUrl}/nostr/${eventId}`;
        const response = await fetch(url);
        const result = await response.json();
        return result;
    }
    async getAccountBalance(walletAddress) {
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
        };
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
    async getNFTsByOwner(walletAddress) {
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
        };
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
    async submitMessage(message, conversationPath, createdAt) {
        return this._socialEventManagerWrite.postNote(message, conversationPath, createdAt);
    }
    async submitLongFormContent(info) {
        return this._socialEventManagerWrite.submitLongFormContentEvents(info);
    }
    async submitLike(postEventData) {
        let tags = postEventData.tags.filter(tag => tag.length >= 2 && (tag[0] === 'e' || tag[0] === 'p'));
        tags.push(['e', postEventData.id]);
        tags.push(['p', postEventData.pubkey]);
        tags.push(['k', postEventData.kind.toString()]);
        await this._socialEventManagerWrite.submitLike(tags);
    }
    async submitRepost(postEventData) {
        let tags = [
            [
                'e',
                postEventData.id
            ],
            [
                'p',
                postEventData.pubkey
            ]
        ];
        const content = JSON.stringify(postEventData);
        await this._socialEventManagerWrite.submitRepost(content, tags);
    }
    async sendPingRequest(pubkey, relayUrl = this._publicIndexingRelay) {
        const data = utilsManager_1.SocialUtilsManager.augmentWithAuthInfo({
            pubkey: pubkey,
        }, this._privateKey);
        let result;
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
    async checkRelayStatus(pubkey, relayUrl) {
        if (!relayUrl)
            relayUrl = this._publicIndexingRelay;
        const data = utilsManager_1.SocialUtilsManager.augmentWithAuthInfo({
            pubkey: pubkey,
        }, this._privateKey);
        let result;
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
                };
            }
        }
        catch (err) {
        }
        return result;
    }
    async searchUsers(query) {
        const events = await this._socialEventManagerRead.searchUsers({ query });
        let metadataArr = [];
        let followersCountMap = {};
        for (let event of events) {
            if (event.kind === 0) {
                metadataArr.push({
                    ...event,
                    content: utilsManager_1.SocialUtilsManager.parseContent(event.content)
                });
            }
            else if (event.kind === 10000108) {
                followersCountMap = utilsManager_1.SocialUtilsManager.parseContent(event.content);
            }
        }
        const userProfiles = [];
        for (let metadata of metadataArr) {
            let userProfile = utilsManager_1.SocialUtilsManager.constructUserProfile(metadata, followersCountMap);
            userProfiles.push(userProfile);
        }
        return userProfiles;
    }
    async addRelay(url) {
        const selfPubkey = utilsManager_1.SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const relaysEvents = await this._socialEventManagerRead.fetchUserRelays({
            pubKey: selfPubkey
        });
        const relaysEvent = relaysEvents.find(event => event.kind === 10000139);
        let relays = { [url]: { write: true, read: true } };
        if (relaysEvent) {
            for (let tag of relaysEvent.tags) {
                if (tag[0] !== 'r')
                    continue;
                let config = { read: true, write: true };
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
    async removeRelay(url) {
        const selfPubkey = utilsManager_1.SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const relaysEvents = await this._socialEventManagerRead.fetchUserRelays({
            pubKey: selfPubkey
        });
        const relaysEvent = relaysEvents.find(event => event.kind === 10000139);
        let relays = {};
        if (relaysEvent) {
            for (let tag of relaysEvent.tags) {
                if (tag[0] !== 'r' || tag[1] === url)
                    continue;
                let config = { read: true, write: true };
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
    async updateRelays(add, remove, defaultRelays) {
        const selfPubkey = utilsManager_1.SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const relaysEvents = await this._socialEventManagerRead.fetchUserRelays({
            pubKey: selfPubkey
        });
        const relaysEvent = relaysEvents.find(event => event.kind === 10000139);
        let relaysMap = {};
        for (let relay of add) {
            relaysMap[relay] = { read: true, write: true };
        }
        if (relaysEvent) {
            for (let tag of relaysEvent.tags) {
                if (tag[0] !== 'r' || remove.includes(tag[1]))
                    continue;
                let config = { read: true, write: true };
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
        await this._socialEventManagerWrite.updateRelayList(relaysMap);
        return relayUrls;
    }
    async makeInvoice(amount, comment) {
        const paymentRequest = await this.lightningWalletManager.makeInvoice(Number(amount), comment);
        await this._socialEventManagerWrite.createPaymentRequestEvent(paymentRequest, amount, comment, true);
        return paymentRequest;
    }
    async createPaymentRequest(chainId, token, amount, to, comment) {
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
    parsePaymentRequest(paymentRequest) {
        const decoded = atob(paymentRequest);
        let data = JSON.parse(decoded);
        return data;
    }
    async sendToken(paymentRequest) {
        let receipt;
        try {
            let data = this.parsePaymentRequest(paymentRequest);
            const wallet = eth_wallet_1.Wallet.getClientInstance();
            await wallet.init();
            if (data.chainId !== wallet.chainId) {
                await wallet.switchNetwork(data.chainId);
            }
            if (data.token.address) {
                const erc20 = new eth_wallet_1.Contracts.ERC20(wallet, data.token.address);
                let amount = eth_wallet_1.Utils.toDecimals(data.amount, data.token.decimals);
                receipt = await erc20.transfer({
                    to: data.to,
                    amount: amount
                });
            }
            else {
                receipt = await wallet.send(data.to, data.amount);
            }
        }
        catch (err) {
            throw new Error('Payment failed');
        }
        return receipt?.transactionHash;
    }
    isLightningInvoice(value) {
        const lnRegex = /^(lnbc|lntb|lnbcrt|lnsb|lntbs)([0-9]+(m|u|n|p))?1\S+/g;
        return lnRegex.test(value);
    }
    async sendPayment(paymentRequest, comment) {
        let preimage;
        let tx;
        if (this.isLightningInvoice(paymentRequest)) {
            preimage = await this.lightningWalletManager.sendPayment(paymentRequest);
        }
        else {
            tx = await this.sendToken(paymentRequest);
        }
        const requestEvent = await this._socialEventManagerRead.fetchPaymentRequestEvent({ paymentRequest });
        if (requestEvent) {
            await this._socialEventManagerWrite.createPaymentReceiptEvent(requestEvent.id, requestEvent.pubkey, comment, preimage, tx);
        }
        return preimage || tx;
    }
    async zap(pubkey, lud16, amount, noteId) {
        const response = await this.lightningWalletManager.zap(pubkey, lud16, Number(amount), '', this._writeRelays, noteId);
        return response;
    }
    async fetchUserPaymentActivities(pubkey, since, until) {
        const paymentActivitiesForSender = await this._socialEventManagerRead.fetchPaymentActivitiesForSender({
            pubkey,
            since,
            until
        });
        const paymentActivitiesForRecipient = await this._socialEventManagerRead.fetchPaymentActivitiesForRecipient({
            pubkey,
            since,
            until
        });
        const paymentActivities = [...paymentActivitiesForSender, ...paymentActivitiesForRecipient];
        return paymentActivities.sort((a, b) => b.createdAt - a.createdAt);
    }
    async fetchPaymentReceiptInfo(paymentRequest) {
        let info = {
            status: 'pending'
        };
        const requestEvent = await this._socialEventManagerRead.fetchPaymentRequestEvent({ paymentRequest });
        if (requestEvent) {
            const receiptEvent = await this._socialEventManagerRead.fetchPaymentReceiptEvent({
                requestEventId: requestEvent.id
            });
            const selfPubkey = this._privateKey ? utilsManager_1.SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey) : null;
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
        const response = await fetch('https://api.coinpaprika.com/v1/tickers/btc-bitcoin');
        const result = await response.json();
        const price = result.quotes.USD.price;
        return price;
    }
    async fetchUserPrivateRelay(pubkey) {
        const url = `${this._publicIndexingRelay}/private-relay?pubkey=${pubkey}`;
        const response = await fetch(url);
        const result = await response.json();
        return result.data.relay;
    }
    async fetchApps(keyword) {
        let url = `${this._apiBaseUrl}/apps`;
        if (keyword !== undefined)
            url += `?keyword=${keyword}`;
        try {
            const response = await fetch(url);
            const result = await response.json();
            return result.data.apps;
        }
        catch (e) {
            console.log('e', e);
        }
    }
    async fetchApp(pubkey, id) {
        const installed = await this.fetchInstalledByPubKey(pubkey);
        let installedVersionId;
        if (installed)
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
    async fetchInstalledByPubKey(pubkey) {
        const url = `${this._apiBaseUrl}/installed?pubkey=${pubkey}`;
        const response = await fetch(url);
        const result = await response.json();
        const installed = result.data.installed;
        if (!installed)
            return null;
        const decrypted = await scom_signer_1.Crypto.decryptWithPrivKey(this._privateKey, installed);
        console.log('decrypted', decrypted);
        return JSON.parse(decrypted);
    }
    async fetchInstalledApps(pubkey) {
        const installed = await this.fetchInstalledByPubKey(pubkey);
        if (!installed)
            return [];
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
    async installApp(pubkey, appId, appVersionId) {
        const url = `${this._apiBaseUrl}/install-app`;
        const installedApps = await this.fetchInstalledByPubKey(pubkey);
        let newInstalledApps = {};
        if (installedApps)
            newInstalledApps = { ...installedApps };
        newInstalledApps[appId] = appVersionId;
        const encryptedInstalledAppList = await scom_signer_1.Crypto.encryptWithPubKey(pubkey, JSON.stringify(newInstalledApps));
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
    async fetchCommunityPinnedNotes(creatorId, communityId) {
        const events = await this._socialEventManagerRead.fetchCommunityPinnedNotesEvents({
            creatorId,
            communityId
        });
        const { notes, metadataByPubKeyMap } = this.createNoteEventMappings(events);
        return {
            notes,
            metadataByPubKeyMap
        };
    }
    async pinCommunityNote(creatorId, communityId, noteId) {
        let noteIds = await this._socialEventManagerRead.fetchCommunityPinnedNoteIds({
            creatorId,
            communityId
        });
        noteIds = Array.from(new Set([...noteIds, noteId]));
        await this._socialEventManagerWrite.updateCommunityPinnedNotes(creatorId, communityId, noteIds);
    }
    async unpinCommunityNote(creatorId, communityId, noteId) {
        let noteIds = await this._socialEventManagerRead.fetchCommunityPinnedNoteIds({
            creatorId,
            communityId
        });
        noteIds = Array.from(new Set(noteIds));
        const index = noteIds.indexOf(noteId);
        if (index > -1) {
            noteIds.splice(index, 1);
        }
        await this._socialEventManagerWrite.updateCommunityPinnedNotes(creatorId, communityId, noteIds);
    }
    async fetchUserPinnedNotes(pubKey) {
        const pinnedNotesEvent = await this._socialEventManagerRead.fetchUserPinnedNotes({ pubKey });
        let noteIds = [];
        if (pinnedNotesEvent) {
            for (let tag of pinnedNotesEvent.tags) {
                if (tag[0] === 'e') {
                    noteIds.push(tag[1]);
                }
            }
        }
        if (noteIds.length > 0)
            return this._socialEventManagerRead.fetchEventsByIds({ ids: noteIds });
        else
            return [];
    }
    async pinUserNote(pubKey, noteId) {
        const pinnedNotesEvent = await this._socialEventManagerRead.fetchUserPinnedNotes({ pubKey });
        let noteIds = [noteId];
        if (pinnedNotesEvent) {
            for (let tag of pinnedNotesEvent.tags) {
                if (tag[0] === 'e' && tag[1] !== noteId) {
                    noteIds.push(tag[1]);
                }
            }
        }
        await this._socialEventManagerWrite.updateUserPinnedNotes(noteIds);
    }
    async unpinUserNote(pubKey, noteId) {
        const pinnedNotesEvent = await this._socialEventManagerRead.fetchUserPinnedNotes({ pubKey });
        let noteIds = [];
        if (pinnedNotesEvent) {
            for (let tag of pinnedNotesEvent.tags) {
                if (tag[0] === 'e' && tag[1] !== noteId) {
                    noteIds.push(tag[1]);
                }
            }
        }
        await this._socialEventManagerWrite.updateUserPinnedNotes(noteIds);
    }
    async fetchUserBookmarks(pubKey) {
        const bookmarksEvent = await this._socialEventManagerRead.fetchUserBookmarks({ pubKey });
        const eventIds = [];
        if (bookmarksEvent) {
            for (let tag of bookmarksEvent.tags) {
                if (tag[0] === 'e' || tag[0] === 'a') {
                    eventIds.push(tag[1]);
                }
            }
        }
        return eventIds;
    }
    async addBookmark(pubKey, eventId, isArticle = false) {
        const bookmarksEvent = await this._socialEventManagerRead.fetchUserBookmarks({ pubKey });
        let tags = [
            [isArticle ? "a" : "e", eventId]
        ];
        if (bookmarksEvent) {
            for (let tag of bookmarksEvent.tags) {
                if (tag[1] !== eventId) {
                    tags.push(tag);
                }
            }
        }
        await this._socialEventManagerWrite.updateUserBookmarks(tags);
    }
    async removeBookmark(pubKey, eventId, isArticle = false) {
        const bookmarksEvent = await this._socialEventManagerRead.fetchUserBookmarks({ pubKey });
        let tags = [];
        if (bookmarksEvent) {
            for (let tag of bookmarksEvent.tags) {
                if (tag[1] !== eventId) {
                    tags.push(tag);
                }
            }
        }
        await this._socialEventManagerWrite.updateUserBookmarks(tags);
    }
    async deleteEvents(eventIds) {
        await this._socialEventManagerWrite.deleteEvents(eventIds);
    }
    async fetchTrendingCommunities() {
        let communities = [];
        const events = await this._socialEventManagerRead.fetchTrendingCommunities();
        let eventIdToMemberCountMap = this.getEventIdToMemberMap(events);
        const communitiesEvents = events.filter(event => event.kind === 34550);
        for (let event of communitiesEvents) {
            const communityInfo = utilsManager_1.SocialUtilsManager.extractCommunityInfo(event);
            const memberCount = eventIdToMemberCountMap[event.id] || 0;
            let community = {
                ...communityInfo,
                memberCount
            };
            communities.push(community);
        }
        return communities;
    }
    async fetchUserEthWalletAccountsInfo(options) {
        const { walletHash, pubKey } = options;
        const event = await this._socialEventManagerRead.fetchUserEthWalletAccountsInfo({ walletHash, pubKey });
        if (!event)
            return null;
        const content = utilsManager_1.SocialUtilsManager.parseContent(event.content);
        let accountsInfo = {
            masterWalletSignature: content.master_wallet_signature,
            socialWalletSignature: content.social_wallet_signature,
            encryptedKey: content.encrypted_key,
            masterWalletHash: walletHash,
            eventData: event
        };
        return accountsInfo;
    }
    async updateUserEthWalletAccountsInfo(info, privateKey) {
        const responses = await this._socialEventManagerWrite.updateUserEthWalletAccountsInfo(info, privateKey);
        const response = responses[0];
        return response.success ? response.eventId : null;
    }
    async fetchSubCommunities(creatorId, communityId) {
        let communities = [];
        try {
            const events = await this._socialEventManagerRead.fetchSubcommunites({
                communityCreatorId: creatorId,
                communityName: communityId
            });
            for (let event of events) {
                const communityInfo = utilsManager_1.SocialUtilsManager.extractCommunityInfo(event);
                let community = {
                    ...communityInfo,
                    members: []
                };
                communities.push(community);
            }
        }
        catch (error) {
            console.error('fetchSubCommunities', error);
        }
        return communities;
    }
    async fetchCommunityDetailMetadata(creatorId, communityId) {
        const events = await this._socialEventManagerRead.fetchCommunityDetailMetadata({
            communityCreatorId: creatorId,
            communityName: communityId
        });
        const communityEvent = events.find(event => event.kind === 34550);
        if (!communityEvent)
            return null;
        const communityInfo = utilsManager_1.SocialUtilsManager.extractCommunityInfo(communityEvent);
        const statsEvent = events.find(event => event.kind === 10000105);
        let stats;
        if (statsEvent) {
            const content = utilsManager_1.SocialUtilsManager.parseContent(statsEvent.content);
            stats = {
                notesCount: content.note_count,
                membersCount: content.member_count,
                subcommunitiesCount: content.subcommunity_count
            };
        }
        if (communityInfo.membershipType === interfaces_1.MembershipType.Protected && !communityInfo.scpData?.encryptedKey) {
            const keyEvents = await this._socialEventManagerRead.fetchGroupKeys({
                identifiers: [communityInfo.communityUri + ':keys']
            });
            const keyEvent = keyEvents[0];
            if (keyEvent) {
                communityInfo.memberKeyMap = JSON.parse(keyEvent.content);
            }
        }
        let detailMetadata = {
            info: communityInfo,
            stats
        };
        return detailMetadata;
    }
    async updateNoteStatus(noteId, status) {
        const result = await this._socialEventManagerWrite.updateNoteStatus(noteId, status);
        return result;
    }
}
exports.SocialDataManager = SocialDataManager;
