import { tensor } from "./tensor";
import { zeros } from "./numts";

//#region utils
/**
 * 
 * @param a - The array.
 */
export function column_iterator(a: tensor) {
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
                }
                yield iter2;
            }
        }
    }
    return iter;
}

export function is_vector(a: tensor): boolean {
    return a.shape.length === 1;
}

export function is_flat(a: tensor): boolean {
    return (a.shape.length === 1) || (a.shape.reduce((x, y) => y === 1 ? x : x + 1, 0) <= 1);
}

export function is_matrix(a: tensor): boolean {
    return a.shape.length === 2;
}

export function is_square(a: tensor): boolean {
    return a.shape.length === 2 && a.shape[0] === a.shape[1];
}
//#endregion utils

/**
 * Calculate the L1 norm of a tensor.
 * @param a - A tensor.
 */
export function l1(a: tensor) {
    if (is_vector(a)) {
        return a.reduce((x, y) => x + Math.abs(y), 0);
    } else if (is_matrix(a)) {
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

/**
 * Calculate the L2 norm of the tensor.
 * @param a - A tensor.
 */
export function l2(a: tensor): number {
    // Calculate sigma_1 of a.
    if (is_flat(a)) {
        // @ts-ignore
        return Math.sqrt(a.reduce((x, y) => x + Math.pow(y, 2), 0));
    } else {
        throw new Error('Not implemented');
    }
}

/**
 * Calculate the L_infinity norm of a tensor.
 * @param a - A tensor
 */
export function linf(a: tensor) {

}

/**
 * Calculate the Frobenius norm of a tensor.
 * @param a - A tensor.
 */
export function fnorm(a: tensor) {

}

export function pnorm(a: tensor) {

}

export function inv(a: tensor): tensor {
    throw new Error();
}

//#region Decompositions
/**
 * Calculate the singular valud decomposition of a matrix.
 * @param a - A matrix.
 */
export function svd(a: tensor): [tensor, tensor, tensor] {
    if (!is_matrix(a)) {
        throw new Error(`Can only calculate SVD for square matrices.`);
    } else {
        const m = a.shape[0];
        const n = a.shape[1];

        throw new Error();
    }
}

/**
 * LU decomposition of a square matrix.
 * Uses the Doolittle algorithm.
 * @param a - The matrix to factor.
 * 
 * @returns - A tuple containing the L and U matrices.
 */
export function lu(a: tensor): [tensor, tensor] {
    if (!is_square(a)) {
        throw new Error('LU decomposition is only valid for square matrices.');
    }
    const n = a.shape[0];
    let lower = zeros(a.shape);
    let upper = zeros(a.shape);
    for (let i = 0; i < n; i++) {
        for (let k = i; k < n; k++) {
            const sum = tensor.dot(lower.slice(i), upper.slice(null, k));
            const diff = a.g(i, k) - sum;
            upper.s(diff, i, k);
        }

        for (let k = i; k < n; k++) {
            if (i === k) {
                lower.s(1, i, i);
            } else {
                const sum = tensor.dot(lower.slice(k), upper.slice(null, i));
                const diff = (a.g(k, i) - sum) / upper.g(i, i);

                lower.s(diff, k, i);
            }
        }
    }

    return [lower, upper];
}

/**
 * Calculate the Cholesky decomposition of a matrix.
 * @param a - A matrix.
 */
export function chol(a: tensor) {

}

export function rank(a: tensor) {

}

/**
 * Calculate the QR decomposition of a matrix.
 * @param a - A matrix.
 * @param options - Options.
 */
export function qr(a: tensor, options = { just_r: false, algorithm: 'givens' }) {

    if (!is_matrix(a)) {
        throw new Error('QR only works for matrices');
    }

    const just_r = options.just_r === undefined ? false : options.just_r;
    const algorithm = options.algorithm === undefined ? 'givens' : options.algorithm;

    if (algorithm === 'givens') {
        return givens_qr(a);
    } else if (algorithm === 'householder') {
        return householder_qr(a);
    } else {
        throw new Error(`Unknown algorithm "${algorithm}"`);
    }
}

/**
 * QR factorization of a symmetric matrix.
 * @param a - The matrix to decompose.
 */
export function sym_qr(a: tensor): [tensor, tensor] {
    throw new Error();
}

//#region Householder QR
/**
 * Calculate a QR decomposition of `a` using Householder transformations.
 * @param A - The matrix to decompose.
 */
function householder_qr(A: tensor) {
    const [m, n] = A.shape;
    let Q = tensor.eye(m);
    let R = tensor.copy(A, 'float64');
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
            continue
        } else {
            const pivot: number = R.g(j, j);
            const s: number = pivot >= 0 ? 1 : -1;
            const u1: number = pivot + s * norm;
            const normalized: tensor = lower_column.div(u1);
            normalized.s(1, 0);
            const tau: number = s * u1 / norm;
            const tauw = normalized.mult(tau);

            // Update R
            const r_block = R.slice([j, null], null);
            const temp1 = tensor.matmul_2d(normalized.transpose(), r_block);
            const temp2 = tensor.matmul_2d(tauw, temp1);
            const r_diff = r_block.sub(temp2);
            R.s(r_diff, [j, null], null);

            // Update Q
            const q_block = Q.slice(null, [j, null]);
            const matmul = tensor.matmul_2d(q_block, normalized);
            const temp3 = tensor.matmul_2d(matmul, tauw.transpose());
            const q_diff = q_block.sub(temp3);
            Q.s(q_diff, null, [j, null]);
        }

    }
    return [Q, R];
}

