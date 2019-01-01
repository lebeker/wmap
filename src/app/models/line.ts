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
//                    if (Number.isNaN(p0.x))
                        console.log("NAN? :", p0);
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
}
