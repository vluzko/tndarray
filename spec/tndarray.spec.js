let z = require("../numts/tndarray");
let numts = require("../numts/numts");
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
        expect(() => tndarray.array([], "asdf")).toThrow(new Error("Shape must be an int, an array of numbers, or a Uint32Array."));
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
          expect(() => tndarray.array([1, 2, 3], [null])).toThrow(new Error("Shape array must be numeric."));
        });

        it("Empty shape.", function () {
          expect(() => tndarray.array([1, 2, 3], [])).toThrow(new z.errors.MismatchedShapeSize());
        });
      });
    });
  });

  describe("Helper methods.", function () {

  });
});

describe("Indices.", function () {
  it("_compute_real_index.", function () {
    expect(numts.zeros([2, 2])._compute_real_index([1, 1])).toBe(3);
    expect(numts.zeros([2, 3, 4, 5]));
  });

  describe("g.", function () {
    it("2-dims.", function () {
      const array = numts.arange(27).reshape([3, 3, 3]);
      expect(array.g(1, 1, 1)).toBe(13);
      expect(array.g(1, 0, 1)).toBe(10);
      expect(array.g(2, 1, 0)).toBe(21);
    });

    it("4-dims.", function () {
      const array = numts.arange(120).reshape([2, 3, 4, 5]);
      expect(array.g(1, 2, 3, 4)).toBe(119);
      expect(array.g(0, 2, 3, 4)).toBe(59);
      expect(array.g(0, 0, 0, 0)).toBe(0);
    });

    it("negatives indices.", function () {
      const array = numts.arange(40).reshape([5, 4, 2]);
      expect(array.g(-1, -2, -1)).toBe(37);
    });
  });

});

describe("Iterators.", function () {

  describe("data_index_iterator.", function () {

    it("one-dimensional.", function () {
      let tensor = numts.arange(0, 10);
      let indices = [...tensor._index_iterator()];
      let real_indices = [...tensor._real_index_iterator()];

      indices.forEach((e, i) => {
        let real_index = real_indices[i];
        let computed = tensor._compute_real_index(e);
        expect(real_index).toBe(computed);
      });
    });

    it("two-dimensional.", function () {
      let tensor = numts.arange(0, 10).reshape([5, 2]);
      let indices = [...tensor._index_iterator()];
      let real_indices = [...tensor._real_index_iterator()];

      indices.forEach((e, i) => {
        let real_index = real_indices[i];
        let computed = tensor._compute_real_index(e);
        expect(real_index).toBe(computed);
      });
    });

    it("four-dimensional.", function () {
      let tensor = numts.arange(0, 16).reshape(new Uint32Array([2, 2, 2, 2]));
      let indices = [...tensor._index_iterator()];
      let real_indices = [...tensor._real_index_iterator()];

      indices.forEach((e, i) => {
        let real_index = real_indices[i];
        let computed = tensor._compute_real_index(e);
        expect(real_index).toBe(computed);
      });

    });
  });

  describe("_index_iterator.", function () {
    it("two-dimensional", function () {
      let array = numts.zeros([2, 2]);
      const expected = [[0, 0], [0, 1], [1, 0], [1, 1]].map(e => new Uint32Array(e));
      const actual = Array.from(array._index_iterator());
      expect(actual).toEqual(expected);
    });
  });

  it("_value_iterator.", function () {
    let array = tndarray.array([1, 2, 3, 4]);
    const expected = [1, 2, 3, 4];
    const actual = Array.from(array._value_iterator());
    expect(actual).toEqual(expected);

  });

});

