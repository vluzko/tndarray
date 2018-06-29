let tndarray = require('../tndarray');
let _ = require('lodash');

// TODO: Randomly generated tests.
// TODO: MAX_INT tests
describe("Constructors and factories.", function() {
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
        "length": 0
      })],
      ["flat", new Sample([1, 2, 3, 4], [4], {
        "shape": new Uint32Array([4]),
        "length": 4
      })],
      ["two-dimensional", new Sample([1,2,3,4,5,6], [2,3], {
        "shape": new Uint32Array([2, 3]),
        "length": 6
      })]
    ]);

    passing_samples.forEach((sample, n) => {
      it (`Testing pass sample ${n}.`, function () {
        const array = tndarray.tndarray.array(sample.input_array, sample.input_shape);
        for (let prop in sample.expected) {
          expect(array[prop]).toEqual(sample.expected[prop])
        }
      });
    });

    describe("Failing tests.", function () {
      it("Data not an array.", function () {
        expect(() => tndarray.tndarray.array(1)).toThrow(new tndarray.errors.BadData())
      });

      it("Data not numeric.", function () {
        expect(() => tndarray.tndarray.array(["asd"])).toThrow(new tndarray.errors.BadData());
      });

      it("Wrong shape type.", function () {
        expect(() => tndarray.tndarray.array([], "asdf")).toThrow(new tndarray.errors.BadShape("Shape must be an int, an array of numbers, or a TypedArray."));
      });

      it("No shape parameter.", function () {
        const array = tndarray.tndarray.array([1,2,3,4]);
        expect(array.shape).toEqual(new Uint32Array([4]));
        expect(array.length).toBe(4);
      });

      describe("Wrong dimensions.", function () {
        it("Wrong length.", function () {
          expect(() => tndarray.tndarray.array([1, 2, 3], [2, 2])).toThrow(new tndarray.errors.MismatchedShapeSize());
        });

        it("Null shape", function () {
          expect(() => tndarray.tndarray.array([1, 2, 3], [null])).toThrow(new tndarray.errors.MismatchedShapeSize());
        });

        it("Empty shape.", function () {
          expect(() => tndarray.tndarray.array([1, 2, 3], [])).toThrow(new tndarray.errors.MismatchedShapeSize());
        });
      });
    });
  });

  describe("Specialized factories.", function () {
    it("zeros.", function () {
      expect(tndarray.tndarray.zeros([2,2]).data).toEqual(new Float64Array([0, 0, 0, 0]));
      expect(tndarray.tndarray.zeros(4).data).toEqual(new Float64Array([0, 0, 0, 0]));
    });

    it("ones.", function () {
      expect(tndarray.tndarray.ones([2,2]).data).toEqual(new Float64Array([1, 1, 1, 1]));
      expect(tndarray.tndarray.ones(4).data).toEqual(new Float64Array([1, 1, 1, 1]));
    });

    it("filled.", function () {
      expect(tndarray.tndarray.filled(-1, [2,2]).data).toEqual(new Float64Array([-1, -1, -1, -1]));
      expect(tndarray.tndarray.filled(10, 4).data).toEqual(new Float64Array([10, 10, 10, 10]));
    });

    describe("from_nested_array.", function () {
      it("small array.", function () {
        let small_nested = [1,2].map(
          x => _.range(x, x+3)
        );
        let small_tnd = tndarray.tndarray.from_nested_array(small_nested);
        expect(small_tnd.shape).toEqual(new Uint32Array([2, 3]));
        expect(small_nested[0][0]).toBe(small_tnd.g(0, 0));
        expect(small_nested[1][2]).toBe(small_tnd.g(1, 2));
      });


      it("larger array", function () {
        // Create nested array with dimensions 3 x 2 x 3 x 5
        let nested = [1,2,3].map(
          x => _.range(x, x+2).map(
            y => _.range(y, y+4).map(
              z => _.range(y+2, y+7)
            )
          )
        );

        let good_nested = tndarray.tndarray.from_nested_array(nested);
        expect(good_nested.shape).toEqual(new Uint32Array([3, 2, 4, 5]));
        for (let indices of good_nested._index_iterator()) {
          let expected = tndarray.tndarray._nested_array_value_from_index(nested, indices);
          let actual = good_nested.g(indices);
          expect(actual).toBe(expected, `index: ${indices}`);

          expected = nested[indices[0]][indices[1]][indices[2]][indices[3]];
          actual = good_nested.g(indices);
          expect(actual).toBe(expected, `index: ${indices}`);
        }
        expect(nested[0][0][0][0]).toBe(good_nested.g(0, 0, 0, 0));
        expect(nested[2][0][0][0]).toBe(good_nested.g(2, 0, 0, 0));
      });
    });
  });

  describe("Helper methods.", function () {

    it("_compute_slice_size.", function () {
      expect(tndarray.tndarray._compute_slice_size([0,0], [2,2], [1,1])).toBe(4);
      expect(tndarray.tndarray._compute_slice_size(new Uint32Array([0,5]), new Uint32Array([6,10]), new Uint32Array([5,2]))).toBe(6);
    });

    it("stride from shape.", function () {
      expect(tndarray.tndarray._stride_from_shape([2, 2, 3])).toEqual(new Uint32Array([1, 2, 4]));
      expect(tndarray.tndarray._stride_from_shape([2, 5])).toEqual(new Uint32Array([1, 2]));
    });
  });

});

