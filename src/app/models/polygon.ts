import {Model} from "./proto.model";
import {Color} from "./color";
import {Line} from "./line";
import {Point} from "./point";

export class Polygon extends Model {

    constructor(data?: any) {
        super(data);
        if (this.lines)
            this.lines = this.lines.map(l => l instanceof Line ? l : new Line(l));
    }
    blurred: boolean;
    lines: Line[];
    color: Color;

    static fromPath(pathStr: string): Polygon[] {
        let groups = pathStr.match(/M[^Z]*Z/g);

        return groups.map(g => new Polygon({lines: Line.fromPath(g)}));
    }

    static triangle(p: Point, d: number = 10): Polygon {
        let dd = d / (2 ** 0.5);
        return new Polygon({
            lines: [
                new Line({
                    start: new Point({x: p.x, y: p.y - d}),
                    end: new Point({x: p.x + dd, y: p.y + dd})
                }),
                new Line({
                    start: new Point({x: p.x + dd, y: p.y + dd}),
                    end: new Point({x: p.x - dd, y: p.y + dd}),
                }),
                new Line({
                    start: new Point({x: p.x - dd, y: p.y + dd}),
                    end: new Point({x: p.x, y: p.y - d})
                }),
            ]
        });
    }

    vertices(): Point[] {
        return this.lines.map(l => l.start);
    }

    toSvg(): string {
        return "";
    }
}