describe("Slicing.", function () {

  describe("slice.", function () {
    it("basic test.", function () {
      const base_array = numts.arange(16).reshape([4, 4]);
      const slice = base_array.slice([0, 2], [1, 3]);

      const expected = numts.from_nested_array([
        [1, 2],
        [5, 6]
      ], "int32");

      const actual = tndarray.from_iterable(slice._value_iterator(), slice.shape, "int32");
      expect(expected.equals(actual)).toBe(true);
      expect(slice.data).toEqual(base_array.data);
    });

    it("single value slice.", function () {
      const base_array = numts.arange(16).reshape([4, 4]);
      const slice = base_array.slice(0);
      const expected = numts.arange(4);

      const actual = tndarray.from_iterable(slice._value_iterator(), slice.shape, "int32");
      expect(expected.equals(actual)).toBe(true);
      expect(slice.data).toEqual(base_array.data);
    });

    it("Successive slices.", function () {
      const base_array = numts.arange(16).reshape([4, 4]);
      const first_slice = base_array.slice([0, 2], [1, 3]);
      expect(first_slice.shape).toEqual(new Uint32Array([2, 2]));
      const second_slice = first_slice.slice(0);

      const expected = numts.arange(1, 3);

      const actual = tndarray.from_iterable(second_slice._value_iterator(), second_slice.shape, "int32");
      expect(expected.equals(actual)).toBe(true);
    });

    it("Slice with large steps.", function () {
      const base_array = numts.arange(16).reshape([4, 4]);
      const slice = base_array.slice([0, 4, 2], [1, 3]);

      const expected = numts.from_nested_array([
        [1, 2],
        [9, 10]
      ], "int32");
      const actual = tndarray.from_iterable(slice._value_iterator(), slice.shape, "int32");

      expect(expected.equals(actual)).toBe(true);

    });

    it("Subdimensions", function () {
      const base_array = numts.arange(120).reshape([4, 5, 6]);
      const first = base_array.slice([0, 4, 2], [1, 3, 2]);
      expect(first.shape).toEqual(new Uint32Array([2, 1, 6]));
      const expected = numts.from_nested_array([
        [[6, 7, 8, 9, 10, 11]],
        [[66, 67, 68, 69, 70, 71]]
      ], "int32");


      const actual = tndarray.from_iterable(first._value_iterator(), first.shape, "int32");
      expect(expected).toEqual(actual);
    });

    it("Successive slice, large steps.", function () {
      const base_array = numts.arange(120).reshape([4, 5, 6]);
      const first = base_array.slice([0, 4, 2], [1, 3, 2]);
      expect(first.shape).toEqual(new Uint32Array([2, 1, 6]));

      const second = first.slice(null, null, [0, 6, 3]);
      expect(second.shape).toEqual(new Uint32Array([2, 1, 2]));

      const expected = numts.from_nested_array([
        [[6, 9]],
        [[66, 69]]
      ], "int32");

      const actual = tndarray.from_iterable(second._value_iterator(), second.shape, "int32");
      expect(expected.equals(actual)).toBe(true);
    });
  });

  describe("reshape.", function () {
    it("array passed", function () {
      let start = numts.from_nested_array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
      let reshaped = start.reshape(new Uint32Array([2, 2, 3]));
      let expected = numts.from_nested_array([
        [
          [0, 1, 2], [3, 4, 5],
        ], [
          [6, 7, 8], [9, 10, 11],
        ],
      ]);

      expect(reshaped.equals(expected)).toBe(true);
    });

    it("spread.", function () {
      const array = numts.arange(10).reshape(2, 5);
      expect(array.shape).toEqual(new Uint32Array([2, 5]));
      expect(array).toEqual(numts.from_nested_array([
        [0, 1, 2, 3, 4],
        [5, 6, 7, 8, 9]
      ], "int32"));
    });
  });

  describe("drop_unit_dimensions." ,function () {
    it("Simple test.", function () {
      const array = numts.arange(5).reshape([1, 5]);
      const dropped = array.drop_unit_dimensions();
      const expected = numts.arange(5);
      expect(expected.equals(dropped)).toBe(true);
    });

    it("Multiple dimensions.", function () {
      const array = numts.arange(25).reshape([1, 5, 1, 1, 5, 1]);
      const dropped = array.drop_unit_dimensions();
      const expected = numts.arange(25).reshape([5, 5]);
      expect(expected.equals(dropped)).toBe(true);
    })
  });
});

describe("Methods.", function () {

  describe('set', function() {
    it('single value', function() {
      let x = numts.arange(10).reshape(2, 5);
      x.s(-20, 0, 0);
      expect(x.g(0, 0)).toBe(-20);
    });

    it('slice.', function(){
      let x = numts.arange(10).reshape(2, 5);
      const replacement = numts.arange(10, 14).reshape(2, 2);
      x.s(replacement, [0, 2], [0, 2]);
      const values = [...x.slice([0,2], [0, 2])._value_iterator()];
      expect(values).toEqual([10, 11, 12, 13]);
    });
  });

});

