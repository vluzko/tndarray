let tndarray = require("../numts/tndarray");
let numts = require("../numts/numts");
let linalg = require("../numts/linalg");

describe("Matrix norms.", function() {
  
});

describe("Decompositions.", function() {
  describe("LU decomposition.", function(){
    it("No pivoting.", function() {
      const a = numts.from_nested_array([
          [4, 2, -1, 3],
          [3, -4, 2, 5],
          [-2, 6, -5, -2],
          [5, 1, 6, -3]
      ]);
      const [l, u] = linalg.lu(a);
      const exp_l = numts.from_nested_array([
        [1, 0, 0, 0],
        [0.75, 1, 0, 0],
        [-0.5, -14 / 11, 1, 0],
        [1.25, 3/11, -13/4, 1]
      ]);
      const exp_u = numts.from_nested_array([
        [4, 2, -1, 3],
        [0, -11/2, 11/4, 11/4],
        [0, 0, -2, 3],
        [0, 0, 0, 9/4]
      ])
      expect(numts.isclose(exp_l, l));
      expect(numts.isclose(exp_u, u));
    });
  });
});
