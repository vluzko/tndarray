type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array| Int32Array | Uint32Array | Float32Array | Float64Array;
type Numeric = TypedArray | number[];
type Broadcastable = number | TypedArray | tndarray | number[];
type Shape = number[] | Uint32Array;

interface NumericalArray {
  byteLength;
  map;
  slice;
  reduce: (cb: (previousValue: number, currentValue: number, currentIndex: number, array: NumericalArray) => number) => number;
  
  new (number): NumericalArray;
}

interface ArrayOptions {
  dtype?: string
  disable_checks?: boolean
}

namespace errors {
  export class MismatchedSizes extends Error {
    constructor() {
      super("Array sizes do not match.")
    }
  }
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
  export class NestedArrayHasInconsistentDimensions extends Error {}
}

namespace  temp {
  export function ab() {}
}

export namespace utils {
  /**
   * TODO: Move to a static function in tndarray
   * @param array1
   * @param array2
   * @return {number}
   */
  export function dot(array1, array2): number {
    return array1.reduce((a, b, i) => a + b * array2[i], 0);
  }
  
  /**
   * TODO: Move to a static function in tndarray
   * @param array1
   * @param array2
   * @return {boolean}
   */
  export function array_equal(array1, array2) {
    if (array1.length !== array2.length) {
      return false;
    } else {
      return array1.reduce((a, b, i) => a && (b === array2[i]), true);
    }
  }
  
  /**
   * TODO: Test
   * Checks whether a value is a number and isn't null.
   * @param value - The value to check.
   * @return {boolean}
   */
  export function is_numeric(value: any): value is number {
    return !isNaN(value) && value !== null;
  }
  
  export function zip_iterable(...iters: Iterator<number>[]): Iterable<number[]> {
    let iterators = iters.map(e => e[Symbol.iterator]());
    
    let iter = {
    };
    iter[Symbol.iterator] = function*() {
      let all_done = false;
      while (!all_done) {
        let results = [];
        iterators.forEach(e => {
          let {value, done} = e.next();
          if (done) {
            all_done = true;
          }
          results.push(value);
        });
        
        if (!all_done) {
          yield results;
        }
      }
    };
    
    return <Iterable<number[]>> iter;
  }
  
  // TODO: Test
  /**
   * Check if value is an ArrayBuffer
   * @param value
   * @return {boolean}
   */
  export function is_typed_array(value: any): value is TypedArray {
    return !!(value.buffer instanceof ArrayBuffer && value.BYTES_PER_ELEMENT);
  }
  
  /**
   * Subtract two typed arrays. Should only be called on typed array that are guaranteed to be the same size.
   * @param {TypedArray} a
   * @param {TypedArray} b
   * @return {TypedArray}
   * @private
   */
  export function _typed_array_sub(a: TypedArray, b: TypedArray) {
    // @ts-ignore
    return a.map((e, i) => e - b[i]);
  }
  
}

export class tndarray {
  
  private data;
  readonly offset: Uint32Array;
  readonly stride: Uint32Array;
  readonly dstride: Uint32Array;
  readonly initial_offset: number;
  public shape: Uint32Array;
  public length: number;
  public dtype: string;
  public is_view: boolean;
  
  /**
   *
   * @param data
   * @param {Uint32Array} shape   - The shape of the array.
   * @param {Uint32Array} offset  - The offset of the array from the start of the underlying data.
   * @param {Uint32Array} stride  - The stride of the array.
   * @param {Uint32Array} dstride - The stride of the underlying data.
   * @param {number} size         - The number of elements in the array.
   * @param {string} dtype
   * @constructor
   */
  private constructor(data,
                      shape: Uint32Array,
                      offset: Uint32Array,
                      stride: Uint32Array,
                      dstride: Uint32Array,
                      size: number,
                      dtype?: string) {
    this.shape = shape;
    this.offset = offset;
    this.stride = stride;
    this.length = size;
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
    this.is_view = false;
  }
  
  add() {
  
  }
  
  all() {}
  
  any() {}
  
  argmax() {}
  
  argmin() {}
  
  argpartition() {}
  
  argsort() {}
  
  as_type(dtype: string) {}
  
  clip(lower: number, upper: number): tndarray {
    return this.map(e => {
      if (e < lower) {
        return lower;
      } else if (e > upper) {
        return upper;
      } else {
        return e;
      }
    });
  }
  
  /**
   * The cumulative product along the given axis.
   * @param {number} axis
   * @param {string} dtype
   * @return {number | tndarray}
   */
  cumprod(axis?: number, dtype?: string): number | tndarray {
    return this.accum_map((acc, b) => acc * b, axis, undefined, dtype);
  }
  
  /**
   * The cumulative sum of the array along the given axis.
   * @param {number} axis
   * @param {string} dtype
   */
  cumsum(axis?: number, dtype?: string): number | tndarray {
    return this.accum_map((acc, b) => acc + b, axis, undefined, dtype);
  }
  
  diagonal() {}
  
  dot() {}
  
  /**
   * Fill the array with value, in-place.
   * @param {number} value  - The value to fill the array with
   * @return {tndarray}     - The filled array.
   */
  fill(value: number) {
    for (let i = 0; i < this.data.length; i++) {
      this.data[i] = value;
    }
    return this;
  }
  
  flatten() {}
  
  /**
   * Returns the maximum element of the array.
   * @param {number} axis
   * @return {number}
   */
  max(axis?: number): tndarray | number {
    return this.apply_to_axis(e => Math.max(...e), axis);
  }
  
