import {Model} from "./proto.model";
import {Color} from "./color";
import {Line} from "./line";
import {Point} from "./point";
import {createSrcToOutPathMapper} from "@angular/compiler-cli/src/transformers/program";

export class Polygon extends Model {
    protected _uid: any;
    get uid(): any { return this._uid; }
    constructor(data?: any) {
        super(data);
        this.lines = (this.lines || []).map(l => l instanceof Line ? l : new Line(l));
        this._uid = (new Date).getTime() + "" + Math.random() * 10000;
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
        // if (points.length < 3) return null;

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

    box(): Point[] {
        let tl: Point, tr: Point, br: Point, bl: Point;
        for (let v of this.vertices()) {
            tl = tl ? new Point({x: Math.min(tl.x, v.x), y: Math.min(tl.y, v.y)}) : v;
            tr = tr ? new Point({x: Math.max(tr.x, v.x), y: Math.min(tr.y, v.y)}) : v;
            br = br ? new Point({x: Math.max(br.x, v.x), y: Math.max(br.y, v.y)}) : v;
            bl = bl ? new Point({x: Math.min(bl.x, v.x), y: Math.max(bl.y, v.y)}) : v;
        }
        return [tl, tr, br, bl];
    }

    isIntersect(poly: Polygon) {
        let bx: any = this.box,
            pbx: any = poly.box,
            inb = (p: Point, box: any) => !(p.x < box[0].x || p.x > box[1].x || p.y > box[2].y || p.y < box[0].y);

        if (!pbx.reduce((a, v) => a || inb(v, bx), false)
         && !bx.reduce((a, v) => a || inb(v, pbx), false)
        ) return false;

        return poly.lines.reduce((a, pl) =>
            a || this.lines.reduce((_a, l) => _a || l.isIntersect(pl), false),
            false
        );
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
        if (!path) return "M0,0Z";
        path += (l ? `L${l.end.x},${l.end.y}Z` : "");
        return path;
    }
}
