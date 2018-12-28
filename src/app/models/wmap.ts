import {Model} from "./proto.model";

export class WMapProjection extends Model {
    type: string;
    scale: number;
    rotate: [number, number];
    center: [number, number];
}
export class WMap extends Model {
    name: string;
    geojson: string;
    projection: WMapProjection;
}
