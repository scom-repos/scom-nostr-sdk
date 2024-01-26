import 'mocha';
import * as assert from 'assert';
import { CalendarEventType, IUpdateCalendarEventInfo, Nip19, SocialDataManager, SocialUtilsManager } from '../src';
import crypto from 'crypto';

const API_URL = 'http://host.docker.internal:8300/api/social/v0';

suite('##Calendar Events', async function() {
    let calendarEvent1Identifier: string;
    let calendarEvent1Naddr: string;
    let calendarEvent1CreatorNsec = 'nsec1t49m2dty3nsddv6el5j4qqfcwjsg70h05cjflkdrv3me3j2nwaqqaq2x4s';
    const user1Nsec = 'nsec1ckk5p6d4yae3qum9s4863433slt7sx57es89863r2n68f9nxzccsqn6xd9';
    let userToBeDeletedEventsMap: Record<string, string[]> = {};
    this.timeout(20000);
    let manager: SocialDataManager;

    suiteSetup(async function() {  
        manager = new SocialDataManager(
            {
                relays: ['wss://relay.primal.net'], 
                cachedServer: 'wss://cache2.primal.net/v1',
                apiBaseUrl: API_URL
            }
        );
        const privateKey = Nip19.decode(user1Nsec).data as string;
        manager.privateKey = privateKey;
    })
    test('Retrieve calendar events by date range', async function() {
        const start = Math.floor(Date.now() / 1000);
        const end = start + 2592000; // 1 month from now
        const events = await manager.retrieveCalendarEventsByDateRange(
            start, 
            end
        );
        console.log('events', events);
    })

    test('Create calendar event', async function() {
        const privateKey = Nip19.decode(calendarEvent1CreatorNsec).data as string;
        const creatorPubkey = SocialUtilsManager.convertPrivateKeyToPubkey(privateKey);
        const start = Math.floor(Date.now() / 1000) + 2592000; // 1 month from now
        const end = start + 3600; // 1 hour after start
        calendarEvent1Identifier = crypto.randomUUID();
        let updateCalendarEventInfo: IUpdateCalendarEventInfo = {
            id: calendarEvent1Identifier,
            title: 'Test Event',
            description: 'This is a test event',
            start: start,
            end: end,
            startTzid: 'America/New_York',
            type: CalendarEventType.TimeBased,
            location: 'Washington DC',
            latitude: 38.8951,
            longitude: -77.0364,
            image: 'https://i.imgur.com/4M34hi2.jpg',
            hostIds: [creatorPubkey]
        }
        calendarEvent1Naddr = await manager.updateCalendarEvent(updateCalendarEventInfo);
        console.log('calendarEvent1Naddr', calendarEvent1Naddr);
        assert.strictEqual(calendarEvent1Naddr.startsWith('naddr1'), true);
    })

    test('Retrieve calendar event by naddr', async function() {
        const event = await manager.retrieveCalendarEvent(calendarEvent1Naddr);
        if (!event) {
            throw new Error('Event not found');
        }
        if (event.eventData?.id) {
            userToBeDeletedEventsMap[calendarEvent1CreatorNsec] = userToBeDeletedEventsMap[calendarEvent1CreatorNsec] || [];
            userToBeDeletedEventsMap[calendarEvent1CreatorNsec].push(event.eventData.id);
        }
        assert.strictEqual(event.attendees?.length, 0);
        assert.notStrictEqual(event.geohash, undefined);
    })

    test('User 1 accepts calendar event', async function() {
        const privateKey = Nip19.decode(user1Nsec).data as string;
        const rsvpId = crypto.randomUUID();
        await manager.acceptCalendarEvent(rsvpId, calendarEvent1Naddr);
        const event = await manager.retrieveCalendarEvent(calendarEvent1Naddr);
        if (!event) {
            throw new Error('Event not found');
        }
        assert.strictEqual(event.attendees?.length, 1);
    })

    test('User 1 declines calendar event', async function() {
        const privateKey = Nip19.decode(user1Nsec).data as string;
        const rsvpId = crypto.randomUUID();
        await manager.declineCalendarEvent(rsvpId, calendarEvent1Naddr);
        const event = await manager.retrieveCalendarEvent(calendarEvent1Naddr);
        if (!event) {
            throw new Error('Event not found');
        }
        if (event.eventData?.id) {
            userToBeDeletedEventsMap[user1Nsec] = userToBeDeletedEventsMap[user1Nsec] || [];
            userToBeDeletedEventsMap[user1Nsec].push(event.eventData.id);
        }
        assert.strictEqual(event.attendees?.length, 0);
    })

    suiteTeardown(async function() {
        for (let userNsec in userToBeDeletedEventsMap) {
            const privateKey = Nip19.decode(userNsec).data as string;
            await manager.socialEventManager.deleteEvents(
                userToBeDeletedEventsMap[userNsec], 
                privateKey
            );
        }
    });
});