import { Command } from "commander";

interface Arguments {
  package: string;
  target: string;
  path: string;
}

export function parseArgs(args: string[]) {
  const program = new Command();
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

  if (program.args?.length) {
    console.log(program.args);
  }
  return ((outArgs || program.opts()) as unknown) as Arguments;
}
