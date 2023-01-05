import { Model, Toshihiko } from "toshihiko"

/*
 * @Author: maple
 * @Date: 2022-12-16 10:46:07
 * @LastEditors: maple
 * @LastEditTime: 2022-12-16 11:02:34
 */
export type FieldsDefines = string[]|(string|string[]|boolean|number)[][]

export interface QuickConfigOptions {
  setPrimaryKey?: boolean
  allowNull?: boolean
}

export interface DbConfigMapDefine {
  [key: string]: [
    string,
    DbConfig
  ]
}

export interface DbMapDefine {
  [key: string]: Toshihiko|QToshihiko
}

export interface DbConfig {
  name?: string;
  dbType?: string;
  database?: string;
}

export interface DBInitOptions {
  saveTableWithNoDB?: boolean;

}

export interface QToshihikoAddition {
  qdefine?(tableName: string, fields: FieldsDefines, options: QuickConfigOptions): void;
  TYPE?: any;
} 

export type QToshihiko = Toshihiko & QToshihikoAddition

export interface ModelMapDefine {
  [key: string]: Model
}