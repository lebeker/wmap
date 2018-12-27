import {Model} from "./proto.model";
import {Point} from "./point";
import {Color} from "./color";

export class Polygon extends Model {
  points: Point[];
  color: Color;
  toSvg(): string {
    return "";
  }
}
