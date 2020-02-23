const fc = require('fast-check');
const tensor = require("../numts/tensor").tensor;
const numts = require("../numts/numts");
const linalg = require("../numts/linalg");
const helpers = require('./helpers');

describe('Decompositions.', () => {
    describe('LU decomposition', () => {

    })

    describe('Givens QR.', () => {
        test('Thin matrices.', function() {
            function f(a) {
                const [m, ] = a.shape;
                const [q, r] = linalg.qr(a);
    
                // Check that q is orthogonal
                const t = q.transpose();
                const inv_prod = tensor.matmul_2d(q, t);
                const expected = tensor.eye(m);
                expect(inv_prod.is_close(expected).all()).toBe(true);
    
                // Check that the product is correct
                const qr_prod = tensor.matmul_2d(q, r);
                expect(qr_prod.is_close(a).all()).toBe(true);
            }
            helpers.check_matrix(f, 'thin');
        });
    })

    describe('Householder QR.', () => {
        test('Thin matrices.', function() {
            function f(a) {
                const [m, ] = a.shape;
                const [q, r] = linalg.qr(a, {algorithm: 'householder'});
            
                // Check that q is orthogonal
                const t = q.transpose();
                const inv_prod = tensor.matmul_2d(q, t);
                const expected = tensor.eye(m);
                if (!inv_prod.is_close(expected).all()) throw new Error('Inverse prod not identity')
            
                // Check that the product is correct
                const qr_prod = tensor.matmul_2d(q, r);
                if (!qr_prod.is_close(a).all()) throw new Error('qr not original.')
            }
            helpers.check_matrix(f, 'thin');
        });
    })
    
})
