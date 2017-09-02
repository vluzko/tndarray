
// type NumericalArray = number[] | Int8Array | Int16Array | Int32Array | Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array | Float32Array | Float64Array;
interface NumericalArray {
  new (number) : NumericalArray;
  map;
  reduce: (cb: (previousValue :number, currentValue: number, currentIndex: number, array: NumericalArray) => number) => number;
}

class ndarray {
  private data;
  private offset;
  private stride;
  public shape;
  
  /**
   * Computes the total size of the array from its shape.
   * @param {NumericalArray} shape
   * @return {number}
   * @private
   */
  private static _compute_size(shape: NumericalArray): number {
    return shape.reduce((a,b) => a*b);
  }
  
  /**
   *
   * @param dtype
   * @return {any}
   * @private
   */
  private static _dtype_map(dtype): NumericalArray {
    let array_type;
    switch(dtype) {
      case "int8": array_type = Int8Array; break;
      case "int16": array_type = Int16Array; break;
      case "int32": array_type = Int32Array; break;
      case "uint8": array_type = Uint8Array; break;
      case "uint8c": array_type = Uint8ClampedArray; break;
      case "uint16": array_type = Uint16Array; break;
      case "uint32": array_type = Uint32Array; break;
      case "float32": array_type = Float32Array; break;
      case "float64": array_type = Float64Array; break;
    }
    
    return array_type;
  }
  
  private constructor(data, shape: NumericalArray) {
    this.data = data;
    this.shape = shape;
    this.offset = (shape).map(() => 0);
  }
  
  static fromIterable(iterable, shape: NumericalArray) {
  
  }
  
  static fromBuffer() {
  
  }
  
  static fromArray(array, shape: NumericalArray, dtype?: string) {
    return new ndarray(array, shape);
  }
  
  static zeroes(shape: NumericalArray, dtype?: string) {
    const size = ndarray._compute_size(shape);
    let data;
    if (dtype === undefined) {
      data = new Int32Array(size);
    } else {
      const constructor = ndarray._dtype_map(dtype);
      return new constructor(size);
    }
  }
  
  g(...indices) {
  
  }
}
