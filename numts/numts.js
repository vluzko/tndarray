"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tndarray_1 = require("./tndarray");
exports.tndarray = tndarray_1.tndarray;
const indexing_1 = require("./indexing");
const utils_1 = require("./utils");
/**
 * Return indices
 * @param condition
 * @param a
 * @param b
 */
function where(condition, a, b) {
}
exports.where = where;
// TODO: Allow non-tndarray arrays
// TODO: Type upcasting.
/**
 * Compute the sum of two arrays.
 * output[i] = a[i] + [i].
 * @param a
 * @param b
 * @return {number | tndarray}
 */
function add(a, b) {
    return tndarray_1.tndarray._add(a, b);
}
exports.add = add;
function div(a, b) {
    return tndarray_1.tndarray._div(a, b);
}
exports.div = div;
function mult(a, b) {
    return tndarray_1.tndarray._mult(a, b);
}
exports.mult = mult;
function sub(a, b) {
    return tndarray_1.tndarray._sub(a, b);
}
exports.sub = sub;
/**
 * Wrapper around tndarray.zeros
 * @param {number[] | Uint32Array} shape
 * @param {string} dtype
 * @return {tndarray}
 */
function zeros(shape, dtype) {
    return tndarray_1.tndarray.zeros(shape, dtype);
}
exports.zeros = zeros;
/**
 * Return an array of the specified size filled with ones.
 * @param {number} shape
 * @param {string} dtype
 * @return {tndarray}
 */
function ones(shape, dtype) {
    return tndarray_1.tndarray.filled(1, shape, dtype);
}
exports.ones = ones;
/**
 * Create a tndarray containing a range of integers.
 * @param {number} start_or_stop  - If no other arguments are passed, the upper bound of the range (with lower bound zero). Otherwise this is the lower bound.
 * @param {number} stop           - The upper bound of the range.
 * @param {number} step           - The step size between elements in the range.
 * @param {Shape} shape           - The shape to return.
 * @return {tndarray}             - A one-dimensional array containing the range.
 */
function arange(start_or_stop, stop, step, shape) {
    if (step === undefined) {
        step = 1;
    }
    let start;
    if (stop === undefined) {
        stop = start_or_stop;
        start = 0;
    }
    else {
        start = start_or_stop;
    }
    let size = Math.abs(Math.floor((stop - start) / step));
    if (shape === undefined) {
        shape = new Uint32Array([size]);
    }
    else {
        const shape_size = indexing_1.indexing.compute_size(shape);
        if (shape_size !== size) {
            throw new Error(`Mismatch between size of range (${size}) and size of shape (${shape_size}`);
        }
    }
    let iter = {
        [Symbol.iterator]: function* () {
            let i = start;
            while (i < real_stop) {
                yield i;
                i += step;
            }
        }
    };
    let real_stop = stop < start ? -stop : stop;
    return tndarray_1.tndarray.from_iterable(iter, shape, "int32");
}
exports.arange = arange;
/**
 * Compute the dimensions of a nested array.
 * @param {any[]} nested_array  - Arrays nested arbitrarily deeply. Each array of the same depth must have the same length.
 *                                This is *not* checked.
 * @return {Uint32Array}        - The dimensions of each subarray.
 * @private
 */
function _nested_array_shape(nested_array) {
    let dims = [];
    let current = nested_array;
    let at_bottom = false;
    while (!at_bottom) {
        dims.push(current.length);
        if (Array.isArray(current[0])) {
            current = current[0];
        }
        else {
            at_bottom = true;
        }
    }
    return new Uint32Array(dims);
}
exports._nested_array_shape = _nested_array_shape;
/**
 *
 * @param {any[]} nested_array
 * @param {Uint32Array} indices
 * @return {any[]}
 * @private
 */
function _nested_array_value_from_index(nested_array, indices) {
    let current_subarray = nested_array;
    for (let index of indices) {
        current_subarray = current_subarray[index];
    }
    return current_subarray;
}
exports._nested_array_value_from_index = _nested_array_value_from_index;
/**
 * Create a tndarray from a nested array of values.
 * @param {any[]} array - An array of arrays (nested to arbitrary depth). Each level must have the same dimension.
 * The final level must contain valid data for a tndarray.
 * @param {string} dtype  - The type to use for the underlying array.
 *
 * @return {tndarray}
 */
function from_nested_array(array, dtype) {
    if (array.length === 0) {
        return tndarray_1.tndarray.array([]);
    }
    const dimensions = _nested_array_shape(array);
    let slice_iter = indexing_1.indexing.slice_iterator(dimensions);
    const size = indexing_1.indexing.compute_size(dimensions);
    const array_type = utils_1.utils.dtype_map(dtype);
    const data = new array_type(size);
    let ndarray = tndarray_1.tndarray.array(data, dimensions, { dtype: dtype, disable_checks: true });
    for (let indices of slice_iter) {
        const real_index = ndarray._compute_real_index(indices);
        ndarray.data[real_index] = _nested_array_value_from_index(array, indices);
    }
    return ndarray;
}
exports.from_nested_array = from_nested_array;
//# sourceMappingURL=numts.js.map