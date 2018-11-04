let z = require("../tndarray");
let numts = require("../numts");
let tndarray = numts.tndarray;
let _ = require("lodash");


// TODO: Randomly generated tests.
// TODO: MAX_INT tests
describe("Constructors and factories.", function () {
  describe("Shapes.", function () {

    class Sample {
      constructor(input_array, input_shape, expected) {
        this.input_array = input_array;
        this.input_shape = input_shape;
        this.expected = expected;
      }
    }

    // TODO: Tests for wrong input types.
    const passing_samples = new Map([
      ["null", new Sample([], null, {
        "shape": new Uint32Array([0]),
        "length": 0,
      })],
      ["flat", new Sample([1, 2, 3, 4], [4], {
        "shape": new Uint32Array([4]),
        "length": 4,
      })],
      ["two-dimensional", new Sample([1, 2, 3, 4, 5, 6], [2, 3], {
        "shape": new Uint32Array([2, 3]),
        "length": 6,
      })],
    ]);

    passing_samples.forEach((sample, n) => {
      it(`Testing pass sample ${n}.`, function () {
        const array = tndarray.array(sample.input_array, sample.input_shape);
        for (let prop in sample.expected) {
          expect(array[prop]).toEqual(sample.expected[prop]);
        }
      });
    });

    describe("Failing tests.", function () {
      it("Data not an array.", function () {
        expect(() => tndarray.array(1)).toThrow(new z.errors.BadData());
      });

      it("Data not numeric.", function () {
        expect(() => tndarray.array(["asd"])).toThrow(new z.errors.BadData());
      });

      it("Wrong shape type.", function () {
        expect(() => tndarray.array([], "asdf")).toThrow(new z.errors.BadShape("Shape must be an int, an array of numbers, or a TypedArray."));
      });

      it("No shape parameter.", function () {
        const array = tndarray.array([1, 2, 3, 4]);
        expect(array.shape).toEqual(new Uint32Array([4]));
        expect(array.length).toBe(4);
      });

      describe("Wrong dimensions.", function () {
        it("Wrong length.", function () {
          expect(() => tndarray.array([1, 2, 3], [2, 2])).toThrow(new z.errors.MismatchedShapeSize());
        });

        it("Null shape", function () {
          expect(() => tndarray.array([1, 2, 3], [null])).toThrow(new z.errors.MismatchedShapeSize());
        });

        it("Empty shape.", function () {
          expect(() => tndarray.array([1, 2, 3], [])).toThrow(new z.errors.MismatchedShapeSize());
        });
      });
    });
  });

  describe("Specialized factories.", function () {
    it("zeros.", function () {
      expect(tndarray.zeros([2, 2]).data).toEqual(new Float64Array([0, 0, 0, 0]));
      expect(tndarray.zeros(4).data).toEqual(new Float64Array([0, 0, 0, 0]));
    });

    it("ones.", function () {
      expect(tndarray.ones([2, 2]).data).toEqual(new Float64Array([1, 1, 1, 1]));
      expect(tndarray.ones(4).data).toEqual(new Float64Array([1, 1, 1, 1]));
    });

    it("filled.", function () {
      expect(tndarray.filled(-1, [2, 2]).data).toEqual(new Float64Array([-1, -1, -1, -1]));
      expect(tndarray.filled(10, 4).data).toEqual(new Float64Array([10, 10, 10, 10]));
    });

    describe("from_nested_array.", function () {

      it("hand array.", function () {
        let nested = [[[0, 1], [2, 3]], [[4, 5], [6, 7]]];
        let tensor = tndarray.from_nested_array(nested);
        expect(tensor.shape).toEqual(new Uint32Array([2, 2, 2]));
        expect(tensor.g([0, 0, 0])).toBe(0);
        expect(tensor.g([0, 0, 1])).toBe(1);
        expect(tensor.g([0, 1, 0])).toBe(2);
        expect(tensor.g([0, 1, 1])).toBe(3);
        expect(tensor.g([1, 0, 0])).toBe(4);
        expect(tensor.g([1, 0, 1])).toBe(5);
        expect(tensor.g([1, 1, 0])).toBe(6);
        expect(tensor.g([1, 1, 1])).toBe(7);

      });

      it("larger array", function () {
        // Create nested array with dimensions 3 x 2 x 3 x 5
        let nested = [1, 2, 3].map(
          x => _.range(x, x + 2).map(
            y => _.range(y, y + 4).map(
              z => _.range(y + 2, y + 7),
            ),
          ),
        );

        let good_nested = tndarray.from_nested_array(nested);
        expect(good_nested.shape).toEqual(new Uint32Array([3, 2, 4, 5]));
        for (let indices of good_nested._index_iterator()) {
          let expected = tndarray._nested_array_value_from_index(nested, indices);
          let actual = good_nested.g(indices);
          expect(actual).toBe(expected, `index: ${indices}`);

          expected = nested[indices[0]][indices[1]][indices[2]][indices[3]];
          actual = good_nested.g(indices);
          expect(actual).toBe(expected, `index: ${indices}`);
        }
        expect(nested[0][0][0][0]).toBe(good_nested.g([0, 0, 0, 0]));
        expect(nested[2][0][0][0]).toBe(good_nested.g([2, 0, 0, 0]));
      });
    });
  });

  describe("Helper methods.", function () {

    it("_compute_slice_size.", function () {
      expect(tndarray._compute_slice_size([0, 0], [2, 2], [1, 1])).toBe(4);
      expect(tndarray._compute_slice_size(new Uint32Array([0, 5]), new Uint32Array([6, 10]), new Uint32Array([5, 2]))).toBe(6);
    });

    it("_stride_from_shape.", function () {
      expect(tndarray._stride_from_shape([2, 2, 3])).toEqual(new Uint32Array([1, 2, 4]));
      expect(tndarray._stride_from_shape([2, 5])).toEqual(new Uint32Array([1, 2]));
    });

    it("_dtype_join.", function () {
      throw new Error();
    });
  });
});

