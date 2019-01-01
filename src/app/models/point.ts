import {Model} from "./proto.model";

export class Point extends Model {
  x: number;
  y: number;

  dist(p: Point): number {
    return ((this.x - p.x) ** 2 + (this.y - p.y) ** 2) ** 0.5;
  }
}
