#! /usr/bin/env node

const pkg = require("../package").version
console.log(pkg)

require("commander")
  .version(pkg)
  .usage("<command>[options]")
  .command("init", "generate a new project from template")
  .command("list", "list availbale oficial templates")
  .parse(process.argv)
