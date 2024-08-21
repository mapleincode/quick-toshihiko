"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quickConfig = void 0;
const toshihiko_1 = require("toshihiko");
const chars = 'abcdefghijklmnopgrstuvwxyz'.split('');
const charMap = {};
const lowerCharMap = {};
for (const c of chars) {
    charMap[c.toUpperCase()] = c;
    lowerCharMap[c] = c;
}
function getLowerName(name = '') {
    let result = '';
    for (let i = 0; i < name.length; i++) {
        const c = name[i];
        const lastC = name[i - 1];
        const nextC = name[i + 1];
        if (charMap[c] && (lowerCharMap[lastC] ||
            ((charMap[lastC]) && lowerCharMap[nextC]))) {
            result += '_';
            result += charMap[c];
            continue;
        }
        result += c.toLowerCase();
    }
    return result;
}
const quickConfig = function (items = [], options) {
    const configs = [];
    const { setPrimaryKey = true } = options;
    let primaryKeySet = !setPrimaryKey;
    for (let item of items) {
        if (typeof item === 'string') {
            item = item.split(',').map(item => item.trim());
        }
        const config = {};
        // 设置 primary key
        if (!primaryKeySet) {
            config.primaryKey = true;
            config.allowNull = true;
            primaryKeySet = true;
        }
        // 全局 allowNull
        if (options.allowNull) {
            if (!config.primaryKey) {
                config.allowNull = true;
            }
        }
        const name = item.shift();
        if (typeof name === 'string') {
            const lowerName = getLowerName(name);
            if (lowerName !== name) {
                config.column = lowerName;
            }
            config.name = name;
        }
        else if (Array.isArray(name) && name.length) {
            config.name = name[0];
            config.column = name[1] || undefined;
        }
        if (item.length === 0) {
            configs.push(config);
            continue;
        }
        let type = item.shift();
        if (typeof type === 'string') {
            config.type = convertType(type);
        }
        if (item.length === 0) {
            configs.push(config);
            continue;
        }
        let allowNull = item.shift();
        let defaultValue;
        // 判定 Boolean 下 true 为默认值优先
        if (config.type === toshihiko_1.Type.Boolean && (typeof allowNull === 'boolean' ||
            allowNull === 'true' ||
            allowNull === 'false')) {
            allowNull = allowNull ? (allowNull !== 'false') : false;
            config.defaultValue = defaultValue = allowNull;
        }
        else if (typeof allowNull == 'string' || typeof allowNull === 'number' || typeof allowNull == 'boolean') {
            if (allowNull === '$t' || allowNull === 'true' || allowNull === true) {
                config.allowNull = allowNull = true;
            }
            else if (allowNull === '$f' || allowNull === 'false' || allowNull === false) {
                config.allowNull = allowNull = false;
            }
            else {
                config.defaultValue = defaultValue = allowNull;
            }
        }
        if (!defaultValue) {
            const newValue = item.shift();
            if (newValue && typeof newValue == 'string' || typeof newValue === 'boolean' && typeof newValue === 'number') {
                defaultValue = newValue;
            }
        }
        if (typeof defaultValue === 'object' && defaultValue !== null) {
            item.unshift(defaultValue);
        }
        else if (defaultValue !== undefined) {
            // 根据类型，对 defaultValue 做转换
            if (type === 'Integer' && typeof defaultValue === 'string') {
                defaultValue = parseInt(defaultValue);
            }
            else if (type === 'Float' && typeof defaultValue === 'string') {
                defaultValue = parseFloat(defaultValue);
            }
            else if (type === 'Boolean' && typeof defaultValue === 'string') {
                defaultValue = allowNull ? (allowNull !== 'false') : false;
            }
            config.defaultValue = defaultValue;
        }
        if (item.length === 0) {
            configs.push(config);
            continue;
        }
        const otherConfig = item.shift();
        if (typeof otherConfig === 'object') {
            Object.assign(config, otherConfig);
        }
        configs.push(config);
    }
    return configs;
};
exports.quickConfig = quickConfig;
function convertType(type) {
    if (type === 's')
        type = 'String';
    if (type === 'i')
        type = 'Integer';
    if (type === 'f')
        type = 'Float';
    if (type === 'd')
        type = 'Datetime';
    if (type === 'b')
        type = 'Boolean';
    if (type === 'j')
        type = 'Json';
    switch (type) {
        case "String":
            return toshihiko_1.Type.String;
        case "Boolean":
            return toshihiko_1.Type.Boolean;
        case "Json":
            return toshihiko_1.Type.Json;
        case "Float":
            return toshihiko_1.Type.Float;
        case "Datetime":
            return toshihiko_1.Type.Datetime;
        case "Integer":
            return toshihiko_1.Type.Integer;
        default:
            throw new Error(`Unsupported Field Type ${type}`);
    }
}
