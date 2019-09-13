import {tndarray} from "./tndarray";
import {zeros} from "./numts";

/**
 * 
 * @param a - The array.
 */
export function column_iterator(a: tndarray) {
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

export function is_vector(a: tndarray): boolean {
  return a.shape.length === 1;
}

export function is_matrix(a: tndarray): boolean {
  return a.shape.length === 2;
}

export function is_square(a: tndarray): boolean {
  return a.shape.length === 2 && a.shape[0] === a.shape[1];
}

export function l1(a: tndarray) {
  if (is_vector(a)) {
    return a.data.reduce((x, y) => x + Math.abs(y), 0);
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

export function l2(a: tndarray) {
  // Calculate sigma_1 of a.
}

export function linf(a: tndarray) {

}

export function fnorm(a: tndarray) {

}

export function pnorm(a: tndarray) {

}

export function inv(a: tndarray): tndarray {
  throw new Error();
}

export function svd(a: tndarray): [tndarray, tndarray, tndarray] {
  throw new Error();
}

/**
 * LU decomposition of a square matrix.
 * Uses the Doolittle algorithm.
 * @param a - The matrix to factor.
 * 
 * @returns - A tuple containing the L and U matrices.
 */
export function lu(a: tndarray): [tndarray, tndarray] {
  if (!is_square(a)) {
    throw new Error("LU decomposition is only valid for square matrices.");
  }
  const n = a.shape[0];
  let lower = zeros(a.shape);
  let upper = zeros(a.shape);
  for (let i = 0; i < n; i++) {
    for (let k = i; k < n; k++) {
      const sum = tndarray.dot(lower.slice(i), upper.slice(null, k));
      const diff = a.g(i, k) - sum;
      upper.s(diff, i, k);
    }

    for (let k = i; k < n; k++) {
      if (i === k) {
        lower.s(1, i, i);
      } else {
        const sum = tndarray.dot(lower.slice(k), upper.slice(null, i));
        const diff = (a.g(k, i) - sum) / upper.g(i, i);
        
        lower.s(diff, k, i);
      }
    }
  }

  return [lower, upper];
}

export function qr(a: tndarray) {

}

export function chol(a: tndarray) {

}

export function rank(a: tndarray) {
    
}

export function householder_qr(A: tndarray) {
  const [m, n] = A.shape;
  let Q = tndarray.eye(m);
  let R = tndarray.copy(A, 'float64');
  for (let j = 0; j < n; j++) {
    // console.log([...R._iorder_data_iterator()]);
    // console.log(R);
    const lower_column = R.slice([j, -1], [j, j + 1]);
    // @ts-ignore
    const norm: number  = Math.sqrt(lower_column.reduce((a, b) => a + Math.pow(b, 2), 0));
    const pivot: number = R.g(j, j);
    const s: number     = pivot >= 0 ? 1 : -1;
    const u1: number    = pivot + s * norm;
    const normalized: tndarray = lower_column.div(u1);
    normalized.s(1, 0);
    const tau: number = s * u1 / norm;
    // const temp1 = normalized.transpose().dot(R.slice([j, -1]));
    // const temp2 = normalized.mult(tau).mult(temp1);
    // const diff = lower_column.sub(temp2)
    const tauw = normalized.mult(tau);

    // Update R
    const r_block = R.slice([j, -1], null);
    const temp1 = tndarray.matmul_2d(normalized.transpose(), r_block);
    const temp2 = tndarray.matmul_2d(tauw, temp1);
    const r_diff = r_block.sub(temp2);
    // console.log(tauw.shape);
    // console.log(normalized.shape);
    // console.log(r_block.shape)
    // console.log(temp1.shape);
    // console.log(r_diff)

    R.s(r_diff, [j, -1], null);

    // Update Q
    const q_block = Q.slice(null, [j, -1]);
    const matmul = tndarray.matmul_2d(q_block, normalized);
    const temp3 = tndarray.matmul_2d(matmul, tauw.transpose());

    const q_diff = q_block.sub(temp3);
    Q.s(q_diff, null, [j, -1]);
  }
  return [Q, R];
}

export function givens_qr(A: tndarray): [tndarray, tndarray] {
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
        Q = tndarray.matmul_2d(G, Q);
      }
    }
  }

  // Handle one-dimensional arrays.
  if (Q === null) {
    Q = tndarray.eye(m);
  }

  return [Q, R];
}

/**
 * 
 * @param A - The matrix to perform the rotation on.
 * @param i - The row to rotate to.
 * @param j - The row to rotate from, and the column.
 */
function givens_rotation_up(A: tndarray, i: number, j: number): [tndarray, tndarray] {
  const bottom_val = A.g(j, i);
  const top_val = A.g(i, i);
  const r = Math.sqrt(Math.pow(bottom_val, 2) + Math.pow(top_val, 2));
  const s = bottom_val / r;
  const c = top_val /r;
  const [m, n] = A.shape;
  let G = tndarray.eye(m);
  G.s(c, i, i);
  G.s(c, j, j);
  G.s(s, i, j);
  G.s(-s, j, i);

  const R = tndarray.matmul_2d(G, A);
  return [G, R];
}

/**
 * Multiply a compressed Givens rotation matrix by a normal matrix.
 * @param G - The compressed representation of the Givens rotation.
 * @param A - The matrix being transformed.
 */
function compressed_givens_mult(G: Float64Array, A: tndarray): tndarray {
  throw new Error();
}