import WebSocket from 'ws';
import {Event, Keys, Bech32, Nip19} from "../src";
import {Wallet,Web3,Utils} from "@ijstech/eth-wallet";

const SERVER = 'wss://nos.lol';
// const privateKey = "0x" + require('crypto').randomBytes(32).toString("hex");
const PRIV_KEY = "19210bff47d113bead377188bcc99d7909e337b21327ad22cee2a1d4dff8fc65"; // bigint / hex / Uint8Array
const PUB = "a0f69b74fd18fe84366b856f075594b15f81b1883244f73914d49aa5c5887aab";
const NPUB = "npub15rmfka8arrlggdnts4hsw4v5k90crvvgxfz0wwg56jd2t3vg024seznss4";
/*
write:
[
  'EVENT',
  {
    id: '02603424d3211dfa454d69d45520c68ceef1dfbb443821fa355b763406f9b069',
    kind: 1,
    pubkey: 'a0f69b74fd18fe84366b856f075594b15f81b1883244f73914d49aa5c5887aab',
    created_at: 1696995329,
    content: 'Hello, World!',
    tags: [],
    sig: '6a5f83fdb5f01d4cf5903fa9cd1b2f45c1019a17c1773bb419a887e579d740bf9b2beaa6a4c6506098400a955c8693fc69e221abba106a2d9746874254ef974d'
  }
]
["OK","02603424d3211dfa454d69d45520c68ceef1dfbb443821fa355b763406f9b069",true,""]
read:
["REQ","1",{"authors":["a0f69b74fd18fe84366b856f075594b15f81b1883244f73914d49aa5c5887aab"]}]
from server: ["EVENT","1",{"content":"Hello, World!","created_at":1696995329,"id":"02603424d3211dfa454d69d45520c68ceef1dfbb443821fa355b763406f9b069","kind":1,"pubkey":"a0f69b74fd18fe84366b856f075594b15f81b1883244f73914d49aa5c5887aab","sig":"6a5f83fdb5f01d4cf5903fa9cd1b2f45c1019a17c1773bb419a887e579d740bf9b2beaa6a4c6506098400a955c8693fc69e221abba106a2d9746874254ef974d","tags":[]}]
*/

async function genKey(){
    let key = Keys.generatePrivateKey();
    let pub = Keys.getPublicKey(key);
    let nsec = Nip19.nsecEncode(key);
    let npub = Nip19.npubEncode(pub);
    console.log('private-key:', key);
    console.log('public-key :', pub);
    console.log('nsec       :', nsec)
    console.log('npub       :', npub);

    let wallet = new Wallet(undefined,<any>{privateKey:key});
    console.log('eth-address:',wallet.address);

    let y = Keys.getPublicKeyY(key);
    console.log(String(Utils.soliditySha3("0x"+pub+y)).substring(26));
}
async function newConnection(server, cb:(message:string)=>void): Promise<WebSocket> { 
    return new Promise((resolve) => {
        const ws = new WebSocket(server);
        
        ws.on('open', () => {
            console.log('Connected to server');
            resolve(ws);
        });
        
        ws.on('message', (message: string) => {
            cb(message);
        });
        
        ws.on('close', () => {
            console.log('Disconnected from server');
        });

        ws.on('error', console.error);
    });
}
async function send(content:string) {  
    let ws = await newConnection(SERVER, (message:string)=>{
        console.log('from server:', message.toString());
    });
    let event: any = {
        "kind": 1,
        "created_at": Math.round(Date.now()/1000),
        "content": content,
        "tags": []
    };
    event = Event.finishEvent(event, PRIV_KEY)
    let msg = JSON.stringify(["EVENT", event]);
    console.log(msg);
    ws.send(msg);
}
async function read(pub:string) {  
    let ws = await newConnection(SERVER, (message:string)=>{
        console.log('from server:', message.toString());
        let event = JSON.parse(message.toString());
        if (event[0]=="EVENT") {
            event = event[2];
            console.log(Event.verifySignature(event)); // true
            console.log(event);
        } else if (event[0]=="EOSE") {
            console.log("end of stored events")
        }
    });
    let msg = JSON.stringify(["REQ", "1",
        {
            authors: [pub]
        }
    ]);
    console.log(msg);
    ws.send(msg);
}
// genKey();
// send("Hello, World!");
// read(PUB);
// read(Nip19.decode(NPUB).data);

