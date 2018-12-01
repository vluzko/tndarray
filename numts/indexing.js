"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
var indexing;
(function (indexing) {
    /**
     * Computes the total length of the array from its shape.
     * @param {NumericalArray} shape
     * @return {number}
     * @private
     */
    function compute_size(shape) {
        return shape.reduce((a, b) => a * b);
    }
    indexing.compute_size = compute_size;
    /**
     * Compute a shape array from a shape parameter.
     * @param shape
     * @return {Uint32Array}
     * @private
     */
    function compute_shape(shape) {
        let final_shape;
        // Compute shapes.
        if (Number.isInteger(shape)) {
            final_shape = new Uint32Array([shape]);
        }
        else if (Array.isArray(shape)) {
            // TODO: Error is not a numerical array.
            if (shape.length === 0) {
                final_shape = new Uint32Array([0]);
            }
            else if (utils_1.utils.is_numeric_array(shape)) {
                final_shape = new Uint32Array(shape);
            }
            else {
                throw new Error("Bad shape");
            }
        }
        else if (ArrayBuffer.isView(shape)) {
            final_shape = shape;
        }
        else {
            throw new Error("Shape must be an int, an array of numbers, or a TypedArray.");
        }
        return final_shape;
    }
    indexing.compute_shape = compute_shape;
    /**
     * Compute the final shape for the new ndarray.
     * @param shape
     * @param data_length
     * @return {Uint32Array}
     * @private
     */
    function compute_final_shape(shape, data_length) {
        let final_shape;
        // Compute shapes.
        if (shape === undefined || shape === null) {
            final_shape = new Uint32Array([data_length]);
        }
        else {
            final_shape = compute_shape(shape);
        }
        return final_shape;
    }
    indexing.compute_final_shape = compute_final_shape;
    /**
     * Calculate a shape from a slice.
     * @param {Uint32Array} start
     * @param {Uint32Array} stop
     * @param {Uint32Array} steps
     * @private
     */
    function new_shape_from_slice(start, stop, steps) {
        const diff = stop.map((e, i) => e - start[i]);
        const required_steps = diff.map((e, i) => Math.floor(e / steps[i]));
        return new Uint32Array(required_steps);
    }
    indexing.new_shape_from_slice = new_shape_from_slice;
    /**
     * Get the new shape after performing a reduction along an axis.
     * @param {Uint32Array} old_shape
     * @param {number} axis
     * @return {Uint32Array}
     */
    function new_shape_from_axis(old_shape, axis) {
        let new_shape;
        if (old_shape.length === 1) {
            new_shape = new Uint32Array(1);
        }
        else {
            new_shape = old_shape.filter((e, i) => i !== axis);
        }
        return new_shape;
    }
    indexing.new_shape_from_axis = new_shape_from_axis;
    /**
     * Computes the size of a slice.
     * @param lower_bounds
     * @param upper_bounds
     * @param steps
     * @private
     */
    function compute_slice_size(lower_bounds, upper_bounds, steps) {
        const ranges = utils_1.utils._typed_array_sub(upper_bounds, lower_bounds);
        const values = ranges.map((e, i) => Math.ceil(e / steps[i]));
        return values.reduce((a, e) => a * e, 1);
    }
    indexing.compute_slice_size = compute_slice_size;
    /**
     *
     * @param {Uint32Array} indices
     * @param {Uint32Array} stride
     * @param {number} initial_offset
     * @return {number}
     * @private
     */
    function index_in_data(indices, stride, initial_offset) {
        return utils_1.utils.dot(indices, stride) + initial_offset;
    }
    indexing.index_in_data = index_in_data;
})(indexing = exports.indexing || (exports.indexing = {}));
//# sourceMappingURL=indexing.js.map