describe("Indices.", function () {

  it("_slice_iterator.", function () {
    let i = 0;
    for (let index of tndarray.tndarray._slice_iterator([0, 5], [4, 0], [5, 5])) {
      console.log(index);
    }
  });

  it("_index_iterator.", function () {
    let array = tndarray.tndarray.zeros([2,2]);
    let i = 0;
    for (let index of array._index_iterator()) {
      switch (i) {
        case 0: expect(index).toEqual(new Uint32Array([0,0])); break;
        case 1: expect(index).toEqual(new Uint32Array([0,1])); break;
        case 2: expect(index).toEqual(new Uint32Array([1,0])); break;
        case 3: expect(index).toEqual(new Uint32Array([1,1])); break;
      }
      ++i;
    }
  });

  it("_value_iterator.", function () {
    let array = tndarray.tndarray.array([1,2,3,4]);

    let i = 0;
    for (let val of array._value_iterator()) {
      switch (i) {
        case 0: expect(val).toEqual(1); break;
        case 1: expect(val).toEqual(2); break;
        case 2: expect(val).toEqual(3); break;
        case 3: expect(val).toEqual(4); break;
      }
      ++i;
    }

  });

  it("_compute_real_index.", function () {
    expect(tndarray.tndarray.zeros([2,2])._compute_real_index([1,1])).toBe(3);
    expect(tndarray.tndarray.zeros([2,3,4,5]))
  });

  it("g.", function () {
    const array1 = (new Uint32Array(27)).map((e, i) => i);
    let tndarray1 = tndarray.tndarray.array(array1, [3, 3, 3]);
    expect(tndarray1.g(1, 1, 1)).toBe(13);
    expect(tndarray1.g(1, 0, 1)).toBe(10);
    expect(tndarray1.g(2, 1, 0)).toBe(5);

    let array2 = (new Uint32Array(120)).map((e, i) => i);
    const tndarray2 = tndarray.tndarray.array(array2, [2,3,4,5]);
    expect(tndarray2.g(1, 2, 3, 4)).toBe(119);
    expect(tndarray2.g(0, 2, 3, 4)).toBe(118);
    expect(tndarray2.g(0, 0, 0, 0)).toBe(0);

    const array3 = (new Uint32Array(36)).map((e, i) => i);
    let tndarray3 = tndarray.tndarray.array(array3, [2, 3, 2, 3]);
    expect(tndarray3.g(1, 2, 1, 2)).toBe(35);
    expect(tndarray3.g(1, 2, 0, 0)).toBe(5);
    expect(tndarray3.g(1, 0, 0, 1)).toBe(13);
  });

  describe("broadcast_dims.", function () {
    it("same dims.", function () {
      for (let i = 0; i < 100; i++) {
        let number_of_dims = _.random(1, 8);
        let dims = _.range(number_of_dims).map(() => _.random(1, 10));
        let a = tndarray.tndarray.zeros(dims);
        let b = tndarray.tndarray.zeros(dims);
        let result = tndarray.tndarray._broadcast_dims(a, b);
        expect(result).toEqual(new Uint32Array(dims), `Input dims: ${dims}. Result: ${result}`);
      }

    });

    it("One shorter.", function () {
      for (let i = 0; i < 10; i++) {
        let number_of_dims = _.random(1, 8);
        let dims = _.range(number_of_dims).map(() => _.random(1, 10));
        let a = tndarray.tndarray.zeros(dims);
        let b = tndarray.tndarray.zeros(dims.slice(number_of_dims - 3));
        let result = tndarray.tndarray._broadcast_dims(a, b);
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

        let a = tndarray.tndarray.zeros(a_dims);
        let b = tndarray.tndarray.zeros(b_dims);

        let result = tndarray.tndarray._broadcast_dims(a, b);
        expect(result).toEqual(new Uint32Array(b_dims), `Input dims: ${b_dims}. Result: ${result}`);
      }
    });
  });

  describe("broadcast.", function () {
    it("Same dims.", function () {
      let a = tndarray.tndarray.from_nested_array([[1,2,3], [3,4,5]]);
      let b = tndarray.tndarray.from_nested_array([[1,2,3], [3,4,5]]);
      let iter = tndarray.tndarray._broadcast(a, b)[0];
      for (let [first, second] of iter) {
        expect(first).toBe(second);
      }
    });

    it("One smaller.", function () {
      let a = tndarray.tndarray.from_nested_array([[1,2,3], [3,4,5]]);
      let b = tndarray.tndarray.from_nested_array([[3,4,5]]);
      let iter = tndarray.tndarray._broadcast(a, b)[0];
      const expected = [[1,3], [2,4], [3, 5], [3,3], [4,4], [5,5]];
      let i = 0;
      for (let [first, second] of iter) {
        let [e1, e2] = expected[i];
        expect(first).toBe(e1);
        expect(second).toBe(e2);
        i++;
      }
    });
  });
});

