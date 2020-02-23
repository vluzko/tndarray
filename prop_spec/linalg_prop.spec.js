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
                expect(numts.isclose(inv_prod, expected).all()).toBe(true);
    
                // Check that the product is correct
                const qr_prod = tensor.matmul_2d(q, r);
                expect(numts.isclose(qr_prod, a).all()).toBe(true);
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
                if (!numts.isclose(inv_prod, expected).all()) throw new Error('Inverse prod not identity')
            
                // Check that the product is correct
                const qr_prod = tensor.matmul_2d(q, r);
                if (!numts.isclose(qr_prod, a).all()) throw new Error('qr not original.')
            }
            helpers.check_matrix(f, 'thin');
        });
    })
    
})
