/** Exact rational arithmetic. Never use display rounding to make decisions. */
export class Fraction {
  readonly n: bigint;
  readonly d: bigint;
  constructor(n: bigint | string | number, d: bigint | string | number = 1) {
    let a = BigInt(n),
      b = BigInt(d);
    if (!b) throw new Error("Zero denominator");
    if (b < 0n) {
      a = -a;
      b = -b;
    }
    let x = a < 0n ? -a : a,
      y = b;
    while (y) [x, y] = [y, x % y];
    this.n = a / x;
    this.d = b / x;
  }
  static parse(value: string): Fraction {
    if (!/^-?\d{1,40}(\/\d{1,40})?$/.test(value))
      throw new Error("Invalid fraction");
    const [n, d = "1"] = value.split("/");
    return new Fraction(n, d);
  }
  add(b: Fraction) {
    return new Fraction(this.n * b.d + b.n * this.d, this.d * b.d);
  }
  sub(b: Fraction) {
    return new Fraction(this.n * b.d - b.n * this.d, this.d * b.d);
  }
  mul(b: Fraction) {
    return new Fraction(this.n * b.n, this.d * b.d);
  }
  compare(b: Fraction) {
    const diff = this.n * b.d - b.n * this.d;
    return diff < 0n ? -1 : diff > 0n ? 1 : 0;
  }
  toString() {
    return this.d === 1n ? String(this.n) : `${this.n}/${this.d}`;
  }
  toJSON() {
    return this.toString();
  }
}
export const fraction = Fraction.parse;
export const sum = (values: string[]) =>
  values.reduce((a, b) => a.add(fraction(b)), fraction("0")).toString();
export const area = (share: string, total: string) =>
  fraction(share).mul(fraction(total)).toString();
