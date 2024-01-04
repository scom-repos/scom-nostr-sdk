declare const Geohash: {
    ENCODE_AUTO: string;
    encode: (latitude: number | string, longitude: number | string, numberOfChars?: number | 'auto') => string;
    encode_uint64: (latitude: number, longitude: number, bitDepth: number) => number;
    encode_int: (latitude: number, longitude: number, bitDepth: number) => number;
    decode: (hashString: string) => {
        latitude: number;
        longitude: number;
        error: {
            latitude: number;
            longitude: number;
        };
    };
    decode_int: (hashInt: number, bitDepth?: number) => {
        latitude: number;
        longitude: number;
        error: {
            latitude: number;
            longitude: number;
        };
    };
    decode_uint64: (hashInt: number, bitDepth?: number) => {
        latitude: number;
        longitude: number;
        error: {
            latitude: number;
            longitude: number;
        };
    };
    decode_bbox: (hashString: string) => number[];
    decode_bbox_uint64: (hashInt: number, bitDepth?: number) => number[];
    decode_bbox_int: (hashInt: number, bitDepth?: number) => number[];
    neighbor: (hashString: string, direction: [number, number]) => string;
    neighbor_int: (hashInt: number, direction: [number, number], bitDepth?: number) => number;
    neighbors: (hashString: string) => string[];
    neighbors_int: (hashInt: number, bitDepth?: number) => number[];
    bboxes: (minLat: number, minLon: number, maxLat: number, maxLon: number, numberOfChars: number) => string[];
    bboxes_int: (minLat: number, minLon: number, maxLat: number, maxLon: number, bitDepth: number) => any[];
};
export default Geohash;
