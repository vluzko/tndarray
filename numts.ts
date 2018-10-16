import {tndarray} from "./tndarray";

/**
 * Return indices
 * @param condition
 * @param a
 * @param b
 */
export function where(condition, a, b?) {

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
 * Create a tndarray containing a range of integers.
 * @param {number} start_or_stop  - If no other arguments are passed, the upper bound of the range (with lower bound zero). Otherwise this is the lower bound.
 * @param {number} stop           - The upper bound of the range.
 * @param {number} step           - The step size between elements in the range.
 * @return {tndarray}             - A one-dimensional array containing the range.
 */
export function arange(start_or_stop: number, stop?: number, step?: number): tndarray {
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

export {tndarray as tndarray};
