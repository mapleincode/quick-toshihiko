import { Model } from "toshihiko";
export declare class QuickModel {
    private name;
    private dbName;
    private readonly model;
    constructor(name: string, dbName: string, model: Model);
    get(): Model;
    getName(): string;
    getDBName(): string;
}
//# sourceMappingURL=QuickModel.d.ts.map