describe("Unary methods.", function () {

  describe("Nonzero.", function () {
    it("simple.", function () {
      const array = numts.from_nested_array([
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

    let array = numts.arange(30).reshape([3, 2, 5]);

    describe("min.", function () {
      it("min over all.", function () {
        expect(array.min()).toBe(0);
      });

      it("min over 0.", function () {
        const expected = numts.from_nested_array([
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
        const expected = numts.from_nested_array([
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
        const expected = numts.from_nested_array([
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
        const expected = numts.from_nested_array([
          [1, 2, 6, 24],
          [5, 30, 210, 1680],
          [9, 90, 990, 11880]
        ], "int32");
        expect(result.equals(expected)).toBe(true);
      });
    });
  });

});

describe("Broadcasting.", function () {

  it("Broadcast on axis.", function () {
    let x = numts.arange(30).reshape([3, 2, 5]);
    let y = x.sum(1);
    const expected_data = [
      [5, 7, 9, 11, 13],
      [25, 27, 29, 31, 33],
      [45, 47, 49, 51, 53]
    ];

    const expected_array = numts.from_nested_array(expected_data, 'int32');
    expect(expected_array.equals(y)).toBe(true);
  });

  describe("_binary_broadcast.", function () {
    it("return first.", function () {
      let a = numts.arange(0, 10);
      let b = numts.arange(1);
      let f = (a, b) => a;

      let broadcasted = tndarray._binary_broadcast(a, b, f);
      expect(broadcasted.equals(a)).toBe(true);
    });

    it("return second.", function () {
      let a = numts.arange(1);
      let b = numts.arange(0, 10);
      let f = (a, b) => b;

      let broadcasted = tndarray._binary_broadcast(a, b, f);
      expect(broadcasted.equals(b)).toBe(true);
    });

    describe("arithmetic.", function () {
      it("add.", function () {
        let a = numts.from_nested_array([[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]], "int32");
        let b = numts.arange(5);

        let summed = numts.add(a, b);
        let expected = numts.from_nested_array([[0, 2, 4, 6, 8], [5, 7, 9, 11, 13]], "int32");
        expect(summed.equals(expected)).toBe(true);
      });

      it("sub.", function () {
        let a = numts.from_nested_array([[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]], "int32");
        let b = numts.arange(5);

        let sub = tndarray._sub(a, b);
        let expected = numts.from_nested_array([[0, 0, 0, 0, 0], [5, 5, 5, 5, 5]], "int32");
        expect(sub.equals(expected)).toBe(true);
      });

      it("mult.", function () {
        let a = numts.from_nested_array([[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]], "int32");
        let b = numts.arange(5);

        let product = tndarray._mult(a, b);
        let expected = numts.from_nested_array([[0, 1, 4, 9, 16], [0, 6, 14, 24, 36]], "int32");
        expect(product.equals(expected)).toBe(true);
      });

      it("div.", function () {
        let a = numts.from_nested_array([[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]], "int32");
        let b = numts.arange(1, 6);

        let product = tndarray._div(a, b);
        let expected = numts.from_nested_array([
          [0, 1 / 2, 2 / 3, 3 / 4, 4 / 5],
          [5, 6 / 2, 7 / 3, 8 / 4, 9 / 5]], "float64");
        expect(product.equals(expected)).toBe(true);
      });

      it("mod.", function () {
        let a = numts.from_nested_array([[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]], "int32");
        let b = numts.arange(1, 6);

        let product = tndarray._mod(a, b);
        let expected = numts.from_nested_array([[0, 1, 2, 3, 4], [0, 0, 1, 0, 4]], "int32");
        expect(product.equals(expected)).toBe(true);
      });

      it("fdiv.", function () {
        let a = numts.from_nested_array([[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]], "int32");
        let b = numts.arange(1, 6);

        let product = tndarray._fdiv(a, b);
        let expected = numts.from_nested_array([[0, 0, 0, 0, 0], [5, 3, 2, 2, 1]], "int32");
        expect(product.equals(expected)).toBe(true);
      });

      it("cdiv.", function () {
        let a = numts.from_nested_array([[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]], "int32");
        let b = numts.arange(1, 6);

        let product = tndarray._cdiv(a, b);
        let expected = numts.from_nested_array([[0, 1, 1, 1, 1], [5, 3, 3, 2, 2]], "int32");
        expect(product.equals(expected)).toBe(true);
      });
    });

    it("take_max", function () {
      throw new Error();
    });

    it("take_min", function () {
      throw new Error();
    });
  });
});

describe("Math.", function () {
  describe("matmul.", function () {
    it("scalar.", function () {
      let a = numts.arange(1, 2).reshape([1, 1]);
      let b = numts.arange(10, 11).reshape([1, 1]);
      let x = tndarray.matmul_2d(a, b);
      const expected = numts.from_nested_array([[10]]);
      expect(expected.equals(x)).toBe(true);
    });
  });

  describe("dot.", function () {
    it("simple.", function () {
      const a = numts.arange(10, 20);
      const b = numts.arange(20, 30);
      const dot = tndarray.dot(a, b);
      expect(dot).toBe(3635)
    });
  });
});

describe("Basic statistics.", function () {

  describe("mean.", function () {
    it('2d.', function () {
      const array = numts.arange(25).reshape([5, 5]);
      const mean = array.mean();
      expect(mean).toBeCloseTo(12.0);

    });
  });

  describe("stdev.", function () {
    it("2d.", function () {
      const array = numts.arange(25).reshape([5, 5]);
      const stdev = array.stdev();
      expect(stdev).toBeCloseTo(7.211);
    });
  });
});
