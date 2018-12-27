import {Polygon} from "./polygon";
import {Model} from "./proto.model";
import {Color} from "./color";

export class Population extends Model {
  name: string;
  size: number;
  areas: Polygon[];
  color: Color;
}
