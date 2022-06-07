/*
 * @Author: maple
 * @Date: 2020-11-18 15:47:50
 * @LastEditors: maple
 * @LastEditTime: 2022-06-07 19:19:14
 */
import { Toshihiko, Model } from 'toshihiko'


declare class ToshihikoQ extends Toshihiko {
  qdefine(collectionName: string, schema: any[], options?: any): Model;
}
declare {
  db: {
    function get(name: string): ToshihikoQ;
    function init(dbConfigs: any[], modelRoot: string): void;
  }
  model: {
    function get(tableName: string): Model;
  }
}