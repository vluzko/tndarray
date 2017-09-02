class ndarray {
    /**
     * Computes the total size of the array from its shape.
     * @param {NumericalArray} shape
     * @return {number}
     * @private
     */
    static _compute_size(shape) {
        return shape.reduce((a, b) => a * b);
    }
    /**
     *
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
        }
        return array_type;
    }
    constructor(data, shape) {
        this.data = data;
        this.shape = shape;
        this.offset = (shape).map(() => 0);
    }
    static fromIterable(iterable, shape) {
    }
    static fromBuffer() {
    }
    static fromArray(array, shape, dtype) {
        return new ndarray(array, shape);
    }
    static zeroes(shape, dtype) {
        const size = ndarray._compute_size(shape);
        let data;
        if (dtype === undefined) {
            data = new Int32Array(size);
        }
        else {
            const constructor = ndarray._dtype_map(dtype);
            return new constructor(size);
        }
    }
    g(...indices) {
    }
}
//# sourceMappingURL=tndarray.js.map