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

/**
 * Return true if the tensor is one-dimensional.
 */
export function is_vector(a: tensor): boolean {
    return a.shape.length === 1;
}

export function is_flat(a: tensor): boolean {
    return (a.shape.length === 1) || (a.shape.reduce((x, y) => y === 1 ? x : x + 1, 0) <= 1);
}

/**
 * Return true if the tensor is two-dimensional.
 */
export function is_matrix(a: tensor): boolean {
    return a.shape.length === 2;
}

/**
 * Return true if the tensor is row or column vector.
 */
export function is_flat_matrix(a: tensor): boolean {
    if (a.shape.length === 2) {
        const [m, n] = a.shape;
        return (m === 1) || (n === 1);
    } else {
        return false;
    }
}

/**
 * Return true if the tensor is a square matrix.
 */
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
    } 
    const m = a.shape[0];
    const n = a.shape[1];

    // Express A as U_1 x B x V_1
    const b = householder_bidiagonal(a);

    // Convert b to diagonal form U x Sigma x V

    // Express A as U_1 U_k Sigma V_k V_1

    // U_1 U_k and V_k V_1 are U and V respectively
    throw new Error();
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
    let R = A.as_type('float64');
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
// def make_house_vec(x):
//     n = x.shape[0]
//     dot_1on = x[1:].dot(x[1:])

//     # v is our return vector; we hack on v[0]
//     v = np.copy(x)
//     v[0] = 1.0

//     if dot_1on < np.finfo(float).eps:
//         beta = 0.0
//     else:
//         # apply Parlett's formula (G&vL page 210) for safe v_0 = x_0 - norm(X)
//         norm_x= np.sqrt(x[0]**2 + dot_1on)
//         if x[0] <= 0:
//             v[0] = x[0] - norm_x
//         else:
//             v[0] = -dot_1on / (x[0] + norm_x)
//         beta = 2 * v[0]**2 / (dot_1on + v[0]**2)
//         v = v / v[0]
//     return v, beta

/**
 * Calculate the vector required to create a Householder transform canceling the given column
 * @param a - The matrix to transform. Transformation is done in place.
 * @param i - The row index of the pivot.
 * @param j - The column index of the pivot.
 */
export function householder_vector(a: tensor, i: number, j: number): [tensor, number] {
    let vec = tensor.copy(a.slice([i, null], [j, j + 1]));
    const pivot: number = a.g(i, j);
    return compute_householder(vec, pivot);
}

/**
 * Calculate the vector required to create a Householder transform canceling the given row.
 * @param a - The matrix to transform. Transformation is done in place.
 * @param i - The row index of the pivot.
 * @param j - The column index of the pivot.
 */
export function householder_row_vector(a: tensor, i: number, j: number): [tensor, number] {
    let vec = tensor.copy(a.slice([i, i + 1], [j, null]));
    const pivot: number = a.g(i, j);
    return compute_householder(vec, pivot);
}

/**
 * Given a row/column vector and the value of the pivot, compute the required Householder vector.
 * Note that only the *non-zero* entries of the w vector are returned, since these
 * are all that is required to calculate the Householder matrix.
 * Algorithm 5.1.1 in Golub & van Loan, 4th Edition.
 */
function compute_householder(vec: tensor, pivot: number): [tensor, number] {
    const sigma = <number>vec.reduce((x, y) => x + Math.pow(y, 2), 0) - Math.pow(pivot, 2);
    let beta: number;
    // If the norm is already very close to zero, the column is already zeroed.
    if (sigma < 1e-14) {
        beta = 0.0;
    } else {
        const mu = Math.sqrt(Math.pow(pivot, 2) + sigma);
        let val: number;
        if (pivot <= 0) {
            val = pivot - mu;
        } else {
            val = -sigma / (pivot + mu);
        }
        const sval = Math.pow(val, 2);
        vec.s(val, 0, 0);
        beta = 2 * sval / (sigma + sval)
        vec = vec.div(val);
    }

    return [vec, beta];
}

/**
 * Calculate the full Householder transformation for a column.
 */
export function full_h_column_matrix(w: tensor, m: number, beta: number): tensor {
    let h = tensor.eye(m);
    const [i, _] = w.shape;
    const squared = tensor.matmul_2d(w, w.transpose());
    const w_beta = squared.mult(beta);
    const index = m - i;

    const diff = h.slice([index, null], [index, null]).sub(w_beta);
    h.s(diff, [index, null], [index, null]);
    return h;
}

/**
 * Calculate the full Householder transformation for a row
 */
export function full_h_row_matrix(w: tensor, m: number, beta: number): tensor {
    let h = tensor.eye(m);
    const [_, j] = w.shape;
    const squared = tensor.matmul_2d(w.transpose(), w);
    const w_beta = squared.mult(beta);
    const index = m - j;

    const diff = h.slice([index, null], [index, null]).sub(w_beta);
    h.s(diff, [index, null], [index, null]);

    return h;

}


// def house_bidiag_explicit_UV(A):
//     m,n = A.shape
//     assert m >= n
//     U,Vt = np.eye(m), np.eye(n)

//     for col in xrange(n):
//         v, beta = make_house_vec(A[col:,col])
//         A[col:,col:] = (np.eye(m-col) - beta * np.outer(v,v)).dot(A[col:,col:])
//         Q = full_house(m, col, v, beta)
//         U = U.dot(Q)
        
