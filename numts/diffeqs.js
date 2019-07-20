"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Runge-Kutta 4 method for solving ODEs.
 * @param f - The differential equation to solve, e.g. it's f in y' = f(t, y).
 * @param t - The time points to solve for.
 * @param y_0 - The value of y at t[0]
 * @param h - The step size.
 */
function rk54(f, t, y_0, h = 0.1) {
    const t_0 = t[0];
    let y = new Float64Array(t.length);
    y[0] = y_0;
    for (let i = 0; i < t.length - 2; i++) {
        const start = t[i];
        const end = t[i + 1];
        const steps = (start - end) / h;
        let prev = y[i];
        for (let cur_t = start + h; cur_t < end; cur_t += h) {
            // The current time step
            const f1 = h * f(cur_t, prev);
            const f2 = h * f(cur_t + h / 2, prev + f1 / 2);
            const f3 = h * f(cur_t + h / 2, prev + f2 / 2);
            const f4 = h * f(cur_t + h, prev + f3);
            prev += 1 / 6 * (f1 + 2 * f2 + 2 * f3 + f4);
        }
        y[i + 1] = prev;
    }
    return y;
}
exports.rk54 = rk54;
//# sourceMappingURL=diffeqs.js.map