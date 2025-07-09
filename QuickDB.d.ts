import { Model } from "toshihiko";
import { QuickModel } from "./QuickModel";
import { DBConfigBaseProps, QuickDBMap, InitOptionsProps, QuickDefineOptions, ModelFile } from "./type";
export declare class QuickDB {
    private dbConfig;
    private toshihiko;
    private dbType;
    private readonly name;
    private initOptions;
    private modelList;
    private modelMap;
    constructor(dbConfig: DBConfigBaseProps, initOptions: InitOptionsProps);
    getName(): string;
    quickDefine(tableName: string, fields: string[], options: QuickDefineOptions): Model;
    defineByModelFile(config: ModelFile): null | undefined;
    define(collectionName: string, schema: any[], options?: any): Model;
    addModel(collectionName: string, model: Model): void;
    get(collectionName: string): QuickModel;
    getModels(): QuickModel[];
}
export declare function buildQuickDBMap(dbConfigList: DBConfigBaseProps[], initOptions: InitOptionsProps): QuickDBMap;
//# sourceMappingURL=QuickDB.d.ts.map