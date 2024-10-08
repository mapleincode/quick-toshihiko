/**
 * @Author: maple
 * @Date: 2020-11-18 11:43:40
 * @LastEditors: maple
 * @LastEditTime: 2022-06-08 11:56:56
 */
const mysql = require('mysql2');
mysql._createPool = mysql.createPool;
mysql.createPool = function () {
  const options = arguments[0];
  const _options = {
    ...options
  };
  delete _options.showSql;
  arguments[0] = _options;
  return mysql._createPool(...arguments);
};
const T = require('toshihiko');
const fs = require('fs');
const path = require('path');
const quickConfig = require('../quick_config');

const MODLE_MAP = {};
const DB_MAP = {};
const DB_CONFIG_MAP = {};

function initDB (dbName, initOptions) {
  if (!DB_CONFIG_MAP[dbName]) {
    throw new Error(`db: ${dbName} not init!`);
  }

  const [dbType, dbConfig] = DB_CONFIG_MAP[dbName];
  const db = DB_MAP[dbName] = new T.Toshihiko(dbType, dbConfig);

  // add qdefine
  db.qdefine = function (tableName, fields, options) {
    const _fileds = quickConfig(fields, options);
    const model = db.define(tableName, _fileds);

    if (initOptions.saveTableWithNoDB) {
      if (!MODLE_MAP[tableName]) {
        // set model map
        MODLE_MAP[tableName] = model;
      } else {
        // throw error;
        throw new Error(`model ${tableName} has been already registed!`);
      }
    }

    MODLE_MAP[`${name}.${tableName}`] = model;
    return model;
  };

  // add
  db.TYPE = T.Type;
  return db;
}

function initModel (db, dbName, modelRoot, initOptions) {
  const tableConfigs = [];
  const dbDirPath = path.join(modelRoot, dbName);
  const dirs = fs.readdirSync(dbDirPath);

  // fetch table configs
  for (const file of dirs) {
    if (file[0] === '.') continue;
    if (file.indexOf('.js') > -1) {
      const config = require(path.join(dbDirPath, file));
      tableConfigs.push(config);
      continue;
    }

    const subRoot = path.join(dbDirPath, file);
    const subDirs = fs.readdirSync(subRoot);
    for (const file of subDirs) {
      if (file[0] === '.') continue;
      if (file.indexOf('.js') > -1) {
        const config = require(path.join(subRoot, file));
        tableConfigs.push(config);
        continue;
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
    if (typeof field !== 'object' || Array.isArray(field)) {
      fields = quickConfig(fields, options);
    }
    const model = db.define(tableName, fields);
    if (MODLE_MAP[tableName]) {
      throw new Error(`table: ${tableName} already registed!`);
    }

    // set model map
    if (initOptions.saveTableWithNoDB) {
      if (!MODLE_MAP[tableName]) {
        // set model map
        MODLE_MAP[tableName] = model;
      } else {
        // throw error;
        throw new Error(`model ${tableName} has been already registed!`);
      }
    }

    MODLE_MAP[`${dbName}.${tableName}`] = model;

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

module.exports = {
  db: {
    init: function (dbConfigs = [], modelRoot = '', initOptions = {}) {
      modelRoot = modelRoot || path.join(process.execPath, 'models');
      if (!Array.isArray(dbConfigs)) {
        dbConfigs = dbConfigs.concat(dbConfigs);
      }

      for (const dbConfig of dbConfigs) {
        const { name, dbType = 'mysql' } = dbConfig;
        delete dbConfig.name;
        delete dbConfig.dbType;
        dbConfig.database = dbConfig.database || name;
        // init toshihiko
        // const db =
        // DB_MAP[name] = db;

        DB_CONFIG_MAP[name] = [dbType, dbConfig];
      }

      if (modelRoot) {
        const dbDirs = fs.readdirSync(modelRoot);
        for (const dbDir of dbDirs) {
          if (dbDir[0] === '.') {
            continue;
          }

          const dbName = dbDir;

          // init db
          const db = initDB(dbName, initOptions);

          // init model
          initModel(db, dbName, modelRoot, initOptions);
        }
      }
    },
    get: function (tableName) {
      return DB_MAP[tableName] || null;
    }
  },
  TYPE: T.Type,
  model: {
    get: function (table) {
      const model = MODLE_MAP[table];
      if (!model) {
        throw new Error(`model: ${table} 不存在`);
      }
      return model;
    }
  }
};
