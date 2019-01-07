import {Model} from "./proto.model";

export class Point extends Model {
    x: number;
    y: number;

    dist(p: Point): number {
        return ((this.x - p.x) ** 2 + (this.y - p.y) ** 2) ** 0.5;
    }

    toString(): string {
        return `{"x": ${Math.round(this.x)}, "y": ${Math.round(this.y)}}`;
    }

    eq(p: Point) {
        return Math.abs(p.x - this.x) < 1
            && Math.abs(p.y - this.y) < 1;
    }
}
