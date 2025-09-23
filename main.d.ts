import { Model } from "toshihiko";
import { QuickDB } from "./QuickDB";
import { QuickModel } from "./QuickModel";
import { DBConfigBaseProps, InitOptionsProps } from "./type";
export declare function getDB(tableName: string): QuickDB;
export declare const TYPE: import("toshihiko")._Type;
export declare function initDBs(dbConfigs: DBConfigBaseProps[] | DBConfigBaseProps, modelRoot?: string, initOptions?: InitOptionsProps): void;
export declare function getModel(collectionName: string, dbName?: string): Model;
export declare function getQuickModel(collectionName: string, dbName?: string): QuickModel;
export declare const model: {
    get: typeof getModel;
};
export declare const db: {
    init: typeof initDBs;
    get: typeof getModel;
};
//# sourceMappingURL=main.d.ts.map