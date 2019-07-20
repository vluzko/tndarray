"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils;
(function (utils) {
    /**
     * TODO: Move to a static function in tndarray
     * @param array1
     * @param array2
     * @return {number}
     */
    function dot(array1, array2) {
        return array1.reduce((a, b, i) => a + b * array2[i], 0);
    }
    utils.dot = dot;
    /**
     * Compare two numeric arrays.
     * @param {Numeric} a - The first array to compare.
     * @param {Numeric} b - Second array to compare.
     * @return {boolean}
     */
    function array_equal(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        else {
            for (let i = 0; i < a.length; i++) {
                if (a[i] !== b[i]) {
                    return false;
                }
            }
            return true;
        }
    }
    utils.array_equal = array_equal;
    /**
     * TODO: Test
     * Checks whether a value is a number and isn't null.
     * @param value - The value to check.
     * @return {boolean}
     */
    function is_numeric(value) {
        return !isNaN(value) && value !== null && !ArrayBuffer.isView(value);
    }
    utils.is_numeric = is_numeric;
    /**
     * Check whether a value is an integer.
     * @param {any} value - The value to check.
     * @return {boolean}
     */
    function is_int(value) {
        return Number.isInteger(value);
    }
    utils.is_int = is_int;
    /**
     * Checks whether a value is an array(like) of numbers.
     * @param array
     * @return {boolean}
     * @private
     */
    function is_numeric_array(array) {
        if (!Array.isArray(array) && !ArrayBuffer.isView(array)) {
            return false;
        }
        else if (ArrayBuffer.isView(array)) {
            return true;
        }
        else {
            return array.reduce((a, b) => is_numeric(b) && a, true);
        }
    }
    utils.is_numeric_array = is_numeric_array;
    function zip_iterable(...iters) {
        let iterators = iters.map(e => e[Symbol.iterator]());
        let iter = {};
        iter[Symbol.iterator] = function* () {
            let all_done = false;
            while (!all_done) {
                let results = [];
                iterators.forEach(e => {
                    let { value, done } = e.next();
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
        return iter;
    }
    utils.zip_iterable = zip_iterable;
    function zip_longest(...iters) {
        let iterators = iters.map(e => e[Symbol.iterator]());
        let iter = {
            [Symbol.iterator]: function* () {
                let individual_done = iters.map(e => false);
                let all_done = false;
                while (!all_done) {
                    let results = [];
                    iterators.forEach((e, i) => {
                        let { value, done } = e.next();
                        if (done) {
                            individual_done[i] = true;
                            iterators[i] = iters[i][Symbol.iterator]();
                            value = iterators[i].next()["value"];
                        }
                        results.push(value);
                    });
                    all_done = individual_done.reduce((a, b) => a && b);
                    if (!all_done) {
                        yield results;
                    }
                }
            }
        };
        return iter;
    }
    utils.zip_longest = zip_longest;
    // TODO: Test
    /**
     * Check if value is an ArrayBuffer
     * @param value
     * @return {boolean}
     */
    function is_typed_array(value) {
        return !!(value.buffer instanceof ArrayBuffer && value.BYTES_PER_ELEMENT);
    }
    utils.is_typed_array = is_typed_array;
    /**
     * Subtract two typed arrays. Should only be called on typed arrays that are guaranteed to be the same size.
     * @param {TypedArray} a
     * @param {TypedArray} b
     * @return {TypedArray}
     * @private
     */
    function _typed_array_sub(a, b) {
        // @ts-ignore
        return a.map((e, i) => e - b[i]);
    }
    utils._typed_array_sub = _typed_array_sub;
    /**
     * Convert a dtype string to the corresponding TypedArray constructor.
     * @param dtype
     * @return {any}
     * @private
     */
    function dtype_map(dtype) {
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
    utils.dtype_map = dtype_map;
    /**
     *
     * @param {string} a  - The first dtype.
     * @param {string} b  - The second dtype.
     * @return {string} - The smallest dtype that can contain a and b without losing data.
     * @private
     */
    function _dtype_join(a, b) {
        // type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array| Int32Array | Uint32Array | Float32Array | Float64Array;
        const ordering = [["int8", "uint8", "uint8c"], ["int16", "uint16"], ["int32", "uint32", "float32"], ["float64"]];
        const a_index = ordering.reduce((acc, e, i) => e.indexOf(a) === -1 ? acc : i, -1);
        const b_index = ordering.reduce((acc, e, i) => e.indexOf(b) === -1 ? acc : i, -1);
        if (a === b) {
            return a;
        }
        else if (a_index === b_index) {
            return ordering[a_index + 1][0];
        }
        else if (a_index < b_index) {
            return b;
        }
        else {
            return a;
        }
    }
    utils._dtype_join = _dtype_join;
    /**
     * Get lower indices and steps for a slice over an entire shape.
     * @param shape - The shape of the array.
     */
    function shape_to_lus(shape) {
        const lower = new Uint32Array(shape.length);
        let steps = new Uint32Array(shape.length);
        steps.fill(1);
        return [lower, shape.slice(0), steps];
    }
    utils.shape_to_lus = shape_to_lus;
    /**
     * Create a fixed-sized array of ones.
     * @param length - The length of the array.
     */
    function fixed_ones(length) {
        let steps = new Uint32Array(length);
        steps.fill(1);
        return steps;
    }
    utils.fixed_ones = fixed_ones;
    /**
     * Add one to a mixed-radix number represented by a Uint32Array.
     * Note that it is assumed that it is *possible* to add one to the given value. This function will *not* extend the array.
     * @param value - The current value of the number.
     * @param upper_bounds - The upper bounds of each digit. In other words the base for the numerical system used in that column
     * @param index - The index to increment.
     */
    function increment_digit(value, upper_bounds, index) {
        let cur_index = index;
        let copy = value.slice(0);
        let done = false;
        while (!done) {
            if (copy[cur_index] === upper_bounds[cur_index]) {
                copy[cur_index] = 0;
                cur_index -= 1;
            }
            else {
                copy[cur_index] = copy[cur_index] + 1;
                done = true;
            }
        }
        return copy;
    }
    utils.increment_digit = increment_digit;
})(utils = exports.utils || (exports.utils = {}));
//# sourceMappingURL=utils.js.map