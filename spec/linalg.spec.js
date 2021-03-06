const tensor = require('../numts/tensor').tensor;
const numts = require('../numts/numts');
const linalg = require('../numts/linalg');

describe('Matrix norms.', function() {
  
  describe('l2.', () => {
    it('Simple.', () => {
      const a = numts.arange(25);
      const b = linalg.l2(a);
      expect(b).toBe(70);
    });
  });

  describe('l1', () => {

  });
});

describe('Decompositions.', () =>  {
  describe('LU decomposition.', () => {
    it('No pivoting.', () =>  {
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
      expect(exp_l.is_close(l));
      expect(exp_u.is_close(u));
    });
  });

  describe('QR decomposition.', () =>  {
    describe('Givens QR.' , () =>  {
      it('Basic test.', () =>  {
        const a = numts.arange(15).reshape(5, 3);
        const [q, r] = linalg.qr(a);
        const prod = tensor.matmul_2d(q, r);
        
        expect(a.is_close(prod).all()).toBe(true);
      });
    });

    describe('Householder QR', () => {
        it('Basic test.', () =>  {
            const a = numts.from_nested_array([
                [1, 6,  11],
                [2, 7, 12],
                [3, 8, 13],
                [4, 9, 14],
                [5, 10, 15]
            ])
            const [m, ] = a.shape;
            const [q, r] = linalg.qr(a, {algorithm: 'householder'});
            const prod = tensor.matmul_2d(q, r);

            const inv_prod = tensor.matmul_2d(q, q.transpose());
            const expected = tensor.eye(m);
            expect(inv_prod.is_close(expected).all()).toBe(true);
            expect(a.is_close(prod).all()).toBe(true);
        });

        describe('Householder transformations', () => {
            it('Basic test.', () => {
                const a = numts.from_nested_array([
                    [1, 6,  11],
                    [2, 7, 12],
                    [3, 8, 13],
                    [4, 9, 14],
                    [5, 10, 15]
                ]);
                const q = linalg.householder_vector(a, 3, 0);
                expect(q.shape.length).toBe(2);
                const [i, j] = q.shape;
                expect(i).toBe(5 - 3);
                expect(j).toBe(1);
            });


        })

        describe('Householder vector and matrix.', () => {
            it('Column test.', () => {
                const a = numts.from_nested_array([
                    [1, 6,  11],
                    [2, 7, 12],
                    [3, 8, 13],
                    [4, 9, 14],
                    [5, 10, 15]
                ]);
                const [v, b] = linalg.householder_col_vector(a, 1, 0);
                expect(v.shape[0]).toBe(4);
                expect(v.shape[1]).toBe(1)
                const q = linalg.full_h_col_matrix(v, 5, b);
                const prod = tensor.matmul_2d(q, a);
                const close = prod.slice([2, null], 0).is_close(numts.zeros(3));
                expect(close.all()).toBe(true);
            })

            it('Row test.', () => {
                const a = numts.from_nested_array([
                    [1, 6,  11, 16],
                    [2, 7, 12, 17],
                    [3, 8, 13, 18],
                    [4, 9, 14, 19],
                    [5, 10, 15, 20]
                ]);
                const [v, b] = linalg.householder_row_vector(a, 0, 1);
                expect(v.shape[0]).toBe(1);
                expect(v.shape[1]).toBe(3);

                const q = linalg.full_h_row_matrix(v, 4, b);
                const prod = tensor.matmul_2d(a, q);

                const close = prod.slice(0, [2, null]).is_close(numts.zeros(2));
                expect(close.all()).toBe(true);
            })

            it('Row vs transpose test.', () => {
                const a = numts.from_nested_array([
                    [1, 6,  11, 16],
                    [2, 7, 12, 17],
                    [3, 8, 13, 18],
                    [4, 9, 14, 19],
                    [5, 10, 15, 20]
                ]);
                const [v1, b1] = linalg.householder_row_vector(a, 0, 1);
                const [v2, b2] = linalg.householder_col_vector(a.transpose(), 1, 0);
                const q1 = linalg.full_h_row_matrix(v1, 4, b1);
                const q2 = linalg.full_h_col_matrix(v2, 4, b2);
                expect(q1.is_close(q2).all()).toBe(true);
            })
        })

        describe('Householder bidiagonal', () => {

            fit('Basic test.', () => {
                const a = numts.from_nested_array([
                    [1, 6,  11, 16],
                    [2, 7, 12, 17],
                    [3, 8, 13, 0.5],
                    [4, 9, 14, 0.1],
                    [5, 10, 15, 100]
                ]);
                let [u, s, v] = linalg.householder_bidiagonal(a);
                console.log(s.to_nested_array())
            })
        })

        describe('From failures.', () =>  {
            // Failure doesn't repeat.
            it('1. Generated by fast-check.', () =>  {
            const a = numts.from_nested_array([
                [0, 0.03880476951599121],
                [0.9937839508056641, 0.5671613216400146]
            ]);
            const [q, r] = linalg.qr(a, {algorithm: 'householder'});
            
            const inv_prod = tensor.matmul_2d(q, q.transpose());
            expect(inv_prod.is_close(tensor.eye(2)).all()).toBe(true);
            const qr_prod = tensor.matmul_2d(q, r);
            expect(qr_prod.is_close(a).all()).toBe(true);
            });

            // Failure doesn't repeat.
            it('2. Generated by fast-check.', () =>  {
            const a = numts.from_nested_array([
                [0, 0.9712722897529602],
                [0.7647293210029602, 0.32188379764556885],
                [0.3959425091743469, 0.7986384630203247]
            ]);
            const [q, r] = linalg.qr(a, {algorithm: 'householder'});
            
            const inv_prod = tensor.matmul_2d(q, q.transpose());
            expect(inv_prod.is_close(tensor.eye(3)).all()).toBe(true);
            const qr_prod = tensor.matmul_2d(q, r);
            expect(qr_prod.is_close(a).all()).toBe(true);
            });
        });
    });
  });
})
