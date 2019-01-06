import * as d3 from "d3";
import {Component, EventEmitter, Input, Output} from "@angular/core";
import {Color} from "../../models/color";
import {DomSanitizer, SafeStyle} from "@angular/platform-browser";

@Component({
    selector: "wmap-color-picker",
    templateUrl: "./color.picker.component.html",
    styleUrls: ["./color.picker.component.scss"]
})
export class ColorPickerComponent {
    @Input()
    visible = false;
    @Output()
    visibleChange = new EventEmitter();
    @Input()
    color: Color;
    @Output()
    colorChange = new EventEmitter<Color>();

    inEdit = false;

    constructor(private _sanitizer: DomSanitizer) {}

    changed() {
        this.colorChange.emit(this.color);
    }

    close(e) {
        this.visible = false;
        this.visibleChange.emit(false);
    }

    get rgba(): string {
        return this.color.toString();
    }

    get alphaGradient(): SafeStyle {
        let color0 = (new Color(this.color.r, this.color.g, this.color.b)).populate({a: 0});
        return this._sanitizer.bypassSecurityTrustStyle(
            "linear-gradient(to bottom," + this.color + " , " + color0 + ")"
        );
    }

    get ph() { return (200 * this.color.h / 360) + "px"; }
    get pa() { return (177 * (1 - this.color.a)) + "px"; }
    get psl() {
        return {
            x : (177 * this.color.s) + "px",
            y : (177 * (1 - this.color.l)) + "px"
        };
    }

    mdown() { this.inEdit = true; }
    mup() { this.inEdit = false; }

    updSL(e) {
        if (!this.inEdit) return;
        if (e.target.getAttribute("class").search(/pointer/) !== -1) return;
        this.color.setHSL(this.color.h, e.offsetX / 177, (177 - e.offsetY) / 177);
        this.changed();
    }

    updH(e) {
        if (!this.inEdit) return;
        if (e.target.getAttribute("class").search(/pointer/) !== -1) return;
        this.color.setHSL(360 * e.offsetX / 200, this.color.s, this.color.l);
        this.changed();
    }
}
