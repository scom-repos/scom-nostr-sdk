"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MqttManager = void 0;
function determineMqttType() {
    if (typeof window !== "undefined") {
        return mqtt;
    }
    else {
        let Mqtt = require('mqtt');
        return Mqtt;
    }
    ;
}
;
class MqttManager {
    constructor(config) {
        this.config = config;
        this.subscriptions = [];
        const mqtt = determineMqttType();
        this.client = mqtt.connect(config.brokerUrl);
        if (config.subscriptions) {
            this.subscribe(config.subscriptions);
        }
        this.client.on('connect', () => {
            if (config.connectCallback) {
                config.connectCallback();
            }
        });
        this.client.on('message', (topic, message) => {
            if (config.messageCallback) {
                config.messageCallback(topic, message.toString());
            }
        });
        this.client.on('error', (error) => {
            console.error(`MQTT Error: ${error}`);
            if (config.errorCallback) {
                config.errorCallback(error);
            }
        });
    }
    subscribe(topics) {
        if (topics?.length === 0) {
            return;
        }
        this.client.subscribe(topics, (error) => {
            if (error) {
                console.error(`Failed to subscribe to ${topics}: ${error}`);
            }
            else {
                this.subscriptions = this.subscriptions.concat(topics);
            }
        });
    }
    unsubscribe(topics) {
        if (topics?.length === 0) {
            return;
        }
        this.client.unsubscribe(topics, (error) => {
            if (error) {
                console.error(`Failed to unsubscribe from ${topics}: ${error}`);
            }
            else {
                this.subscriptions = this.subscriptions.filter((topic) => !topics.includes(topic));
            }
        });
    }
    publish(topic, message) {
        this.client.publish(topic, message, (error) => {
            if (error) {
                console.error(`Failed to publish to ${topic}: ${error}`);
            }
        });
    }
    disconnect() {
        this.client.end();
    }
}
exports.MqttManager = MqttManager;
