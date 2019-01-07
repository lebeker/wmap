import {Model} from "./proto.model";
import {Point} from "./point";

export class Line extends Model {
    start: Point;
    end: Point;
    bezier1: Point;
    bezier2: Point;
    radius: number; // TBD for "A" path type
    get curved() { return !! (this.bezier1 || this.bezier2 || this.radius); }

    static fromPath(pathStr: string): Line[] {
        let lines: Line[] = [],
            tl: Line,
            parts = pathStr.match(/[MLHVCSQTAZ]\s*[0-9\.\s-,]+/g)
                .map((r: any) => {
                    r = r.match(/([MLHVCSQTAZ])\s*([0-9\.\s-,]+)/);
                    return [
                        r[1],
                        r[2].split(",").map(s => +s.trim())
                    ];
                });
        let p0 = null,
            p2pt = (p: any, _p0?: Point) => new Point({x: p[0]  || _p0.x, y: p[1] || _p0.y});

        for (let p = parts.splice(0, 1); parts.length; p = parts.splice(0, 1)) {
            p = p[0];
            // noinspection FallThroughInSwitchStatementJS
            switch ((p[0] + "").trim()) {
                case "M":
                    p0 = p2pt(p[1]);
                    break;
                case "L":
                    lines.push(new Line({
                        start: new Point(p0),
                        end: p2pt(p[1])
                    }));
                    p0 = p2pt(p[1]);
                    break;
                case "V":
                    p[1][1] = p[1][0];
                    p[1][0] = undefined;
                case "H":
                    lines.push(new Line({
                        start: new Point(p0),
                        end: p2pt(p[1], p0)
                    }));
                    p0 = p2pt(p[1], p0);
                    break;
                case "C":
                    lines.push(new Line({
                        start: new Point(p0),
                        bezier1: p2pt(p[1].splice(0, 2)),
                        bezier2: p2pt(p[1].splice(0, 2)),
                        end: p2pt(p[1])
                    }));
                    break;
                case "Z":
                    lines.push(new Line({
                        start: new Point(p0),
                        end: new Point(lines[0].start)
                    }));
                    console.log("l0: ", lines[0]);
                    console.log("lz: ", lines[lines.length - 1]);
                    break;
                default:
                    throw new Error("Not Supported(yet) operation (SQTA) ~ " + p[0]);
            }
        }
        return lines;
    }

    dist(pt: Point): number {
        let a = pt.dist(this.start),
            b = pt.dist(this.end),
            c = this.start.dist(this.end),
            p = (a + b + c) / 2;
        return (2 / c) * ((p * (p - a) * (p - b) * (p - c)) ** 0.5);
    }

    isIntersect(l: Line): boolean {
        let tmx = Math.min(this.start.x, this.end.x),
            tmy = Math.min(this.start.y, this.end.y),
            lmx = Math.min(l.start.x, l.end.x),
            lmy = Math.min(l.start.y, l.end.y),
            tmxx = Math.max(this.start.x, this.end.x),
            tmxy = Math.max(this.start.y, this.end.y),
            lmxx = Math.max(l.start.x, l.end.x),
            lmxy = Math.max(l.start.y, l.end.y);

        if (lmx > tmx && lmx < tmxx && lmxy < tmxy && lmxy > tmy) {
        //    console.log(this + " intsq " + l);
            return true;
        }
        if (tmx > lmx && tmx < lmxx && tmxy < lmxy && tmxy > lmy) {
        //    console.log(this + " intsq " + l);
            return true;
        }

        return false;
    }

    vertices(): Point[] {
        return [this.start, this.end];
    }

    toPath(): string {
        return `M${this.start.x},${this.start.y}L${this.end.x},${this.end.y}Z`;
    }

    toString() { return `{"start":${this.start},"end":${this.end}}`; }

    eq(l: Line) {
        return (this.start.eq(l.start) && this.end.eq(l.end))
            || (this.start.eq(l.end) && this.end.eq(l.start));
    }
}
