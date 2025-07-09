"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuickDB = void 0;
exports.buildQuickDBMap = buildQuickDBMap;
const toshihiko_1 = require("toshihiko");
const quick_config_1 = require("./quick_config");
const QuickModel_1 = require("./QuickModel");
const type_1 = require("./type");
class QuickDB {
    constructor(dbConfig, initOptions) {
        this.modelList = [];
        this.modelMap = {};
        this.dbConfig = dbConfig;
        const { name, dbType = type_1.DBType.mysql } = dbConfig;
        delete dbConfig.name;
        delete dbConfig.dbType;
        this.name = name;
        this.dbType = dbType;
        this.toshihiko = new toshihiko_1.Toshihiko(dbType, dbConfig);
        this.initOptions = initOptions || {};
    }
    getName() {
        return this.name;
    }
    quickDefine(tableName, fields, options = {}) {
        const schemas = (0, quick_config_1.quickConfig)(fields, options);
        return this.define(tableName, schemas, options);
    }
    defineByModelFile(config) {
        if (config == null || !config.config) {
            return null;
        }
        let [collectionName, fields, options = {}] = config.config;
        const field = fields[0];
        let schemas;
        if (typeof field !== 'object' || Array.isArray(field)) {
            schemas = (0, quick_config_1.quickConfig)(fields, options);
        }
        else {
            schemas = fields;
        }
        const model = this.define(collectionName, schemas, options);
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
    define(collectionName, schema, options) {
        const model = this.toshihiko.define(collectionName, schema, options);
        this.addModel(collectionName, model);
        return model;
    }
    addModel(collectionName, model) {
        if (this.modelMap[collectionName]) {
            throw new Error(`db: ${this.getName()} model: ${collectionName} has already initialized!`);
        }
        const quickModel = new QuickModel_1.QuickModel(collectionName, this.getName(), model);
        this.modelList.push(quickModel);
        this.modelMap[quickModel.getName()] = quickModel;
    }
    get(collectionName) {
        const model = this.modelMap[collectionName];
        if (!model) {
            throw new Error(`db: ${this.getName()} model: ${collectionName} not found!`);
        }
        return model;
    }
    getModels() {
        return this.modelList;
    }
}
exports.QuickDB = QuickDB;
function buildQuickDBMap(dbConfigList, initOptions) {
    const databaseMap = {};
    for (const dbConfig of dbConfigList) {
        const database = new QuickDB(dbConfig, initOptions);
        const name = database.getName();
        if (databaseMap[name]) {
            throw new Error(`Database config ${name} is Repetitive!`);
        }
        databaseMap[name] = database;
    }
    return databaseMap;
}
