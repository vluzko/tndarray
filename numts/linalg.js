"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
function qr(a) {
}
exports.qr = qr;
function chol(a) {
}
exports.chol = chol;
function lu(a) {
}
exports.lu = lu;
function rank(a) {
}
exports.rank = rank;
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
}
//# sourceMappingURL=linalg.js.map