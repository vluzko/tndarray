import {tensor} from "./tensor";
import {zeros} from "./numts";

/**
 * 
 * @param a - The array.
 */
export function column_iterator(a: tensor) {
  const step = a.shape[0];
  let iter = {
    [Symbol.iterator]: function*() {
      let index = 0;
      for (let column = 0; column < a.shape[1]; column++) {
        let iter2 = {
          [Symbol.iterator]: function*() {
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

/**
 * Calculate the singular valud decomposition of a matrix.
 * @param a - A matrix.
 */
export function svd(a: tensor): [tensor, tensor, tensor] {
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

export function qr(a: tensor) {

}

export function chol(a: tensor) {

}

export function rank(a: tensor) {
    
}

export function householder_qr(A: tensor) {
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
      const s: number     = pivot >= 0 ? 1 : -1;
      const u1: number    = pivot + s * norm;
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

export function givens_qr(A: tensor): [tensor, tensor] {
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
  const c = top_val /r;
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