import {Model} from "./proto.model";
import {Color} from "./color";
import {Line} from "./line";

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

    toSvg(): string {
        return "";
    }
}
