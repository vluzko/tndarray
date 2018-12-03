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

  fit("zip_longest.", function () {
    const a = numts.arange(10);
    const b = numts.arange(5);

    let iter = b._real_index_iterator();
    let y = iter[Symbol.iterator]().next();
    let z = iter[Symbol.iterator]().next();
    console.log(y);
    console.log(z)
    let zipped = utils.zip_longest(a._real_index_iterator(), b._real_index_iterator());
    for (let x of zipped) {
      console.log(x)
    }
  });
});
