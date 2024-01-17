"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const geohash_1 = __importDefault(require("./geohash"));
const rangeIndex = [
    0.6,
    1,
    2.19,
    4.57,
    9.34,
    14.4,
    33.18,
    62.1,
    128.55,
    252.9,
    510.02,
    1015.8,
    2236.5,
    3866.9,
    8749.7,
    15664,
    33163.5,
    72226.3,
    150350,
    306600,
    474640,
    1099600,
    2349600,
    4849600,
    10018863
];
const queryByProximity = (lat, lon, radius) => {
    let radiusBitDepth = rangeDepth(radius);
    const bitDepth = 52;
    let ranges = getQueryRangesFromBitDepth(lat, lon, radiusBitDepth, bitDepth);
    return ranges;
};
const getQueryRangesFromBitDepth = (lat, lon, radiusBitDepth, bitDepth) => {
    bitDepth = bitDepth || 52;
    radiusBitDepth = radiusBitDepth || 48;
    let bitDiff = bitDepth - radiusBitDepth;
    if (bitDiff < 0) {
        throw new Error("bitDepth must be high enough to calculate range within radius");
    }
    let i;
    let ranges = [], range;
    let lowerRange = 0, upperRange = 0;
    let hash = geohash_1.default.encode_int(lat, lon, radiusBitDepth);
    let neighbors = geohash_1.default.neighbors_int(hash, radiusBitDepth);
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
const leftShift = (integer, shft) => {
    return integer * Math.pow(2, shft);
};
const rangeDepth = (radius) => {
    for (let i = 0; i < rangeIndex.length - 1; i++) {
        if (radius - rangeIndex[i] < rangeIndex[i + 1] - radius) {
            return 52 - (i * 2);
        }
    }
    return 2;
};
const calculateGeoIndex = (lat, lon) => {
    return geohash_1.default.encode_int(lat, lon);
};
exports.default = {
    queryByProximity,
    calculateGeoIndex
};
