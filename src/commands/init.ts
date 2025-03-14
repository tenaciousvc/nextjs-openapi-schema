import path from "path";
import fse from "fs-extra";
import ora from "ora";

import openapiTemplate from "../openapi-template.js";

const spinner = ora("Initializing project with OpenAPI template...\n");

export async function init() {
  spinner.start();
  try {
    const outputPath = path.join(process.cwd(), "next-openapi.json");
    const template = { ...openapiTemplate };

    await fse.writeJson(outputPath, template, { spaces: 2 });
    spinner.succeed(`Created OpenAPI template in next-openapi.json`);
  } catch (error) {
    spinner.fail(`Failed to initialize project: ${error.message}`);
  }
}
