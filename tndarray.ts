type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array| Int32Array | Uint32Array | Float32Array | Float64Array;
type Broadcastable = number | TypedArray | tndarray;

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

namespace utils {
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
  
  // TODO: Test
  /**
   * Check if value is an ArrayBuffer
   * @param value
   * @return {boolean}
   */
  export function is_typed_array(value: any): value is TypedArray {
    return !!(value.buffer instanceof ArrayBuffer && value.BYTES_PER_ELEMENT);
  }
}


class tndarray {
  
  private data;
  private offset: Uint32Array;
  private stride: Uint32Array;
  private dstride: Uint32Array;
  private initial_offset: number;
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
  
  /**
   * Computes the index of a value in the underlying data array based on a passed index.
   * @param indices
   * @return {number} - The index
   * @private
   */
  private _compute_real_index(indices): number {
    if (ArrayBuffer.isView(indices[0])) {
      indices = indices[0];
    }
    
    return utils.dot(indices, this.stride) + this.initial_offset;
  }
  
  /**
   * Computes the size of a slice.
   * @param lower_bounds
   * @param upper_bounds
   * @param steps
   * @private
   */
  private static _compute_slice_size(lower_bounds: Uint32Array, upper_bounds: Uint32Array, steps: Uint32Array): number {
    const ranges = tndarray.sub(upper_bounds, lower_bounds);
    const values = tndarray.cdiv(ranges, steps);
    return values.reduce((a, e) => a * e, 1);
  }
  
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
   * Change the shape of the array.
   * @param {Uint32Array} new_shape - The shape to make the new array.
   * @return {tndarray}             -
   */
  reshape(new_shape: Uint32Array): tndarray {
    const new_size = tndarray._compute_size(new_shape);
    const size = tndarray._compute_size(this.shape);
    if (size !== new_size) {
      throw new errors.BadShape(`Array cannot be reshaped because sizes do not match. Size of underlying array: ${size}. Size of reshaped array: ${new_shape}`);
    }
    // TODO: Copy data if necessary. This will break for views.
    this.shape = new_shape;
    return this;
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
  
  // TODO: Axes.
  /**
   * Returns the maximum element of the array.
   * @param {number} axis
   * @return {number}
   */
  max(axis?: number): number {
    return Math.max(...this.data);
  }
  
  // TODO: Axes.
  /**
   * Returns the minimum element of the array.
   * @param {number} axis
   * @return {number}
   */
  min(axis?: number): number {
    return Math.min(...this.data);
  }
  
  // TODO: Axes
  /**
   * Compute an element-wise power.
   * @param {number} exp
   * @param {number} axis
   */
  power(exp: number, axis?: number) {
    return this.map(e => Math.pow(e, exp));
  }
  
  // TODO: Axes
  /**
   * Sum the entries of an array.
   * @param {number} axis
   * @return {number}
   */
  sum(axis?: number): number {
    return this.reduce((a, e) => a + e, 0);
  }
  
  // TODO: Axes
  /**
   * Calculate the mean of the array.
   * @param {number} axis
   */
  mean(axis?: number): number {
    return this.sum() / this.length;
  }
  
  // TODO: Axes
  /**
   *
   * @param {number} axis
   * @return {number}
   */
  stdev(axis?: number): number {
    const mean = this.mean();
    throw Error("Not implemented");
  }
  
  // TODO: Axes.
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
  
  // TODO: Axes.
  /**
   * Reduce the array.
   * @param f
   * @param {number} axis
   */
  reduce(f, axis?: number) {
    return this.data.reduce(f);
  }
  
  /**
   * Return true if this array equals the passed array, false otherwise.
   * @param {tndarray} a  - The array to compare against.
   * @return {boolean}
   */
  equals(a: tndarray) {
    return tndarray.equals(this, a);
  }
  
  // /**
  //  * Similar to filter, but avoids the issue of having to compute the shape of the new array.
  //  * @param f
  //  * @return {tndarray}
  //  */
  // where(f): tndarray {
  //   return
  // }
  
  /**
   * Iterate over a slice.
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
   * @param {Broadcastable} a
   * @param {Broadcastable} b
   * @private
   */
  private static _broadcast(a: Broadcastable, b: Broadcastable): [IterableIterator<number[]>, Uint32Array] {
    
    let a_array = tndarray._upcast_to_tndarray(a);
    let b_array = tndarray._upcast_to_tndarray(b);
    
    const new_dimensions = tndarray._broadcast_dims(a_array, b_array);
    let index_iter = tndarray._slice_iterator(new_dimensions);
    
    const a_indexer = tndarray._broadcast_indexer(new_dimensions, a_array.shape);
    const b_indexer = tndarray._broadcast_indexer(new_dimensions, b_array.shape);
    
    let iter = {};
    iter[Symbol.iterator] = function* () {
      for (let index of index_iter) {
        yield [a_array.g(a_indexer(index)), b_array.g(b_indexer(index))];
      }
    };
    
    return [<IterableIterator<[number, number]>>iter, new_dimensions];
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
  private* _value_iterator(): Iterable<any> {
    const index_iterator = tndarray._slice_iterator(this.shape);
    let iter = {};
    // Alas, generators are dynamically scoped.
    const self = this;
    iter[Symbol.iterator] = function* () {
      for (let index of index_iterator) {
        yield self.g(index);
      }
    };
    return iter;
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
  static from_iterable(iterable, shape, dtype?: string) {
    const final_shape = tndarray._compute_shape(shape);
    
    const size = tndarray._compute_size(final_shape);
    const array_type = tndarray._dtype_map(dtype);
    const data = new array_type(iterable);
    
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
  static arange(start_or_stop: number, stop?: number, step?: number) {
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
    let iter = {};
    
    let real_stop = stop < start ? -stop : stop;
    
    iter[Symbol.iterator] = function*() {
      let i = start;
      while (i < real_stop) {
        yield i;
        i += step;
      }
    };
    
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
  
  // TODO: Broadcasting
  // TODO: Allow non-tndarray arrays
  // TODO: Type upcasting.
  /**
   * Compute the sum of two arrays.
   * output[i] = a[i] + [i].
   * @param a
   * @param b
   * @return {number | tndarray}
   */
  static add(a, b) {
    if (!tndarray._lengths_exist_and_match(a, b)) {
      throw new errors.MismatchedSizes();
    }
    
    const new_data = a.map((e, i) => e + b[i]);
    return tndarray._upcast_data(a, b, new_data);
  }
  
  // TODO: Broadcasting
  // TODO: Allow non-tndarray arrays
  // TODO: Type upcasting.
  /**
   * Subtract an array from another.
   * output[i] = a[i] - b[i].
   * @param {tndarray} a
   * @param {tndarray} b - The subtrahend.
   * @return {tndarray} - The element-wise
   */
  static sub(a: Broadcastable, b: Broadcastable) {
    if (!tndarray._lengths_exist_and_match(a, b)) {
      throw new errors.MismatchedSizes();
    }
    
    let [iter, shape] = tndarray._broadcast(a, b);
  
    const new_data = a.map((e, i) => e - b[i]);
    return tndarray._upcast_data(a, b, new_data);
  }
  
  // TODO: Broadcasting
  // TODO: Allow non-tndarray arrays
  // TODO: Type upcasting.
  /**
   * Compute the Hadamard product of two arrays, i.e. the element-wise product of the two arrays.
   * output[i] = a[i] * b[i].
   * @param {tndarray} a - First factor.
   * @param {tndarray} b - Second factor.
   * @return {tndarray} - The element-wise product of the two inputs. Will have the shape of value1.
   */
  static mult(a, b) {
    if (!tndarray._lengths_exist_and_match(a, b)) {
      throw new errors.MismatchedSizes();
    }
  
    const new_data = a.map((e, i) => e * b[i]);
    return tndarray._upcast_data(a, b, new_data);
  }
  
  // TODO: Broadcasting
  // TODO: Allow non-tndarray arrays
  // TODO: Type upcasting.
  /**
   * Compute the element-wise quotient of the two inputs.
   * output[i] = a[i] / b[i].
   * @param {tndarray} a - Dividend array.
   * @param {tndarray} b - Divisor array.
   * @return {tndarray} - The element-wise quotient of value1 and value2. Will have the shape of value1.
   */
  static div(a, b) {
    if (! tndarray._lengths_exist_and_match(a, b)) {
      throw new errors.MismatchedSizes();
    }
    
    const new_data = a.map((e, i) => e / b[i]);
    return tndarray._upcast_data(a, b, new_data);
  }
  
  // TODO: Broadcasting
  /**
   * Compute the element-wise quotient of two arrays, rounding values up to the nearest integer.
   * @param a
   * @param b
   * @return {tndarray | tndarray | any}
   */
  static cdiv(a, b) {
    if (! tndarray._lengths_exist_and_match(a, b)) {
      throw new errors.MismatchedSizes();
    }
  
    const new_data = a.map((e, i) => Math.ceil(e / b[i]));
    return tndarray._upcast_data(a, b, new_data);
  }
  
  
  // TODO: Broadcasting
  /**
   * Compute the element-wise quotient of two arrays, rounding values down to the nearest integer.
   * @param a
   * @param b
   */
  static fdiv(a, b) {
    if (! tndarray._lengths_exist_and_match(a, b)) {
      throw new errors.MismatchedSizes();
    }
  
    const new_data = a.map((e, i) => Math.floor(e / b[i]));
    return tndarray._upcast_data(a, b, new_data);
  }
  
  // TODO: Generalize to an inner product.
  // TODO: Use the Kahan summation algorithm. This is numerically unstable.
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
  
  // TODO: Broadcasting
  /**
   * Compute element-wise less than.
   * @param {tndarray} a
   * @param {tndarray} b
   */
  static lt(a: tndarray, b: tndarray) {
  
  }
  
  /**
   * Compute element-wise greater than.
   * @param {tndarray} a
   * @param {tndarray} b
   */
  static gt(a: tndarray, b: tndarray) {
  
  }
  
  /**
   * Compute element-wise less than or equal to.
   * @param {tndarray} a
   * @param {tndarray} b
   */
  static le(a: tndarray, b: tndarray) {
  
  }
  
  /**
   * Compute element-wise greater than or equal to.
   * @param {tndarray} a
   * @param {tndarray} b
   */
  static ge(a: tndarray, b: tndarray) {
  
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
  
}
export {tndarray, errors, utils};
