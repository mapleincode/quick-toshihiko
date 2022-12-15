/*
 * @Author: maple
 * @Date: 2020-11-18 15:47:50
 * @LastEditors: maple
 * @LastEditTime: 2022-12-15 18:55:51
 */
import { Toshihiko, Model } from 'toshihiko'


declare class ToshihikoQ extends Toshihiko {
  qdefine(collectionName: string, schema: any[], options?: any): Model;
}

interface QDB {
  get(name: string): ToshihikoQ;
  init(dbConfigs: any[], modelRoot: string): void;
}

interface QModel {
  get(tableName: string): Model;
}

declare const db: QDB;

declare const model: QModel;