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
        expect(tensor.g(0, 0, 0)).toBe(0);
        expect(tensor.g(0, 0, 1)).toBe(1);
        expect(tensor.g(0, 1, 0)).toBe(2);
        expect(tensor.g(0, 1, 1)).toBe(3);
        expect(tensor.g(1, 0, 0)).toBe(4);
        expect(tensor.g(1, 0, 1)).toBe(5);
        expect(tensor.g(1, 1, 0)).toBe(6);
        expect(tensor.g(1, 1, 1)).toBe(7);

      });

      it("larger array", function () {
        // Create nested array with dimensions 3 x 2 x 3 x 5
        let nested = [1, 2, 3].map(
          x => [x, x+1].map(
            y => [y, y+1, y+2, y+3].map(
              z => [y + 2, y+3, y+4, y+5, y+6]
            ),
          ),
        );

        let good_nested = numts.from_nested_array(nested);
        expect(good_nested.shape).toEqual(new Uint32Array([3, 2, 4, 5]));
        for (let indices of good_nested._iorder_index_iterator()) {
          let expected = numts._nested_array_value_from_index(nested, indices);
          let actual = good_nested.g(...indices);
          expect(actual).toBe(expected, `index: ${indices}`);

          expected = nested[indices[0]][indices[1]][indices[2]][indices[3]];
          actual = good_nested.g(...indices);
          expect(actual).toBe(expected, `index: ${indices}`);
        }
        expect(nested[0][0][0][0]).toBe(good_nested.g(0, 0, 0, 0));
        expect(nested[2][0][0][0]).toBe(good_nested.g(2, 0, 0, 0));
      });
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
  });

});

describe("Broadcasting", function () {
  it("Broadcast on axis", function () {
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
});

describe('Utilities.', function() {
  describe('isclose.', function() {
    it('Exact match.', function() {
      const a = numts.arange(5);
      const b = numts.arange(5);
      const close = numts.isclose(a, b);
      expect(close.all()).toBe(true);
    })
  })
});