describe("Methods.", function () {

  describe("_binary_broadcast.", function () {
    it("return first.", function () {
      let a = tndarray.tndarray.arange(0, 10);
      let b = tndarray.tndarray.arange(1);
      let f = (a, b) => a;

      let broadcasted = tndarray.tndarray._binary_broadcast(a, b, f);
      expect(broadcasted.equals(a)).toBe(true);
    });

    it("return second.", function () {
      let a = tndarray.tndarray.arange(1);
      let b = tndarray.tndarray.arange(0, 10);
      let f = (a, b) => b;

      let broadcasted = tndarray.tndarray._binary_broadcast(a, b, f);
      expect(broadcasted.equals(b)).toBe(true);
    });
  });

  it("Add.", function () {

  });

  describe("Subtract.", function () {
    it("Same size tndarray.", function () {
      let a = tndarray.tndarray.arange(0, 5);
      let b = tndarray.tndarray.arange(5, 10);
      let t = tndarray.tndarray.filled(5, [5], "int32");
      let sub = tndarray.tndarray.sub(b, a);
      expect(sub.equals(t)).toBe(true);
    });

    it("Broadcasted array.", function () {
      let a = tndarray.tndarray.arange(0, 6);
      let b = tndarray.tndarray.arange(1);
      let t = tndarray.tndarray.from_nested_array([0, 1, 2, 3, 4, 5], "int32");
      let sub = a.sub(b);
      expect(sub.equals(t)).toBe(true);
    });
  });

  it("Multiply.", function () {

  });

});

describe("utils.", function () {
  it("dot.", function () {
    expect(tndarray.utils.dot([1,2,3], [1,2,3])).toBe(14);
  });
});
