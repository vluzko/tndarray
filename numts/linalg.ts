import {tndarray} from "./tndarray";

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

export function l1(a: tndarray) {
  if (is_vector(a)) {
    return a.data.reduce((a, b) => a + Math.abs(b), 0);
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

export function qr(a: tndarray) {

}

export function chol(a: tndarray) {

}

export function lu(a: tndarray) {

}

export function rank(a: tndarray) {
    
}

/**
 * 
 * @param a - The matrix to perform the rotation on.
 * @param i - The row to rotate to.
 * @param j - The row to rotate from, and the column.
 */
function givens_rotation_up(a: tndarray, i: number, j: number): [tndarray, tndarray] {
  const bottom_val = a.g(j, j);
  const top_val = a.g(i, j);
  const r = Math.sqrt(Math.pow(bottom_val, 2) + Math.pow(top_val, 2));
  const s = bottom_val / r;
  const c = top_val /r;
  const [m, n] = a.shape;
  // const G = numts.eye(m);
  // G.s(i, i) = c;
  // G.s(j, j) = c;
  // G.s(j, i) = s;
  // G.s(i, j) = -s;

  throw new Error();
}