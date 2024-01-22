declare var mqtt: any;
// import mqtt, { MqttClient } from 'mqtt';
function determineMqttType() {
	if (typeof window !== "undefined"){
        return mqtt;
	}
	else{
        // @ts-ignore
        let Mqtt = require('mqtt');
        return Mqtt;
	};
};

interface IMqttManagerConfig {
    brokerUrl: string;
    subscriptions?: string[];
    connectCallback?: () => void;
    errorCallback?: (error: any) => void;
    messageCallback?: (topic: string, message: string) => void;
}

class MqttManager {
    private client: any;
    private subscriptions: string[] = [];

    constructor(private config: IMqttManagerConfig) {
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

        this.client.on('message', (topic: string, message: any) => {
            if (config.messageCallback) {
                config.messageCallback(topic, message.toString());
            }
        });

        this.client.on('error', (error: any) => {
            console.error(`MQTT Error: ${error}`);
            if (config.errorCallback) {
                config.errorCallback(error);
            }
        });
    }

    subscribe(topics: string[]): void {
        if (topics?.length === 0) {
            return;
        }
        this.client.subscribe(topics, (error) => {
            if (error) {
                console.error(`Failed to subscribe to ${topics}: ${error}`);
            } else {
                this.subscriptions = this.subscriptions.concat(topics);
            }
        });
    }

    unsubscribe(topics: string[]): void {
        if (topics?.length === 0) {
            return;
        }
        this.client.unsubscribe(topics, (error) => {
            if (error) {
                console.error(`Failed to unsubscribe from ${topics}: ${error}`);
            } else {
                this.subscriptions = this.subscriptions.filter((topic) => !topics.includes(topic));
            }
        });
    }

    publish(topic: string, message: string): void {
        this.client.publish(topic, message, (error) => {
            if (error) {
                console.error(`Failed to publish to ${topic}: ${error}`);
            }
        });
    }

    disconnect(): void {
        this.client.end();
    }
}

export {
    MqttManager
}