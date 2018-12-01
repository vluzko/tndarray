let tndarray = require("../numts/tndarray");
let numts = require("../numts/numts");
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
        const array = numts.tndarray.array(sample.input_array, sample.input_shape);
        for (let prop in sample.expected) {
          expect(array[prop]).toEqual(sample.expected[prop]);
        }
      });
    });

  });

  describe("Specialized factories.", function () {
    it("zeros.", function () {
      expect(numts.zeros([2, 2]).data).toEqual(new Float64Array([0, 0, 0, 0]));
      expect(numts.zeros(4).data).toEqual(new Float64Array([0, 0, 0, 0]));
    });

    it("ones.", function () {
      expect(numts.ones([2, 2]).data).toEqual(new Float64Array([1, 1, 1, 1]));
      expect(numts.ones(4).data).toEqual(new Float64Array([1, 1, 1, 1]));
    });

    it("filled.", function () {
      expect(numts.tndarray.filled(-1, [2, 2]).data).toEqual(new Float64Array([-1, -1, -1, -1]));
      expect(numts.tndarray.filled(10, 4).data).toEqual(new Float64Array([10, 10, 10, 10]));
    });

    describe("from_nested_array.", function () {

      it("hand array.", function () {
        let nested = [[[0, 1], [2, 3]], [[4, 5], [6, 7]]];
        let tensor = numts.from_nested_array(nested);
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

        let good_nested = numts.from_nested_array(nested);
        expect(good_nested.shape).toEqual(new Uint32Array([3, 2, 4, 5]));
        for (let indices of good_nested._index_iterator()) {
          let expected = numts._nested_array_value_from_index(nested, indices);
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

    it("_stride_from_shape.", function () {
      expect(numts.tndarray._stride_from_shape([2, 2, 3])).toEqual(new Uint32Array([1, 2, 4]));
      expect(numts.tndarray._stride_from_shape([2, 5])).toEqual(new Uint32Array([1, 2]));
    });
  });
});

describe("Methods.", function () {

  describe("_binary_broadcast.", function () {
    it("return first.", function () {
      let a = numts.arange(0, 10);
      let b = numts.arange(1);
      let f = (a, b) => a;

      let broadcasted = numts.tndarray._binary_broadcast(a, b, f);
      expect(broadcasted.equals(a)).toBe(true);
    });

    it("return second.", function () {
      let a = numts.arange(1);
      let b = numts.arange(0, 10);
      let f = (a, b) => b;

      let broadcasted = numts.tndarray._binary_broadcast(a, b, f);
      expect(broadcasted.equals(b)).toBe(true);
    });

    describe("arithmetic", function () {
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

        let sub = numts.tndarray._sub(a, b);
        let expected = numts.from_nested_array([[0, 0, 0, 0, 0], [5, 5, 5, 5, 5]], "int32");
        expect(sub.equals(expected)).toBe(true);
      });

      it("mult.", function () {
        let a = numts.from_nested_array([[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]], "int32");
        let b = numts.arange(5);

        let product = numts.tndarray._mult(a, b);
        let expected = numts.from_nested_array([[0, 1, 4, 9, 16], [0, 6, 14, 24, 36]], "int32");
        expect(product.equals(expected)).toBe(true);
      });

      it("div.", function () {
        let a = numts.from_nested_array([[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]], "int32");
        let b = numts.arange(1, 6);

        let product = numts.tndarray._div(a, b);
        let expected = numts.from_nested_array([[0, 1 / 2, 2 / 3, 3 / 4, 4 / 5], [5, 6 / 2, 7 / 3, 8 / 4, 9 / 5]], "float64");
        expect(product.equals(expected)).toBe(true);
      });

      it("mod.", function () {
        let a = numts.from_nested_array([[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]], "int32");
        let b = numts.arange(1, 6);

        let product = numts.tndarray._mod(a, b);
        let expected = numts.from_nested_array([[0, 1, 2, 3, 4], [0, 0, 1, 0, 4]], "int32");
        expect(product.equals(expected)).toBe(true);
      });

      it("fdiv.", function () {
        let a = numts.from_nested_array([[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]], "int32");
        let b = numts.arange(1, 6);

        let product = numts.tndarray._fdiv(a, b);
        let expected = numts.from_nested_array([[0, 0, 0, 0, 0], [5, 3, 2, 2, 1]], "int32");
        expect(product.equals(expected)).toBe(true);
      });

      it("cdiv.", function () {
        let a = numts.from_nested_array([[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]], "int32");
        let b = numts.arange(1, 6);

        let product = numts.tndarray._cdiv(a, b);
        let expected = numts.from_nested_array([[0, 1, 1, 1, 1], [5, 3, 3, 2, 2]], "int32");
        expect(product.equals(expected)).toBe(true);
      });
    });

    // describe()

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
  });

});

describe("Broadcasting", function () {
  it("Broadcast on axis", function () {
    let x = numts.arange(30).reshape([3, 2, 5]);
    // console.log(x);
    let y = x.sum(1);
    const expected_data = [
      [5, 7, 9, 11, 13],
      [25, 27, 29, 31, 33],
      [45, 47, 49, 51, 53]
    ];

    const expected_array = numts.from_nested_array(expected_data, 'int32');
    expect(expected_array.equals(y)).toBe(true);
  });
});
