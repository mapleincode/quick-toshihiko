import { createPool } from "mysql2"
import { Toshihiko, Type } from "toshihiko";
import { quickConfig } from "./quick_config";
import {
  DBConfigBaseProps, DBConfigMapProps,
  DBMapProps, DBType,
  InitOptionsProps, InitQuickModel, ModelFile,
  ModelMapProps,
  QuickDefine,
  QuickToshihiko, ToshihikoConfig, ToshihikoSchema
} from "./type";
import {join} from "path"
import { readdirSync } from "fs"


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

const MODEL_MAP: ModelMapProps = {};
const DB_MAP: DBMapProps = {};
const DB_CONFIG_MAP: DBConfigMapProps = {};

// add qdefine

function initQuickToshihiko (dbName: string, initOptions: InitOptionsProps): QuickToshihiko {
  if (!DB_CONFIG_MAP[dbName]) {
    throw new Error(`db: ${dbName} not init!`);
  }

  const [dbType, dbConfig] = DB_CONFIG_MAP[dbName];
  const db = DB_MAP[dbName] = new Toshihiko(dbType, dbConfig);

  const quickDefine: QuickDefine = function (tableName, fields, options) {
    const schemas = quickConfig(fields, options);
    const model = db.define(tableName, schemas);

    if (initOptions.saveTableWithNoDB) {
      if (!MODEL_MAP[tableName]) {
        // set model map
        MODEL_MAP[tableName] = model;
      } else {
        // throw error;
        throw new Error(`model ${tableName} has been already registered!`);
      }
    }

    MODEL_MAP[`${db.database}.${tableName}`] = model;
    return model;
  };

  const qdb = db as QuickToshihiko;
  qdb.quickDefine = quickDefine;
  qdb.qdefine = quickDefine;

  return qdb;
}

const initQuickModel: InitQuickModel = function(db: QuickToshihiko, dbName, modelRoot, initOptions) {
  const tableConfigs: ModelFile[] = [];
  const dbDirPath = join(modelRoot, dbName);
  const dirs = readdirSync(dbDirPath);

  // fetch table configs
  for (const file of dirs) {
    if (file[0] === '.') continue;

    // 处理 js 文件
    if (file.endsWith('.js')) {
      const config = require(join(dbDirPath, file));
      tableConfigs.push(config);
      continue;
    }

    const subRoot = join(dbDirPath, file);
    const subDirs = readdirSync(subRoot);
    for (const file of subDirs) {
      if (file[0] === '.') {
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
    if (!config.config) {
      continue;
    }

    let [tableName, fields, options = {}] = config.config;

    const field = fields[0];

    let schemas: ToshihikoSchema[];
    if (typeof field !== 'object' || Array.isArray(field)) {
      schemas = quickConfig(fields, options);
    } else {
      schemas = fields as ToshihikoSchema[];
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
      } else {
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
}

export const db = {
    init: function (dbConfigs: DBConfigBaseProps[] = [], modelRoot: string = '', initOptions: InitOptionsProps = {}) {
      modelRoot = modelRoot || join(process.execPath, 'models');
      if (!Array.isArray(dbConfigs)) {
        dbConfigs = [].concat(dbConfigs);
      }

      for (const dbConfig of dbConfigs) {
        const { name, dbType = DBType.mysql } = dbConfig;

        dbConfig.database = dbConfig.database || name;
        dbConfig.name = undefined;
        dbConfig.dbType = undefined;

        const toshihikoDBConfig: ToshihikoConfig = {
          ...dbConfig,
          name: undefined,
          dbType: undefined
        }

        DB_CONFIG_MAP[name] = [dbType, toshihikoDBConfig];
      }

      if (modelRoot) {
        const dbDirs = readdirSync(modelRoot);
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
    get: function (tableName: string) {
      return DB_MAP[tableName] || null;
    }
  };
export const TYPE = Type;
export const model =  {
  get: function (table: string) {
    const model = MODEL_MAP[table];
    if (!model) {
      throw new Error(`model: ${table} 不存在`);
    }
    return model;
  }
};
