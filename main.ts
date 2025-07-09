import { createPool } from "mysql2"
import { Model, Toshihiko, Type } from "toshihiko";
import { buildQuickDBMap, QuickDB } from "./QuickDB";
import { QuickModel } from "./QuickModel";
import {
  DBConfigBaseProps,
  QuickDBMap,
  InitOptionsProps, ModelFile,
  QuickModelMap
} from "./type";
import {join} from "path"
import * as fs from "fs"

const MODEL_MAP: QuickModelMap = {};
let DB_MAP: QuickDBMap = {};

function initQuickModel(db: QuickDB, dbConfigFilePath: string, initOptions: InitOptionsProps) {
  const tableConfigs: ModelFile[] = [];
  const dirs = fs.readdirSync(dbConfigFilePath);

  // fetch table configs
  for (const file of dirs) {
    // 判断是否隐藏文件
    if (file.startsWith('.')) {
      continue;
    }

    const fileFullPath = join(dbConfigFilePath, file);
    const fileState = fs.statSync(fileFullPath);
    // 判断是否为文件
    if (fileState && fileState.isFile()) {
      // 处理 js 文件
      if (file.endsWith('.js')) {
        const config = require(join(dbConfigFilePath, file));
        tableConfigs.push(config);
        continue;
      } else {
        continue;
      }
    }

    const subRoot = join(dbConfigFilePath, file);
    const subDirs = fs.readdirSync(subRoot);
    for (const file of subDirs) {
      if (file.startsWith(".")) {
        continue;
      }

      if (file.indexOf('.js') > -1) {
        const config: ModelFile = require(join(subRoot, file));
        tableConfigs.push(config);
      }
    }
  }

  // init model
  for (const config of tableConfigs) {
    db.defineByModelFile(config);
  }
}


export const db = {
    init: function (dbConfigs: DBConfigBaseProps[]|DBConfigBaseProps, modelRoot: string = '', initOptions: InitOptionsProps = {}) {
      modelRoot = modelRoot || join(process.execPath, 'models');
      if (!Array.isArray(dbConfigs)) {
        dbConfigs = [dbConfigs]
      }

      const databaseMap = buildQuickDBMap(dbConfigs, initOptions);
      if (modelRoot && modelRoot.trim() !== "") {
        const databaseDirs = fs.readdirSync(modelRoot);
        for (const databaseName of databaseDirs) {
          if (databaseName.startsWith('.')) {
            // 过滤隐藏文件
            continue;
          }
          const dbConfigFilePath = join(modelRoot, databaseName);
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
            if (model) {
              // 存在同名 model
              throw new Error(`model ${modelName} has been already registered!`);
            }

            // 按照 model name 进行保存
            MODEL_MAP[modelName] = model;
          }

          MODEL_MAP[`${dbName}.${modelName}`] = model;
        }

      }

    },
    get: function (tableName: string): QuickDB {
      return DB_MAP[tableName] || null;
    }
  };
export const TYPE = Type;
// @ts-ignore
export const model =  {
  get: function (collectionName: string, dbName?: string): Model {
    return this.getQuickModel(collectionName, dbName).get();
  },

  getQuickModel: function (collectionName: string, dbName?: string): QuickModel {
    const key = dbName ? `${dbName}.${collectionName}` : collectionName;

    const model = MODEL_MAP[key];
    if (!model) {
      throw new Error(`model: ${key} 不存在`);
    }
    return model;
  }
};
