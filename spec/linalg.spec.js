const fc = require('fast-check');
const tndarray = require("../numts/tndarray").tndarray;
const numts = require("../numts/numts");
const linalg = require("../numts/linalg");

const helpers = require('./helpers');

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

  describe('QR decomposition.', function() {
    describe('Givens QR.' ,function() {
      it('Basic test.', function() {
        const a = numts.arange(15).reshape(5, 3);
        const [q, r] = linalg.givens_qr(a);
        const prod = tndarray.matmul_2d(q.transpose(), r);
        
        expect(numts.isclose(a, prod).all()).toBe(true);
      });

      it('Property based test.', function() {
        function f(a) {
          const [m, ] = a.shape;
          const [q, r] = linalg.givens_qr(a);

          // Check that q is orthogonal
          const t = q.transpose();
          const inv_prod = tndarray.matmul_2d(q, t);
          const expected = tndarray.eye(m);
          expect(numts.isclose(inv_prod, expected).all()).toBe(true);

          // Check that the product is correct
          const qr_prod = tndarray.matmul_2d(t, r);
          expect(numts.isclose(qr_prod, a).all()).toBe(true);
        }
        helpers.check_matrix(f, 'thin');
        
      });
    });

    describe('Householder QR', function() {
      fit('Basic test.', function() {
        const a = numts.arange(15).reshape(5, 3);
        const [m, ] = a.shape;
        const [q, r] = linalg.householder_qr(a);
        const prod = tndarray.matmul_2d(q.transpose(), r);

        const inv_prod = tndarray.matmul_2d(q, q.transpose());
        const expected = tndarray.eye(m);
        // expect(numts.isclose(inv_prod, expected).all()).toBe(true);
        // console.log(inv_prod)
        // console.log(q)
        // console.log(r)
        console.log(a)
        console.log(prod);
        // expect(numts.isclose(a, prod).all()).toBe(true);
      });

    });
  });
});
