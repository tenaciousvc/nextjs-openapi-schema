import * as t from "@babel/types";
import fs from "node:fs";
import path from "node:path";
import traverse from "@babel/traverse";
import { parse } from "@babel/parser";

import { SchemaProcessor } from "./schema-processor.js";
import { capitalize, extractJSDocComments, getOperationId } from "./utils.js";
import type { DataTypes, OpenApiConfig, RouteDefinition } from "../types.js";

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const MUTATION_HTTP_METHODS = ["PATCH", "POST", "PUT"];

export class RouteProcessor {
  private swaggerPaths: Record<string, any> = {};
  private schemaProcessor: SchemaProcessor;
  private config: OpenApiConfig;

  constructor(config: OpenApiConfig) {
    this.config = config;
    this.schemaProcessor = new SchemaProcessor(config.schemaDir);
  }

  private isRoute(varName: string) {
    return HTTP_METHODS.includes(varName);
  }

  private processFile(filePath: string, verbose = false) {
    if(verbose) console.log(`Processing ${filePath}`);

    const content = fs.readFileSync(filePath, "utf-8");
    const ast = parse(content, {
      sourceType: "module",
      plugins: ["typescript", "decorators-legacy"],
    });

    traverse.default(ast, {
      ExportNamedDeclaration: (path) => {
        const declaration = path.node.declaration;

        if (
          t.isFunctionDeclaration(declaration) &&
          t.isIdentifier(declaration.id)
        ) {
          const dataTypes = extractJSDocComments(path);
          if (this.isRoute(declaration.id.name)) {
            this.addRouteToPaths(declaration.id.name, filePath, dataTypes);
          }
        }

        if (t.isVariableDeclaration(declaration)) {
          // biome-ignore lint/complexity/noForEach: <explanation>
          declaration.declarations.forEach((decl) => {
            if (t.isVariableDeclarator(decl) && t.isIdentifier(decl.id)) {
              if (this.isRoute(decl.id.name)) {
                this.addRouteToPaths(
                  decl.id.name,
                  filePath,
                  extractJSDocComments(path)
                );
              }
            }
          });
        }
      },
    });
  }

  public scanApiRoutes(dir: string, verbose = false) {
    const files = fs.readdirSync(dir);

    // biome-ignore lint/complexity/noForEach: <explanation>
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        this.scanApiRoutes(filePath, verbose);
        // @ts-ignore
      } else if (file.endsWith(".ts")) {
        this.processFile(filePath, verbose);
      }
    });
  }

  private addRouteToPaths(
    varName: string,
    filePath: string,
    dataTypes: DataTypes
  ): void {
    const method = varName.toLowerCase();
    console.log(" - filePath", filePath);
    let routePath = this.getRoutePath(filePath);
    console.log(" - Route path", routePath);
    const rootPath = capitalize(routePath.split("/")[1]);
    const operationId = getOperationId(routePath, method);
    const { summary, description, auth, isOpenApi } = dataTypes;

    const pathParams = routePath.split("/")
        .filter(part => part.startsWith("[") && part.endsWith("]"))
        .map(part => part.slice(1, -1));
    routePath = routePath.replaceAll('[', '{').replaceAll(']', '}');

    console.log(" - Adding route", method, routePath, pathParams);

    if (this.config.onlyOpenApiRoutes && !isOpenApi) {
      // If flag is enabled and there is no @openapi tag, then skip path
      return;
    }

    if (!this.swaggerPaths[routePath]) {
      this.swaggerPaths[routePath] = {};
    }

    const { params, body, responses } =
      this.schemaProcessor.getSchemaContent(dataTypes);

    const definition: RouteDefinition = {
      operationId: operationId,
      summary: summary,
      description: description,
      tags: [rootPath],
    };

    // Add auth
    if (auth) {
      definition.security = [
        {
          [auth]: [],
        },
      ];
    }

    if (params || pathParams.length) {
      definition.parameters = [
        ...this.schemaProcessor.createPathParamsSchema(pathParams),
        ...this.schemaProcessor.createRequestParamsSchema(params)
      ]
    }

    // Add request body
    if (MUTATION_HTTP_METHODS.includes(method.toUpperCase())) {
      definition.requestBody =
        this.schemaProcessor.createRequestBodySchema(body);
    }

    // Add responses
    definition.responses = responses
      ? this.schemaProcessor.createResponseSchema(responses)
      : {};

    this.swaggerPaths[routePath][method] = definition;
  }

  private getRoutePath(filePath: string): string {
    const { apiDir } = this.config;
    const apiSeparated = apiDir.split("/");
    const apiSeparator = apiSeparated[apiSeparated.length - 1];
    const suffixPath = filePath.split(apiSeparator)[1];
    return suffixPath
      .replace("route.ts", "")
      .replaceAll("\\", "/")
      .replace(/\/$/, "");
  }

  private getSortedPaths(paths: Record<string, any>) {
    function comparePaths(a, b) {
      const aMethods = this.swaggerPaths[a] || {};
      const bMethods = this.swaggerPaths[b] || {};

      // Extract tags for all methods in path a
      const aTags = Object.values(aMethods).flatMap(
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        (method: any) => method.tags || []
      );
      // Extract tags for all methods in path b
      const bTags = Object.values(bMethods).flatMap(
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        (method: any) => method.tags || []
      );

      // Let's user only the first tags
      const aPrimaryTag = aTags[0] || "";
      const bPrimaryTag = bTags[0] || "";

      // Sort alphabetically based on the first tag
      const tagComparison = aPrimaryTag.localeCompare(bPrimaryTag);
      if (tagComparison !== 0) {
        return tagComparison; // Return the result of tag comparison
      }

      // Compare lengths of the paths
      const aLength = a.split("/").length;
      const bLength = b.split("/").length;

      return aLength - bLength; // Shorter paths come before longer ones
    }

    return Object.keys(paths)
      .sort(comparePaths.bind(this))
      .reduce((sorted, key) => {
        sorted[key] = paths[key];

        return sorted;
      }, {});
  }

  public getSwaggerPaths() {
    const paths = this.getSortedPaths(this.swaggerPaths);

    return this.getSortedPaths(paths);
  }
}
