let utils = require("../numts/utils").utils;
let tndarray = require("../numts/tndarray");
let numts = require("../numts/numts");
let _ = require("lodash");

describe("utils.", function () {
  it("dot.", function () {
    expect(utils.dot([1, 2, 3], [1, 2, 3])).toBe(14);
  });

  describe("zip_iterable.", function () {
    it("same size test.", function () {
      let iter1 = {
        [Symbol.iterator]: function*() {
          yield* [1,2,3]
        }
      };

      let iter2 = {
        [Symbol.iterator]: function*() {
          yield* [2,3,4]
        }
      };

      let results = [...utils.zip_iterable(iter1, iter2)];
      expect(results).toEqual([[1,2], [2,3], [3,4]]);
    });
  });

  it("zip_longest.", function () {
    const a = numts.arange(4);
    const b = numts.arange(2);

    let zipped = utils.zip_longest(a._real_index_iterator(), b._real_index_iterator());
    let result = [...zipped];
    expect(result).toEqual([
      [0, 0],
      [1, 1],
      [2, 0],
      [3, 1]
    ]);
  });
});