describe("Indices and slicing.", function () {

  describe("_compute_slice_size", function () {
    it("From test", function () {
      let x = tndarray._compute_slice_size([0, 0], [3, 1], [1, 1]);
      expect(x).toBe(3);
    });
  });

  describe("_slice_iterator", function() {

    it("3 2 5", function () {
      let iter = tndarray._slice_iterator([0, 0], [3, 1], [1, 1]);
      let x = Array.from(iter);
      expect(x).toEqual([[0, 0], [1, 0], [2, 0]]);
    });

    it("_slice_iterator.", function () {
      let i = 0;
      for (let index of tndarray._slice_iterator([0, 5], [4, 0], [5, 5])) {
        console.log(index);
      }
    });
  });

  it("_real_index_iterator", function () {
    let tensor = tndarray.arange(0, 100).reshape(new Uint32Array([5, 5, 2, 2]));
    let indices = [...tensor._index_iterator()];
    let real_indices = [...tensor._real_index_iterator()];

    indices.forEach((e, i) => {
      let real_index = real_indices[i];
      let computed = tensor._compute_real_index(e);
      expect(real_index).toBe(computed);
    });

  });

  it("_index_iterator.", function () {
    let array = tndarray.zeros([2, 2]);
    let i = 0;
    for (let index of array._index_iterator()) {
      switch (i) {
        case 0:
          expect(index).toEqual(new Uint32Array([0, 0]));
          break;
        case 1:
          expect(index).toEqual(new Uint32Array([0, 1]));
          break;
        case 2:
          expect(index).toEqual(new Uint32Array([1, 0]));
          break;
        case 3:
          expect(index).toEqual(new Uint32Array([1, 1]));
          break;
      }
      ++i;
    }
  });

  it("_value_iterator.", function () {
    let array = tndarray.array([1, 2, 3, 4]);

    let i = 0;
    for (let val of array._value_iterator()) {
      switch (i) {
        case 0:
          expect(val).toEqual(1);
          break;
        case 1:
          expect(val).toEqual(2);
          break;
        case 2:
          expect(val).toEqual(3);
          break;
        case 3:
          expect(val).toEqual(4);
          break;
      }
      ++i;
    }

  });

  it("_compute_real_index.", function () {
    expect(tndarray.zeros([2, 2])._compute_real_index([1, 1])).toBe(3);
    expect(tndarray.zeros([2, 3, 4, 5]));
  });

  describe("_new_shape_from_slice.", function () {
    it("Basic test.", function () {
      const starts = new Uint32Array(3);
      const ends = new Uint32Array([1, 2, 3]);
      const steps = new Uint32Array(3);
      steps.fill(1);

      const shape = tndarray._new_shape_from_slice(starts, ends, steps);
      expect(shape).toEqual(ends);
    });

    it("Complicated test.", function () {
      const starts = new Uint32Array([2, 6, 10]);
      const ends = new Uint32Array([10, 12, 11]);
      const steps = new Uint32Array([2, 3, 1]);

      const shape = tndarray._new_shape_from_slice(starts, ends, steps);
      const expected = new Uint32Array([4, 2, 1]);
      expect(shape).toEqual(expected);
    });
  });

  describe("slice.", function () {
    it("basic test.", function () {
      const base_array = tndarray.arange(16).reshape([4, 4]);
      const slice = base_array.slice([0, 2], [1, 3]);
      
      const expected = tndarray.from_nested_array([
        [1, 2],
        [5, 6]
      ], "int32");
      expect(expected.equals(slice)).toBe(true);
    });

    it("single value slice.", function () {
      const base_array = tndarray.arange(16).reshape([4, 4]);
      const slice = base_array.slice(0);
      const expected = tndarray.arange(4).reshape([1, 4]);
      expect(slice.equals(expected)).toBe(true);
    });
  });

  it("g.", function () {
    const array1 = (new Uint32Array(27)).map((e, i) => i);
    let tndarray1 = tndarray.array(array1, [3, 3, 3]);
    expect(tndarray1.g([1, 1, 1])).toBe(13);
    expect(tndarray1.g([1, 0, 1])).toBe(10);
    expect(tndarray1.g([2, 1, 0])).toBe(5);

    let array2 = (new Uint32Array(120)).map((e, i) => i);
    const tndarray2 = tndarray.array(array2, [2, 3, 4, 5]);
    expect(tndarray2.g([1, 2, 3, 4])).toBe(119);
    expect(tndarray2.g([0, 2, 3, 4])).toBe(118);
    expect(tndarray2.g([0, 0, 0, 0])).toBe(0);

    const array3 = (new Uint32Array(36)).map((e, i) => i);
    let tndarray3 = tndarray.array(array3, [2, 3, 2, 3]);
    expect(tndarray3.g([1, 2, 1, 2])).toBe(35);
    expect(tndarray3.g([1, 2, 0, 0])).toBe(5);
    expect(tndarray3.g([1, 0, 0, 1])).toBe(13);
  });

  describe("broadcast_dims.", function () {
    it("same dims.", function () {
      for (let i = 0; i < 100; i++) {
        let number_of_dims = _.random(1, 8);
        let dims = _.range(number_of_dims).map(() => _.random(1, 10));
        let a = tndarray.zeros(dims);
        let b = tndarray.zeros(dims);
        let result = tndarray._broadcast_dims(a, b);
        expect(result).toEqual(new Uint32Array(dims), `Input dims: ${dims}. Result: ${result}`);
      }

    });

    it("One shorter.", function () {
      for (let i = 0; i < 10; i++) {
        let number_of_dims = _.random(1, 8);
        let dims = _.range(number_of_dims).map(() => _.random(1, 10));
        let a = tndarray.zeros(dims);
        let b = tndarray.zeros(dims.slice(number_of_dims - 3));
        let result = tndarray._broadcast_dims(a, b);
        expect(result).toEqual(new Uint32Array(dims), `Input dims: ${dims}. Result: ${result}`);
      }
    });

    it("Random ones.", function () {
      for (let i = 0; i < 100; i++) {
        let number_of_dims = _.random(1, 8);
        let a_dims = _.range(number_of_dims).map(() => _.random(1, 10));
        let b_dims = a_dims.slice(0);

        _.range(a_dims.length).map((j, i) => {
          let sw = Math.random() < 1 / a_dims.length;
          if (sw) {
            a_dims[i] = 1;
          }
        });

        let a = tndarray.zeros(a_dims);
        let b = tndarray.zeros(b_dims);

        let result = tndarray._broadcast_dims(a, b);
        expect(result).toEqual(new Uint32Array(b_dims), `Input dims: ${b_dims}. Result: ${result}`);
      }
    });
  });

  describe("broadcast.", function () {
    it("Same dims.", function () {
      let a = tndarray.from_nested_array([[1, 2, 3], [3, 4, 5]]);
      let b = tndarray.from_nested_array([[1, 2, 3], [3, 4, 5]]);
      let iter = tndarray._broadcast(a, b)[0];
      for (let [first, second] of iter) {
        expect(first).toBe(second);
      }
    });

    it("One smaller.", function () {
      let a = tndarray.from_nested_array([[1, 2, 3], [3, 4, 5]]);
      let b = tndarray.from_nested_array([[3, 4, 5]]);
      let iter = tndarray._broadcast(a, b)[0];
      const expected = [[1, 3], [2, 4], [3, 5], [3, 3], [4, 4], [5, 5]];
      let i = 0;
      for (let [first, second] of iter) {
        let [e1, e2] = expected[i];
        expect(first).toBe(e1);
        expect(second).toBe(e2);
        i++;
      }
    });
  });

  it("Reshape.", function () {
    let start = tndarray.from_nested_array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    let reshaped = start.reshape(new Uint32Array([2, 2, 3]));
    let expected = tndarray.from_nested_array([
      [
        [0, 1, 2], [3, 4, 5],
      ], [
        [6, 7, 8], [9, 10, 11],
      ],
    ]);

    expect(reshaped.equals(expected)).toBe(true);
  });
});

