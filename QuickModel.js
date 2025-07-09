"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuickModel = void 0;
class QuickModel {
    constructor(name, dbName, model) {
        this.dbName = dbName;
        this.name = name;
        this.model = model;
    }
    get() {
        if (!this.model) {
            throw new Error("model has not been initialized yet");
        }
        return this.model;
    }
    getName() {
        return this.name;
    }
    getDBName() {
        return this.dbName;
    }
}
exports.QuickModel = QuickModel;
