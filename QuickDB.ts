import { Model, Toshihiko } from "toshihiko";
import { quickConfig } from "./quick_config";
import { QuickModel } from "./QuickModel";
import {
  DBConfigBaseProps,
  QuickDBMap,
  DBType,
  InitOptionsProps,
  QuickDefineOptions,
  ModelFile,
  ToshihikoSchema
} from "./type";

export class QuickDB {
  private dbConfig: DBConfigBaseProps;
  private toshihiko: Toshihiko;
  private dbType: DBType;
  private readonly name: string;
  private initOptions: InitOptionsProps;
  private modelList: QuickModel[] = [];
  private modelMap: {[key: string]: QuickModel} = {};

  constructor(dbConfig: DBConfigBaseProps, initOptions: InitOptionsProps) {
    this.dbConfig = dbConfig;
    const { name, dbType = DBType.mysql } = dbConfig;

    delete dbConfig.name;
    delete dbConfig.dbType;

    this.name = name;
    this.dbType = dbType;
    this.toshihiko = new Toshihiko(dbType, dbConfig);
    this.initOptions = initOptions || {};
  }

  getName(): string {
    return this.name;
  }

  quickDefine(tableName: string, fields: string[], options: QuickDefineOptions) {
    const schemas = quickConfig(fields, options);
    // if (this.initOptions.saveTableWithNoDB) {
    //   if (!MODEL_MAP[tableName]) {
    //     // set model map
    //     MODEL_MAP[tableName] = model;
    //   } else {
    //     // throw error;
    //     throw new Error(`model ${tableName} has been already registered!`);
    //   }
    // }
    //
    // MODEL_MAP[`${db.database}.${tableName}`] = model;
    return this.define(tableName, schemas, options);
  }

  defineByModelFile(config: ModelFile) {
    if (config == null || !config.config) {
      return null;
    }

    let [collectionName, fields, options = {}] = config.config;

    const field = fields[0];

    let schemas: ToshihikoSchema[];
    if (typeof field !== 'object' || Array.isArray(field)) {
      schemas = quickConfig(fields, options);
    } else {
      schemas = fields as ToshihikoSchema[];
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

  define(collectionName: string, schema: any[], options?: any): Model {
    const model = this.toshihiko.define(collectionName, schema, options);
    this.addModel(collectionName, model);
    return model;
  }

  addModel(collectionName: string, model: Model) {
    if (this.modelMap[collectionName]) {
      throw new Error(`db: ${this.getName()} model: ${collectionName} has already initialized!`);
    }
    const quickModel: QuickModel = new QuickModel(collectionName, this.getName(), model);
    this.modelList.push(quickModel);
    this.modelMap[quickModel.getName()] = quickModel;
  }

  get(collectionName: string): QuickModel {
    const model = this.modelMap[collectionName];
    if (!model) {
      throw new Error(`db: ${this.getName()} model: ${collectionName} not found!`);
    }
    return model;
  }

  getModels(): QuickModel[] {
    return this.modelList;
  }
}


export function buildQuickDBMap(dbConfigList: DBConfigBaseProps[], initOptions: InitOptionsProps) {
  const databaseMap: QuickDBMap = {};
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


