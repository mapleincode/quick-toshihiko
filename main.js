"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TYPE = void 0;
const toshihiko_1 = require("toshihiko");
const QuickDB_1 = require("./QuickDB");
const path_1 = require("path");
const fs = __importStar(require("fs"));
const MODEL_MAP = {};
let DB_MAP = {};
function initQuickModel(db, dbConfigFilePath, initOptions) {
    const tableConfigs = [];
    const dirs = fs.readdirSync(dbConfigFilePath);
    // fetch table configs
    for (const file of dirs) {
        // 判断是否隐藏文件
        if (file.startsWith(".")) {
            continue;
        }
        const fileFullPath = (0, path_1.join)(dbConfigFilePath, file);
        const fileState = fs.statSync(fileFullPath);
        // 判断是否为文件
        if (fileState && fileState.isFile()) {
            // 处理 js 文件
            if (file.endsWith(".js")) {
                const config = require((0, path_1.join)(dbConfigFilePath, file));
                tableConfigs.push(config);
                continue;
            }
            else {
                continue;
            }
        }
        const subRoot = (0, path_1.join)(dbConfigFilePath, file);
        const subDirs = fs.readdirSync(subRoot);
        for (const file of subDirs) {
            if (file.startsWith(".")) {
                continue;
            }
            if (file.indexOf(".js") > -1) {
                const config = require((0, path_1.join)(subRoot, file));
                tableConfigs.push(config);
            }
        }
    }
    // init model
    for (const config of tableConfigs) {
        db.defineByModelFile(config);
    }
}
function getDB(tableName) {
    return DB_MAP[tableName] || null;
}
exports.TYPE = toshihiko_1.Type;
// @ts-ignore
function initDBs(dbConfigs, modelRoot = "", initOptions = {}) {
    modelRoot = modelRoot || (0, path_1.join)(process.execPath, "models");
    if (!Array.isArray(dbConfigs)) {
        dbConfigs = [dbConfigs];
    }
    const databaseMap = (0, QuickDB_1.buildQuickDBMap)(dbConfigs, initOptions);
    if (modelRoot && modelRoot.trim() !== "") {
        const databaseDirs = fs.readdirSync(modelRoot);
        for (const databaseName of databaseDirs) {
            if (databaseName.startsWith(".")) {
                // 过滤隐藏文件
                continue;
            }
            const dbConfigFilePath = (0, path_1.join)(modelRoot, databaseName);
            const state = fs.statSync(dbConfigFilePath);
            if (!state.isDirectory()) {
                continue;
            }
            const database = databaseMap[databaseName];
            if (!database) {
                throw new Error(`init model error.db: ${databaseName} not found`);
            }
            // init model
            initQuickModel(database, dbConfigFilePath, initOptions);
        }
    }
    // 挂载 DB_MAP
    DB_MAP = databaseMap;
    // 挂载 MODEL_MAP
    for (const key of Object.keys(databaseMap)) {
        const db = databaseMap[key];
        for (const model of db.getModels()) {
            const dbName = db.getName();
            const modelName = model.getName();
            if (initOptions.saveTableWithNoDB) {
                // 老模式
                const testModel = MODEL_MAP[modelName];
                if (testModel) {
                    // 存在同名 model
                    throw new Error(`model ${modelName} has been already registered!`);
                }
                // 按照 model name 进行保存
                MODEL_MAP[modelName] = model;
            }
            MODEL_MAP[`${dbName}.${modelName}`] = model;
        }
    }
}
function getModel(collectionName, dbName) {
    return getQuickModel(collectionName, dbName).get();
}
function getQuickModel(collectionName, dbName) {
    const key = dbName ? `${dbName}.${collectionName}` : collectionName;
    const model = MODEL_MAP[key];
    if (!model) {
        throw new Error(`model: ${key} 不存在`);
    }
    return model;
}
exports.default = {
    model: {
        init: initDBs,
        get: getDB
    },
    db: {
        get: getModel
    },
    getDB: getDB,
    getModel: getModel,
    getQuickModel: getQuickModel
};
