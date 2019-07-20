import {tndarray} from "./tndarray";
import {indexing} from "./indexing";
import {utils} from "./utils";
import {Shape} from "./types";

/**
 * Return indices
 * @param condition
 * @param a
 * @param b
 */
export function where(condition, a, b?) {
  throw new Error();
}

/**
 *  Return an array of booleans. Each entry is whether the corresponding entries in a and b are numerically close. The arrays will be broadcasted. 
 * @param a - First array to compare.
 * @param b - Second array to compare. 
 * @param rel_tol - The maximum relative error.
 * @param abs_tol - The maximum absolute error.
 */
export function isclose(a: tndarray, b: tndarray, rel_tol: number = 1e-5, abs_tol: number = 1e-8): tndarray {
    const compare = (x: number, y: number): number => {
        return +(Math.abs(x - y) <= abs_tol + (rel_tol * Math.abs(y)));
    }
    return tndarray._binary_broadcast(a, b, compare);
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
export function add(a, b) {
  return tndarray._add(a, b);
}

export function div(a, b) {
  return tndarray._div(a, b);
}

export function mult(a, b) {
  return tndarray._mult(a, b);
}

export function sub(a, b) {
  return tndarray._sub(a, b);
}

/**
 * Wrapper around tndarray.zeros
 * @param {number[] | Uint32Array} shape
 * @param {string} dtype
 * @return {tndarray}
 */
export function zeros(shape: number[] | Uint32Array, dtype?: string): tndarray {
  return tndarray.zeros(shape, dtype);
}

/**
 * Return an array of the specified size filled with ones.
 * @param {number} shape
 * @param {string} dtype
 * @return {tndarray}
 */
export function ones(shape: number[] | Uint32Array, dtype?: string): tndarray {
  return tndarray.filled(1, shape, dtype);
}

/**
 * Create a tndarray containing a range of integers.
 * @param {number} start_or_stop  - If no other arguments are passed, the upper bound of the range (with lower bound zero). Otherwise this is the lower bound.
 * @param {number} stop           - The upper bound of the range.
 * @param {number} step           - The step size between elements in the range.
 * @param {Shape} shape           - The shape to return.
 * @return {tndarray}             - A one-dimensional array containing the range.
 */
export function arange(start_or_stop: number, stop?: number, step?: number, shape?: Shape): tndarray {
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
  if (shape === undefined) {
    shape = new Uint32Array([size]);
  } else {
    const shape_size = indexing.compute_size(shape);
    if (shape_size !== size) {
      throw new Error(`Mismatch between size of range (${size}) and size of shape (${shape_size}`);
    }
  }

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
 * Compute the dimensions of a nested array.
 * @param {any[]} nested_array  - Arrays nested arbitrarily deeply. Each array of the same depth must have the same length.
 *                                This is *not* checked.
 * @return {Uint32Array}        - The dimensions of each subarray.
 * @private
 */
export function _nested_array_shape(nested_array: any[]): Uint32Array {
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
export function _nested_array_value_from_index(nested_array: any[], indices: Uint32Array) {
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
export function from_nested_array(array: any[], dtype?: string): tndarray {
  if (array.length === 0) {
    return tndarray.array([]);
  }

  const dimensions = _nested_array_shape(array);
  let slice_iter = indexing.iorder_index_iterator(dimensions);

  const size = indexing.compute_size(dimensions);
  const array_type = utils.dtype_map(dtype);
  const data = new array_type(size);

  let ndarray = tndarray.array(data, dimensions, {dtype: dtype, disable_checks: true});

  for (let indices of slice_iter) {
    const real_index = ndarray._compute_real_index(indices);
    ndarray.data[real_index] = _nested_array_value_from_index(array, indices);
  }

  return ndarray;
}

export {tndarray as tndarray};
