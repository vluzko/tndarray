const call_python = require('./call_python');
const tensor = require('../numts/tensor').tensor;
const numts = require('../numts/numts');
const helpers = require('./helpers');

// test('temp.', () => {
//   const a = numts.zeros(10);
//   // const ret = call_python.call_python()
// });

describe('Basic operations.', () => {

  function check_op(op) {
    const f = (a, b) => {
      const numts_value = tensor[op](a, b);

      const a_string = JSON.stringify(a.to_json());
      const b_string = JSON.stringify(b.to_json());
      return numts_value !== undefined;
    };
    return f;
  }

  test('Array addition.', () => {
    helpers.check_arrays(check_op('_add'));
  });
});
