type NumericalUnion = number[] | Int8Array | Int16Array | Int32Array | Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array | Float32Array | Float64Array;
type AnyNumerical = number[] & Int8Array & Int16Array & Int32Array & Uint8Array & Uint8ClampedArray & Uint16Array & Uint32Array & Float32Array & Float64Array;
type TypedArray = Int8Array & Int16Array & Int32Array & Uint8Array & Uint8ClampedArray & Uint16Array & Uint32Array & Float32Array & Float64Array;


interface NumericalArray {
  byteLength;
  
  new (number): NumericalArray;
  
  map;
  slice;
  reduce: (cb: (previousValue: number, currentValue: number, currentIndex: number, array: NumericalArray) => number) => number;
}

namespace errors {
  
  export class MismatchedShapes extends Error {
    constructor() {
      super("Array shapes do not match.")
    }
  }
  
  export class BadData extends Error {
    constructor() {
      super("Bad data.");
    }
  }
  
  export class DataNotArrayError extends Error {}
  
  export class DataNullOrNotNumeric extends Error {}
  
  export class BadShape extends Error {}
  
  export class MismatchedShapeSize extends Error {}
  
  export class WrongIterableSize extends Error {}
}

namespace utils {
  export function dot(array1, array2): number {
    return array1.reduce((a, b, i) => a + b * array2[i], 0);
  }
  
  export function arrayEqual(array1, array2) {
    if (array1.length !== array2.length) {
      return false;
    } else {
      return array1.reduce((a, b, i) => a && (b === array2[i]), true);
    }
  }
}

class tndarray {
  
  private data;
  private offset: Uint32Array;
  private stride: Uint32Array;
  private dstride: Uint32Array;
  private initial_offset: number;
  public shape: Uint32Array;
  public size: number;
  public dtype: string;
  
  /**
   * Computes the total size of the array from its shape.
   * @param {NumericalArray} shape
   * @return {number}
   * @private
   */
  private static _compute_size(shape: Uint32Array): number {
    return shape.reduce((a, b) => a * b);
  }
  
  /**
   *
   * @param dtype
   * @return {any}
   * @private
   */
  private static _dtype_map(dtype) {
    let array_type;
    switch (dtype) {
      case "int8":
        array_type = Int8Array;
        break;
      case "int16":
        array_type = Int16Array;
        break;
      case "int32":
        array_type = Int32Array;
        break;
      case "uint8":
        array_type = Uint8Array;
        break;
      case "uint8c":
        array_type = Uint8ClampedArray;
        break;
      case "uint16":
        array_type = Uint16Array;
        break;
      case "uint32":
        array_type = Uint32Array;
        break;
      case "float32":
        array_type = Float32Array;
        break;
      case "float64":
        array_type = Float64Array;
        break;
      default:
        array_type = Float64Array;
    }
    
    return array_type;
  }
  
  // TODO: MAX_INT checks on shape/size/etc.
  /**
   *
   * @param data
   * @param {Uint32Array} shape   -
   * @param {Uint32Array} offset  - The offset of the array from the start of the underlying data.
   * @param {Uint32Array} stride  - The stride of the array.
   * @param {Uint32Array} dstride - The stride of the underlying data.
   * @param {number} size
   * @param {string} dtype
   * @constructor
   */
  private constructor(data, shape: Uint32Array, offset: Uint32Array, stride: Uint32Array, dstride: Uint32Array, size: number, dtype?: string) {
    this.shape = shape;
    this.offset = offset;
    this.stride = stride;
    this.size = size;
    this.dstride = dstride;
    if (dtype !== undefined) {
      const array_type = tndarray._dtype_map(dtype);
      if (!(data instanceof array_type)) {
        this.data = new array_type(data);
      } else {
        this.data = data;
      }
      this.dtype = dtype;
    } else {
      this.data = data;
      this.dtype = "float64";
    }
    this.initial_offset = utils.dot(this.dstride, this.offset);
    
  }
  
  private _compute_real_index(indices) {
    return utils.dot(indices, this.stride) + this.initial_offset;
  }
  
  slice(...indices) {
  
  }
  
  /**
   *
   * @param indices
   * @return {any}
   */
  g(...indices) {
    const real_index = this._compute_real_index(indices);
    return this.data[real_index];
  }
  
  /**
   * Set an element of the array.
   * @param {number} value
   * @param indices
   */
  s(value: number, ...indices) {
    const real_index = this._compute_real_index(indices);
    this.data[real_index] = value;
  }
  
  /**
   * Returns the negation of this array.
   */
  neg(): tndarray {
    const new_data = this.data.map(x => -x);
    return tndarray.array(new_data, this.shape, {disable_checks: true, dtype: this.dtype});
  }
  
  /**
   * TODO: Broadcast
   * TODO: Work with arraylike
   * Adds two arrays.
   * @param {tndarray} array
   * @return {tndarray}
   */
  add(array: tndarray): tndarray {
    if (! utils.arrayEqual(this.shape, array.shape)) {
      throw new errors.MismatchedShapes();
    }
    const new_data = this.data.map((e, i) => e + array.data[i]);
    
    return tndarray.array(new_data, this.shape, {disable_checks: true, dtype: this.dtype});
  }
  
  /**
   * TODO: Broadcast
   * TODO: Work with arraylike
   * Subtract an array from another.
   * @param {tndarray} array  - The subtrahend
   * @return {tndarray}
   */
  sub(array: tndarray): tndarray {
    if (! utils.arrayEqual(this.shape, array.shape)) {
      throw new errors.MismatchedShapes();
    }
    const new_data = this.data.map((e, i) => e - array.data[i]);
  
    return tndarray.array(new_data, this.shape, {disable_checks: true, dtype: this.dtype});
  }
  
