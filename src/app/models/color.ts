import {Model} from "./proto.model";

export class Color extends Model {
    r: number;
    g: number;
    b: number;
    a: number;

    h: number;
    s: number;
    l: number;

    /**
     * @todo check ir passed string ~ "rgba(12,36,124,1)" something goes wrong;
     *
     * @param r - red or full color string
     * @param g - green
     * @param b - blue
     * @param a - alpha
     */
    constructor(r: number | string = null, g: number = null, b: number = null, a: number = 1) {
        let data;
        if (typeof r === "string" || r > 256)
            data = Color.fromString("" + r);
        else
            data = {r: r, g: g, b: b, a: a};
        super(data);
        this._RGBtoHSL();
    }

    static random(): Color {
        return new Color(Math.random() * 255, Math.random() * 255, Math.random() * 255);
    }

    static fromString(rgba: string): Color {
        let r, g, b, a = null;
        if (rgba.match(/(0x|rgb\(|rgba\()?[abcdef0-9]{8}\)?/))
            [, , r, g, b, a] = rgba.match(/(0x|rgb\(|rgba\()?([abcdef0-9]{2})([abcdef0-9]{2})([abcdef0-9]{2})([abcdef0-9]{2})\)?/);
        else if (rgba.match(/(0x|rgb\(|rgba\()?[abcdef0-9]{6}/))
            [, , r, g, b] = rgba.match(/(0x|rgb\(|rgba\()?([abcdef0-9]{2})([abcdef0-9]{2})([abcdef0-9]{2})([abcdef0-9]{2})\)?/);
        if (rgba.match(/^0x/))
            [r, g, b, a] = [r, g, b, a].map(v => +("0x" + v));

        return <Color>{r: r, g: g, b: b, a: a};
    }

    toString() {
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
    }

    setRGBA(r: number, g: number, b: number, a: number = 1) {
        this.populate({r: r, g: g, b: b, a: a});
        this._RGBtoHSL();
    }

    setH(h) { this.setHSL(h, this.s, this.l); }
    setS(s) { this.setHSL(this.h, s, this.l); }
    setL(l) { this.setHSL(this.h, this.s, l); }

    setHSL(hue, saturation, lightness) {
        this.h = hue;
        this.s = saturation;
        this.l = lightness;
        this._HSLtoRGB();
    }

    protected _HSLtoRGB() {
        let sat = this.s,
            light = this.l,
            C = sat * (1 - Math.abs(2 * light - 1)),
            H = this.h / 60,
            X = C * (1 - Math.abs(H % 2 - 1)),
            m = light - C / 2,
            precision =  255;

        C = (C + m) * precision | 0 ;
        X = (X + m) * precision | 0;
        m = m * precision | 0;

        if (H >= 0 && H < 1) {	this.populate({r: C, g: X, b: m});	return; }
        if (H >= 1 && H < 2) {	this.populate({r: X, g: C, b: m});	return; }
        if (H >= 2 && H < 3) {	this.populate({r: m, g: C, b: X});	return; }
        if (H >= 3 && H < 4) {	this.populate({r: m, g: X, b: C});	return; }
        if (H >= 4 && H < 5) {	this.populate({r: X, g: m, b: C});	return; }
        if (H >= 5 && H < 6) {	this.populate({r: C, g: m, b: X});	return; }
    }

    protected _RGBtoHSL() {
        let red		= this.r / 255,
            green	= this.g / 255,
            blue	= this.b / 255,

            cmax = Math.max(red, green, blue),
            cmin = Math.min(red, green, blue),
            delta = cmax - cmin,
            hue = 0,
            saturation = 0,
            lightness = (cmax + cmin) / 2,
            X = (1 - Math.abs(2 * lightness - 1));

        if (delta) {
            if (cmax === red ) { hue = ((green - blue) / delta); }
            if (cmax === green ) { hue = 2 + (blue - red) / delta; }
            if (cmax === blue ) { hue = 4 + (red - green) / delta; }
            if (cmax) saturation = delta / X;
        }

        this.h = 60 * hue | 0;
        if (this.h < 0) this.h += 360;
        this.s = ((saturation * 100) | 0) / 100;
        this.l = ((lightness * 100) | 0) / 100;
    }
}
