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
     * TODO: Move to a static function in tndarray
     * @param array1
     * @param array2
     * @return {boolean}
     */
    function array_equal(array1, array2) {
        if (array1.length !== array2.length) {
            return false;
        }
        else {
            return array1.reduce((a, b, i) => a && (b === array2[i]), true);
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
        return !isNaN(value) && value !== null;
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
})(utils = exports.utils || (exports.utils = {}));
//# sourceMappingURL=utils.js.map