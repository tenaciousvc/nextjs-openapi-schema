#!/usr/bin/env node

import { Command } from "commander";

import { init } from "./commands/init.js";
import { generate } from "./commands/generate.js";

const program = new Command();

program
  .name("nextjs-openapi-schema")
  .version("0.0.1")
  .description(
    "Generate OpenAPI schema for Next.js"
  );

program
  .command("init")
  .description("Initialize a openapi specification")
  .action(init);

program
  .command("generate")
  .option("-v, --verbose", "Verbose output", false)
  .description("Generate a specification based on api routes")
  .action(generate);

program.parse(process.argv);
