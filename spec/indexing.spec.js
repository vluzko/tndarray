const indexing = require("../numts/indexing").indexing;


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

    it("Complicated test.", function () {
      const starts = new Uint32Array([2, 6, 10]);
      const ends = new Uint32Array([10, 12, 11]);
      const steps = new Uint32Array([2, 3, 1]);

      const shape = indexing.new_shape_from_slice(starts, ends, steps);
      const expected = new Uint32Array([4, 2, 1]);
      expect(shape).toEqual(expected);
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
