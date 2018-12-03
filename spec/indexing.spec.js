const indexing = require("../numts/indexing").indexing;
const numts = require("../numts/numts");
const _ = require("lodash");


describe("Basic calculations.", function () {

  describe("compute_slice_size.", function () {
    it("From failing test.", function () {
      let x = indexing.compute_slice_size([0, 0], [3, 1], [1, 1]);
      expect(x).toBe(3);
    });

    it("Basic checks.", function () {
      expect(indexing.compute_slice_size([0, 0], [2, 2], [1, 1])).toBe(4);
      expect(indexing.compute_slice_size(new Uint32Array([0, 5]), new Uint32Array([6, 10]), new Uint32Array([5, 2]))).toBe(6);
    });
  });

  describe("new_shape_from_slice.", function () {
    it("Basic test.", function () {
      const starts = new Uint32Array(3);
      const ends = new Uint32Array([1, 2, 3]);
      const steps = new Uint32Array(3);
      steps.fill(1);

      const shape = indexing.new_shape_from_slice(starts, ends, steps);
      expect(shape).toEqual(ends);
    });

    it("With steps and offsets.", function () {
      const starts = new Uint32Array([2, 6, 9]);
      const ends = new Uint32Array([10, 12, 11]);
      const steps = new Uint32Array([2, 3, 1]);

      const shape = indexing.new_shape_from_slice(starts, ends, steps);
      const expected = new Uint32Array([4, 2, 2]);
      expect(shape).toEqual(expected);
    });


    it("With unit dimension.", function () {
      const starts = new Uint32Array([2, 6, 10]);
      const ends = new Uint32Array([10, 12, 11]);
      const steps = new Uint32Array([2, 3, 1]);

      const shape = indexing.new_shape_from_slice(starts, ends, steps);
      const expected = new Uint32Array([4, 2, 1]);

      expect(shape).toEqual(expected);
    });
  });

  it("_stride_from_shape.", function () {
    expect(indexing.stride_from_shape([2, 2, 3])).toEqual(new Uint32Array([1, 2, 4]));
    expect(indexing.stride_from_shape([2, 5])).toEqual(new Uint32Array([1, 2]));
  });

  describe("convert_negative_indices.", function () {
    it("basic test.", function () {
      const indices = [-2, [2, 3], [2, -1], [,-3, 4]];
      const shape = [4, 4, 5, 12];
      const expected = [2, [2, 3], [2, 4], [, 9, 4]];
      expect(expected).toEqual(indexing.convert_negative_indices(indices, shape));
    });
  });

  describe("calculate_broadcast_dimensions.", function () {
    it("same dims.", function () {
      for (let i = 0; i < 100; i++) {
        let number_of_dims = _.random(1, 8);
        let dims = _.range(number_of_dims).map(() => _.random(1, 10));
        let a = numts.zeros(dims);
        let b = numts.zeros(dims);
        let result = indexing.calculate_broadcast_dimensions(a.shape, b.shape);
        expect(result).toEqual(new Uint32Array(dims), `Input dims: ${dims}. Result: ${result}`);
      }

    });

    it("One shorter.", function () {
      for (let i = 0; i < 10; i++) {
        let number_of_dims = _.random(1, 8);
        let dims = _.range(number_of_dims).map(() => _.random(1, 10));
        let a = numts.zeros(dims);
        let b = numts.zeros(dims.slice(number_of_dims - 3));
        let result = indexing.calculate_broadcast_dimensions(a.shape, b.shape);
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

        let a = numts.zeros(a_dims);
        let b = numts.zeros(b_dims);

        let result = indexing.calculate_broadcast_dimensions(a.shape, b.shape);
        expect(result).toEqual(new Uint32Array(b_dims), `Input dims: ${b_dims}. Result: ${result}`);
      }
    });
  });

});

describe("Iterators.", function () {
  describe("_slice_iterator", function() {

    it("3 2 5", function () {
      let iter = indexing.slice_iterator([0, 0], [3, 1], [1, 1]);
      let x = Array.from(iter);
      expect(x).toEqual([[0, 0], [1, 0], [2, 0]]);
    });

    it("_slice_iterator.", function () {
      let i = 0;
      throw new Error();
      for (let index of indexing.slice_iterator([0, 5], [4, 0], [5, 5])) {
        throw new Error();
      }
    });
  });
});
