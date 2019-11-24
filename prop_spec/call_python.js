"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = require("process");
const python_shell_1 = require("python-shell");
const DIR = process_1.cwd();
console.log(DIR);
const FILE = './numpy_test.py';
function compare_tensors(command, args, expected) {
    const options = {
        args: args
    };
    const result = python_shell_1.PythonShell.run(command);
}
exports.compare_tensors = compare_tensors;
//# sourceMappingURL=call_python.js.map