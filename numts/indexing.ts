import {utils} from "./utils";

export namespace indexing {
  /**
   * Computes the total length of the array from its shape.
   * @param {NumericalArray} shape
   * @return {number}
   * @private
   */
  export function compute_size(shape: Uint32Array): number {
    return shape.reduce((a, b) => a * b);
  }


  /**
   * Compute a shape array from a shape parameter.
   * @param shape
   * @return {Uint32Array}
   * @private
   */
  export function compute_shape(shape): Uint32Array {
    let final_shape;
    // Compute shapes.
    if (Number.isInteger(shape)) {
      final_shape = new Uint32Array([shape]);
    } else if (Array.isArray(shape)) {
      // TODO: Error is not a numerical array.
      if (shape.length === 0) {
        final_shape = new Uint32Array([0]);
      } else if (utils.is_numeric_array(shape)) {
        final_shape = new Uint32Array(shape);
      } else {
        throw new Error("Bad shape")
      }
    } else if (ArrayBuffer.isView(shape)) {
      final_shape = shape;
    } else {
      throw new Error("Shape must be an int, an array of numbers, or a TypedArray.");
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
  export function compute_final_shape(shape: any, data_length): Uint32Array {
    let final_shape;
    // Compute shapes.
    if (shape === undefined || shape === null) {
      final_shape = new Uint32Array([data_length]);
    } else {
      final_shape = compute_shape(shape);
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
}
