import Geohash from './geohash';

const rangeIndex: number[] = [
    0.6, //52
    1, //50
    2.19, //48
    4.57, //46
    9.34, //44
    14.4, //42
    33.18, //40
    62.1, //38
    128.55, //36
    252.9, //34
    510.02, //32
    1015.8, //30
    2236.5, //28
    3866.9, //26
    8749.7, //24
    15664, //22
    33163.5, //20
    72226.3, //18
    150350, //16
    306600, //14
    474640, //12
    1099600, //10
    2349600, //8
    4849600, //6
    10018863 //4
];

const queryByProximity = (lat: number, lon: number, radius: number): number[][] => {
    let radiusBitDepth: number = rangeDepth(radius);
    const bitDepth: number = 52;

    let ranges = getQueryRangesFromBitDepth(lat, lon, radiusBitDepth, bitDepth);
    return ranges;
};

const getQueryRangesFromBitDepth = (lat: number, lon: number, radiusBitDepth: number, bitDepth: number): number[][] => {
    bitDepth = bitDepth || 52;
    radiusBitDepth = radiusBitDepth || 48;

    let bitDiff: number = bitDepth - radiusBitDepth;
    if (bitDiff < 0) {
        throw new Error("bitDepth must be high enough to calculate range within radius");
    }

    let i: number;
    let ranges: number[][] = [], range: number[];

    let lowerRange: number = 0, upperRange: number = 0;

    let hash: number = Geohash.encode_int(lat, lon, radiusBitDepth);
    let neighbors: number[] = Geohash.neighbors_int(hash, radiusBitDepth);

    neighbors.push(hash);
    neighbors.sort();

    for (i = 0; i < neighbors.length; i++) {
        lowerRange = neighbors[i];
        upperRange = lowerRange + 1;
        while (neighbors[i + 1] === upperRange) {
            neighbors.shift();
            upperRange = neighbors[i] + 1;
        }
        ranges.push([lowerRange, upperRange]);
    }

    for (i = 0; i < ranges.length; i++) {
        range = ranges[i];
        range[0] = leftShift(range[0], bitDiff);
        range[1] = leftShift(range[1], bitDiff);
    }

    return ranges;
};

const leftShift = (integer: number, shft: number): number => {
    return integer * Math.pow(2, shft);
};

const rangeDepth = (radius: number): number => {
    for (let i = 0; i < rangeIndex.length - 1; i++) {
        if (radius - rangeIndex[i] < rangeIndex[i + 1] - radius) {
            return 52 - (i * 2);
        }
    }
    return 2;
};

const calculateGeoIndex = (lat: number, lon: number): number => {
    return Geohash.encode_int(lat, lon);
}

export default {
    queryByProximity,
    calculateGeoIndex
}
