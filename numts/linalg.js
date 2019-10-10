"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tensor_1 = require("./tensor");
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
function is_flat(a) {
    return (a.shape.length === 1) || (a.shape.reduce((x, y) => y === 1 ? x : x + 1, 0) <= 1);
}
exports.is_flat = is_flat;
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
        return a.reduce((x, y) => x + Math.abs(y), 0);
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
/**
 * Calculate the L2 norm of the tensor.
 * @param a - A tensor.
 */
function l2(a) {
    // Calculate sigma_1 of a.
    if (is_flat(a)) {
        // @ts-ignore
        return Math.sqrt(a.reduce((x, y) => x + Math.pow(y, 2), 0));
    }
    else {
        throw new Error('Not implemented');
    }
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
        throw new Error('LU decomposition is only valid for square matrices.');
    }
    const n = a.shape[0];
    let lower = numts_1.zeros(a.shape);
    let upper = numts_1.zeros(a.shape);
    for (let i = 0; i < n; i++) {
        for (let k = i; k < n; k++) {
            const sum = tensor_1.tensor.dot(lower.slice(i), upper.slice(null, k));
            const diff = a.g(i, k) - sum;
            upper.s(diff, i, k);
        }
        for (let k = i; k < n; k++) {
            if (i === k) {
                lower.s(1, i, i);
            }
            else {
                const sum = tensor_1.tensor.dot(lower.slice(k), upper.slice(null, i));
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
function householder_qr(A) {
    const [m, n] = A.shape;
    let Q = tensor_1.tensor.eye(m);
    let R = tensor_1.tensor.copy(A, 'float64');
    if (m === 1 && n === 1) {
        return [Q, R];
    }
    for (let j = 0; j < n; j++) {
        // Calculate the vector to reflect around.
        const lower_column = R.slice([j, null], [j, j + 1]);
        // @ts-ignore
        const norm = l2(lower_column);
        // If the norm is already very close to zero, the column is already
        if (norm < 1e-14) {
            continue;
        }
        else {
            const pivot = R.g(j, j);
            const s = pivot >= 0 ? 1 : -1;
            const u1 = pivot + s * norm;
            const normalized = lower_column.div(u1);
            normalized.s(1, 0);
            const tau = s * u1 / norm;
            const tauw = normalized.mult(tau);
            // Update R
            const r_block = R.slice([j, null], null);
            const temp1 = tensor_1.tensor.matmul_2d(normalized.transpose(), r_block);
            const temp2 = tensor_1.tensor.matmul_2d(tauw, temp1);
            const r_diff = r_block.sub(temp2);
            R.s(r_diff, [j, null], null);
            // Update Q
            const q_block = Q.slice(null, [j, null]);
            const matmul = tensor_1.tensor.matmul_2d(q_block, normalized);
            const temp3 = tensor_1.tensor.matmul_2d(matmul, tauw.transpose());
            const q_diff = q_block.sub(temp3);
            Q.s(q_diff, null, [j, null]);
        }
    }
    return [Q, R];
}
exports.householder_qr = householder_qr;
function givens_qr(A) {
    const [m, n] = A.shape;
    let Q = null;
    let R = A;
    // Zero out the lower diagonal.
    for (let i = 0; i < n; i++) {
        for (let j = m - 1; j > i; j--) {
            let G;
            [G, R] = givens_rotation_up(R, i, j);
            if (Q === null) {
                Q = G;
            }
            else {
                Q = tensor_1.tensor.matmul_2d(G, Q);
            }
        }
    }
    // Handle one-dimensional arrays.
    if (Q === null) {
        Q = tensor_1.tensor.eye(m);
    }
    return [Q.transpose(), R];
}
exports.givens_qr = givens_qr;
/**
 *
 * @param A - The matrix to perform the rotation on.
 * @param i - The row to rotate to.
 * @param j - The row to rotate from, and the column.
 */
function givens_rotation_up(A, i, j) {
    const bottom_val = A.g(j, i);
    const top_val = A.g(i, i);
    const r = Math.sqrt(Math.pow(bottom_val, 2) + Math.pow(top_val, 2));
    const s = bottom_val / r;
    const c = top_val / r;
    const [m, n] = A.shape;
    let G = tensor_1.tensor.eye(m);
    G.s(c, i, i);
    G.s(c, j, j);
    G.s(s, i, j);
    G.s(-s, j, i);
    const R = tensor_1.tensor.matmul_2d(G, A);
    return [G, R];
}
/**
 * Multiply a compressed Givens rotation matrix by a normal matrix.
 * @param G - The compressed representation of the Givens rotation.
 * @param A - The matrix being transformed.
 */
function compressed_givens_mult(G, A) {
    throw new Error();
}
//# sourceMappingURL=linalg.js.map