  /**
   * Calculate the mean of the array.
   * @param {number} axis
   */
  mean(axis?: number): tndarray | number {
    if (axis === undefined) {
      return <number> this.sum() / this.length;
    } else {
      return tndarray._div(this.sum(axis), this.shape[axis]);
    }
  }
  
  /**
   * Returns the minimum element of the array along the specified axis.
   * @param {number} axis
   * @return {number}
   */
  min(axis?: number): tndarray | number {
    return this.apply_to_axis(e => Math.min(...e), axis);
  }
  
  /**
   * Returns the indices of the nonzero elements of the array.
   */
  nonzero(): Uint32Array[] {
    let indices = [];
    for (let index of this._index_iterator()) {
      const real_value = this._compute_real_index(index);
      if (this.data[real_value] !== 0) {
        indices.push(index)
      }
    }
    return indices
  }
  
  partition() {}
  
  /**
   * Compute an element-wise power.
   * @param {number} exp
   */
  power(exp: number ) {
    return this.map(e => Math.pow(e, exp));
  }
  
  prod() {}
  
  /**
   * Create a copy of this with a different shape.
   * @param {Uint32Array} new_shape - The shape to make the new array.
   * @return {tndarray}             - The reshaped array.
   */
  reshape(new_shape: Uint32Array | number[]): tndarray {
    if (Array.isArray(new_shape)) {
      new_shape = new Uint32Array(new_shape);
    }
    const new_size = tndarray._compute_size(new_shape);
    const size = tndarray._compute_size(this.shape);
    if (size !== new_size) {
      throw new errors.BadShape(`Array cannot be reshaped because sizes do not match. Size of underlying array: ${size}. Size of reshaped array: ${new_shape}`);
    }
    let value_iter = this._value_iterator();
    return tndarray.from_iterable(value_iter, new_shape, this.dtype);
  }
  
  round() {}
  
  sort() {}
  
  squeeze() {}
  
  // TODO: Axes
  /**
   * Return the standard deviation along the specified axis.
   * @param {number} axis
   * @return {number}
   */
  stdev(axis?: number): number {
    const mean = this.mean();
    throw Error("Not implemented");
  }
  
  // TODO: Axes
  /**
   * Sum the entries of the array along the specified axis.
   * @param {number} axis
   * @return {number}
   */
  sum(axis?: number): number | tndarray {
    return this.reduce((a, e) => a + e, axis);
  }
  
  trace() {}
  
  /**
   * Return a slice of an array. Copies the underlying data.
   * @param indices
   */
  c_slice(...indices) {
  
  }
  
  /**
   * Return a slice of an array. Does not copy the underlying data.
   * @param indices
   */
  slice(...indices) {
  
  }
  
  /**
   *
   * @param indices
   * @return {any}
   */
  g(indices) {
    const real_index = this._compute_real_index(indices);
    return this.data[real_index];
  }
  