//         if col <= n-2:
//             # transpose here, reflection for zeros above diagonal in A
//             # col+1 keeps us off the super diagonal
//             v,beta = make_house_vec(A[col,col+1:].T)
//             A[col:,col+1:] = A[col:, col+1:].dot(np.eye(n-(col+1)) - beta * np.outer(v,v))
//             P = full_house(n, col+1, v, beta)
//             Vt = P.dot(Vt)
//     return U, A, Vt

// def full_house(n, col, v, beta):
//     ''' for size n, apply a Householder vector v in the lower right corner of
//         I_n to get a full-sized matrix with a smaller Householder matrix component'''
//     full = np.eye(n)
//     full[col:, col:] -= beta * np.outer(v,v)
//     return full

// /**
//  * Calculate the Householder vector to zero out a row.
//  * Based on the algorithm given in Burden and Faires, Chapter 9.
//  * Note that only the *non-zero* entries of the w vector are returned, since these
//  * are all that is required to calculate the Householder matrix.
//  * @param a - The matrix to transform. Transformation is done in place.
//  * @param i - The row index of the pivot.
//  * @param j - The column index of the pivot.
//  */
// export function householder_row_vector(a: tensor, i: number, j: number): tensor {
//     let lower_column = tensor.copy(a.slice([i, i + 1], [j, null]));
//     // @ts-ignore
//     const norm = l2(lower_column);
//     // If the norm is already very close to zero, the column is already zeroed.
//     if (norm < 1e-14) {
//         // TODO: In this case we should return the zero vector.
//         throw new Error();
//     } else {
//         const pivot: number = a.g(i, j);
//         const sign: number = pivot >= 0 ? 1 : -1;
//         const alpha = -sign * norm;
//         const r = Math.sqrt(0.5 * alpha * (alpha - pivot));
//         lower_column.s(lower_column.g(0, 0) - alpha, 0, 0);
//         lower_column = lower_column.div(2 * r);

//         return lower_column;
//     }
// }

/**
 * Reduce an [m, n] matrix to bidiagonal form using Householder transformations.
 */
export function householder_bidiagonal(a: tensor): [tensor, tensor, tensor] {

    const [m, n] = a.shape;
    if (m < n) {throw new Error(`SVD needs a tall triangular matrix. Got (${m}, ${n})`);}

    let u = tensor.eye(m);
    let v = tensor.eye(n);

    for (let col = 0; col < n; col++) {
        const [w, beta] = householder_vector(a, col+1, col);
        // TODO: This can be optimized by just iterating over the transpose.
        const w_square = tensor.matmul_2d(w, w.transpose());
        // Householder matrix to zero out col.
        const householder_matrix = tensor.eye(m - col).sub(w_square);
        const a_col_slice = a.slice([col, null], [col, null]);
        const lower_slice = tensor.matmul_2d(householder_matrix, a_col_slice);
        a.s(lower_slice, [col, null], [col, null]);
        // console.log(a);

        let q = tensor.eye(m);
        const diff = q.slice([col, null], [col, null]).sub(w_square);
        q.s(diff, [col, null], [col, null]);

        u = tensor.matmul_2d(u, q);

        if (col <= n - 2) {
            const [row_w, beta] = householder_row_vector(a, col, col+1);
            const row_w_square = tensor.matmul_2d(row_w, row_w.transpose());
            const householder_row_matrix = tensor.eye(n - (col + 1)).sub(row_w_square);
            const a_row_slice = a.slice([col, null], [col + 1, null]);
            const row_prod = tensor.matmul_2d(a_row_slice, householder_row_matrix);
            a.s(row_prod, [col, null], [col + 1, null]);

            let p = tensor.eye(n);
            const p_diff = p.slice([col + 1, null], [col + 1, null]);
            p.s(p_diff, [col + 1, null], [col + 1, null]);
            v = tensor.matmul_2d(p, v)
        }
    }

    return [u, a, v];
}

function pivoted_householder(a: tensor): [tensor, Uint32Array] {
    throw new Error();
    // if (!is_matrix(a)) {
    //     throw new Error()
    // }

    // const [m, n] = a.shape;
    // let c = [];
    // // Stores the permutation matrix.
    // // The final permutation matrix is the identity matrix with row j and row pivot[j] swapped.
    // let pivot = new Uint32Array(m);
    // let tau = Number.MIN_VALUE;
    // let k;
    // for (let i = 0; i < n; i++) {
    //     const l = a.slice(null, i);
    //     c[i] = l.dot(l)
    //     if (c[i] >= tau) {
    //         tau = c[i];
    //         k = i;
    //     }
    // }
    // let r = 0;
    // while (tau > 0 && r < n) {
    //     pivot[r] = k;
    //     // Swap the chosen columns
    //     const col_r = a.slice(null, r);
    //     // Set column r to column k
    //     a.s(a.slice(null, k), null, r)
    //     // Set column k to column
    //     a.s(col_r, null, k);

    //     const c_k = c[k];
    //     c[k] = c[r];
    //     c[r] = c_k;

    //     const [v, b] = householder_vector(a.slice([r, null], r));
    //     const h = construct_householder_matrix(v, b);
    //     const vals = tensor.matmul_2d(h, a.slice([r, null], [r, null]));
    //     a.s(vals, [r, null], [r, null]);
    //     a.s(v.slice([1, m - r + 1]), [r+1, null], r);
    //     tau = Number.MIN_VALUE;
    //     for (let j = r+1 ; j < n; j++) {
    //         c[j] = c[j] - Math.pow(a.g(r, j), 2);
    //         if (c[j] > tau) {
    //             tau = c[j];
    //             k = j;
    //         }
    //     }
    // }
    // return [a, pivot];
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
