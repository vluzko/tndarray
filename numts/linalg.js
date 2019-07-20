"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tndarray_1 = require("./tndarray");
const numts_1 = require("./numts");
/**
 *
 * @param a - The array.
 */
function column_iterator(a) {
    const step = a.shape[0];
    let iter = {
        [Symbol.iterator]: function* () {
            let index = 0;
            for (let column = 0; column < a.shape[1]; column++) {
                let iter2 = {
                    [Symbol.iterator]: function* () {
                        for (let row = 0; row < a.shape[0]; row++) {
                            yield a.data[index];
                            index += 1;
                        }
                    }
                };
                yield iter2;
            }
        }
    };
    return iter;
}
exports.column_iterator = column_iterator;
function is_vector(a) {
    return a.shape.length === 1;
}
exports.is_vector = is_vector;
function is_matrix(a) {
    return a.shape.length === 2;
}
exports.is_matrix = is_matrix;
function is_square(a) {
    return a.shape.length === 2 && a.shape[0] === a.shape[1];
}
exports.is_square = is_square;
function l1(a) {
    if (is_vector(a)) {
        return a.data.reduce((a, b) => a + Math.abs(b), 0);
    }
    else if (is_matrix(a)) {
        let max = Number.MIN_VALUE;
        for (let column of column_iterator(a)) {
            let sum = 0;
            for (let value of column) {
                sum += Math.abs(value);
            }
            max = sum > max ? sum : max;
        }
        return max;
    }
}
exports.l1 = l1;
function l2(a) {
    // Calculate sigma_1 of a.
}
exports.l2 = l2;
function linf(a) {
}
exports.linf = linf;
function fnorm(a) {
}
exports.fnorm = fnorm;
function pnorm(a) {
}
exports.pnorm = pnorm;
function inv(a) {
    throw new Error();
}
exports.inv = inv;
function svd(a) {
    throw new Error();
}
exports.svd = svd;
/**
 * LU decomposition of a square matrix.
 * Uses the Doolittle algorithm.
 * @param a - The matrix to factor.
 *
 * @returns - A tuple containing the L and U matrices.
 */
function lu(a) {
    if (!is_square(a)) {
        throw new Error("LU decomposition is only valid for square matrices.");
    }
    const n = a.shape[0];
    let lower = numts_1.zeros(a.shape);
    let upper = numts_1.zeros(a.shape);
    for (let i = 0; i < n; i++) {
        for (let k = i; k < n; k++) {
            const sum = tndarray_1.tndarray.dot(lower.slice(i), upper.slice(null, k));
            const diff = a.g(i, k) - sum;
            upper.s(diff, i, k);
        }
        for (let k = i; k < n; k++) {
            if (i === k) {
                lower.s(1, i, i);
            }
            else {
                const sum = tndarray_1.tndarray.dot(lower.slice(k), upper.slice(null, i));
                const diff = (a.g(k, i) - sum) / upper.g(i, i);
                lower.s(diff, k, i);
            }
        }
    }
    return [lower, upper];
}
exports.lu = lu;
function qr(a) {
}
exports.qr = qr;
function chol(a) {
}
exports.chol = chol;
function rank(a) {
}
exports.rank = rank;
<<<<<<< HEAD
function householder() {
}
function givens() {
=======
/**
 *
 * @param a - The matrix to perform the rotation on.
 * @param i - The row to rotate to.
 * @param j - The row to rotate from, and the column.
 */
function givens_rotation_up(a, i, j) {
    const bottom_val = a.g(j, j);
    const top_val = a.g(i, j);
    const r = Math.sqrt(Math.pow(bottom_val, 2) + Math.pow(top_val, 2));
    const s = bottom_val / r;
    const c = top_val / r;
    const [m, n] = a.shape;
    // const G = numts.eye(m);
    // G.s(i, i) = c;
    // G.s(j, j) = c;
    // G.s(j, i) = s;
    // G.s(i, j) = -s;
    throw new Error();
>>>>>>> 396cd256f4f49ba232c3cfdf7ae8045aca41c65c
}
//# sourceMappingURL=linalg.js.map