function pivoted_householder(a: tensor): [tensor, tensor] {
    if (!is_matrix(a)) {
        throw new Error()
    }
    
    const [m, n] = a.shape;
    let c = [];
    // Stores the permutation matrix.
    // The final permutation matrix is the identity matrix with row j and row pivot[j] swapped.
    let pivot = new Uint32Array(m);
    let tau = Number.MIN_VALUE;
    let k;
    for (let i = 0; i < n; i++) {
        const l = a.slice(null, i);
        c[i] = l.dot(l)
        tau = c[i] >= tau? c[i] : tau;
        k = i;
    }
    let r = 0;
    while (tau > 0 && r < n) {
        pivot[r] = k;
        // Swap the chosen columns
        const col_r = a.slice(null, r);
        // Set column r to column k
        a.s(a.slice(null, k), null, r)
        // Set column k to column
        a.s(col_r, null, k);

        const c_k = c[k];
        c[k] = c[r];
        c[r] = c_k;

        const [v, b] = householder_vector(a.slice([r, null], r));
        
    }
    throw new Error();
}

/**
 * Construct the matrix I - b * v * v_T
 * @param v - 
 * @param b - 
 */
function construct_householder_matrix(v: tensor, b: number) {
    if (!is_vector(v)) {
        throw new Error();
    }
    const m = v.shape[0];
    let matrix = tensor.eye(m);
    let squared = tensor.matmul_2d(v, v.transpose());
    let scaled = squared.mult(b);

    return matrix.sub(scaled);
}

/**
 * 
 * @param a - The matrix to compute.
 */
function householder_vector(a: tensor): [tensor, number] {
    throw new Error();
}

/**
 * Transform a column of `a`
 * @param a - The matrix to reflect.
 * @param i - The row index of the pivot.
 * @param j - The column index of the pivot.
 */
function householder_transform(a: tensor, i:number, j: number) {
//     // Calculate the vector to reflect around.
//     const lower_column = a.slice([j, null], [j, j + 1]);
//     // @ts-ignore
//     const norm = l2(lower_column);
//     // If the norm is already very close to zero, the column is already
//     if (norm < 1e-14) {
//         throw new Error();
//     } else {
//         const pivot: number = R.g(j, j);
//         const s: number = pivot >= 0 ? 1 : -1;
//         const u1: number = pivot + s * norm;
//         const normalized: tensor = lower_column.div(u1);
//         normalized.s(1, 0);
//         const tau: number = s * u1 / norm;
//         const tauw = normalized.mult(tau);

//         // Update R
//         const r_block = a.slice([j, null], null);
//         const temp1 = tensor.matmul_2d(normalized.transpose(), r_block);
//         const temp2 = tensor.matmul_2d(tauw, temp1);
//         const r_diff = r_block.sub(temp2);
//         a.s(r_diff, [j, null], null);

//         // Update Q
//         const q_block = Q.slice(null, [j, null]);
//         const matmul = tensor.matmul_2d(q_block, normalized);
//         const temp3 = tensor.matmul_2d(matmul, tauw.transpose());
//         const q_diff = q_block.sub(temp3);
        
//     }
}

//#endregion Householder QR

//#region Givens QR
/**
 * Calculate the QR factorization of `a` using Givens rotations.
 * @param A - The matrix to factorize.
 */
function givens_qr(A: tensor): [tensor, tensor] {
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
            } else {
                Q = tensor.matmul_2d(G, Q);
            }
        }
    }

    // Handle one-dimensional arrays.
    if (Q === null) {
        Q = tensor.eye(m);
    }

    return [Q.transpose(), R];
}

/**
 * 
 * @param A - The matrix to perform the rotation on.
 * @param i - The row to rotate to.
 * @param j - The row to rotate from, and the column.
 */
function givens_rotation_up(A: tensor, i: number, j: number): [tensor, tensor] {
    const bottom_val = A.g(j, i);
    const top_val = A.g(i, i);
    const r = Math.sqrt(Math.pow(bottom_val, 2) + Math.pow(top_val, 2));
    const s = bottom_val / r;
    const c = top_val / r;
    const [m, n] = A.shape;
    let G = tensor.eye(m);
    G.s(c, i, i);
    G.s(c, j, j);
    G.s(s, i, j);
    G.s(-s, j, i);

    const R = tensor.matmul_2d(G, A);
    return [G, R];
}

/**
 * Multiply a compressed Givens rotation matrix by a normal matrix.
 * @param G - The compressed representation of the Givens rotation.
 * @param A - The matrix being transformed.
 */
function compressed_givens_mult(G: Float64Array, A: tensor): tensor {
    throw new Error();
}

//#endregion Givens QR

//#endregion Decompositions