describe("Methods.", function () {

  describe("_binary_broadcast.", function () {
    it("return first.", function () {
      let a = tndarray.arange(0, 10);
      let b = tndarray.arange(1);
      let f = (a, b) => a;

      let broadcasted = tndarray._binary_broadcast(a, b, f);
      expect(broadcasted.equals(a)).toBe(true);
    });

    it("return second.", function () {
      let a = tndarray.arange(1);
      let b = tndarray.arange(0, 10);
      let f = (a, b) => b;

      let broadcasted = tndarray._binary_broadcast(a, b, f);
      expect(broadcasted.equals(b)).toBe(true);
    });

    describe("arithmetic", function () {
      it("add.", function () {
        let a = tndarray.from_nested_array([[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]], "int32");
        let b = tndarray.arange(5);

        let summed = numts.add(a, b);
        let expected = tndarray.from_nested_array([[0, 2, 4, 6, 8], [5, 7, 9, 11, 13]], "int32");
        expect(summed.equals(expected)).toBe(true);
      });

      it("sub.", function () {
        let a = tndarray.from_nested_array([[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]], "int32");
        let b = tndarray.arange(5);

        let sub = tndarray._sub(a, b);
        let expected = tndarray.from_nested_array([[0, 0, 0, 0, 0], [5, 5, 5, 5, 5]], "int32");
        expect(sub.equals(expected)).toBe(true);
      });

      it("mult.", function () {
        let a = tndarray.from_nested_array([[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]], "int32");
        let b = tndarray.arange(5);

        let product = tndarray._mult(a, b);
        let expected = tndarray.from_nested_array([[0, 1, 4, 9, 16], [0, 6, 14, 24, 36]], "int32");
        expect(product.equals(expected)).toBe(true);
      });

      it("div.", function () {
        let a = tndarray.from_nested_array([[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]], "int32");
        let b = tndarray.arange(1, 6);

        let product = tndarray._div(a, b);
        let expected = tndarray.from_nested_array([[0, 1 / 2, 2 / 3, 3 / 4, 4 / 5], [5, 6 / 2, 7 / 3, 8 / 4, 9 / 5]], "float64");
        expect(product.equals(expected)).toBe(true);
      });

      it("mod.", function () {
        let a = tndarray.from_nested_array([[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]], "int32");
        let b = tndarray.arange(1, 6);

        let product = tndarray._mod(a, b);
        let expected = tndarray.from_nested_array([[0, 1, 2, 3, 4], [0, 0, 1, 0, 4]], "int32");
        expect(product.equals(expected)).toBe(true);
      });

      it("fdiv.", function () {
        let a = tndarray.from_nested_array([[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]], "int32");
        let b = tndarray.arange(1, 6);

        let product = tndarray._fdiv(a, b);
        let expected = tndarray.from_nested_array([[0, 0, 0, 0, 0], [5, 3, 2, 2, 1]], "int32");
        expect(product.equals(expected)).toBe(true);
      });

      it("cdiv.", function () {
        let a = tndarray.from_nested_array([[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]], "int32");
        let b = tndarray.arange(1, 6);

        let product = tndarray._cdiv(a, b);
        let expected = tndarray.from_nested_array([[0, 1, 1, 1, 1], [5, 3, 3, 2, 2]], "int32");
        expect(product.equals(expected)).toBe(true);
      });
    });

    // describe()

  });
});

