import {Model} from "./proto.model";
import {Color} from "./color";
import {Line} from "./line";
import {Point} from "./point";
import {createSrcToOutPathMapper} from "@angular/compiler-cli/src/transformers/program";

export class Polygon extends Model {

    constructor(data?: any) {
        super(data);
        this.lines = (this.lines || []).map(l => l instanceof Line ? l : new Line(l));
    }
    blurred: boolean;
    lines: Line[];
    color: Color;

    static fromPath(pathStr: string): Polygon[] {
        let groups = pathStr.match(/M[^Z]*Z/g);

        return groups.map(g => new Polygon({lines: Line.fromPath(g)}));
    }

    static triangle(p: Point, d: number = 10): Polygon {
        let dd = (3 ** 0.5) * d / 2;
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

    static fromVertices(points: Point[]): Polygon {
        if (points.length < 3) return null;

        let p0 = null,
            poly = new Polygon();
        for (let p of points) {
            if (p0)
                poly.lines.push(new Line({start: p0, end: p}));
            p0 = p;
        }

        // search collisions (recursively?)
        return poly;
    }

    merge(p: Polygon) {
        let plines = p.lines.splice(0),
            inx = -1, pinx = -1, cnt = 0, i = 0;
        for (; i < this.lines.length; i++)
            if (pinx = plines.indexOf(this.lines[i])) {
                inx = i;
                while (i < this.lines.length && plines.indexOf(this.lines[i++]) === (cnt++ + inx));
                break;
            }
        let ppart = plines.splice(0, pinx + cnt);
        plines = plines.concat(ppart.slice(0, pinx));
        this.lines.splice(inx, cnt, ...plines);
    }

    addVertice(v: Point, into: Line = null) {
        if (into)
            into = this.lines.find(l => into.start === l.start && into.end === l.end);
        into = into || this.lines.slice(0).sort((l1, l2) => l1.start.dist(v) - l2.start.dist(v))[0];
        this.lines.splice(this.lines.indexOf(into), 1,
            new Line({start: into.start, end: v}),
            new Line({start: v, end: into.end})
        );
    }

    vertices(): Point[] {
        return this.lines.map(l => l.start);
    }

    toPath(): string {
        let path = "", l;
        for (l of this.lines)
            path += (path ? "L" : "M") + l.start.x + "," + l.start.y;
        path += `L${l.end.x},${l.end.y}Z`;
        return path;
    }
}