  /**
   * Set an element of the array.
   * @param {number} value
   * @param indices
   */
  s(value: number, indices) {
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
   * Map the array.
   * @param f
   * @param {number} axis
   * @return {tndarray}
   */
  map(f, axis?: number): tndarray {
    const new_data = this.data.map(f);
    return tndarray.array(new_data, this.shape, {disable_checks: true, dtype: this.dtype})
  }
  
  /**
   * Subtract a broadcastable value from this.
   * @param {Broadcastable} b - Value to subtract.
   * @return {number | tndarray}
   */
  sub(b: Broadcastable) {
    return tndarray._sub(this, b);
  }
  
  /**
   * Accumulating map over the entire array or along a particular axis.
   * If no axis is provided a flat array is returned.
   * Otherwise the shape of the result is the same as the shape of the original array.
   * @param f - Function to use.
   * @param {number} axis - Axis to map over.
   * @param {number} start  - Initial value.
   * @param {string} dtype  - Dtype of the result array.
   * @return {tndarray | number}
   */
  accum_map(f, axis?: number, start?: number, dtype?: string): tndarray | number {
    dtype = dtype === undefined ? this.dtype : dtype;
    let new_array;
    if (axis === undefined) {
      const data_type = tndarray._dtype_map(dtype);
      // TODO: Views: Use size of view.
      new_array = tndarray.zeros(this.length, dtype);
      let first_value;
      if (start !== undefined) {
        first_value = f(start, this.data[0])
      } else {
        first_value = this.data[0]
      }
      
      new_array.data[0] = first_value;
      let previous_index = 0;
      let index_in_new = 0;
      for (let index of this._real_index_iterator()) {
        new_array.data[index_in_new] = f(new_array.data[previous_index], this.data[index]);
        previous_index = index_in_new;
        index_in_new += 1;
      }
    } else {
      const [lower, upper, steps] = tndarray._slice_for_axis(this, axis);
      new_array = tndarray.zeros(this.shape, dtype);
      const step_along_axis = this.stride[axis];
      
      for (let index of this._real_index_iterator(lower, upper, steps)) {
        let first_value;
        if (start !== undefined) {
          first_value = f(start, this.data[index]);
        } else {
          first_value = this.data[index];
        }
        new_array.data[index] = first_value;
        let previous_index = index;
        for (let i = 1; i < this.shape[axis]; i++) {
          const new_index = index + i * step_along_axis;
          new_array.data[new_index] = f(new_array.data[previous_index], this.data[new_index]);
          previous_index = new_index;
        }
      }
    }
    return new_array;
  }
  
  /**
   * Apply the given function along the given axis.
   * @param {(a: (TypedArray | number[])) => any} f
   * @param {number} axis
   * @param {string} dtype
   * @return {tndarray | number}
   */
  apply_to_axis(f: (a: TypedArray | number[]) => any, axis?: number, dtype?: string): tndarray | number {
    dtype = dtype === undefined ? this.dtype : dtype;
    if (axis === undefined) {
      return f(this.data);
    } else {
      const new_shape = tndarray._new_shape_from_axis(this.shape, axis);
      let new_array = tndarray.zeros(new_shape, dtype);
      const step_along_axis = this.stride[axis];
      for (let [old_index, new_index] of tndarray._true_index_iterator_over_axes(this, axis)) {
        let axis_values = [];
        for (let i = 0; i < this.shape[axis]; i ++) {
          axis_values.push(this.data[old_index + i * step_along_axis]);
        }
        
        new_array.data[new_index] = f(axis_values);
      }
    
      return new_array;
    }
  }
  
  /**
   * Reduce the array over the specified axes with the specified function.
   * @param {(number, number, number?, array?) => number} f
   * @param {number} axis
   * @param {string} dtype
   */
  reduce(f: (accum: number, e: number, i?: number, array?) => number, axis?: number, dtype?: string): number | tndarray {
    dtype = dtype === undefined ? this.dtype : dtype;
    
    if (axis === undefined) {
      const new_data = this.data.reduce(f);
      return tndarray.array(new_data, this.shape, {dtype: dtype})
    } else {
      const new_shape = tndarray._new_shape_from_axis(this.shape, axis);
      let new_array = tndarray.zeros(new_shape, dtype);
      const step_along_axis = this.stride[axis];
      for (let [old_index, new_index] of tndarray._true_index_iterator_over_axes(this, axis)) {
        let accum = this.data[old_index];
        for (let i = 1; i < this.shape[axis]; i ++) {
          accum = f(accum, this.data[old_index + i * step_along_axis]);
        }
  
        new_array.data[new_index] = accum;
      }
      
      return new_array;
    }
  }
  
  /**
   * Return true if this array equals the passed array, false otherwise.
   * @param {tndarray} a  - The array to compare against.
   * @return {boolean}
   */
  equals(a: tndarray) {
    return tndarray.equals(this, a);
  }
  
  /**
   * Computes the index of a value in the underlying data array based on a passed index.
   * @param indices
   * @return {number} - The index
   * @private
   */
  private _compute_real_index(indices): number {
    return tndarray._index_in_data(indices, this.stride, this.initial_offset);
  }
  
  /**
   * Computes the total length of the array from its shape.
   * @param {NumericalArray} shape
   * @return {number}
   * @private
   */
  private static _compute_size(shape: Uint32Array): number {
    return shape.reduce((a, b) => a * b);
  }
  
  /**
   * Convert a dtype string to the corresponding TypedArray.
   * @param dtype
   * @return {any}
   * @private
   */
  private static _dtype_map(dtype: string) {
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
  
  /**
   * Check that the value is valid tndarray data.
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
  
  /**
   * Checks whether a value is an array(like) of numbers.
   * @param array
   * @return {boolean}
   * @private
   */
  private static _is_numeric_array(array): boolean {
    if (!Array.isArray(array) && !ArrayBuffer.isView(array)) {
      return false;
    } else {
      return (<number[]>array).reduce((a, b) => utils.is_numeric(b) && a, true);
    }
  }
  
  /**
   * Compute a shape array from a shape parameter.
   * @param shape
   * @return {Uint32Array}
   * @private
   */
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
    } else if (ArrayBuffer.isView(shape)) {
      final_shape = shape;
    } else {
      throw new errors.BadShape("Shape must be an int, an array of numbers, or a TypedArray.");
    }
    return final_shape;
  }
  
