import { BaseType, Model, ObjStatic, Toshihiko, Type } from "toshihiko";
import { ToshihikoQ } from "./index";
import {ConnectionOptions} from "mysql2"

export interface ModelMapProps {
  [key: string]: Model
}

export interface DBMapProps {
  [key: string]: Toshihiko
}

export enum DBType {
  mysql = 'mysql'
}

export type ToshihikoConfig = ConnectionOptions & {
  showSql?: boolean
}

export interface  DBConfigMapProps {
  [key: string]: [DBType, ToshihikoConfig]
}


export interface QuickDefineOptions {

}

export interface QuickDefine {
  (tableName: string, fields: string[], options: QuickDefineOptions): Model
}

export interface InitOptionsProps {
  saveTableWithNoDB?: boolean
}

export interface InitQuickModel {
  (db: QuickToshihiko, dbName: string, modelRoot: string, initOptions: InitOptionsProps): void
}

export type QuickConfigItem = string | (object | boolean | string | [string, string])[]

// export interface QuickConfigItem {
//
// }

export interface QuickConfigOptions {
  setPrimaryKey?: boolean
  allowNull?: boolean
}

export interface ToshihikoSchema {
  primaryKey?: boolean
  allowNull?: boolean
  column?: string
  name?: string
  type?: ToshihikoBaseType
  defaultValue?: ToshihikoBaseTypeBasic
}
export type ToshihikoBaseTypeBasic = string | boolean | number | ObjStatic | Date

export type ToshihikoBaseType = BaseType<string>|BaseType<boolean>|BaseType<number>|BaseType<ObjStatic>|BaseType<Date>;

// export type ToshihikoSchemaWithBasic = ToshihikoSchema<string>|ToshihikoSchema<boolean>|ToshihikoSchema<number>|ToshihikoSchema<ObjStatic>|ToshihikoSchema<Date>;

export interface QuickToshihiko extends Toshihiko {
  qdefine: QuickDefine,
  quickDefine: QuickDefine
}
export type ModelFileConfig = [
  tableName: string,
  fields: QuickConfigItem[] | ToshihikoSchema[][],
  options: any
]
export type ModelFile = { config: ModelFileConfig } & { [key: string]: Function }

export type DBConfigBaseProps = ToshihikoConfig & {
  name: string
  dbType: DBType
}