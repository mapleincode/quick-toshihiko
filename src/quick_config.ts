
import Toshihiko, { Type, _Type } from 'toshihiko'
import { FieldsDefines, QuickConfigOptions } from './type';

interface StringMap {
  [key: string]: string
}


const chars = 'abcdefghijklmnopgrstuvwxyz'.split('');
const charMap: StringMap = {};
const lowerCharMap: StringMap = {};
for (const c of chars) {
  charMap[c.toUpperCase()] = c;
  lowerCharMap[c] = c;
}


function getLowerName (name: string) {
  let result = '';
  for (let i = 0; i < name.length; i++) {
    const c = name[i];
    const lastC = name[i - 1];
    const nextC = name[i + 1];
    if (charMap[c] && (lowerCharMap[lastC] ||
             ((charMap[lastC]) && lowerCharMap[nextC]))) {
      result += '_';
      result += charMap[c];
      continue;
    }
    result += c.toLowerCase();
  }

  return result;
}




interface ColumnConfig {
  primaryKey?:boolean
  allowNull?: boolean
  column?: string
  name?: string
  type?: any
  defaultValue?: string|boolean|number
}

type DefaultValueType = string|number|boolean|undefined

const quickConfig = function (items: FieldsDefines, options: QuickConfigOptions|undefined) {
  const configs = [];

  if (options === undefined) {
    options = {}
  }

  const { setPrimaryKey = true } = options;

  let primaryKeySet = !setPrimaryKey;

  for (let item of items) {
    if (typeof item === 'string') {
      item = item.split(',').map(item => item.trim());
    }

    const config: ColumnConfig = {};

    // 设置 primary key
    if (!primaryKeySet) {
      config.primaryKey = true;
      config.allowNull = true;
      primaryKeySet = true;
    }

    // 全局 allowNull
    if (options.allowNull == true) {
      if (!config.primaryKey) {
        config.allowNull = true;
      }
    }

    const name = item.shift();

    if (typeof name === 'string') {
      const lowerName = getLowerName(name);

      if (lowerName !== name) {
        config.column = lowerName;
      }
      config.name = name;
    } else if (Array.isArray(name) && name.length) {
      config.name = name[0];
      config.column = name[1] || undefined;
    }

    if (item.length === 0) {
      configs.push(config);
      continue;
    }

    let type = item.shift() as string|any;

    if (typeof type === 'string') {
      let colType;

      if (type === 's' || type === 'String'){
        colType = Type.String
      } else if (type === 'i' || type === 'Integer') {
        colType = Type.Integer;
      } else if (type === 'f'|| type === 'Float') {
        colType = Type.Float;
      } else if (type === 'd'|| type === 'Datetime') {
        colType = Type.Datetime;
      } else if (type === 'b'|| type === 'Boolean') {
        colType = Type.Boolean;
      };
      config.type = colType
    } else if (type) {
      config.type = type;
    }

    if (item.length === 0) {
      configs.push(config);
      continue;
    }

    let allowNull = item.shift() as DefaultValueType;
    let defaultValue: DefaultValueType;

    // 判定 Boolean 下 true 为默认值优先
    if (type === 'Boolean' && (
      typeof allowNull === 'boolean' ||
      allowNull === 'true' ||
      allowNull === 'false'
    )) {
      const allowNullValue = allowNull ? (allowNull !== 'false') : false;
      config.defaultValue = defaultValue = allowNullValue;
    } else {
      if (allowNull === '$t' || allowNull === 'true' || allowNull === true) {
        config.allowNull = allowNull = true;
      } else if (allowNull === '$f' || allowNull === false) {
        config.allowNull = allowNull = false;
      } else {
        if (allowNull !== undefined) {
          config.defaultValue = defaultValue = allowNull;
        }
      }
    }

    if (defaultValue === undefined) {
      defaultValue = item.shift() as DefaultValueType;
    }

    if (typeof defaultValue === 'object' && defaultValue !== null) {
      item.unshift(defaultValue);
    } else if (defaultValue !== undefined) {
      // 根据类型，对 defaultValue 做转换

      if (type === 'Integer') {
        defaultValue = parseInt(defaultValue as string);
      } else if (type === 'Float') {
        defaultValue = parseFloat(defaultValue as string);
      } else if (type === 'Boolean') {
        defaultValue = allowNull ? (allowNull !== 'false') : false;
      }

      config.defaultValue = defaultValue;
    }

    if (item.length === 0) {
      configs.push(config);
      continue;
    }

    const otherConfig = item.shift();
    if (typeof otherConfig === 'object') {
      Object.assign(config, otherConfig);
    }

    configs.push(config);
  }
  return configs;
};

export default quickConfig;
