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
const mqtt_1 = require("../utils/mqtt");
const lightningWallet_1 = require("../utils/lightningWallet");
const utilsManager_1 = require("./utilsManager");
Object.defineProperty(exports, "SocialUtilsManager", { enumerable: true, get: function () { return utilsManager_1.SocialUtilsManager; } });
const eventManagerWrite_1 = require("./eventManagerWrite");
Object.defineProperty(exports, "NostrEventManagerWrite", { enumerable: true, get: function () { return eventManagerWrite_1.NostrEventManagerWrite; } });
const eventManagerRead_1 = require("./eventManagerRead");
Object.defineProperty(exports, "NostrEventManagerRead", { enumerable: true, get: function () { return eventManagerRead_1.NostrEventManagerRead; } });
const eventManagerReadV2_1 = require("./eventManagerReadV2");
Object.defineProperty(exports, "NostrEventManagerReadV2", { enumerable: true, get: function () { return eventManagerReadV2_1.NostrEventManagerReadV2; } });
function flatMap(array, callback) {
    return array.reduce((acc, item) => {
        return acc.concat(callback(item));
    }, []);
}
class SocialDataManager {
    constructor(config) {
        this._apiBaseUrl = config.apiBaseUrl;
        this._ipLocationServiceBaseUrl = config.ipLocationServiceBaseUrl;
        let nostrCommunicationManagers = [];
        this._publicIndexingRelay = config.publicIndexingRelay;
        this._writeRelays = config.writeRelays;
        for (let relay of config.writeRelays) {
            if (relay.startsWith('wss://')) {
                nostrCommunicationManagers.push(new communication_1.NostrWebSocketManager(relay));
            }
            else {
                nostrCommunicationManagers.push(new communication_1.NostrRestAPIManager(relay));
            }
        }
        let nostrReadRelayManager = new communication_1.NostrRestAPIManager(config.readRelay);
        if (config.version === 2) {
            this._socialEventManagerRead = new eventManagerReadV2_1.NostrEventManagerReadV2(nostrReadRelayManager);
        }
        else {
            this._socialEventManagerRead = new eventManagerRead_1.NostrEventManagerRead(nostrReadRelayManager);
        }
        this._socialEventManagerWrite = new eventManagerWrite_1.NostrEventManagerWrite(nostrCommunicationManagers, config.apiBaseUrl);
        if (config.mqttBrokerUrl) {
            this.mqttManager = new mqtt_1.MqttManager({
                brokerUrl: config.mqttBrokerUrl,
                subscriptions: config.mqttSubscriptions,
                messageCallback: config.mqttMessageCallback
            });
        }
        this.lightningWalletManager = new lightningWallet_1.LightningWalletManager();
    }
    set privateKey(privateKey) {
        this._privateKey = privateKey;
        this._socialEventManagerRead.privateKey = privateKey;
        this._socialEventManagerWrite.privateKey = privateKey;
        this.lightningWalletManager.privateKey = privateKey;
    }
    get socialEventManagerRead() {
        return this._socialEventManagerRead;
    }
    get socialEventManagerWrite() {
        return this._socialEventManagerWrite;
    }
    set relays(value) {
        this._setRelays(value);
    }
    _setRelays(relays) {
        this._writeRelays = relays;
        let nostrCommunicationManagers = [];
        for (let relay of relays) {
            if (relay.startsWith('wss://')) {
                nostrCommunicationManagers.push(new communication_1.NostrWebSocketManager(relay));
            }
            else {
                nostrCommunicationManagers.push(new communication_1.NostrRestAPIManager(relay));
            }
        }
        this._socialEventManagerWrite.nostrCommunicationManagers = nostrCommunicationManagers;
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
    async retrieveCommunityEvents(creatorId, communityId) {
        const feedEvents = await this._socialEventManagerRead.fetchCommunityFeed(creatorId, communityId);
        const notes = feedEvents.filter(event => event.kind === 1);
        const communityEvent = feedEvents.find(event => event.kind === 34550);
        if (!communityEvent)
            throw new Error('No info event found');
        const communityInfo = utilsManager_1.SocialUtilsManager.extractCommunityInfo(communityEvent);
        if (!communityInfo)
            throw new Error('No info event found');
        if (communityInfo.membershipType === interfaces_1.MembershipType.InviteOnly) {
            const keyEvent = await this._socialEventManagerRead.fetchGroupKeys(communityInfo.communityUri + ':keys');
            if (keyEvent) {
                communityInfo.memberKeyMap = JSON.parse(keyEvent.content);
            }
        }
        return {
            notes,
            info: communityInfo
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
        let communityPrivateKey;
        if (communityInfo.membershipType === interfaces_1.MembershipType.InviteOnly) {
            const creatorPubkey = communityInfo.eventData.pubkey;
            const pubkey = utilsManager_1.SocialUtilsManager.convertPrivateKeyToPubkey(selfPrivateKey);
            const encryptedKey = communityInfo.memberKeyMap?.[pubkey];
            if (encryptedKey) {
                communityPrivateKey = await utilsManager_1.SocialUtilsManager.decryptMessage(selfPrivateKey, creatorPubkey, encryptedKey);
            }
        }
        else if (communityInfo.membershipType === interfaces_1.MembershipType.NFTExclusive) {
            communityPrivateKey = await utilsManager_1.SocialUtilsManager.decryptMessage(selfPrivateKey, communityInfo.scpData.gatekeeperPublicKey, communityInfo.scpData.encryptedKey);
        }
        return communityPrivateKey;
    }
    async retrieveInviteOnlyCommunityNotePrivateKeys(creatorId, communityId) {
        let noteIdToPrivateKey = {};
        const communityEvents = await this.retrieveCommunityEvents(creatorId, communityId);
        const communityInfo = communityEvents.info;
        const notes = communityEvents.notes;
        let communityPrivateKey = await this.retrieveCommunityPrivateKey(communityInfo, this._privateKey);
        if (!communityPrivateKey)
            return noteIdToPrivateKey;
        for (const note of notes) {
            const postPrivateKey = await this.retrievePostPrivateKey(note, communityInfo.communityUri, communityPrivateKey);
            if (postPrivateKey) {
                noteIdToPrivateKey[note.id] = postPrivateKey;
            }
        }
        return noteIdToPrivateKey;
    }
    async retrieveCommunityPostKeys(options) {
        let noteIdToPrivateKey = {};
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
            const inviteOnlyNoteIdToPrivateKey = await this.retrieveInviteOnlyCommunityNotePrivateKeys(options.creatorId, options.communityId);
            noteIdToPrivateKey = {
                ...noteIdToPrivateKey,
                ...inviteOnlyNoteIdToPrivateKey
            };
        }
        return noteIdToPrivateKey;
    }
    async retrieveCommunityThreadPostKeys(options) {
        const communityInfo = options.communityInfo;
        let noteIdToPrivateKey = {};
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
            if (!communityPrivateKey)
                return noteIdToPrivateKey;
            for (const note of options.noteEvents) {
                const postPrivateKey = await this.retrievePostPrivateKey(note, communityInfo.communityUri, communityPrivateKey);
                if (postPrivateKey) {
                    noteIdToPrivateKey[note.id] = postPrivateKey;
                }
            }
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
            if (options.pubKey === communityInfo.creatorId) {
                let communityPrivateKey = await utilsManager_1.SocialUtilsManager.decryptMessage(this._privateKey, communityInfo.scpData.gatekeeperPublicKey, communityInfo.scpData.encryptedKey);
                if (communityPrivateKey) {
                    communityPrivateKeyMap[communityInfo.communityUri] = communityPrivateKey;
                }
            }
            communityInfoMap[communityInfo.communityUri] = communityInfo;
        }
        let gatekeeperNpubToNotesMap = {};
        let inviteOnlyCommunityNotesMap = {};
        for (let noteCommunityInfo of noteCommunityMappings.noteCommunityInfoList) {
            const communityPrivateKey = communityPrivateKeyMap[noteCommunityInfo.communityUri];
            if (communityPrivateKey) {
                const postPrivateKey = await this.retrievePostPrivateKey(noteCommunityInfo.eventData, noteCommunityInfo.communityUri, communityPrivateKey);
                if (postPrivateKey) {
                    noteIdToPrivateKey[noteCommunityInfo.eventData.id] = postPrivateKey;
                }
            }
            else {
                const communityInfo = communityInfoMap[noteCommunityInfo.communityUri];
                if (!communityInfo)
                    continue;
                if (communityInfo.membershipType === interfaces_1.MembershipType.InviteOnly) {
                    inviteOnlyCommunityNotesMap[communityInfo.communityUri] = inviteOnlyCommunityNotesMap[communityInfo.communityUri] || [];
                    inviteOnlyCommunityNotesMap[communityInfo.communityUri].push(noteCommunityInfo);
                }
                else if (communityInfo.gatekeeperNpub) {
                    gatekeeperNpubToNotesMap[communityInfo.gatekeeperNpub] = gatekeeperNpubToNotesMap[communityInfo.gatekeeperNpub] || [];
                    gatekeeperNpubToNotesMap[communityInfo.gatekeeperNpub].push(noteCommunityInfo);
                }
            }
        }
        if (Object.keys(gatekeeperNpubToNotesMap).length > 0) {
            for (let gatekeeperNpub in gatekeeperNpubToNotesMap) {
                const gatekeeperUrl = options.gatekeepers.find(v => v.npub === gatekeeperNpub)?.url;
                if (gatekeeperUrl) {
                    const noteIds = gatekeeperNpubToNotesMap[gatekeeperNpub].map(v => v.eventData.id);
                    const signature = await options.getSignature(options.pubKey);
                    let bodyData = {
                        noteIds: noteIds.join(','),
                        message: options.pubKey,
                        signature: signature
                    };
                    let url = `${gatekeeperUrl}/api/communities/v0/post-keys`;
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
        }
        for (let communityUri in inviteOnlyCommunityNotesMap) {
            for (let noteCommunityInfo of inviteOnlyCommunityNotesMap[communityUri]) {
                const inviteOnlyNoteIdToPrivateKey = await this.retrieveInviteOnlyCommunityNotePrivateKeys(noteCommunityInfo.creatorId, noteCommunityInfo.communityId);
                noteIdToPrivateKey = {
                    ...noteIdToPrivateKey,
                    ...inviteOnlyNoteIdToPrivateKey
                };
            }
        }
        return noteIdToPrivateKey;
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
        const metadata = await this._socialEventManagerRead.fetchUserProfileCacheEvents([...npubs, ...uniqueKeys]);
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
        const fetchFromCache = true;
        let metadataArr = [];
        let followersCountMap = {};
        const fetchData = async () => {
            if (fetchFromCache) {
                const events = await this._socialEventManagerRead.fetchUserProfileCacheEvents(pubKeys);
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
        };
        try {
            await fetchData();
        }
        catch (error) {
            console.error('fetchUserProfiles', error);
        }
        if (metadataArr.length == 0)
            return null;
        const userProfiles = [];
        for (let metadata of metadataArr) {
            let userProfile = this.constructUserProfile(metadata, followersCountMap);
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
        const events = await this._socialEventManagerRead.fetchTrendingCacheEvents();
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
        const events = await this._socialEventManagerRead.fetchProfileFeedCacheEvents(pubKey, since, until);
        const earliest = this.getEarliestEventTimestamp(events.filter(v => v.created_at));
        const { notes, metadataByPubKeyMap, quotedNotesMap, noteToRepostIdMap } = this.createNoteEventMappings(events);
        for (let note of notes) {
            if (note.eventData.tags?.length) {
                const communityUri = note.eventData.tags.find(tag => tag[0] === 'a')?.[1];
                if (communityUri) {
                    const { creatorId, communityId } = utilsManager_1.SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                    note.community = {
                        communityUri,
                        communityId,
                        creatorId: index_1.Nip19.npubEncode(creatorId)
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
        const events = await this._socialEventManagerRead.fetchProfileRepliesCacheEvents(pubKey, since, until);
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
    getEarliestEventTimestamp(events) {
        if (!events || events.length === 0) {
            return 0;
        }
        return events.reduce((createdAt, event) => {
            return Math.min(createdAt, event.created_at);
        }, events[0].created_at);
    }
    async fetchHomeFeedInfo(pubKey, since = 0, until) {
        let events = await this._socialEventManagerRead.fetchHomeFeedCacheEvents(pubKey, since, until);
        const earliest = this.getEarliestEventTimestamp(events.filter(v => v.created_at));
        const { notes, metadataByPubKeyMap, quotedNotesMap } = this.createNoteEventMappings(events);
        return {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            earliest
        };
    }
    async fetchUserFollowingFeedInfo(pubKey, until) {
        let events = await this._socialEventManagerRead.fetchUserFollowingFeed(pubKey, until);
        const earliest = this.getEarliestEventTimestamp(events.filter(v => (v.kind === 1 || v.kind === 6) && v.created_at));
        const { notes, metadataByPubKeyMap, quotedNotesMap } = this.createNoteEventMappings(events);
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
        for (let event of events) {
            if (event.kind === 0) {
                metadataByPubKeyMap[event.pubkey] = {
                    ...event,
                    content: utilsManager_1.SocialUtilsManager.parseContent(event.content)
                };
            }
            else if (event.kind === 10000107) {
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
                const content = utilsManager_1.SocialUtilsManager.parseContent(event.content);
                noteStatsMap[content.event_id] = {
                    upvotes: content.likes,
                    replies: content.replies,
                    reposts: content.reposts
                };
            }
            else if (event.kind === 10000113) {
                const timeInfo = utilsManager_1.SocialUtilsManager.parseContent(event.content);
            }
        }
        for (let note of notes) {
            const noteId = note.eventData?.id;
            note.stats = noteStatsMap[noteId];
        }
        return {
            notes,
            metadataByPubKeyMap,
            quotedNotesMap,
            noteToParentAuthorIdMap,
            noteStatsMap,
            noteToRepostIdMap
        };
    }
    async fetchCommunityInfo(creatorId, communityId) {
        const communityEvents = await this._socialEventManagerRead.fetchCommunity(creatorId, communityId);
        const communityEvent = communityEvents.find(event => event.kind === 34550);
        if (!communityEvent)
            return null;
        let communityInfo = utilsManager_1.SocialUtilsManager.extractCommunityInfo(communityEvent);
        if (communityInfo.membershipType === interfaces_1.MembershipType.InviteOnly) {
            const keyEvent = await this._socialEventManagerRead.fetchGroupKeys(communityInfo.communityUri + ':keys');
            if (keyEvent) {
                communityInfo.memberKeyMap = JSON.parse(keyEvent.content);
            }
        }
        return communityInfo;
    }
    async fetchThreadNotesInfo(focusedNoteId) {
        let focusedNote;
        let ancestorNotes = [];
        let replies = [];
        let childReplyEventTagIds = [];
        let decodedFocusedNoteId = focusedNoteId.startsWith('note1') ? index_1.Nip19.decode(focusedNoteId).data : focusedNoteId;
        const threadEvents = await this._socialEventManagerRead.fetchThreadCacheEvents(decodedFocusedNoteId);
        const { notes, metadataByPubKeyMap, quotedNotesMap } = this.createNoteEventMappings(threadEvents);
        for (let note of notes) {
            if (note.eventData.tags?.length) {
                const communityUri = note.eventData.tags.find(tag => tag[0] === 'a')?.[1];
                if (communityUri) {
                    const { creatorId, communityId } = utilsManager_1.SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                    note.community = {
                        communityUri,
                        communityId,
                        creatorId: index_1.Nip19.npubEncode(creatorId)
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
                        creatorId
                    });
                }
            }
        }
        if (noteCommunityInfoList.length > 0) {
            const communityEvents = await this._socialEventManagerRead.fetchCommunities(pubkeyToCommunityIdsMap);
            for (let event of communityEvents) {
                let communityInfo = utilsManager_1.SocialUtilsManager.extractCommunityInfo(event);
                communityInfoList.push(communityInfo);
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
        const userContactEvents = await this._socialEventManagerRead.fetchUserProfileDetailCacheEvents(pubKey);
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
        let userProfile = this.constructUserProfile(metadata);
        return {
            userProfile,
            stats
        };
    }
    constructUserProfile(metadata, followersCountMap) {
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
            metadata,
        };
        return userProfile;
    }
    async fetchUserContactList(pubKey) {
        let metadataArr = [];
        let followersCountMap = {};
        const userContactEvents = await this._socialEventManagerRead.fetchContactListCacheEvents(pubKey, true);
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
            let userProfile = this.constructUserProfile(metadata, followersCountMap);
            userProfiles.push(userProfile);
        }
        return userProfiles;
    }
    async fetchUserFollowersList(pubKey) {
        let metadataArr = [];
        let followersCountMap = {};
        const userFollowersEvents = await this._socialEventManagerRead.fetchFollowersCacheEvents(pubKey);
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
            let userProfile = this.constructUserProfile(metadata, followersCountMap);
            userProfiles.push(userProfile);
        }
        return userProfiles;
    }
    async fetchUserRelayList(pubKey) {
        let relayList = [];
        const relaysEvents = await this._socialEventManagerRead.fetchUserRelays(pubKey);
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
        const contactListEvents = await this._socialEventManagerRead.fetchContactListCacheEvents(selfPubkey, false);
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
        const contactListEvents = await this._socialEventManagerRead.fetchContactListCacheEvents(selfPubkey, false);
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
            gatekeeperNpub: newInfo.gatekeeperNpub,
            scpData: newInfo.scpData,
            membershipType: newInfo.membershipType,
            memberIds: newInfo.memberIds
        };
        if (communityInfo.membershipType === interfaces_1.MembershipType.NFTExclusive) {
            const gatekeeperPublicKey = index_1.Nip19.decode(communityInfo.gatekeeperNpub).data;
            const communityKeys = await this.generateGroupKeys(this._privateKey, [gatekeeperPublicKey]);
            const encryptedKey = communityKeys.encryptedGroupKeys[gatekeeperPublicKey];
            communityInfo.scpData = {
                ...communityInfo.scpData,
                publicKey: communityKeys.groupPublicKey,
                encryptedKey: encryptedKey,
                gatekeeperPublicKey
            };
        }
        else if (communityInfo.membershipType === interfaces_1.MembershipType.InviteOnly) {
            let encryptionPublicKeys = [];
            for (let memberId of communityInfo.memberIds) {
                const memberPublicKey = index_1.Nip19.decode(memberId).data;
                encryptionPublicKeys.push(memberPublicKey);
            }
            const communityKeys = await this.generateGroupKeys(this._privateKey, encryptionPublicKeys);
            await this._socialEventManagerWrite.updateGroupKeys(communityUri + ':keys', 34550, JSON.stringify(communityKeys.encryptedGroupKeys), communityInfo.memberIds);
            communityInfo.scpData = {
                ...communityInfo.scpData,
                publicKey: communityKeys.groupPublicKey
            };
        }
        if (communityInfo.scpData) {
            const updateChannelResponses = await this.updateCommunityChannel(communityInfo);
            const updateChannelResponse = updateChannelResponses.find(v => v.success && !!v.eventId);
            if (updateChannelResponse?.eventId) {
                communityInfo.scpData.channelEventId = updateChannelResponse.eventId;
            }
        }
        await this._socialEventManagerWrite.updateCommunity(communityInfo);
        return communityInfo;
    }
    async updateCommunity(info) {
        if (info.membershipType === interfaces_1.MembershipType.NFTExclusive) {
            const gatekeeperPublicKey = index_1.Nip19.decode(info.gatekeeperNpub).data;
            info.scpData.gatekeeperPublicKey = gatekeeperPublicKey;
        }
        else if (info.membershipType === interfaces_1.MembershipType.InviteOnly) {
            let encryptionPublicKeys = [];
            for (let memberId of info.memberIds) {
                const memberPublicKey = index_1.Nip19.decode(memberId).data;
                encryptionPublicKeys.push(memberPublicKey);
            }
            const groupPrivateKey = await this.retrieveCommunityPrivateKey(info, this._privateKey);
            let encryptedGroupKeys = {};
            for (let encryptionPublicKey of encryptionPublicKeys) {
                const encryptedGroupKey = await utilsManager_1.SocialUtilsManager.encryptMessage(this._privateKey, encryptionPublicKey, groupPrivateKey);
                encryptedGroupKeys[encryptionPublicKey] = encryptedGroupKey;
            }
            const response = await this._socialEventManagerWrite.updateGroupKeys(info.communityUri + ':keys', 34550, JSON.stringify(encryptedGroupKeys), info.memberIds);
            console.log('updateCommunity', response);
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
        const updateChannelResponses = await this._socialEventManagerWrite.updateChannel(channelInfo);
        const updateChannelResponse = updateChannelResponses.find(v => v.success && !!v.eventId);
        if (updateChannelResponse?.eventId) {
            const channelUri = `40:${updateChannelResponse.eventId}`;
            await this._socialEventManagerWrite.updateGroupKeys(channelUri + ':keys', 40, JSON.stringify(channelKeys.encryptedGroupKeys), memberIds);
        }
        return channelInfo;
    }
    async updateChannel(channelInfo) {
        const updateChannelResponses = await this._socialEventManagerWrite.updateChannel(channelInfo);
        return updateChannelResponses;
    }
    async fetchCommunitiesMembers(communities) {
        const communityUriToMemberIdRoleComboMap = await this.mapCommunityUriToMemberIdRoleCombo(communities);
        let pubkeys = new Set(flatMap(Object.values(communityUriToMemberIdRoleComboMap), combo => combo.map(c => c.id)));
        const communityUriToMembersMap = {};
        if (pubkeys.size > 0) {
            const userProfiles = await this.fetchUserProfiles(Array.from(pubkeys));
            if (!userProfiles)
                return communityUriToMembersMap;
            for (let community of communities) {
                const memberIds = communityUriToMemberIdRoleComboMap[community.communityUri];
                if (!memberIds)
                    continue;
                const communityMembers = [];
                for (let memberIdRoleCombo of memberIds) {
                    const userProfile = userProfiles.find(profile => profile.npub === memberIdRoleCombo.id);
                    if (!userProfile)
                        continue;
                    let communityMember = {
                        id: userProfile.npub,
                        name: userProfile.displayName,
                        profileImageUrl: userProfile.avatar,
                        username: userProfile.username,
                        internetIdentifier: userProfile.internetIdentifier,
                        role: memberIdRoleCombo.role
                    };
                    communityMembers.push(communityMember);
                }
                communityUriToMembersMap[community.communityUri] = communityMembers;
            }
        }
        return communityUriToMembersMap;
    }
    async fetchCommunities() {
        let communities = [];
        const events = await this._socialEventManagerRead.fetchCommunities();
        for (let event of events) {
            const communityInfo = utilsManager_1.SocialUtilsManager.extractCommunityInfo(event);
            let community = {
                ...communityInfo,
                members: []
            };
            communities.push(community);
        }
        const communityUriToMembersMap = await this.fetchCommunitiesMembers(communities);
        for (let community of communities) {
            community.members = communityUriToMembersMap[community.communityUri];
        }
        return communities;
    }
    async fetchMyCommunities(pubKey) {
        let communities = [];
        const events = await this._socialEventManagerRead.fetchAllUserRelatedCommunities(pubKey);
        for (let event of events) {
            if (event.kind === 34550) {
                const communityInfo = utilsManager_1.SocialUtilsManager.extractCommunityInfo(event);
                communities.push(communityInfo);
            }
        }
        return communities;
    }
    async joinCommunity(community, pubKey) {
        const communities = await this._socialEventManagerRead.fetchUserBookmarkedCommunities(pubKey);
        communities.push(community);
        await this._socialEventManagerWrite.updateUserBookmarkedCommunities(communities);
        if (community.scpData?.channelEventId) {
            const channelEventIds = await this._socialEventManagerRead.fetchUserBookmarkedChannelEventIds(pubKey);
            channelEventIds.push(community.scpData.channelEventId);
            await this._socialEventManagerWrite.updateUserBookmarkedChannels(channelEventIds);
        }
    }
    async leaveCommunity(community, pubKey) {
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
    async submitCommunityPost(message, info, conversationPath) {
        const messageContent = {
            communityUri: info.communityUri,
            message,
        };
        let newCommunityPostInfo;
        if (info.membershipType === interfaces_1.MembershipType.Open) {
            newCommunityPostInfo = {
                community: info,
                message,
                conversationPath
            };
        }
        else {
            const { encryptedMessage, encryptedGroupKey } = await this.encryptGroupMessage(this._privateKey, info.scpData.publicKey, JSON.stringify(messageContent));
            newCommunityPostInfo = {
                community: info,
                message: encryptedMessage,
                conversationPath,
                scpData: {
                    encryptedKey: encryptedGroupKey,
                    communityUri: info.communityUri
                }
            };
        }
        await this._socialEventManagerWrite.submitCommunityPost(newCommunityPostInfo);
    }
    async fetchAllUserRelatedChannels(pubKey) {
        const { channels, channelMetadataMap, channelIdToCommunityMap } = await this._socialEventManagerRead.fetchAllUserRelatedChannels(pubKey);
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
        const events = await this._socialEventManagerRead.fetchChannelMessages(channelId, since, until);
        const messageEvents = events.filter(event => event.kind === 42);
        return messageEvents;
    }
    async retrieveChannelEvents(creatorId, channelId) {
        const channelEvents = await this._socialEventManagerRead.fetchChannelInfoMessages(channelId);
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
                const { communityId } = utilsManager_1.SocialUtilsManager.getCommunityBasicInfoFromUri(channelInfo.scpData.communityUri);
                const communityInfo = await this.fetchCommunityInfo(channelInfo.eventData.pubkey, communityId);
                groupPrivateKey = await this.retrieveCommunityPrivateKey(communityInfo, options.privateKey);
                if (!groupPrivateKey)
                    return messageIdToPrivateKey;
            }
            else {
                const groupUri = `40:${channelInfo.id}`;
                const keyEvent = await this._socialEventManagerRead.fetchGroupKeys(groupUri + ':keys');
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
        const events = await this._socialEventManagerRead.fetchDirectMessages(selfPubKey, decodedSenderPubKey, since, until);
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
    async sendDirectMessage(chatId, message) {
        const decodedReceiverPubKey = index_1.Nip19.decode(chatId).data;
        const content = await utilsManager_1.SocialUtilsManager.encryptMessage(this._privateKey, decodedReceiverPubKey, message);
        await this._socialEventManagerWrite.sendMessage(decodedReceiverPubKey, content);
    }
    async resetMessageCount(selfPubKey, senderPubKey) {
        await this._socialEventManagerRead.resetMessageCount(selfPubKey, senderPubKey);
    }
    async fetchMessageContacts(pubKey) {
        const events = await this._socialEventManagerRead.fetchMessageContactsCacheEvents(pubKey);
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
        const events = await this._socialEventManagerRead.fetchUserGroupInvitations([40, 34550], pubKey);
        for (let event of events) {
            const identifier = event.tags.find(tag => tag[0] === 'd')?.[1];
            if (identifier) {
                identifiers.push(identifier);
            }
        }
        return identifiers;
    }
    async mapCommunityUriToMemberIdRoleCombo(communities) {
        const communityUriToMemberIdRoleComboMap = {};
        const communityUriToCreatorOrModeratorIdsMap = {};
        for (let community of communities) {
            const communityUri = community.communityUri;
            communityUriToMemberIdRoleComboMap[communityUri] = [];
            communityUriToMemberIdRoleComboMap[communityUri].push({
                id: community.creatorId,
                role: interfaces_1.CommunityRole.Creator
            });
            communityUriToCreatorOrModeratorIdsMap[communityUri] = new Set();
            communityUriToCreatorOrModeratorIdsMap[communityUri].add(community.creatorId);
            if (community.moderatorIds) {
                if (community.moderatorIds.includes(community.creatorId))
                    continue;
                for (let moderator of community.moderatorIds) {
                    communityUriToMemberIdRoleComboMap[communityUri].push({
                        id: moderator,
                        role: interfaces_1.CommunityRole.Moderator
                    });
                    communityUriToCreatorOrModeratorIdsMap[communityUri].add(moderator);
                }
            }
        }
        const generalMembersEvents = await this._socialEventManagerRead.fetchCommunitiesGeneralMembers(communities);
        for (let event of generalMembersEvents) {
            const communityUriArr = event.tags.filter(tag => tag[0] === 'a')?.map(tag => tag[1]) || [];
            for (let communityUri of communityUriArr) {
                if (!communityUriToMemberIdRoleComboMap[communityUri])
                    continue;
                const pubkey = index_1.Nip19.npubEncode(event.pubkey);
                if (communityUriToCreatorOrModeratorIdsMap[communityUri].has(pubkey))
                    continue;
                communityUriToMemberIdRoleComboMap[communityUri].push({
                    id: pubkey,
                    role: interfaces_1.CommunityRole.GeneralMember
                });
            }
        }
        return communityUriToMemberIdRoleComboMap;
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
    async retrieveCalendarEventsByDateRange(start, end, limit) {
        const events = await this._socialEventManagerRead.fetchCalendarEvents(start, end, limit);
        let calendarEventInfoList = [];
        for (let event of events) {
            let calendarEventInfo = this.extractCalendarEventInfo(event);
            calendarEventInfoList.push(calendarEventInfo);
        }
        return calendarEventInfoList;
    }
    async retrieveCalendarEvent(naddr) {
        let address = index_1.Nip19.decode(naddr).data;
        const calendarEvent = await this._socialEventManagerRead.fetchCalendarEvent(address);
        if (!calendarEvent)
            return null;
        let calendarEventInfo = this.extractCalendarEventInfo(calendarEvent);
        let hostPubkeys = calendarEvent.tags.filter(tag => tag[0] === 'p' && tag[3] === 'host')?.map(tag => tag[1]) || [];
        const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
        let hosts = [];
        let attendees = [];
        let attendeePubkeys = [];
        let attendeePubkeyToEventMap = {};
        const postEvents = await this._socialEventManagerRead.fetchCalendarEventPosts(calendarEventUri);
        const notes = [];
        for (let postEvent of postEvents) {
            const note = {
                eventData: postEvent
            };
            notes.push(note);
        }
        const rsvpEvents = await this._socialEventManagerRead.fetchCalendarEventRSVPs(calendarEventUri);
        for (let rsvpEvent of rsvpEvents) {
            if (attendeePubkeyToEventMap[rsvpEvent.pubkey])
                continue;
            let attendanceStatus = rsvpEvent.tags.find(tag => tag[0] === 'l' && tag[2] === 'status')?.[1];
            if (attendanceStatus === 'accepted') {
                attendeePubkeyToEventMap[rsvpEvent.pubkey] = rsvpEvent;
                attendeePubkeys.push(rsvpEvent.pubkey);
            }
        }
        const userProfileEvents = await this._socialEventManagerRead.fetchUserProfileCacheEvents([
            ...hostPubkeys,
            ...attendeePubkeys
        ]);
        for (let event of userProfileEvents) {
            if (event.kind === 0) {
                let metaData = {
                    ...event,
                    content: utilsManager_1.SocialUtilsManager.parseContent(event.content)
                };
                let userProfile = this.constructUserProfile(metaData);
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
        const rsvpEvents = await this._socialEventManagerRead.fetchCalendarEventRSVPs(calendarEventUri, pubkey);
        if (rsvpEvents.length > 0) {
            rsvpId = rsvpEvents[0].tags.find(tag => tag[0] === 'd')?.[1];
        }
        await this._socialEventManagerWrite.createCalendarEventRSVP(rsvpId, calendarEventUri, true);
    }
    async declineCalendarEvent(rsvpId, naddr) {
        let address = index_1.Nip19.decode(naddr).data;
        const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
        const pubkey = utilsManager_1.SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const rsvpEvents = await this._socialEventManagerRead.fetchCalendarEventRSVPs(calendarEventUri, pubkey);
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
    async submitMessage(message, conversationPath) {
        await this._socialEventManagerWrite.postNote(message, conversationPath);
    }
    async submitLongFormContent(info) {
        await this._socialEventManagerWrite.submitLongFormContentEvents(info);
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
    async sendPingRequest(pubkey, relayUrl) {
        relayUrl = relayUrl || this._publicIndexingRelay;
        if (!relayUrl)
            return null;
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
    async fetchUnreadMessageCounts(pubkey) {
        if (!this._publicIndexingRelay)
            return null;
        let url = this._publicIndexingRelay + '/unread-message-counts?pubkey=' + pubkey;
        const response = await fetch(url);
        const result = await response.json();
        return result;
    }
    async updateMessageLastReadReceipt(pubkey, walletAddress, signature, fromId) {
        if (!this._publicIndexingRelay)
            return null;
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
    async searchUsers(query) {
        const events = await this._socialEventManagerRead.searchUsers(query);
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
            let userProfile = this.constructUserProfile(metadata, followersCountMap);
            userProfiles.push(userProfile);
        }
        return userProfiles;
    }
    async addRelay(url) {
        const selfPubkey = utilsManager_1.SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
        const relaysEvents = await this._socialEventManagerRead.fetchUserRelays(selfPubkey);
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
        const relaysEvents = await this._socialEventManagerRead.fetchUserRelays(selfPubkey);
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
        const relaysEvents = await this._socialEventManagerRead.fetchUserRelays(selfPubkey);
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
        await this._socialEventManagerWrite.createPaymentRequestEvent(paymentRequest, amount, comment);
        return paymentRequest;
    }
    async sendPayment(paymentRequest, comment) {
        const preimage = await this.lightningWalletManager.sendPayment(paymentRequest);
        const requestEvent = await this._socialEventManagerRead.fetchPaymentRequestEvent(paymentRequest);
        if (requestEvent) {
            await this._socialEventManagerWrite.createPaymentReceiptEvent(requestEvent.id, requestEvent.pubkey, preimage, comment);
        }
        return preimage;
    }
    async zap(pubkey, lud16, amount, noteId) {
        const response = await this.lightningWalletManager.zap(pubkey, lud16, Number(amount), '', this._writeRelays, noteId);
        return response;
    }
    async fetchUserPaymentActivities(pubkey, since, until) {
        const paymentActivitiesForSender = await this._socialEventManagerRead.fetchPaymentActivitiesForSender(pubkey, since, until);
        const paymentActivitiesForRecipient = await this._socialEventManagerRead.fetchPaymentActivitiesForRecipient(pubkey, since, until);
        const paymentActivities = [...paymentActivitiesForSender, ...paymentActivitiesForRecipient];
        return paymentActivities.sort((a, b) => b.createdAt - a.createdAt);
    }
    async getLightningBalance() {
        const response = await this.lightningWalletManager.getBalance();
        return response;
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
        const url = `${this._apiBaseUrl}/app?id=${id}&pubkey=${pubkey}`;
        const response = await fetch(url);
        const result = await response.json();
        return result.data.app;
    }
    async fetchInstalledApps(pubkey) {
        const url = `${this._apiBaseUrl}/installed-apps?pubkey=${pubkey}`;
        const response = await fetch(url);
        const result = await response.json();
        return result.data.installedApps;
    }
    async installApp(pubkey, appId, appVersionId) {
        const url = `${this._apiBaseUrl}/install-app`;
        const installedApps = await this.fetchInstalledApps(pubkey);
        let newInstalledApps = {};
        if (installedApps)
            newInstalledApps = { ...installedApps };
        newInstalledApps[appId] = appVersionId;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pubkey,
                installedAppList: JSON.stringify(newInstalledApps)
            })
        });
        const result = await response.json();
        return result;
    }
}
exports.SocialDataManager = SocialDataManager;
