const fc = require('fast-check');
const tndarray = require('../numts/tndarray').tndarray;

function random_shape(max_size, upper) {
  if (max_size === undefined) {
    max_size = 10;
  }

  if (upper === undefined) {
    upper = 10;
  }

  let shape = [];
  for (let i = 0; i < max_size; i++) {
    shape.push(Math.ceil(Math.random() * upper))
  }

  return new Uint32Array(shape);
}

const matrix = fc.array(fc.integer(1, 1000), 2, 2).chain(shape => {
  const size = shape.reduce((a, b) => a * b, 1);
  return fc.tuple(fc.array(fc.float(), size, size), fc.constant(shape))
});

const squarish_array = fc.array(fc.integer(1, 10), 1, 5).chain(shape => {
  const size = shape.reduce((a, b) => a * b, 1);
  return fc.tuple(fc.array(fc.float(), size, size), fc.constant(shape),)
});

const many_dimensions = fc.array(fc.integer(1, 2), 1, 20).chain(shape => {
  const size = shape.reduce((a, b) => a * b, 1);
  return fc.tuple(fc.array(fc.float(), size, size), fc.constant(shape))
});

const large_dimensions = fc.array(fc.integer(100, 10000), 1, 2).chain(shape => {
  const size = shape.reduce((a, b) => a * b, 1);
  return fc.tuple(fc.array(fc.float(), size, size), fc.constant(shape))
});

function check_random_array(f) {
  const check = ([data, shape]) => {
    const a = tndarray.from_iterable(data, shape);
    return f(a);
  }
  fc.assert(fc.property(squarish_array, check));  
  fc.assert(fc.property(many_dimensions, check));
  fc.assert(fc.property(large_dimensions, check));
}

function check_matrix(f) {
  const check = ([data, shape]) => {
    const a = tndarray.from_iterable(data, shape);
    return f(a);
  }
  fc.assert(fc.property(matrix, check));  
}

module.exports = {random_shape, check_random_array, check_matrix};