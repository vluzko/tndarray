import {utils} from "./utils";
import {Broadcastable, Shape} from "./types";


export namespace indexing {
  /**
   * Computes the total length of the array from its shape.
   * @param {NumericalArray} shape
   * @return {number}
   * @private
   */
  export function compute_size(shape: Shape): number {
    // @ts-ignore
    return shape.reduce((a, b) => a * b);
  }


  /**
   * Compute a shape array from a shape parameter.
   * @param shape
   * @return {Uint32Array}
   * @private
   */
  export function compute_shape(shape: number | Shape): Uint32Array {
    let final_shape;

    // Convert integer to shape.
    if (utils.is_int(shape)) {
      final_shape = new Uint32Array([shape]);

    // Convert standard array to shape.
    } else if (Array.isArray(shape)) {
      // TODO: Error is not a numerical array.
      if (shape.length === 0) {
        final_shape = new Uint32Array([0]);
      } else if (utils.is_numeric_array(shape)) {
        final_shape = new Uint32Array(shape);
      } else {
        throw new Error("Shape array must be numeric.")
      }

    // Convert TypedArray to shape.
    } else if (ArrayBuffer.isView(shape)) {
      final_shape = shape;

    } else {
      throw new Error("Shape must be an int, an array of numbers, or a Uint32Array.");
    }
    return final_shape;
  }

  /**
   * Calculate a shape from a slice.
   * @param {Uint32Array} start
   * @param {Uint32Array} stop
   * @param {Uint32Array} steps
   * @private
   */
  export function new_shape_from_slice(start: Uint32Array, stop: Uint32Array, steps: Uint32Array) {
    const diff = stop.map((e, i) => e - start[i]);
    const required_steps = diff.map((e, i) => Math.floor(e / steps[i]));
    return new Uint32Array(required_steps);
  }

  /**
   * Get the new shape after performing a reduction along an axis.
   * @param {Uint32Array} old_shape
   * @param {number} axis
   * @return {Uint32Array}
   */
  export function new_shape_from_axis(old_shape: Uint32Array, axis: number): Uint32Array {
    let new_shape;
    if (old_shape.length === 1) {
      new_shape = new Uint32Array(1);
    } else {
      new_shape = old_shape.filter((e, i) => i !== axis);
    }
    return new_shape
  }

  /**
   * Computes the size of a slice.
   * @param lower_bounds
   * @param upper_bounds
   * @param steps
   * @private
   */
  export function compute_slice_size(lower_bounds: Uint32Array, upper_bounds: Uint32Array, steps: Uint32Array): number {
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
  export function index_in_data(indices: Uint32Array, stride: Uint32Array, initial_offset: number): number {
    return utils.dot(indices, stride) + initial_offset;
  }

  /**
   * Produces a column-major stride from an array shape.
   * @param {Uint32Array} shape
   * @private
   */
  export  function stride_from_shape(shape: Uint32Array): Uint32Array {
    let stride = new Uint32Array(shape.length);
    stride[0] = 1;
    let i;
    for (i = 0; i < shape.length - 1; i++) {
      stride[i + 1] = stride[i] * shape[i];
    }
    return stride;
  }

  export function convert_negative_indices(indices: Array<number | number[]>, shape: Shape) {
    let new_indices = indices.slice();
    let i = 0;
    for (let index of new_indices) {

      if (utils.is_numeric(index)) {
        new_indices[i] = index < 0 ? shape[i] + index : index;
      } else if (Array.isArray(index) || ArrayBuffer.isView(index)) {
        const second_index = index[1] < 0 ? shape[i] + index[1] : index[1];
        index[1] = second_index;
      }
      i += 1;
    }
    return new_indices;
  }

  /**
   * Return an iterator over the indices of a slice.
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
  export function slice_iterator(lower_or_upper: Uint32Array, upper_bounds?: Uint32Array, steps?: Uint32Array): Iterable<Uint32Array> {
    if (steps === undefined) {
      steps = new Uint32Array(lower_or_upper.length);
      steps.fill(1);
    }

    if (upper_bounds === undefined) {
      upper_bounds = lower_or_upper;
      lower_or_upper = new Uint32Array(upper_bounds.length);
    }

    let iter = {};
    const size = indexing.compute_slice_size(lower_or_upper, upper_bounds, steps);
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

}