  /**
   * Compute the final shape for the new ndarray.
   * @param shape
   * @param data_length
   * @return {Uint32Array}
   * @private
   */
  private static _compute_final_shape(shape: any, data_length): Uint32Array {
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
      stride[i + 1] = stride[i] * shape[i];
    }
    return stride;
  }
  
  /**
   * Checks that the inputs have a `length` property, and that their lengths are equal.
   * @param value1
   * @param value2
   * @return {boolean}
   * @private
   */
  private static _lengths_exist_and_match(value1: any, value2: any): boolean {
    return value1.length !== undefined && value1.length === value2.length;
  }
  
  /**
   *
   * @param {string} a  - The first dtype.
   * @param {string} b  - The second dtype.
   * @return {string} - The smallest dtype that can contain a and b without losing data.
   * @private
   */
  private static _dtype_join(a: string, b: string): string {
    // type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array| Int32Array | Uint32Array | Float32Array | Float64Array;
    const ordering = [["int8", "uint8", "uint8c"], ["int16", "uint16"], ["int32", "uint32", "float32"], ["float64"]];
    const a_index = ordering.reduce((acc, e, i) => e.indexOf(a) === -1 ? acc : i, -1);
    const b_index = ordering.reduce((acc, e, i) => e.indexOf(b) === -1 ? acc : i, -1);
    if (a === b) {
      return a;
    } else if (a_index === b_index) {
       return ordering[a_index + 1][0];
    } else if (a_index < b_index) {
      return b;
    } else {
      return a;
    }
  }
  
  /**
   * Returns a tndarray if a or b are tndarrays, returns the raw data otherwise.
   * @param a - The first value used to produce `new_data`. Has priority.
   * @param b - The second value used to produce `new_data`.
   * @param new_data  - The actual data.
   * @return {any}
   * @private
   */
  private static _upcast_data(a, b, new_data) {
    if (a instanceof tndarray) {
      return tndarray.array(new_data, a.shape, {disable_checks: true, dtype: a.dtype});
    } else if (b instanceof tndarray) {
      return tndarray.array(new_data, b.shape, {disable_checks: true, dtype: b.dtype});
    } else {
      return new_data;
    }
    
  }
  
  /**
   * Convert a broadcastable value to a tndarray.
   * @param {Broadcastable} value - The value to convert. Numbers will be converted to 1x1 tndarrays, TypedArrays will be 1xn, and tndarrays will be left alone.
   * @return {tndarray}           - The resulting tndarray.
   * @private
   */
  private static _upcast_to_tndarray(value: Broadcastable): tndarray {
    let a_array;
    if (utils.is_numeric(value)) {
      a_array = tndarray.array(new Uint32Array([value]), new Uint32Array([1]), {disable_checks: true});
    } else if (utils.is_typed_array(value)) {
      a_array = tndarray.array(value, new Uint32Array([value.length]), {disable_checks: true});
    } else {
      a_array = value;
    }
    return a_array;
  }
  
  /**
   * Create a function that converts indices to the broadcast array to indices to the input array.
   * @param {Uint32Array} new_shape                 - The shape of the broadcast array.
   * @param {Uint32Array} array_shape               - The shape of the input array.
   * @return {(index: Uint32Array) => Uint32Array}  - The index converter.
   * @private
   */
  private static _broadcast_indexer(new_shape: Uint32Array, array_shape: Uint32Array) {
    const first_elem = new_shape.length - array_shape.length;
    return function(index: Uint32Array) {
      return index.slice(first_elem).map((e, i) => Math.min(e, array_shape[i] - 1));
    }
  }
  
  /**
   * Calculate the shape from broadcasting two arrays together.
   * @param {tndarray} a    - First array.
   * @param {tndarray} b    - Second array.
   * @return {Uint32Array}  - Shape of the broadcast array.
   * @private
   */
  private static _broadcast_dims(a: tndarray, b: tndarray) {
    let a_number_of_dims = a.shape.length;
    let b_number_of_dims = b.shape.length;
  
    const number_of_dimensions = Math.max(a_number_of_dims, b_number_of_dims);
    const new_dimensions = new Uint32Array(number_of_dimensions);
    
    for (let j = 1; j <= number_of_dimensions; j++) {
      let a_axis_size = a_number_of_dims - j >= 0 ? a.shape[a_number_of_dims - j] : 1;
      let b_axis_size = b_number_of_dims - j >= 0 ? b.shape[b_number_of_dims - j] : 1;
    
      let dimension;
    
      // If the axes match in size, that is the broadcasted dimension.
      if (a_axis_size === b_axis_size) {
        dimension = a_axis_size;
      } else if (a_axis_size === 1) { // If either dimension is 1, use the other.
        dimension = b_axis_size;
      } else if (b_axis_size === 1) {
        dimension = a_axis_size;
      } else {
        throw new errors.BadShape(`Unbroadcastable shapes. a: ${a.shape}. b: ${b.shape}. Failed on axis: ${j}. Computed axes are: ${a_axis_size}, ${b_axis_size}`);
      }
      new_dimensions[number_of_dimensions - j] = dimension;
    }
    
    return new_dimensions;
  }
  
  /**
   * Broadcast two values together.
   * Works like numpy broadcasting.
   * @param {Broadcastable} a - The first broadcastable value.
   * @param {Broadcastable} b - The second broadcastable value.
   * @return {[IterableIterator<number[]>, Uint32Array, string]}  - An iterator over that returns a tuple (a_i, b_i) of broadcasted values, the new shape, and the new dtype.
   * @private
   */
  private static _broadcast_by_index(a: Broadcastable, b: Broadcastable): [IterableIterator<[number, number, Uint32Array]>, Uint32Array, string] {
    
    let a_array = tndarray._upcast_to_tndarray(a);
    let b_array = tndarray._upcast_to_tndarray(b);
    
    const new_dimensions = tndarray._broadcast_dims(a_array, b_array);
    const new_dtype = tndarray._dtype_join(a_array.dtype, b_array.dtype);
    let index_iter = tndarray._slice_iterator(new_dimensions);
    
    const a_indexer = tndarray._broadcast_indexer(new_dimensions, a_array.shape);
    const b_indexer = tndarray._broadcast_indexer(new_dimensions, b_array.shape);
    
    let iter = {};
    iter[Symbol.iterator] = function* () {
      for (let index of index_iter) {
        let a_val = a_array.g(a_indexer(index));
        let b_val = b_array.g(b_indexer(index));
        yield [a_val, b_val, index];
      }
    };
    
    return [<IterableIterator<[number, number, Uint32Array]>>iter, new_dimensions, new_dtype];
  }
  
  private static _broadcast(a: Broadcastable, b: Broadcastable): [IterableIterator<[number, number, Uint32Array]>, Uint32Array, string] {
    
    let a_array = tndarray._upcast_to_tndarray(a);
    let b_array = tndarray._upcast_to_tndarray(b);
    
    const new_dimensions = tndarray._broadcast_dims(a_array, b_array);
    const new_dtype = tndarray._dtype_join(a_array.dtype, b_array.dtype);
    let index_iter = tndarray._slice_iterator(new_dimensions);
    
    const a_indexer = tndarray._broadcast_indexer(new_dimensions, a_array.shape);
    const b_indexer = tndarray._broadcast_indexer(new_dimensions, b_array.shape);
    
    let iter = {};
    iter[Symbol.iterator] = function* () {
      for (let index of index_iter) {
        let a_val = a_array.g(a_indexer(index));
        let b_val = b_array.g(b_indexer(index));
        yield [a_val, b_val, index];
      }
    };
    
    return [<IterableIterator<[number, number, Uint32Array]>>iter, new_dimensions, new_dtype];
  }
  
  /**
   * Computes the size of a slice.
   * @param lower_bounds
   * @param upper_bounds
   * @param steps
   * @private
   */
  private static _compute_slice_size(lower_bounds: Uint32Array, upper_bounds: Uint32Array, steps: Uint32Array): number {
    const ranges = utils._typed_array_sub(upper_bounds, lower_bounds);
    const values = ranges.map((e, i) => Math.ceil(e / steps[i]));
    return values.reduce((a, e) => a * e, 1);
  }
  
  /**
   *
   * @param {Uint32Array} indices
   * @param {Uint32Array} stride
   * @param {number} initial_offset
   * @return {number}
   * @private
   */
  private static _index_in_data(indices: Uint32Array, stride: Uint32Array, initial_offset: number): number {
    return utils.dot(indices, stride) + initial_offset;
  }
  
  /**
   * Iterate over the indices of a slice.
   * Coordinates are updated last dimension first.
   * @param {Uint32Array} lower_or_upper  - If no additional arguments are passed, this is treated as the upper bounds of each dimension.
   *                                        with lower bound [0]*n and step size [1]*n.
   *                                        Otherwise, this is the lower bounds of each dimension.
   * @param {Uint32Array} upper_bounds    - The upper bounds of each dimension. If this is not passed the first argument is treated as
   *                                        the upper bounds and the lower bounds default to [0]*n.
   * @param {Uint32Array} steps           - The size of step to take along each dimension. Defaults to [1]*n if not passed.
   * @return {Iterable<any>}
   * @private
   */
  private static _slice_iterator(lower_or_upper: Uint32Array, upper_bounds?: Uint32Array, steps?: Uint32Array): Iterable<Uint32Array> {
    
    if (steps === undefined) {
      steps = new Uint32Array(lower_or_upper.length);
      steps.fill(1);
    }
    
    if (upper_bounds === undefined) {
      upper_bounds = lower_or_upper;
      lower_or_upper = new Uint32Array(upper_bounds.length);
    }
    
    let iter = {};
    const size = tndarray._compute_slice_size(lower_or_upper, upper_bounds, steps);
    const end_dimension = upper_bounds.length - 1;
    iter[Symbol.iterator] = function* () {
      
      let current_index = lower_or_upper.slice();
      let count = 0;
      
      // Equivalent to stopping when the maximum index is reached, but saves actually checking for array equality.
      for (let i = 0; i < size; i++) {
        // Yield a copy of the current index.
        yield current_index.slice();
        
        ++current_index[end_dimension];
        
        // Carry the ones.
        let current_dimension = end_dimension;
        while (current_dimension >= 0 && (current_index[current_dimension] === upper_bounds[current_dimension])) {
          current_index[current_dimension] = lower_or_upper[current_dimension];
          current_dimension--;
          current_index[current_dimension] += steps[current_dimension];
        }
        
        count++;
      }
    };
    return <Iterable<Uint32Array>> iter
  }
  
  // TODO: Make recursive
  /**
   * Create an iterator over the real indices of the array.
   * Equivalent to calling _compute_real_index on result of _slice_iterator, but faster.
   * @param {Uint32Array} lower_or_upper
   * @param {Uint32Array} upper_bounds
   * @param {Uint32Array} steps
   * @return {Iterable<number>}
   * @private
   */
  private _real_index_iterator(lower_or_upper?: Uint32Array, upper_bounds?: Uint32Array, steps?: Uint32Array): Iterable<number> {
    
    if (lower_or_upper === undefined) {
      lower_or_upper = this.shape;
    }
    
    if (steps === undefined) {
      steps = new Uint32Array(lower_or_upper.length);
      steps.fill(1);
    }
    
    if (upper_bounds === undefined) {
      upper_bounds = lower_or_upper;
      lower_or_upper = new Uint32Array(upper_bounds.length);
    }
    
    let iter = {};
    const upper_inclusive = upper_bounds.map(e => e - 1);
    const start = this._compute_real_index(lower_or_upper);
    const step = this.stride[this.stride.length - 1];
    const end = this._compute_real_index(upper_inclusive);
    const index_stride = this.stride.slice(0, -1);
    let starting_indices = tndarray._slice_iterator(lower_or_upper.slice(0, -1), upper_bounds.slice(0, -1), steps.slice(0, -1));
    
    iter[Symbol.iterator] = function* () {
      for (let starting_index of starting_indices) {
        
        let current_index = utils.dot(starting_index, index_stride) + start;
        while (current_index <= end) {
          yield current_index;
          current_index += step;
        }
      }
    };
    return <Iterable<number>> iter;
  }
  
  /**
   * Compute lower, upper, and steps for a slice of `full_array` along `axis`.
   * @param {tndarray} full_array
   * @param {number} axis
   * @return {[Uint32Array, Uint32Array, Uint32Array]}  - [lower, upper, steps]
   * @private
   */
  private static _slice_for_axis(full_array: tndarray, axis: number): [Uint32Array, Uint32Array, Uint32Array] {
    let lower = new Uint32Array(full_array.shape.length);
    let upper = full_array.shape.slice(0);
    let steps = new Uint32Array(full_array.shape.length);
    steps.fill(1);
    upper[axis] = 1;
    return [lower, upper, steps];
  }
  
  /**
   * Return an iterator over real indices of the old array and real indices of the new array.
   * @param {tndarray} full_array
   * @param {number} axis
   * @return {Iterable<number[]>}
   * @private
   */
  private static _true_index_iterator_over_axes(full_array: tndarray, axis: number): Iterable<number[]> {
    const new_shape = tndarray._new_shape_from_axis(full_array.shape, axis);
    let new_array = tndarray.zeros(new_shape, full_array.dtype);
    
    let [lower, upper, steps] = tndarray._slice_for_axis(full_array, axis);
  
    let old_iter = full_array._real_index_iterator(lower, upper, steps)[Symbol.iterator]();
    let new_iter = new_array._real_index_iterator()[Symbol.iterator]();
    return utils.zip_iterable(old_iter, new_iter);
  }
  
  /**
   * Returns an iterator over the indices of the array.
   * @private
   */
  private _index_iterator(): Iterable<Uint32Array> {
    return tndarray._slice_iterator(this.shape);
  }
  
  /**
   * TODO: Test
   * Returns a generator of the values of the array, in index order.
   * @private
   */
  private _value_iterator(): Iterable<any> {
    const index_iterator = tndarray._slice_iterator(this.shape);
    let iter = {};
    // Alas, generators are dynamically scoped.
    const self = this;
    iter[Symbol.iterator] = function* () {
      for (let index of index_iterator) {
        yield self.g(index);
      }
    };
    return <Iterable<any>> iter;
  }
  
  /**
   * Compute the dimensions of a nested array.
   * @param {any[]} nested_array  - Arrays nested arbitrarily deeply. Each array of the same depth must have the same length.
   *                                This is *not* checked.
   * @return {Uint32Array}        - The dimensions of each subarray.
   * @private
   */
  private static _nested_array_shape(nested_array: any[]): Uint32Array {
    let dims: number[] = [];
    let current = nested_array;
    let at_bottom = false;
    while (!at_bottom) {
      dims.push(current.length);
      if (Array.isArray(current[0])) {
        current = current[0];
      } else {
        at_bottom = true;
      }
    }
    
    return new Uint32Array(dims);
  }
  
  /**
   *
   * @param {any[]} nested_array
   * @param {Uint32Array} indices
   * @return {any[]}
   * @private
   */
  private static _nested_array_value_from_index(nested_array: any[], indices: Uint32Array) {
    let current_subarray = nested_array;
    for (let index of indices) {
      current_subarray = current_subarray[index];
    }
    return current_subarray;
  }
  
  /**
   * Create a tndarray from a nested array of values.
   * @param {any[]} array - An array of arrays (nested to arbitrary depth). Each level must have the same dimension.
   * The final level must contain valid data for a tndarray.
   * @param {string} dtype  - The type to use for the underlying array.
   *
   * @return {tndarray}
   */
  static from_nested_array(array: any[], dtype?: string): tndarray {
    if (array.length === 0) {
      return tndarray.array([]);
    }
    
    const dimensions = tndarray._nested_array_shape(array);
    let slice_iter = tndarray._slice_iterator(dimensions);

    const size = tndarray._compute_size(dimensions);
    const array_type = tndarray._dtype_map(dtype);
    const data = new array_type(size);
    
    let ndarray = tndarray.array(data, dimensions, {dtype: dtype, disable_checks: true});
    
    for (let indices of slice_iter) {
      const real_index = ndarray._compute_real_index(indices);
      ndarray.data[real_index] = tndarray._nested_array_value_from_index(array, indices);
    }
    
    return ndarray;
  }
  
  /**
   * Create an n-dimensional array from an iterable.
   * @param iterable
   * @param shape
   * @param {string} dtype
   * @return {tndarray}
   */
  static from_iterable(iterable: Iterable<number>, shape: Shape, dtype?: string) {
    const final_shape = tndarray._compute_shape(shape);
    
    const size = tndarray._compute_size(final_shape);
    const array_type = tndarray._dtype_map(dtype);
    const index_iterator = tndarray._slice_iterator(final_shape);
    const val_gen = iterable[Symbol.iterator]();
    let data = new array_type(size);
    const stride = tndarray._stride_from_shape(final_shape);
    const initial_offset = 0;
    let i = 0;
    for (let index of index_iterator) {
      const real_index = tndarray._index_in_data(index, stride, initial_offset);
      let val = val_gen.next();
      data[real_index] = val.value;
    }
    
    if (data.length !== size) {
      throw new errors.MismatchedShapeSize(`Iterable passed has size ${data.length}. Size expected from shape was: ${size}`);
    }
    
    return tndarray.array(data, final_shape, {disable_checks: true, dtype: dtype});
  }
  
  /**
   * Produces an array of the desired shape filled with a single value.
   * @param {number} value                - The value to fill in.
   * @param shape - A numerical array or a number. If this is a number a one-dimensional array of that length is produced.
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
   * Return an array of the specified size filled with zeroes.
   * @param {number} shape
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
   * Return an array of the specified size filled with ones.
   * @param {number} shape
   * @param {string} dtype
   * @return {tndarray}
   */
  static ones(shape: number[] | Uint32Array, dtype?: string): tndarray {
    return tndarray.filled(1, shape, dtype);
  }
  
  /**
   * Create an array containing the element-wise max of the inputs.
   * Inputs must be the same shape.
   * @param {tndarray} a  - First array.
   * @param {tndarray} b  - Second array.
   * @return {tndarray}   - An array with the same shape as a and b. Its entries are the max of the corresponding entries of a and b.
   */
  static take_max(a: tndarray, b: tndarray) {
    return a.map((e, i) => Math.max(e, b[i]));
  }
  
  /**
   * Create an array containing the element-wise min of the inputs.
   * Inputs must be the same shape.
   * @param {tndarray} a  - First array.
   * @param {tndarray} b  - Second array.
   * @return {tndarray}   - An array with the same shape as a and b. Its entries are the min of the corresponding entries of a and b.
   */
  static take_min(a: tndarray, b: tndarray) {
    return a.map((e, i) => Math.min(e, b[i]));
  }
  
  /**
   * Create a tndarray containing a range of integers.
   * @param {number} start_or_stop  - If no other arguments are passed, the upper bound of the range (with lower bound zero). Otherwise this is the lower bound.
   * @param {number} stop           - The upper bound of the range.
   * @param {number} step           - The step size between elements in the range.
   * @return {tndarray}             - A one-dimensional array containing the range.
   */
  static arange(start_or_stop: number, stop?: number, step?: number): tndarray {
    if (step === undefined) {
      step = 1;
    }
    
    let start;
    if (stop === undefined) {
      stop = start_or_stop;
      start = 0;
    } else {
      start = start_or_stop;
    }
    
    let size = Math.abs(Math.floor((stop - start) / step));
    const shape = new Uint32Array([size]);
    let iter = {
      [Symbol.iterator]: function*() {
        let i = start;
        while (i < real_stop) {
          yield i;
          i += step;
        }
      }
    };
    
    let real_stop = stop < start ? -stop : stop;
    
    return tndarray.from_iterable(iter, shape, "int32");
  }
  
  /**
   * Create a tndarray containing the specified data
   * @param data
   * @param shape
   * @param options
   * @return {tndarray}
   */
  static array(data, shape?, options?: ArrayOptions): tndarray {
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
      
      final_shape = tndarray._compute_final_shape(shape, data.length);
      
      // Compute length
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
  
  private static _new_shape_from_axis(old_shape: Uint32Array, axis: number): Uint32Array {
    let new_shape;
    if (old_shape.length === 1) {
      new_shape = new Uint32Array(1);
    } else {
      new_shape = old_shape.filter((e, i) => i !== axis);
    }
    return new_shape
  }
  
  /**
   * Apply a binary function to two broadcastables.
   * @param {Broadcastable} a - The first argument to f.
   * @param {Broadcastable} b - The second argument to f.
   * @param {(a: number, b: number) => number} f  - The function to apply.
   * @param {string} dtype  - Optional forced data type.
   * @return {tndarray}  - The result of applying f to a and b.
   * @private
   */
  private static _binary_broadcast(a: Broadcastable, b: Broadcastable, f: (a: number, b: number) => number, dtype?: string): tndarray {
    
    let [iter, shape, new_dtype] = tndarray._broadcast_by_index(a, b);
    
    if (dtype === undefined) {
      dtype = new_dtype
    }
    
    let new_array = tndarray.filled(0, shape, dtype);
    
    for (let [a_val, b_val, index] of iter) {
      const new_val = f(a_val, b_val);
      new_array.s(new_val, index);
    }
    
    return new_array
  }
  
  // TODO: Allow non-tndarray arrays
  // TODO: Type upcasting.
  /**
   * Compute the sum of two arrays.
   * output[i] = a[i] + [i].
   * @param a
   * @param b
   * @return {number | tndarray}
   */
  static _add(a, b) {
    return tndarray._binary_broadcast(a, b, (x, y) => x + y);
  }
  
  /**
   * Subtract an array from another.
   * output[i] = a[i] - b[i].
   * @param {Broadcastable} a - The minuend.
   * @param {Broadcastable} b - The subtrahend.
   * @return {Broadcastable} - The element-wise difference.
   */
  static _sub(a: Broadcastable, b: Broadcastable): tndarray {
    return tndarray._binary_broadcast(a, b, (x, y) => x - y);
  }
  
  /**
   * Compute the Hadamard product of two arrays, i.e. the element-wise product of the two arrays.
   * output[i] = a[i] * b[i].
   * @param {Broadcastable} a - First factor.
   * @param {Broadcastable} b - Second factor.
   * @return {Broadcastable} - The element-wise product of the two inputs.
   */
  static _mult(a: Broadcastable, b: Broadcastable): tndarray {
     return tndarray._binary_broadcast(a, b, (x, y) => x * y);
  }
  
  /**
   * Compute the element-wise quotient of the two inputs.
   * output[i] = a[i] / b[i].
   * @param {Broadcastable} a - Dividend array.
   * @param {Broadcastable} b - Divisor array.
   * @return {Broadcastable}  - Quotient array.
   */
  static _div(a: Broadcastable, b: Broadcastable): tndarray {
    return tndarray._binary_broadcast(a, b, (x, y) => x / y, "float64");
  }
  
  /**
   * Compute the element-wise power of two inputs
   * @param {Broadcastable} a - Base array.
   * @param {Broadcastable} b - Exponent array.
   * @return {tndarray}       - Result array.
   * @private
   */
  static _power(a: Broadcastable, b: Broadcastable): tndarray {
    return tndarray._binary_broadcast(a, b, (x, y) => Math.pow(x, y));
  }
  
  /**
   * Compute the element-wise quotient of two arrays, rounding values up to the nearest integer.
   * @param {Broadcastable} a - Dividend array.
   * @param {Broadcastable} b - Divisor array.
   * @return {Broadcastable}  - Quotient array.
   */
  static _cdiv(a: Broadcastable, b: Broadcastable): tndarray {
    return tndarray._binary_broadcast(a, b, (x, y) => Math.ceil(x / y));
  }
  
  /**
   * Compute the element-wise quotient of two arrays, rounding values down to the nearest integer.
   * @param {Broadcastable} a - Dividend array.
   * @param {Broadcastable} b - Divisor array.
   * @return {tndarray}       - Quotient array.
   */
  static _fdiv(a: Broadcastable, b: Broadcastable): tndarray {
    return tndarray._binary_broadcast(a, b, (x, y) => Math.floor(x / y));
  }
  
  /**
   * Compute element-wise modulus of two arrays.
   * @param {Broadcastable} a - First array.
   * @param {Broadcastable} b - Second array.
   * @return {tndarray}       - Modulus array.
   */
  static _mod(a: Broadcastable, b: Broadcastable): tndarray {
    return tndarray._binary_broadcast(a, b, (x, y) => x % y);
  }
  
  // TODO: Generalize to an inner product.
  // TODO: This is numerically unstable.
  /**
   * Compute the dot product of two arrays.
   * @param {tndarray} a
   * @param {tndarray} b
   * @return {number}
   */
  static dot(a: tndarray, b: tndarray): number {
    let acc = 0;
    for (let i = 0; i++; i < a.length) {
      acc += a.data[i] + b.data[i];
    }
    return acc;
  }
  
  /**
   * Compute element-wise less than.
   * @param {tndarray} a
   * @param {tndarray} b
   */
  static _lt(a: tndarray, b: tndarray) {
    return tndarray._binary_broadcast(a, b, (x, y) => +(x < y), "uint8");
  }
  
  /**
   * Compute element-wise greater than.
   * @param {tndarray} a
   * @param {tndarray} b
   */
  static _gt(a: tndarray, b: tndarray) {
    return tndarray._binary_broadcast(a, b, (x, y) => +(x > y), "uint8");
  }
  
  /**
   * Compute element-wise less than or equal to.
   * @param {tndarray} a
   * @param {tndarray} b
   */
  static _le(a: tndarray, b: tndarray) {
    return tndarray._binary_broadcast(a, b, (x, y) => +(x <= y), "uint8");
  }
  
  /**
   * Compute element-wise greater than or equal to.
   * @param {tndarray} a
   * @param {tndarray} b
   */
  static _ge(a: tndarray, b: tndarray) {
    return tndarray._binary_broadcast(a, b, (x, y) => +(x >= y), "uint8");
  }
  
  /**
   * Compute element-wise not equal to.
   * @param {tndarray} a
   * @param {tndarray} b
   */
  static _ne(a: tndarray, b: tndarray) {
    return tndarray._binary_broadcast(a, b, (x, y) => +(x !== y), "uint8");
  }
  
  /**
   * Compute element-wise equal to.
   * @param {tndarray} a
   * @param {tndarray} b
   */
  static _eq(a: tndarray, b: tndarray) {
    return tndarray._binary_broadcast(a, b, (x, y) => +(x === y), "uint8");
  }
  
  /**
   * Check if two n-dimensional arrays are equal.
   * @param {tndarray} array1
   * @param {tndarray} array2
   * @return {boolean}
   */
  static equals(array1: tndarray, array2: tndarray): boolean {
    return (
      (array1.length === array2.length) &&
      (tndarray._equal_data(array1.shape, array2.shape)) &&
      (tndarray._equal_data(array1.offset, array2.offset)) &&
      (tndarray._equal_data(array1.stride, array2.stride)) &&
      (tndarray._equal_data(array1.dstride, array2.dstride)) &&
      (array1.initial_offset === array2.initial_offset) &&
      (array1.dtype === array2.dtype) &&
      (tndarray._equal_data(array1, array2))
    );
  }
  
  /**
   * Check if two arraylikes have the same length and the same elements.
   * @param array1
   * @param array2
   * @return {boolean}  - true if the length and elements match, false otherwise.
   * @private
   */
  static _equal_data(array1, array2): boolean {
    if (array1 instanceof tndarray) {
      array1 = array1.data;
    }
    
    if (array2 instanceof tndarray) {
      array2 = array2.data;
    }
    
    return (
      (array1.length === array2.length) &&
      (array1.reduce((a, e, i) => a && e === array2[i], true))
    );
  }
  
  /**
   * Return a copy of a.
   * @param {tndarray} a  - tndarray to copy.
   * @return {tndarray}   - The copy.
   */
  static copy(a: tndarray): tndarray {
    return new tndarray(a.data.slice(0), a.shape.slice(0), a.offset.slice(0), a.stride.slice(0), a.dstride.slice(0), a.length, a.dtype);
  }
}

export {errors};
