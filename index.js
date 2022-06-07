/**
 * @Author: maple
 * @Date: 2020-11-18 11:43:40
 * @LastEditors: maple
 * @LastEditTime: 2022-06-07 20:05:46
 */
const T = require('toshihiko');
const fs = require('fs');
const path = require('path');
const quickConfig = require('./quick_config');

const MODLE_MAP = {};
const DB_MAP = {};

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
        // init toshihiko
        const db = new T.Toshihiko(dbType, dbConfig);

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
        DB_MAP[name] = db;
      }

      if (modelRoot) {
        const dbDirs = fs.readdirSync(modelRoot);
        for (const dbDir of dbDirs) {
          if (dbDir[0] === '.') {
            continue;
          }

          const dbName = dbDir;
          if (!DB_MAP[dbName]) {
            throw new Error(`db: ${dbName} not init!`);
          }

          const db = DB_MAP[dbName];
          const tableConfigs = [];
          const dbDirPath = path.join(modelRoot, dbName);
          const dirs = fs.readdirSync(dbDirPath);
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

            // return model;
          }
        }
      }
    },
    get: function (tableName) {
      return DB_MAP[name] || null;
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
