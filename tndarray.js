"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var errors;
(function (errors) {
    class MismatchedSizes extends Error {
        constructor() {
            super("Array sizes do not match.");
        }
    }
    errors.MismatchedSizes = MismatchedSizes;
    class MismatchedShapes extends Error {
        constructor() {
            super("Array shapes do not match.");
        }
    }
    errors.MismatchedShapes = MismatchedShapes;
    class BadData extends Error {
        constructor() {
            super("Bad data.");
        }
    }
    errors.BadData = BadData;
    class DataNotArrayError extends Error {
    }
    errors.DataNotArrayError = DataNotArrayError;
    class DataNullOrNotNumeric extends Error {
    }
    errors.DataNullOrNotNumeric = DataNullOrNotNumeric;
    class BadShape extends Error {
    }
    errors.BadShape = BadShape;
    class MismatchedShapeSize extends Error {
    }
    errors.MismatchedShapeSize = MismatchedShapeSize;
    class WrongIterableSize extends Error {
    }
    errors.WrongIterableSize = WrongIterableSize;
    class NestedArrayHasInconsistentDimensions extends Error {
    }
    errors.NestedArrayHasInconsistentDimensions = NestedArrayHasInconsistentDimensions;
})(errors || (errors = {}));
exports.errors = errors;
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
})(utils || (utils = {}));
exports.utils = utils;
class tndarray {
    /**
     *
     * @param data
     * @param {Uint32Array} shape   - The shape of the array.
     * @param {Uint32Array} offset  - The offset of the array from the start of the underlying data.
     * @param {Uint32Array} stride  - The stride of the array.
     * @param {Uint32Array} dstride - The stride of the underlying data.
     * @param {number} size         - The number of elements in the array.
     * @param {string} dtype
     * @constructor
     */
    constructor(data, shape, offset, stride, dstride, size, dtype) {
        this.shape = shape;
        this.offset = offset;
        this.stride = stride;
        this.length = size;
        this.dstride = dstride;
        if (dtype !== undefined) {
            const array_type = tndarray._dtype_map(dtype);
            if (!(data instanceof array_type)) {
                this.data = new array_type(data);
            }
            else {
                this.data = data;
            }
            this.dtype = dtype;
        }
        else {
            this.data = data;
            this.dtype = "float64";
        }
        this.initial_offset = utils.dot(this.dstride, this.offset);
    }
    /**
     * Computes the index of a value in the underlying data array based on a passed index.
     * @param indices
     * @return {number} - The index
     * @private
     */
    _compute_real_index(indices) {
        if (ArrayBuffer.isView(indices[0])) {
            indices = indices[0];
        }
        return utils.dot(indices, this.stride) + this.initial_offset;
    }
    /**
     * Computes the size of a slice.
     * @param lower_bounds
     * @param upper_bounds
     * @param steps
     * @private
     */
    static _compute_slice_size(lower_bounds, upper_bounds, steps) {
        const ranges = tndarray.sub(upper_bounds, lower_bounds);
        const values = tndarray.cdiv(ranges, steps);
        return values.reduce((a, e) => a * e, 1);
    }
    /**
     * Return a slice of an array. Copies the underlying data.
     * @param indices
     */
    c_slice(...indices) {
    }
    /**
     * Return a slice of an array. Does not copy the underlying data.
     * @param indices
     */
    slice(...indices) {
    }
    reshape(new_shape) {
    }
    /**
     *
     * @param indices
     * @return {any}
     */
    g(...indices) {
        const real_index = this._compute_real_index(indices);
        return this.data[real_index];
    }
    /**
     * Set an element of the array.
     * @param {number} value
     * @param indices
     */
    s(value, ...indices) {
        const real_index = this._compute_real_index(indices);
        this.data[real_index] = value;
    }
    /**
     * Returns the negation of this array.
     */
    neg() {
        const new_data = this.data.map(x => -x);
        return tndarray.array(new_data, this.shape, { disable_checks: true, dtype: this.dtype });
    }
    // TODO: Axes.
    /**
     * Returns the maximum element of the array.
     * @param {number} axis
     * @return {number}
     */
    max(axis) {
        return Math.max(...this.data);
    }
    // TODO: Axes.
    /**
     * Returns the minimum element of the array.
     * @param {number} axis
     * @return {number}
     */
    min(axis) {
        return Math.min(...this.data);
    }
    /**
     * Compute an element-wise power.
     * @param {number} exp
     * @param {number} axis
     */
    power(exp, axis) {
        return this.map(e => Math.pow(e, exp));
    }
    /**
     * Sum the entries of an array.
     * @param {number} axis
     */
    sum(axis) {
        return this.reduce((a, e) => a + e, 0);
    }
    /**
     * Calculate the mean of the array.
     * @param {number} axis
     */
    mean(axis) {
        return this.sum() / this.length;
    }
    // TODO: Axes.
    /**
     * Map the array.
     * @param f
     * @param {number} axis
     * @return {tndarray}
     */
    map(f, axis) {
        const new_data = this.data.map(f);
        return tndarray.array(new_data, this.shape, { disable_checks: true, dtype: this.dtype });
    }
    // TODO: Axes.
    /**
     * Reduce the array.
     * @param f
     * @param {number} axis
     */
    reduce(f, axis) {
        return this.data.reduce(f);
    }
    // /**
    //  * Similar to filter, but avoids the issue of having to compute the shape of the new array.
    //  * @param f
    //  * @return {tndarray}
    //  */
    // where(f): tndarray {
    //   return
    // }
    /**
     * Iterate over a slice.
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
    static _slice_iterator(lower_or_upper, upper_bounds, steps) {
        if (steps === undefined) {
            steps = new Uint32Array(lower_or_upper.length);
            steps.fill(1);
        }
        if (upper_bounds === undefined) {
            upper_bounds = lower_or_upper;
            lower_or_upper = new Uint32Array(upper_bounds.length);
        }
        let iter = {};
        const size = tndarray._compute_slice_size(lower_or_upper, upper_bounds, steps);
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
        return iter;
    }
    /**
     * Computes the total length of the array from its shape.
     * @param {NumericalArray} shape
     * @return {number}
     * @private
     */
    static _compute_size(shape) {
        return shape.reduce((a, b) => a * b);
    }
    /**
     * Convert a dtype string to the corresponding TypedArray.
     * @param dtype
     * @return {any}
     * @private
     */
    static _dtype_map(dtype) {
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
    /**
     * Check that the value is valid tndarray data.
     * @param data
     */
    static _check_data(data) {
        if (!Array.isArray(data)) {
            throw new errors.DataNotArrayError();
        }
        if (!data.reduce((a, b) => (!isNaN(b) && b !== null) && a, true)) {
            throw new errors.DataNullOrNotNumeric();
        }
    }
    /**
     * Checks whether a value is an array(like) of numbers.
     * @param array
     * @return {boolean}
     * @private
     */
    static _is_numeric_array(array) {
        if (!Array.isArray(array) && !ArrayBuffer.isView(array)) {
            return false;
        }
        else {
            return array.reduce((a, b) => utils.is_numeric(b) && a, true);
        }
    }
    /**
     * Compute a shape array from a shape parameter.
     * @param shape
     * @return {Uint32Array}
     * @private
     */
    static _compute_shape(shape) {
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
            else if (tndarray._is_numeric_array(shape)) {
                final_shape = new Uint32Array(shape);
            }
            else {
                throw new errors.BadShape();
            }
        }
        else if (ArrayBuffer.isView(shape)) {
            final_shape = shape;
        }
        else {
            throw new errors.BadShape();
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
    static _compute_final_shape(shape, data_length) {
        let final_shape;
        // Compute shapes.
        if (shape === undefined || shape === null) {
            final_shape = new Uint32Array([data_length]);
        }
        else {
            final_shape = tndarray._compute_shape(shape);
        }
        return final_shape;
    }
    /**
     * Produces a column-major stride from an array shape.
     * @param {Uint32Array} shape
     * @private
     */
    static _stride_from_shape(shape) {
        let stride = new Uint32Array(shape.length);
        stride[0] = 1;
        let i;
        for (i = 0; i < shape.length - 1; i++) {
            stride[i + 1] = stride[i] * shape[i];
        }
        return stride;
    }
    /**
     * Checks that the inputs have a `length` property, and that their lengths are equal.
     * @param value1
     * @param value2
     * @return {boolean}
     * @private
     */
    static _lengths_exist_and_match(value1, value2) {
        return value1.length !== undefined && value1.length === value2.length;
    }
    /**
     * Returns a tndarray if a or b are tndarrays, returns the raw data otherwise.
     * @param a - The first value used to produce `new_data`. Has priority.
     * @param b - The second value used to produce `new_data`.
     * @param new_data  - The actual data.
     * @return {any}
     * @private
     */
    static _upcast_data(a, b, new_data) {
        if (a instanceof tndarray) {
            return tndarray.array(new_data, a.shape, { disable_checks: true, dtype: a.dtype });
        }
        else if (b instanceof tndarray) {
            return tndarray.array(new_data, b.shape, { disable_checks: true, dtype: b.dtype });
        }
        else {
            return new_data;
        }
    }
    /**
     * Broadcast one array to another.
     * @param {tndarray} a
     * @param {tndarray} b
     * @private
     */
    static _broadcast(a, b) {
        let a_dim = a.shape.length;
        let b_dim = b.shape.length;
        const number_of_dimensions = Math.max(a_dim, b_dim);
        const new_dimensions = new Uint32Array(number_of_dimensions);
        for (let j = 1; j <= number_of_dimensions; j++) {
            let a_axis_size = a_dim - j >= 0 ? a.shape[a_dim - j] : 1;
            let b_axis_size = b_dim - j >= 0 ? b.shape[b_dim - j] : 1;
            let dimension;
            // If the axes match in size, that is the broadcasted dimension.
            if (a_axis_size === b_axis_size) {
                dimension = a_axis_size;
            }
            else if (a_axis_size === 1) {
                dimension = b_axis_size;
            }
            else if (b_axis_size === 1) {
                dimension = a_axis_size;
            }
            else {
                throw new errors.BadShape();
            }
            new_dimensions[number_of_dimensions - j] = dimension;
        }
        let iter = {};
        iter[Symbol.iterator] = function* () {
            // let current_index = lower_or_upper.slice();
            // let count = 0;
            //
            // // Equivalent to stopping when the maximum index is reached, but saves actually checking for array equality.
            // for (let i = 0; i < size; i++) {
            //   // Yield a copy of the current index.
            //   yield current_index.slice();
            //
            //   ++current_index[end_dimension];
            //
            //   // Carry the ones.
            //   let current_dimension = end_dimension;
            //   while (current_dimension >= 0 && (current_index[current_dimension] === upper_bounds[current_dimension])) {
            //     current_index[current_dimension] = lower_or_upper[current_dimension];
            //     current_dimension--;
            //     current_index[current_dimension] += steps[current_dimension];
            //   }
            //
            //   count++;
            // }
        };
        return new_dimensions;
    }
    /**
     * Returns an iterator over the indices of the array.
     * @private
     */
    _index_iterator() {
        return tndarray._slice_iterator(this.shape);
    }
    /**
     * TODO: Test
     * Returns a generator of the values of the array, in index order.
     * @private
     */
    *_value_iterator() {
        const index_iterator = tndarray._slice_iterator(this.shape);
        let iter = {};
        // Alas, generators are dynamically scoped.
        const self = this;
        iter[Symbol.iterator] = function* () {
            for (let index of index_iterator) {
                yield self.g(index);
            }
        };
        return iter;
    }
    /**
     * Compute the dimensions of a nested array.
     * @param {any[]} nested_array  - Arrays nested arbitrarily deeply. Each array of the same depth must have the same length.
     *                                This is *not* checked.
     * @return {Uint32Array}        - The dimensions of each subarray.
     * @private
     */
    static _nested_array_shape(nested_array) {
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
    /**
     *
     * @param {any[]} nested_array
     * @param {Uint32Array} indices
     * @return {any[]}
     * @private
     */
    static _nested_array_value_from_index(nested_array, indices) {
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
    static from_nested_array(array, dtype) {
        if (array.length === 0) {
            return tndarray.array([]);
        }
        const dimensions = tndarray._nested_array_shape(array);
        let slice_iter = tndarray._slice_iterator(dimensions);
        const size = tndarray._compute_size(dimensions);
        const array_type = tndarray._dtype_map(dtype);
        const data = new array_type(size);
        let ndarray = tndarray.array(data, dimensions, { dtype: dtype, disable_checks: true });
        for (let indices of slice_iter) {
            const real_index = ndarray._compute_real_index(indices);
            ndarray.data[real_index] = tndarray._nested_array_value_from_index(array, indices);
        }
        return ndarray;
    }
    /**
     * Create an n-dimensional array from an iterable.
     * @param iterable
     * @param shape
     * @param {string} dtype
     * @return {tndarray}
     */
    static from_iterable(iterable, shape, dtype) {
        const final_shape = tndarray._compute_shape(shape);
        const size = tndarray._compute_size(final_shape);
        const array_type = tndarray._dtype_map(dtype);
        const data = new array_type(iterable);
        if (data.length !== size) {
            throw new errors.WrongIterableSize();
        }
        return tndarray.array(data, final_shape, { disable_checks: true, dtype: dtype });
    }
    /**
     * Produces an array of the desired shape filled with a single value.
     * @param {number} value                - The value to fill in.
     * @param shape - A numerical array or a number. If this is a number a one-dimensional array of that length is produced.
     * @param {string} dtype                - The data type to use for the array. float64 by default.
     * @return {tndarray}
     */
    static filled(value, shape, dtype) {
        const final_shape = tndarray._compute_shape(shape);
        const size = tndarray._compute_size(final_shape);
        const array_type = tndarray._dtype_map(dtype);
        const data = new array_type(size).fill(value);
        return tndarray.array(data, final_shape, { disable_checks: true, dtype: dtype });
    }
    /**
     * A special case of filled that produces an array of zeros.
     * Implemented without actually calling filled, because TypedArray constructors initialize everything to 0 already.
     * @param {AnyNumerical} shape
     * @param {string} dtype
     * @return {tndarray}
     */
    static zeros(shape, dtype) {
        const final_shape = tndarray._compute_shape(shape);
        const size = tndarray._compute_size(final_shape);
        const array_type = tndarray._dtype_map(dtype);
        const data = new array_type(size);
        return tndarray.array(data, final_shape, { disable_checks: true, dtype: dtype });
    }
    /**
     * A special called of filled that produces an array of ones.
     * @param {AnyNumerical | number} shape
     * @param {string} dtype
     * @return {tndarray}
     */
    static ones(shape, dtype) {
        return tndarray.filled(1, shape, dtype);
    }
    /**
     *
     * @param {tndarray} a
     * @param b
     * @return {tndarray}
     */
    static take_max(a, b) {
        return a.map((e, i) => Math.max(e, b[i]));
    }
    static arange(start_or_stop, stop, step) {
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
        let size = Math.floor((stop - start) / step);
        const shape = new Uint32Array([size]);
        let iter = {};
        iter[Symbol.iterator] = function* () {
            let i = 0;
            while (i < stop) {
                yield i;
                i++;
            }
        };
        return tndarray.from_iterable(iter, shape, "int32");
    }
    /**
     * Create a tndarray containing the specified data
     * @param data
     * @param shape
     * @param options
     * @return {tndarray}
     */
    static array(data, shape, options) {
        let final_shape;
        let size;
        let dtype;
        if (options && options.dtype) {
            dtype = options.dtype;
        }
        if (options && options.disable_checks === true) {
            final_shape = shape;
            size = tndarray._compute_size(shape);
        }
        else {
            if (!tndarray._is_numeric_array(data)) {
                throw new errors.BadData();
            }
            final_shape = tndarray._compute_final_shape(shape, data.length);
            // Compute length
            size = tndarray._compute_size(final_shape);
            if (size !== data.length) {
                throw new errors.MismatchedShapeSize();
            }
        }
        const stride = tndarray._stride_from_shape(final_shape);
        const offset = new Uint32Array(final_shape.length);
        const dstride = new Uint32Array(final_shape.length);
        return new tndarray(data, final_shape, offset, stride, dstride, size, dtype);
    }
    // TODO: Broadcasting
    // TODO: Allow non-tndarray arrays
    // TODO: Type upcasting.
    /**
     * Compute the sum of two arrays.
     * output[i] = a[i] + [i].
     * @param a
     * @param b
     * @return {number | tndarray}
     */
    static add(a, b) {
        if (!tndarray._lengths_exist_and_match(a, b)) {
            throw new errors.MismatchedSizes();
        }
        const new_data = a.map((e, i) => e + b[i]);
        return tndarray._upcast_data(a, b, new_data);
    }
    // TODO: Broadcasting
    // TODO: Allow non-tndarray arrays
    // TODO: Type upcasting.
    /**
     * Subtract an array from another.
     * output[i] = a[i] - b[i].
     * @param {tndarray} a
     * @param {tndarray} b - The subtrahend.
     * @return {tndarray} - The element-wise
     */
    static sub(a, b) {
        if (!tndarray._lengths_exist_and_match(a, b)) {
            throw new errors.MismatchedSizes();
        }
        const new_data = a.map((e, i) => e - b[i]);
        return tndarray._upcast_data(a, b, new_data);
    }
    // TODO: Broadcasting
    // TODO: Allow non-tndarray arrays
    // TODO: Type upcasting.
    /**
     * Compute the Hadamard product of two arrays, i.e. the element-wise product of the two arrays.
     * output[i] = a[i] * b[i].
     * @param {tndarray} a - First factor.
     * @param {tndarray} b - Second factor.
     * @return {tndarray} - The element-wise product of the two inputs. Will have the shape of value1.
     */
    static mult(a, b) {
        if (!tndarray._lengths_exist_and_match(a, b)) {
            throw new errors.MismatchedSizes();
        }
        const new_data = a.map((e, i) => e * b[i]);
        return tndarray._upcast_data(a, b, new_data);
    }
    // TODO: Broadcasting
    // TODO: Allow non-tndarray arrays
    // TODO: Type upcasting.
    /**
     * Compute the element-wise quotient of the two inputs.
     * output[i] = a[i] / b[i].
     * @param {tndarray} a - Dividend array.
     * @param {tndarray} b - Divisor array.
     * @return {tndarray} - The element-wise quotient of value1 and value2. Will have the shape of value1.
     */
    static div(a, b) {
        if (!tndarray._lengths_exist_and_match(a, b)) {
            throw new errors.MismatchedSizes();
        }
        const new_data = a.map((e, i) => e / b[i]);
        return tndarray._upcast_data(a, b, new_data);
    }
    /**
     * Compute the element-wise quotient of two arrays, rounding values up to the nearest integer.
     * @param a
     * @param b
     * @return {tndarray | tndarray | any}
     */
    static cdiv(a, b) {
        if (!tndarray._lengths_exist_and_match(a, b)) {
            throw new errors.MismatchedSizes();
        }
        const new_data = a.map((e, i) => Math.ceil(e / b[i]));
        return tndarray._upcast_data(a, b, new_data);
    }
    /**
     * Compute the element-wise quotient of two arrays, rounding values down to the nearest integer.
     * @param a
     * @param b
     */
    static fdiv(a, b) {
        if (!tndarray._lengths_exist_and_match(a, b)) {
            throw new errors.MismatchedSizes();
        }
        const new_data = a.map((e, i) => Math.floor(e / b[i]));
        return tndarray._upcast_data(a, b, new_data);
    }
    // TODO: Generalize to an inner product.
    // TODO: Use the Kahan summation algorithm. This is numerically unstable.
    /**
     * Compute the dot product of two arrays.
     * @param {tndarray} a
     * @param {tndarray} b
     * @return {number}
     */
    static dot(a, b) {
        let acc = 0;
        for (let i = 0; i++; i < a.length) {
            acc += a.data[i] + b.data[i];
        }
        return acc;
    }
    /**
     * Check if two n-dimensional arrays are equal.
     * @param {tndarray} array1
     * @param {tndarray} array2
     * @return {boolean}
     */
    static equals(array1, array2) {
        return ((array1.length === array2.length) &&
            (tndarray._equal_data(array1.shape, array2.shape)) &&
            (tndarray._equal_data(array1.offset, array2.offset)) &&
            (tndarray._equal_data(array1.stride, array2.stride)) &&
            (tndarray._equal_data(array1.dstride, array2.dstride)) &&
            (array1.initial_offset === array2.initial_offset) &&
            (array1.dtype === array2.dtype) &&
            (tndarray._equal_data(array1, array2)));
    }
    /**
     * Check if two arraylikes have the same length and the same elements.
     * @param array1
     * @param array2
     * @return {boolean}  - true if the length and elements match, false otherwise.
     * @private
     */
    static _equal_data(array1, array2) {
        if (array1 instanceof tndarray) {
            array1 = array1.data;
        }
        if (array2 instanceof tndarray) {
            array2 = array2.data;
        }
        return ((array1.length === array2.length) &&
            (array1.reduce((a, e, i) => a && e === array2[i], true)));
    }
}
exports.tndarray = tndarray;
//# sourceMappingURL=tndarray.js.map