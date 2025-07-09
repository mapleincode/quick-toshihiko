import { Model } from "toshihiko";
export class QuickModel {
  private name: string;
  private dbName: string;
  private readonly model: Model;

  constructor(name: string, dbName: string, model: Model) {
    this.dbName = dbName;
    this.name = name;
    this.model = model;
  }

  get(): Model {
    if (!this.model) {
      throw new Error("model has not been initialized yet")
    }
    return this.model;
  }

  getName(): string {
    return this.name;
  }

  getDBName(): string {
    return this.dbName;
  }
}
