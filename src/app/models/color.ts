import {Model} from "./proto.model";

export class Color extends Model {
  r: number;
  g: number;
  b: number;
  a: number;
  constructor(r: number|string = null, g: number = null, b: number = null, a: number = null) {
    let data;
    if (typeof r === "string" || r > 256)
      data = Color.fromString("" + r);
    else
      data = {r: r, g: g, b: b, a: a};
    super(data);
  }

  static fromString(rgba: string): Color {
    let r, g, b, a = null;
    if (rgba.match(/(0x|rgb\(|rgba\()?[abcdef0-9]{8}\)?/))
      [, , r, g, b, a] = rgba.match(/(0x|rgb\(|rgba\()?([abcdef0-9]{2})([abcdef0-9]{2})([abcdef0-9]{2})([abcdef0-9]{2})\)?/);
    else if (rgba.match(/(0x|rgb\(|rgba\()?[abcdef0-9]{6}/))
      [, , r, g, b] = rgba.match(/(0x|rgb\(|rgba\()?([abcdef0-9]{2})([abcdef0-9]{2})([abcdef0-9]{2})([abcdef0-9]{2})\)?/);
    return <Color> {r: r, g: g, b: b, a: a};
  }
}