  /**
   * TODO: Axisify
   * Returns the maximum element of the array.
   * @param {number} axis
   * @return {number}
   */
  max(axis?: number): number {
    return Math.max(...this.data);
  }
  
  /**
   * TODO: Axisify
   * Returns the minimum element of the array.
   * @param {number} axis
   * @return {number}
   */
  min(axis?: number): number {
    return Math.min(...this.data);
  }
  
  /**
   *
   * @param data
   */
  private static _check_data(data) {
    if (!Array.isArray(data)) {
      throw new errors.DataNotArrayError();
    }
    
    if (!data.reduce((a, b) => (!isNaN(b) && b !== null) && a, true)) {
      throw new errors.DataNullOrNotNumeric();
    }
  }
  
  private static _is_numeric_array(array): boolean {
    if (!Array.isArray(array) && !ArrayBuffer.isView(array)) {
      return false;
    } else {
      return (<number[]>array).reduce((a, b) => (!isNaN(b) && b !== null) && a, true);
    }
  }
  
  private static _compute_shape(shape): Uint32Array {
    let final_shape;
    // Compute shapes.
    if (Number.isInteger(shape)) {
      final_shape = new Uint32Array([shape]);
    } else if (Array.isArray(shape)) {
      // TODO: Error is not a numerical array.
      if (shape.length === 0) {
        final_shape = new Uint32Array([0]);
      } else if (tndarray._is_numeric_array(shape)) {
        final_shape = new Uint32Array(shape);
      } else {
        throw new errors.BadShape();
      }
    } else {
      // TODO: Create custom error.
      throw new errors.BadShape();
    }
    return final_shape;
  }
  
  private static _check_shape(shape: any, data_length): Uint32Array {
    let final_shape;
    // Compute shapes.
    if (shape === undefined || shape === null) {
      final_shape = new Uint32Array([data_length]);
    } else {
      final_shape = tndarray._compute_shape(shape);
    }
    return final_shape;
  }
  
  /**
   * Produces a column-major stride from an array shape.
   * @param {Uint32Array} shape
   * @private
   */
  private static _stride_from_shape(shape: Uint32Array): Uint32Array {
    let stride = new Uint32Array(shape.length);
    stride[0] = 1;
    let i;
    for (i = 0; i < shape.length - 1; i++) {
      stride[i+1] = stride[i] * shape[i];
    }
    return stride;
  }
  
  /**
   *
   * @param iterable
   * @param shape
   * @param {string} dtype
   * @return {tndarray}
   */
  static from_iterable(iterable, shape, dtype?: string) {
    const final_shape = tndarray._compute_shape(shape);
  
    const size = tndarray._compute_size(final_shape);
    const array_type = tndarray._dtype_map(dtype);
    const data = new array_type(iterable);
    
    if (data.length !== size) {
      throw new errors.WrongIterableSize()
    }
    
    return tndarray.array(data, final_shape, {disable_checks: true, dtype: dtype});
  }
  /**
   * Produces an array of the desired shape filled with a single value.
   * @param {number} value                - The value to fill in.
   * @param shape - A numerical array or a number. If this is a number a one-dimensional array of that size is produced.
   * @param {string} dtype                - The data type to use for the array. float64 by default.
   * @return {tndarray}
   */
  static filled(value: number, shape, dtype?: string): tndarray {
    const final_shape = tndarray._compute_shape(shape);
    
    const size = tndarray._compute_size(final_shape);
    const array_type = tndarray._dtype_map(dtype);
    const data = new array_type(size).fill(value);
    
    return tndarray.array(data, final_shape, {disable_checks: true, dtype: dtype});
  }
  
  /**
   * A special case of filled that produces an array of zeros.
   * Implemented without actually calling filled, because TypedArray constructors initialize everything to 0 already.
   * @param {AnyNumerical} shape
   * @param {string} dtype
   * @return {tndarray}
   */
  static zeros(shape, dtype?: string) {
    const final_shape = tndarray._compute_shape(shape);
    const size = tndarray._compute_size(final_shape);
    const array_type = tndarray._dtype_map(dtype);
    const data = new array_type(size);
    
    return tndarray.array(data, final_shape, {disable_checks: true, dtype: dtype});
  }
  
  /**
   * A special called of filled that produces an array of ones.
   * @param {AnyNumerical | number} shape
   * @param {string} dtype
   * @return {tndarray}
   */
  static ones(shape, dtype?: string) : tndarray {
    return tndarray.filled(1, shape, dtype);
  }
  
  /**
   *
   * @param data
   * @param shape
   * @param options
   * @return {tndarray<number[] | Int8Array>}
   */
  static array(data, shape?, options?): tndarray {
    let final_shape;
    let size;
    let dtype;
    
    if (options && options.dtype) {
      dtype = options.dtype
    }
    
    if (options && options.disable_checks === true) {
      final_shape = shape;
      size = tndarray._compute_size(shape);
    } else {
      if (!tndarray._is_numeric_array(data)) {
        throw new errors.BadData();
      }
      
      final_shape = tndarray._check_shape(shape, data.length);
      
      // Compute size
      size = tndarray._compute_size(final_shape);
      
      if (size !== data.length) {
        throw new errors.MismatchedShapeSize()
      }
    }
  
    const stride = tndarray._stride_from_shape(final_shape);
    const offset = new Uint32Array(final_shape.length);
    const dstride = new Uint32Array(final_shape.length);
    
    return new tndarray(data, final_shape, offset, stride, dstride, size, dtype);
  }
}
export {tndarray, errors, utils};
