"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseArgs = void 0;
const commander_1 = require("commander");
function parseArgs(args) {
    var _a;
    const program = new commander_1.Command();
    program.version("1.0.5");
    let outArgs = null;
    program
        .command("add [value]")
        .option("--target <t>", "exernal resource to proxy", "https://site.com")
        .option("--path <alias>", "proxy alias path", "/proxy/site")
        .option("--package <pkg>", "which package.json file", "package.json")
        .action((cmd, opt) => {
        // handle the add command
        let { target, path, package: pkg } = opt;
        console.log(cmd, "target:", target, "path:", path, "package:", pkg);
        outArgs = { ...opt };
    });
    debugger;
    program.parse(args);
    if ((_a = program.args) === null || _a === void 0 ? void 0 : _a.length) {
        console.log(program.args);
    }
    return (outArgs || program.opts());
}
exports.parseArgs = parseArgs;
//# sourceMappingURL=parseArgs.js.map