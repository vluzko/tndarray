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
        expect(() => tndarray.tndarray.array([], "asdf")).toThrow(new tndarray.errors.BadShape());
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

  describe("Helper methods.", function () {

    fit("_compute_slice_size.", function () {
      expect(tndarray.tndarray._compute_slice_size([0,0], [2,2], [1,1])).toBe(4);
      expect(tndarray.tndarray._compute_slice_size(new Uint32Array([0,5]), new Uint32Array([6,10]), new Uint32Array([5,2]))).toBe(6);
      console.log(tndarray.tndarray._compute_slice_size())
    });

    it("stride from shape.", function () {
      expect(tndarray.tndarray._stride_from_shape([2, 2, 3])).toEqual(new Uint32Array([1, 2, 4]));
      expect(tndarray.tndarray._stride_from_shape([2, 5])).toEqual(new Uint32Array([1, 2]));
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
  })
});

describe("Indices", function () {

  it("_slice_iterator", function () {
    let i = 0;
    for (let index of tndarray.tndarray._slice_iterator([0, 5], [4, 0], [5, 5])) {
      console.log(index);
    }
  });

  // TODO: Come up with some reasonable property based tests.
  it("_index_iterator", function () {
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

  it("compute_real_index.", function () {
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
});

describe("Methods.", function () {

  it("Add.", function () {

  });

  it("Subtract.", function () {

  });

  it("Multiply.", function () {

  });

});

describe("utils.", function () {
  it("dot.", function () {
    expect(tndarray.utils.dot([1,2,3], [1,2,3])).toBe(14);
  });
});
