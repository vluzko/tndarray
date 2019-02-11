import {utils} from "./utils";
import {indexing} from "./indexing";
import new_shape_from_axis = indexing.new_shape_from_axis;

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

export class tndarray {
  
  public data;
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
   * @param {boolean} is_view
   * @constructor
   */
  private constructor(data,
                      shape: Uint32Array,
                      offset: Uint32Array,
                      stride: Uint32Array,
                      dstride: Uint32Array,
                      size: number,
                      dtype?: string,
                      is_view?: boolean) {
    this.shape = shape;
    this.offset = offset;
    this.stride = stride;
    this.length = size;
    this.dstride = dstride;
    if (dtype !== undefined) {
      const array_type = utils.dtype_map(dtype);
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
    this.is_view = is_view === undefined ? false : is_view;
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
    return this.accum_map((acc, b) => acc * b, axis, 1, dtype);
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
  reshape(...new_shape: Array<Uint32Array | number[] | number>): tndarray {
    let shape: Uint32Array | number[];
    if (utils.is_numeric_array(new_shape[0])) {
      // @ts-ignore
      shape = new_shape[0];
    } else {
      // @ts-ignore
      shape = new_shape;
    }

    if (Array.isArray(shape)) {
      shape = new Uint32Array(shape);
    }

    const new_size = indexing.compute_size(shape);
    const size = indexing.compute_size(this.shape);
    if (size !== new_size) {
      throw new errors.BadShape(`Array cannot be reshaped because sizes do not match. Size of underlying array: ${size}. Size of reshaped array: ${shape}`);
    }
    let value_iter = this._value_iterator();
    return tndarray.from_iterable(value_iter, shape, this.dtype);
  }
  
  round() {}
  
  sort() {}
  
  squeeze() {}
  
  /**
   * Return the standard deviation along the specified axis.
   * @param {number} axis
   * @return {number}
   */
  stdev(axis?: number): tndarray | number {
    const mean = this.mean(axis);
    const squared_values = this.power(2);
    const mean_of_squares = squared_values.mean(axis);
    const squared_mean = tndarray._power(mean, 2);
    const difference = tndarray._sub(mean_of_squares, squared_mean);
    const result = tndarray._power(difference, 0.5);
    if (axis === undefined) {
      return result.data[0];
    } else {
      return result;
    }
  }

  /**
   * Return the variance along the specified axis.
   * @param {number} axis
   * @return {tndarray | number}
   */
  variance(axis?: number): tndarray | number {
    const std = this.stdev(axis);
    const result = tndarray._power(std, 0.5);
    if (axis === undefined) {
      return result.data[0];
    } else {
      return result;
    }
  }
  
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
   * Drop any dimensions that equal 1.
   * @return {tndarray}
   */
  drop_unit_dimensions(): tndarray {
    // Drop extra dimensions.
    let flattened_shape = [];
    let flattened_stride = [];
    let flattened_offset = [];
    this.shape.forEach((e, i) => {
      if (e > 1) {
        flattened_shape.push(e);
        flattened_stride.push(this.stride[i]);
        flattened_offset.push(this.offset[i]);
      }
    });
    const size = indexing.compute_size(flattened_shape);
    const new_shape = new Uint32Array(flattened_shape);
    const new_offset = new Uint32Array(flattened_offset);
    const new_stride = new Uint32Array(flattened_stride);

    const view = new tndarray(this.data, new_shape, new_offset, new_stride, new_stride, size, this.dtype, true);

    return view;
  }

  /**
   * Return a slice of an array. Copies the underlying data.
   * @param indices
   */
  c_slice(...indices) {
  
  }
  
  /**
   * Return a slice of an array. Does not copy the underlying data. Does not drop dimensions.
   * @param indices
   */
  slice(...indices: Array<number | number[]>): tndarray {
    const positive_indices = indexing.convert_negative_indices(indices, this.shape);
    let start = new Uint32Array(this.shape.length);
    let end = this.shape.slice();
    let steps = new Uint32Array(this.shape.length);
    let dims_to_drop = new Set();

    steps.fill(1);

    let i = 0;
    for (let index of positive_indices) {
      if (index === null) {

      } else if (utils.is_numeric(index)) {
        start[i] = index;
        end[i] = index + 1;
        dims_to_drop.add(i);
      } else if (index.length === 2) {
        start[i] = index[0];
        end[i] = index[1];
      } else if (index.length === 3) {
        start[i] = index[0];
        end[i] = index[1];
        steps[i] = index[2];
      } else {
        throw new Error(`Arguments to slice were wrong: ${positive_indices}. Broke on ${index}.`);
      }
      i += 1;
    }

    const new_shape = indexing.new_shape_from_slice(start, end, steps);
    const size = indexing.compute_size(new_shape);

    const offset = start.map((e, j) => e + this.offset[j]);
    const stride = steps.map((e, j) => e * this.stride[j]);

    const filt = (e, j) => !dims_to_drop.has(j);

    const new_stride = stride.filter(filt);
    const new_dstride = this.dstride.filter(filt);
    const view = new tndarray(this.data,
      new_shape.filter(filt),
      offset.filter(filt),
      new_stride, new_dstride, size, this.dtype, true);
    
    return view;
  }


  /**
   * Get the value at the given index.
   * @param indices
   * @return {number}
   */
  g(...indices): number {
    if (indices.length !== this.shape.length) {
      throw new Error(`Need more dimensions.`)
    }
    const positive_indices = indexing.convert_negative_indices(indices, this.shape);
    const real_index = this._compute_real_index(positive_indices);
    return this.data[real_index];
  }
  
  /**
   * Set an element of the array.
   * @param values
   * @param indices
   */
  s(values: Broadcastable, ...indices) {
    if (indexing.checks_indices_are_single_index(...indices)) {
      if (! utils.is_numeric(values)) {
        throw new Error(`Bad dimensions for broadcasting.`);
      }
      const positive_indices = indexing.convert_negative_indices(indices, this.shape);
      const real_index = this._compute_real_index(positive_indices);
      this.data[real_index] = values;
      return;
    }

    const view = this.slice(...indices);
    let b_array = tndarray._upcast_to_tndarray(values);

    // Check that shapes are compatible.
    const difference = view.shape.length - b_array.shape.length;
    if (difference < 0) {
      throw new Error(`Bad dimensions for broadcasting. a: ${view.shape}, b: ${b_array.shape}`);
    }

    for (let i = 0 ; i < b_array.shape.length; i++) {
      if (b_array.shape[i] !== view.shape[i + difference] && b_array.shape[i] !== 1) {
        throw new Error(`Bad dimensions for broadcasting. a: ${view.shape}, b: ${b_array.shape}`);
      }
    }

    const iterator = utils.zip_longest(view._real_index_iterator(), b_array._real_index_iterator());

    for (let [a_index, b_index] of iterator) {
      view.data[a_index] = b_array.data[b_index];
    }
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
      // TODO: Views: Use size of view.

      new_array = tndarray.zeros(this.length, dtype);
      let first_value;

      if (start !== undefined) {
        new_array.data[0] = start;
      }

      let previous_index = 0;
      let index_in_new = 0;
      for (let index of this._real_index_iterator()) {
        new_array.data[index_in_new] = f(new_array.data[previous_index], this.data[index]);
        previous_index = index_in_new;
        index_in_new += 1;
      }

    } else {
      const [lower, upper, steps] = this._slice_for_axis(axis);
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
      const new_shape = indexing.new_shape_from_axis(this.shape, axis);
      let new_array = tndarray.zeros(new_shape, dtype);
      const step_along_axis = this.stride[axis];
      for (let [old_index, new_index] of this._true_index_iterator_over_axes(axis)) {
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
      return this.data.reduce(f);
    } else {
      const new_shape = indexing.new_shape_from_axis(this.shape, axis);
      let new_array = tndarray.zeros(new_shape, dtype);
      const step_along_axis = this.stride[axis];
      for (let [old_index, new_index] of this._true_index_iterator_over_axes( axis)) {
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
  _compute_real_index(indices): number {
    return indexing.index_in_data(indices, this.stride, this.initial_offset);
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
      a_array = tndarray.array(new Float64Array([value]), new Uint32Array([1]), {disable_checks: true});
    } else if (utils.is_typed_array(value)) {
      a_array = tndarray.array(value, new Uint32Array([value.length]), {disable_checks: true});
    } else {
      a_array = value;
    }
    return a_array;
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

    const new_dimensions = indexing.calculate_broadcast_dimensions(a_array.shape, b_array.shape);
    const new_dtype = utils._dtype_join(a_array.dtype, b_array.dtype);
    let index_iter = indexing.slice_iterator(new_dimensions);

    const iterator = utils.zip_longest(a_array._real_index_iterator(), b_array._real_index_iterator(), index_iter);

    let iter = {};
    iter[Symbol.iterator] = function* () {
      for (let [a_index, b_index, index] of iterator) {
        const a_val = a_array.data[a_index];
        const b_val = b_array.data[b_index];
        yield [a_val, b_val, index];
      }
    };

    return [<IterableIterator<[number, number, Uint32Array]>>iter, new_dimensions, new_dtype];
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
  static _binary_broadcast(a: Broadcastable, b: Broadcastable, f: (a: number, b: number) => number, dtype?: string): tndarray {
    let [iter, shape, new_dtype] = tndarray._broadcast_by_index(a, b);

    if (dtype === undefined) {
      dtype = new_dtype
    }

    let new_array = tndarray.filled(0, shape, dtype);

    for (let [a_val, b_val, index] of iter) {
      const new_val = f(a_val, b_val);
      new_array.s(new_val, ...index);
    }

    return new_array
  }

  /**
   * Compute lower, upper, and steps for a slice of `full_array` along `axis`.
   * @param {number} axis
   * @return {[Uint32Array, Uint32Array, Uint32Array]}  - [lower, upper, steps]
   * @private
   */
  private _slice_for_axis(axis: number): [Uint32Array, Uint32Array, Uint32Array] {
    let lower = new Uint32Array(this.shape.length);
    let upper = this.shape.slice(0);
    let steps = new Uint32Array(this.shape.length);
    steps.fill(1);
    upper[axis] = 1;
    return [lower, upper, steps];
  }
  
  /**
   * Return an iterator over real indices of the old array and real indices of the new array.
   * @param {number} axis
   * @return {Iterable<number[]>}
   * @private
   */
  private _true_index_iterator_over_axes(axis: number): Iterable<number[]> {
    const new_shape = indexing.new_shape_from_axis(this.shape, axis);
    let new_array = tndarray.zeros(new_shape, this.dtype);
    
    let [lower, upper, steps] = this._slice_for_axis(axis);
  
    let old_iter = this._real_index_iterator(lower, upper, steps)[Symbol.iterator]();
    let new_iter = new_array._real_index_iterator()[Symbol.iterator]();
    return utils.zip_iterable(old_iter, new_iter);
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
  _real_index_iterator(lower_or_upper?: Uint32Array, upper_bounds?: Uint32Array, steps?: Uint32Array): Iterable<number> {

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
    let starting_indices = indexing.slice_iterator(lower_or_upper.slice(0, -1), upper_bounds.slice(0, -1), steps.slice(0, -1));

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
   * Returns an iterator over the indices of the array.
   * @private
   */
  _index_iterator(): Iterable<Uint32Array> {
    return indexing.slice_iterator(this.offset, this.shape);
  }
  
  /**
   * TODO: Test
   * Returns a generator of the values of the array, in index order.
   * @private
   */
  _value_iterator(lower_or_upper?: Uint32Array, upper_bounds?: Uint32Array, steps?: Uint32Array): Iterable<any> {
    
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

    const index_iterator = indexing.slice_iterator(lower_or_upper, upper_bounds, steps);
    let iter = {};
    // Alas, generators are dynamically scoped.
    const self = this;
    iter[Symbol.iterator] = function* () {
      for (let index of index_iterator) {
        yield self.g(...index);
      }
    };
    return <Iterable<number>> iter;
  }
  
  /**
   * Create an n-dimensional array from an iterable.
   * @param iterable
   * @param shape
   * @param {string} dtype
   * @return {tndarray}
   */
  static from_iterable(iterable: Iterable<number>, shape: Shape, dtype?: string) {
    const final_shape = indexing.compute_shape(shape);
    
    const size = indexing.compute_size(final_shape);
    const array_type = utils.dtype_map(dtype);
    const index_iterator = indexing.slice_iterator(final_shape);
    const val_gen = iterable[Symbol.iterator]();
    let data = new array_type(size);
    const stride = indexing.stride_from_shape(final_shape);
    const initial_offset = 0;
    let i = 0;
    for (let index of index_iterator) {
      const real_index = indexing.index_in_data(index, stride, initial_offset);
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
    const final_shape = indexing.compute_shape(shape);
    
    const size = indexing.compute_size(final_shape);
    const array_type = utils.dtype_map(dtype);
    const data = new array_type(size).fill(value);
    
    return tndarray.array(data, final_shape, {disable_checks: true, dtype: dtype});
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

    if (shape === undefined) {
      shape = new Uint32Array([data.length]);
    }
    
    if (options && options.dtype) {
      dtype = options.dtype
    }
    
    if (options && options.disable_checks === true) {
      final_shape = shape;
      size = indexing.compute_size(shape);
    } else {
      if (!utils.is_numeric_array(data)) {
        throw new errors.BadData();
      }
      
      if (shape === undefined || shape === null) {
        final_shape = new Uint32Array([data.length]);
      } else {
        final_shape = indexing.compute_shape(shape);
      }
      
      // Compute length
      size = indexing.compute_size(final_shape);
      
      if (size !== data.length) {
        throw new errors.MismatchedShapeSize()
      }
    }
    
    const stride = indexing.stride_from_shape(final_shape);
    const offset = new Uint32Array(final_shape.length);
    const dstride = stride.slice();
    
    return new tndarray(data, final_shape, offset, stride, dstride, size, dtype);
  }

  /**
   * Return an array of the specified size filled with zeroes.
   * Equivalent to `tndarray.filled`, but slightly faster.
   * @param {number} shape
   * @param {string} dtype
   * @return {tndarray}
   */
  static zeros(shape, dtype?: string) {
    const final_shape = indexing.compute_shape(shape);
    const size = indexing.compute_size(final_shape);
    const array_type = utils.dtype_map(dtype);
    const data = new array_type(size);

    return tndarray.array(data, final_shape, {disable_checks: true, dtype: dtype});
  }

  /**
   * 
   * @param {Broadcastable} a -
   * @param {Broadcastable} b -
   * @returns {tndarray}      -
   */
  static broadcast_matmul(a: Broadcastable, b: Broadcastable): tndarray {
    let a_array = tndarray._upcast_to_tndarray(a);
    let b_array = tndarray._upcast_to_tndarray(b);

    const new_dimensions = indexing.calculate_broadcast_dimensions(a_array.shape, b_array.shape);
    new_dimensions[new_dimensions.length - 2] = a_array.shape[a_array.shape.length - 2];
    new_dimensions[new_dimensions.length - 1] = b_array.shape[b_array.shape.length - 1];


    const new_dtype = utils._dtype_join(a_array.dtype, b_array.dtype);
    let index_iter = indexing.slice_iterator(new_dimensions);



    const iterator = utils.zip_longest(a_array._real_index_iterator(), b_array._real_index_iterator(), index_iter);

    // let iter = {};
    // iter[Symbol.iterator] = function* () {
    //   for (let [a_index, b_index, index] of iterator) {
    //     const a_val = a_array.data[a_index];
    //     const b_val = b_array.data[b_index];
    //     yield [a_val, b_val, index];
    //   }
    // };

    // return [<IterableIterator<[number, number, Uint32Array]>>iter, new_dimensions, new_dtype];
      // tndarray._broadcast_by_index
    throw new Error();
  }

  /**
   * Multiply two 2D matrices.
   * @param {tndarray} a
   * @param {tndarray} b
   */
  static matmul_2d(a: tndarray, b: tndarray) {
    const new_shape = new Uint32Array([a.shape[0], b.shape[1]]);

    let iter = {
      [Symbol.iterator]: function*() {
        for (let i = 0; i < new_shape[0]; i++) {
          for (let j = 0; j < new_shape[1]; j++) {
            let x = tndarray.dot(a.slice(i), b.slice(null, j));

            yield x;
          }
        }
      }
    };

    return tndarray.from_iterable(iter, new_shape);
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
    for (let i = 0; i < a.length; i++) {
      acc += a.data[i] * b.data[i];
    }
    return acc;
  }

  // TODO: Broadcasting
  /**
   * Create an array containing the element-wise max of the inputs.
   * Inputs must be the same shape.
   * @param {tndarray} a  - First array.
   * @param {tndarray} b  - Second array.
   * @return {tndarray}   - An array with the same shape as a and b. Its entries are the max of the corresponding entries of a and b.
   */
  static take_max(a: tndarray, b: tndarray) {
    return tndarray._binary_broadcast(a, b, (x, y) => Math.max(x, y));
  }

  // TODO: Broadcasting
  /**
   * Create an array containing the element-wise min of the inputs.
   * Inputs must be the same shape.
   * @param {tndarray} a  - First array.
   * @param {tndarray} b  - Second array.
   * @return {tndarray}   - An array with the same shape as a and b. Its entries are the min of the corresponding entries of a and b.
   */
  static take_min(a: tndarray, b: tndarray) {
    return tndarray._binary_broadcast(a, b, (x, y) => Math.min(x, y));
  }

  // TODO: Type upcasting.
  /**
   * Compute the sum of two arrays.
   * output[i] = a[i] + [i].
   * @param a
   * @param b
   * @return {number | tndarray}
   */
  static _add(a: Broadcastable, b: Broadcastable) {
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
    return tndarray._binary_broadcast(a, b, (x, y) => Math.pow(x, y), "float64");
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
  static _gt(a: Broadcastable, b: Broadcastable) {
    return tndarray._binary_broadcast(a, b, (x, y) => +(x > y), "uint8");
  }
  
  /**
   * Compute element-wise less than or equal to.
   * @param {Broadcastable} a
   * @param {Broadcastable} b
   */
  static _le(a: Broadcastable, b: Broadcastable) {
    return tndarray._binary_broadcast(a, b, (x, y) => +(x <= y), "uint8");
  }
  
  /**
   * Compute element-wise greater than or equal to.
   * @param {Broadcastable} a
   * @param {Broadcastable} b
   */
  static _ge(a: Broadcastable, b: Broadcastable) {
    return tndarray._binary_broadcast(a, b, (x, y) => +(x >= y), "uint8");
  }
  
  /**
   * Compute element-wise not equal to.
   * @param {Broadcastable} a
   * @param {Broadcastable} b
   */
  static _ne(a: Broadcastable, b: Broadcastable) {
    return tndarray._binary_broadcast(a, b, (x, y) => +(x !== y), "uint8");
  }
  
  /**
   * Compute element-wise equality.
   * @param {Broadcastable} a
   * @param {Broadcastable} b
   */
  static _eq(a: Broadcastable, b: Broadcastable) {
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
