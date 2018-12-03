
type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array| Int32Array | Uint32Array | Float32Array | Float64Array;
type Numeric = TypedArray | number[];
type Shape = number[] | Uint32Array;


export namespace utils {
  /**
   * TODO: Move to a static function in tndarray
   * @param array1
   * @param array2
   * @return {number}
   */
  export function dot(array1, array2): number {
    return array1.reduce((a, b, i) => a + b * array2[i], 0);
  }

  /**
   * TODO: Move to a static function in tndarray
   * @param array1
   * @param array2
   * @return {boolean}
   */
  export function array_equal(array1, array2) {
    if (array1.length !== array2.length) {
      return false;
    } else {
      return array1.reduce((a, b, i) => a && (b === array2[i]), true);
    }
  }

  /**
   * TODO: Test
   * Checks whether a value is a number and isn't null.
   * @param value - The value to check.
   * @return {boolean}
   */
  export function is_numeric(value: any): value is number {
    return !isNaN(value) && value !== null;
  }

  /**
   * Check whether a value is an integer.
   * @param {any} value - The value to check.
   * @return {boolean}
   */
  export function is_int(value: any): value is number {
    return Number.isInteger(value);
  }

  /**
   * Checks whether a value is an array(like) of numbers.
   * @param array
   * @return {boolean}
   * @private
   */
  export function is_numeric_array(array): boolean {
    if (!Array.isArray(array) && !ArrayBuffer.isView(array)) {
      return false;
    } else if (ArrayBuffer.isView(array)) {
      return true;
    } else {
        return (<number[]>array).reduce((a, b) => is_numeric(b) && a, true);
    }
  }

  export function zip_iterable(...iters: Iterator<number>[]): Iterable<number[]> {
    let iterators = iters.map(e => e[Symbol.iterator]());

    let iter = {};
    iter[Symbol.iterator] = function* () {
      let all_done = false;
      while (!all_done) {
        let results = [];
        iterators.forEach(e => {
          let {value, done} = e.next();
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

    return <Iterable<number[]>> iter;
  }

// TODO: Test
  /**
   * Check if value is an ArrayBuffer
   * @param value
   * @return {boolean}
   */
  export function is_typed_array(value: any): value is TypedArray {
    return !!(value.buffer instanceof ArrayBuffer && value.BYTES_PER_ELEMENT);
  }

  /**
   * Subtract two typed arrays. Should only be called on typed arrays that are guaranteed to be the same size.
   * @param {TypedArray} a
   * @param {TypedArray} b
   * @return {TypedArray}
   * @private
   */
  export function _typed_array_sub(a: Numeric, b: Numeric) {
    // @ts-ignore
    return a.map((e, i) => e - b[i]);
  }

  /**
   * Convert a dtype string to the corresponding TypedArray constructor.
   * @param dtype
   * @return {any}
   * @private
   */
  export function dtype_map(dtype: string) {
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
}
