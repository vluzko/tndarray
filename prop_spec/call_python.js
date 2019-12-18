"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const FILE = `${__dirname}/numpy_tests.py`;
function call_python(function_name, args, kwargs) {
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
    const res = child_process_1.execSync(command);
    return res;
}
exports.call_python = call_python;
// call_python('hello', [], new Map());
//# sourceMappingURL=call_python.js.map