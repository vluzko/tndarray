import {execSync} from 'child_process';
import {tensor} from '../numts/tensor';

const FILE = `${__dirname}/numpy_tests.py`;

export function call_python(function_name: string, args: Array<string>, kwargs: Map<string, string>): any {
  const arg_string = args === undefined ? '' : args.join(' ');
  let kwarg_array = [];
  if (kwargs !== undefined) {
    kwargs.forEach((v, k) => {
      const joined = `${k}=${v}`;
      kwarg_array.push(joined);
    });
  }
  const kwarg_string = kwarg_array.join(' ');

  const command = `python ${FILE} ${function_name} ${arg_string} ${kwarg_string}`;
  const res = execSync(command);
  return res;
}

// call_python('hello', [], new Map());
