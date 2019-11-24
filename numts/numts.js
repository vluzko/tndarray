"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tensor_1 = require("./tensor");
exports.tensor = tensor_1.tensor;
const indexing_1 = require("./indexing");
/**
 * Return indices
 * @param condition
 * @param a
 * @param b
 */
function where(condition, a, b) {
    throw new Error();
}
exports.where = where;
/**
 *  Return an array of booleans. Each entry is whether the corresponding entries in a and b are numerically close. The arrays will be broadcasted.
 * @param a - First array to compare.
 * @param b - Second array to compare.
 * @param rel_tol - The maximum relative error.
 * @param abs_tol - The maximum absolute error.
 */
function isclose(a, b, rel_tol = 1e-5, abs_tol = 1e-8) {
    const compare = (x, y) => {
        return +(Math.abs(x - y) <= abs_tol + (rel_tol * Math.abs(y)));
    };
    return tensor_1.tensor._binary_broadcast(a, b, compare);
}
exports.isclose = isclose;
// TODO: Allow non-tensor arrays
// TODO: Type upcasting.
/**
 * Compute the sum of two arrays.
 * output[i] = a[i] + [i].
 * @param a
 * @param b
 * @return {number | tensor}
 */
function add(a, b) {
    return tensor_1.tensor._add(a, b);
}
exports.add = add;
function div(a, b) {
    return tensor_1.tensor._div(a, b);
}
exports.div = div;
function mult(a, b) {
    return tensor_1.tensor._mult(a, b);
}
exports.mult = mult;
function sub(a, b) {
    return tensor_1.tensor._sub(a, b);
}
exports.sub = sub;
/**
 * Wrapper around tensor.zeros
 * @param {number[] | Uint32Array} shape
 * @param {string} dtype
 * @return {tensor}
 */
function zeros(shape, dtype) {
    return tensor_1.tensor.zeros(shape, dtype);
}
exports.zeros = zeros;
/**
 * Return an array of the specified size filled with ones.
 * @param {number} shape
 * @param {string} dtype
 * @return {tensor}
 */
function ones(shape, dtype) {
    return tensor_1.tensor.filled(1, shape, dtype);
}
exports.ones = ones;
/**
 * Create a tensor containing a range of integers.
 * @param {number} start_or_stop  - If no other arguments are passed, the upper bound of the range (with lower bound zero). Otherwise this is the lower bound.
 * @param {number} stop           - The upper bound of the range.
 * @param {number} step           - The step size between elements in the range.
 * @param {Shape} shape           - The shape to return.
 * @return {tensor}             - A one-dimensional array containing the range.
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
    return tensor_1.tensor.from_iterable(iter, shape, "int32");
}
exports.arange = arange;
/**
 * Create a tensor from a nested array of values.
 * @param {any[]} array - An array of arrays (nested to arbitrary depth). Each level must have the same dimension.
 * The final level must contain valid data for a tensor.
 * @param {string} dtype  - The type to use for the underlying array.
 *
 * @return {tensor}
 */
function from_nested_array(array, dtype) {
    return tensor_1.tensor.from_nested_array(array, dtype);
}
exports.from_nested_array = from_nested_array;
//# sourceMappingURL=numts.js.map