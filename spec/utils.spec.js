let utils = require("../numts/utils").utils;
let tndarray = require("../numts/tndarray");
let numts = require("../numts/numts");

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

  it("is_numeric.", function () {
    expect(utils.is_numeric(new Uint32Array(0))).toBe(false);
  });

  describe("_dtype_join.", function () {
    const types = ["int8", "uint8", "uint8c", "int16", "uint16", "int32", "uint32", "float32", "float64"];
    it("Equal types.", function () {
      for (let type of types) {
        expect(utils._dtype_join(type, type)).toBe(type);
      }
    });

    it("Common types.", function () {
      expect(utils._dtype_join("int32", "float32")).toBe("float64");
      expect(utils._dtype_join("int32", "uint32")).toBe("float64");
    });
  });
});

describe('increment_number.', function() {
  it('Basic.', function() {
    const val = new Uint32Array([1, 2, 3]);
    const bounds = new Uint32Array([3, 4, 5]);
    const result = utils.increment_digit(val, bounds, 2);
    expect(result).toEqual(new Uint32Array([1, 2, 4]));
  });

  it('With carry.', function() {
    const val = new Uint32Array([1, 2, 3]);
    const bounds = new Uint32Array([3, 4, 3]);
    const result = utils.increment_digit(val, bounds, 2);
    expect(result).toEqual(new Uint32Array([1, 3, 0]));
  });

  describe('From failures.', function() {
    it('From dorder.', function() {
      const val = new Uint32Array([0, 5]);
      const bounds = new Uint32Array([1, 5]);
      const result = utils.increment_digit(val, bounds, 1);
      expect(result).toEqual(new Uint32Array([1, 0]));
    });
  });
});
