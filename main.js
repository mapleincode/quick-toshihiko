"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.model = exports.TYPE = exports.db = void 0;
const toshihiko_1 = require("toshihiko");
const quick_config_1 = require("./quick_config");
const type_1 = require("./type");
const path_1 = require("path");
const fs_1 = require("fs");
// mysql._createPool = mysql.createPool;
// mysql.createPool = function () {
//   const options = arguments[0];
//   const _options = {
//     ...options
//   };
//   delete _options.showSql;
//   arguments[0] = _options;
//   return mysql._createPool(...arguments);
// };
// const T = require('toshihiko');
// const fs = require('fs');
// const path = require('path');
// const quickConfig = require('./quick_config');
const MODEL_MAP = {};
const DB_MAP = {};
const DB_CONFIG_MAP = {};
// add qdefine
function initQuickToshihiko(dbName, initOptions) {
    if (!DB_CONFIG_MAP[dbName]) {
        throw new Error(`db: ${dbName} not init!`);
    }
    const [dbType, dbConfig] = DB_CONFIG_MAP[dbName];
    const db = DB_MAP[dbName] = new toshihiko_1.Toshihiko(dbType, dbConfig);
    const quickDefine = function (tableName, fields, options) {
        const schemas = (0, quick_config_1.quickConfig)(fields, options);
        const model = db.define(tableName, schemas);
        if (initOptions.saveTableWithNoDB) {
            if (!MODEL_MAP[tableName]) {
                // set model map
                MODEL_MAP[tableName] = model;
            }
            else {
                // throw error;
                throw new Error(`model ${tableName} has been already registered!`);
            }
        }
        MODEL_MAP[`${db.database}.${tableName}`] = model;
        return model;
    };
    const qdb = db;
    qdb.quickDefine = quickDefine;
    qdb.qdefine = quickDefine;
    return qdb;
}
const initQuickModel = function (db, dbName, modelRoot, initOptions) {
    const tableConfigs = [];
    const dbDirPath = (0, path_1.join)(modelRoot, dbName);
    const dirs = (0, fs_1.readdirSync)(dbDirPath);
    // fetch table configs
    for (const file of dirs) {
        if (file[0] === '.')
            continue;
        // 处理 js 文件
        if (file.endsWith('.js')) {
            const config = require((0, path_1.join)(dbDirPath, file));
            tableConfigs.push(config);
            continue;
        }
        const subRoot = (0, path_1.join)(dbDirPath, file);
        const subDirs = (0, fs_1.readdirSync)(subRoot);
        for (const file of subDirs) {
            if (file[0] === '.') {
                continue;
            }
            if (file.indexOf('.js') > -1) {
                const config = require((0, path_1.join)(subRoot, file));
                tableConfigs.push(config);
            }
        }
    }
    // init model
    for (const config of tableConfigs) {
        if (!config.config) {
            continue;
        }
        let [tableName, fields, options = {}] = config.config;
        const field = fields[0];
        let schemas;
        if (typeof field !== 'object' || Array.isArray(field)) {
            schemas = (0, quick_config_1.quickConfig)(fields, options);
        }
        else {
            schemas = fields;
        }
        const model = db.define(tableName, schemas);
        if (MODEL_MAP[tableName]) {
            throw new Error(`table: ${tableName} already registered!`);
        }
        // set model map
        if (initOptions.saveTableWithNoDB) {
            if (!MODEL_MAP[tableName]) {
                // set model map
                MODEL_MAP[tableName] = model;
            }
            else {
                // throw error;
                throw new Error(`model ${tableName} has been already registed!`);
            }
        }
        MODEL_MAP[`${dbName}.${tableName}`] = model;
        // bind function
        const keys = Object.keys(config).filter(key => key !== 'config');
        for (const key of keys) {
            if (typeof config[key] === 'function') {
                model[key] = config[key].bind(model);
                continue;
            }
            model[key] = config[key];
        }
    }
};
exports.db = {
    init: function (dbConfigs = [], modelRoot = '', initOptions = {}) {
        modelRoot = modelRoot || (0, path_1.join)(process.execPath, 'models');
        if (!Array.isArray(dbConfigs)) {
            dbConfigs = [].concat(dbConfigs);
        }
        for (const dbConfig of dbConfigs) {
            const { name, dbType = type_1.DBType.mysql } = dbConfig;
            dbConfig.database = dbConfig.database || name;
            dbConfig.name = undefined;
            dbConfig.dbType = undefined;
            const toshihikoDBConfig = Object.assign({}, dbConfig);
            delete toshihikoDBConfig.name;
            delete toshihikoDBConfig.dbType;
            DB_CONFIG_MAP[name] = [dbType, toshihikoDBConfig];
        }
        if (modelRoot) {
            const dbDirs = (0, fs_1.readdirSync)(modelRoot);
            for (const dbDir of dbDirs) {
                if (dbDir[0] === '.') {
                    continue;
                }
                const dbName = dbDir;
                // init db
                const db = initQuickToshihiko(dbName, initOptions);
                // init model
                initQuickModel(db, dbName, modelRoot, initOptions);
            }
        }
    },
    get: function (tableName) {
        return DB_MAP[tableName] || null;
    }
};
exports.TYPE = toshihiko_1.Type;
exports.model = {
    get: function (table) {
        const model = MODEL_MAP[table];
        if (!model) {
            throw new Error(`model: ${table} 不存在`);
        }
        return model;
    }
};
