import {cwd} from 'process';
import {PythonShell} from 'python-shell';
import {tensor} from '../numts/tensor';

const DIR = cwd();
console.log(DIR)
const FILE = './numpy_test.py';

export function compare_tensors(command: string, args: Array<string>, expected: tensor): boolean {
  const options = {
    args: args
  };
  const result = PythonShell.run(command, )
}
