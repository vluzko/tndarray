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
      console.log(l);
      console.log(u);
    });
  });
});