describe("Unary methods.", function () {

  describe("Nonzero.", function () {
    it("simple.", function () {
      const array = tndarray.from_nested_array([
        [0, 1, 0], [2, 0, 1]
      ]);
      const expected = [
        new Uint32Array([0, 1]),
        new Uint32Array([1, 0]),
        new Uint32Array([1, 2]),
      ];

      expect(array.nonzero()).toEqual(expected);

    });
  });

  describe("Methods along axes.", function () {

    let array = tndarray.arange(30).reshape([3, 2, 5]);

    describe("min.", function () {
      it("min over all.", function () {
        expect(array.min()).toBe(0);
      });

      it("min over 0.", function () {
        const expected = tndarray.from_nested_array([
          [0, 1, 2, 3, 4],
          [5, 6, 7, 8, 9]
        ], "int32");
        expect(array.min(0).equals(expected)).toBe(true);
      });
    });

    describe("max.", function () {
      it("max over all.", function () {
        expect(array.max()).toBe(29);
      });

      it("max over 0.", function () {
        const expected = tndarray.from_nested_array([
          [20, 21, 22, 23, 24],
          [25, 26, 27, 28, 29]
        ], "int32");
        expect(array.max(0).equals(expected)).toBe(true);
      });
    });

    describe("mean.", function () {

    });

    describe("cumsum.", function () {
      it("No axes.", function () {
        const input = numts.arange(12).reshape([3, 4]);
        const x = input.cumsum();
        const expected = tndarray.from_iterable([0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66], [12], 'int32');
        expect(x.equals(expected)).toBe(true);
      });

      it("2d, axis 1.", function () {
        const input = numts.arange(12).reshape([3, 4]);
        const result = input.cumsum(1);
        const expected = tndarray.from_nested_array([
          [0, 1, 3, 6],
          [4, 9, 15, 22],
          [8, 17, 27, 38]
        ], "int32");
        expect(result.equals(expected)).toBe(true);
      });
    });

    describe("cumprod.", function () {
      it("No axes.", function () {
        const input = numts.arange(1, 13).reshape([3, 4]);
        const x = input.cumprod();
        const expected = tndarray.from_iterable([1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800, 479001600], [12], 'int32');
        expect(x.equals(expected)).toBe(true);
      });

      it("2d, axis 1.", function () {
        const input = numts.arange(1, 13).reshape([3, 4]);
        const result = input.cumprod(1);
        const expected = tndarray.from_nested_array([
          [1, 2, 6, 24],
          [5, 30, 210, 1680],
          [9, 90, 990, 11880]
        ], "int32");
        expect(result.equals(expected)).toBe(true);
      });
    });
  });

});

describe("Broadcasting", function () {
  it("Broadcast on axis", function () {
    let x = tndarray.arange(30).reshape([3, 2, 5]);
    let y = x.sum(1);
    const expected_data = [
      [5, 7, 9, 11, 13],
      [25, 27, 29, 31, 33],
      [45, 47, 49, 51, 53]
    ];

    const expected_array = tndarray.from_nested_array(expected_data, 'int32');
    expect(expected_array.equals(y)).toBe(true);
  });
});

describe("Math.", function () {
  describe("matmul.", function () {
    it("scalar.", function () {
      let a = tndarray.arange(1, 2).reshape([1, 1]);
      let b = tndarray.arange(10, 11).reshape([1, 1]);
      let x = tndarray.matmul_2d(a, b);
      const expected = tndarray.from_nested_array([[10]]);
      expect(expected.equals(x)).toBe(true);
    });
  });

  describe("dot.", function () {
    it("simple.", function () {
      const a = tndarray.arange(10, 20);
      const b = tndarray.arange(20, 30);
      const dot = tndarray.dot(a, b);
      expect(dot).toBe(3635)
    });
  });
});
