/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Compiler } from 'webpack';
import * as typescript from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

type ScalprumASTPluginOptions = {
  componentName?: string;
  debug?: boolean;
  modulesConfigLocation: string;
};

const pluginName = 'ScalprumASTPlugin';

type ModulesMap = Map<string, { remoteTypesPath: string; cdnLocation: string }>;

type ModulesResponse = {
  [moduleName: string]: {
    manifestLocation: string;
    remoteTypesLocation: string;
  };
};

class ScalprumASTPlugin {
  private options: ScalprumASTPluginOptions;
  private pendingFiles: Set<string>;
  private dependencies: Map<string, Set<string>> = new Map();
  private dependents: Map<string, Set<string>> = new Map();
  private modulesMap: ModulesMap = new Map();
  private modulesResponse: ModulesResponse | undefined;
  private modulesConfigError: boolean = false;
  private blockingTimeMs = 0;
  private nonBlockingTimeMs = 0;

  constructor(options: ScalprumASTPluginOptions = { modulesConfigLocation: '' }) {
    const { componentName = 'ScalprumComponent', debug = false, modulesConfigLocation } = options;
    if (!modulesConfigLocation) {
      throw new Error(`${pluginName} requires "modulesConfigLocation" option to be set`);
    }
    this.options = { componentName, debug, modulesConfigLocation };
    this.pendingFiles = new Set<string>();

    this.dependencies = new Map<string, Set<string>>();
    this.dependents = new Map<string, Set<string>>();
  }

  private debug(message: string, ...args: any[]) {
    if (this.options.debug) {
      console.debug(`[${pluginName}] ${message}`, ...args);
    }
  }

  private async fetchModulesConfig() {
    this.debug(`Fetching modules config from ${this.options.modulesConfigLocation}...`);
    try {
      if (this.modulesResponse) {
        this.debug(`Modules config already fetched, using cached version.`);
        return this.modulesResponse;
      }
      const response = await fetch(this.options.modulesConfigLocation);
      if (!response.ok) {
        throw new Error(`Failed to fetch modules config: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      this.modulesResponse = data;
      this.debug(`Successfully fetched modules config:`, data);
      return data;
    } catch (error) {
      this.info(`Error fetching modules config:`, error);
      this.modulesConfigError = true;
      return null;
    }
  }

  private info(message: string, ...args: any[]) {
    console.log(`[${pluginName}] ${message}`, ...args);
  }

  private addDependency(dependentFile: string, dependencyFile: string) {
    this.debug(`Adding dependency: ${path.basename(dependentFile)} depends on ${path.basename(dependencyFile)}`);

    // Track: dependencyFile -> [files that import it]
    if (!this.dependencies.has(dependencyFile)) {
      this.dependencies.set(dependencyFile, new Set());
    }

    this.dependencies.get(dependencyFile)?.add(dependentFile);

    // Track: dependentFile -> [files it imports]
    if (!this.dependents.has(dependentFile)) {
      this.dependents.set(dependentFile, new Set());
    }

    this.dependents.get(dependentFile)?.add(dependencyFile);
  }

  private getTagName(node: typescript.JsxElement | typescript.JsxSelfClosingElement): string {
    const openingElement = typescript.isJsxElement(node) ? node.openingElement : node;
    const tagName = openingElement.tagName;

    if (typescript.isIdentifier(tagName)) {
      return tagName.text;
    }

    return '';
  }

  private getScriptKind(fileName: string): typescript.ScriptKind {
    let scriptKind: typescript.ScriptKind = typescript.ScriptKind.Unknown;
    if (fileName.endsWith('.ts')) {
      scriptKind = typescript.ScriptKind.TS;
    } else if (fileName.endsWith('.tsx')) {
      scriptKind = typescript.ScriptKind.TSX;
    } else if (fileName.endsWith('.js')) {
      scriptKind = typescript.ScriptKind.JS;
    } else if (fileName.endsWith('.jsx')) {
      scriptKind = typescript.ScriptKind.JSX;
    }
    return scriptKind;
  }

  private resolveImportPath(importPath: string, currentFile: string) {
    try {
      let resolvedPath = null;
      // relative import
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        const currentDir = path.dirname(currentFile);
        resolvedPath = path.resolve(currentDir, importPath);
      } else {
        // ignore absolute imports
        this.debug(`Ignoring non-relative import: ${importPath} in ${path.basename(currentFile)}`);
        return null;
      }

      const extensions = ['.ts', '.tsx', '.js', '.jsx'];
      // named file imports
      for (const ext of extensions) {
        const fullPath = resolvedPath + ext;
        if (fs.existsSync(fullPath)) {
          this.debug(`Resolved import: ${importPath} -> ${path.basename(fullPath)}`);
          return fullPath;
        }
      }

      // index file imports
      for (const ext of extensions) {
        const indexPath = path.join(resolvedPath, 'index' + ext);
        if (fs.existsSync(indexPath)) {
          this.debug(`Resolved import: ${importPath} -> ${path.basename(indexPath)}`);
          return indexPath;
        }
      }
    } catch (error) {
      this.debug(`Failed to resolve import ${importPath} from ${path.basename(currentFile)}:`, error);
    }
  }

  private findImportSource(variableName: string, sourceFile: typescript.SourceFile): string | null {
    let importPath = null;
    const visit = (node: typescript.Node) => {
      if (typescript.isImportDeclaration(node) && node.moduleSpecifier && typescript.isStringLiteral(node.moduleSpecifier)) {
        const importSpecifiers = node.moduleSpecifier.text;
        if (node.importClause?.namedBindings && typescript.isNamedImports(node.importClause.namedBindings)) {
          const hasVariable = node.importClause.namedBindings.elements.some((element) => element.name.text === variableName);
          if (hasVariable) {
            importPath = importSpecifiers;
            this.debug(`Found import: ${variableName} from ${importPath}`);
          }
        }
        if (node.importClause?.name?.text === variableName) {
          importPath = importSpecifiers;
          this.debug(`Found default import: ${variableName} from ${importPath}`);
        }
      }
      typescript.forEachChild(node, visit);
    };
    visit(sourceFile);
    return importPath;
  }

  private resolveSpreadAttribute(variableName: string, sourceFile: typescript.SourceFile) {
    let result: {
      scope: string | null;
      module: string | null;
      importName: string | null;
    } = { scope: null, module: null, importName: null };

    const visit = (node: typescript.Node) => {
      if (
        typescript.isVariableDeclaration(node) &&
        typescript.isIdentifier(node.name) &&
        node.name.text === variableName &&
        node.initializer &&
        typescript.isObjectLiteralExpression(node.initializer)
      ) {
        this.debug(`Found object definition for: ${variableName}`);
        node.initializer.properties.forEach((prop) => {
          if (typescript.isPropertyAssignment(prop) && typescript.isIdentifier(prop.name)) {
            const propName = prop.name.text;

            if (propName === 'scope' || propName === 'module' || propName === 'importName') {
              if (typescript.isStringLiteral(prop.initializer)) {
                result[propName] = prop.initializer.text;
                this.debug(`Found ${propName}: "${prop.initializer.text}"`);
              }
            }
          }
        });
      }
      typescript.forEachChild(node, visit);
    };
    visit(sourceFile);
    return result;
  }

  private getExpressionValue(expression: typescript.Expression | undefined) {
    if (!expression) {
      return null;
    }

    if (typescript.isStringLiteral(expression)) {
      return expression.text;
    }

    if (typescript.isIdentifier(expression)) {
      // Variable reference: {someVariable}
      return expression.text;
    }

    if (typescript.isPropertyAccessExpression(expression)) {
      // Property access: {config.moduleName}
      return expression.getText();
    }

    if (typescript.isTemplateExpression(expression) || typescript.isNoSubstitutionTemplateLiteral(expression)) {
      // Template literal: `${something}`
      return expression.getText();
    }

    if (typescript.isArrayLiteralExpression(expression)) {
      // Array literal: ["item1", "item2"]
      return `{${expression.getText()}}`;
    }

    if (typescript.isObjectLiteralExpression(expression)) {
      // Object literal: {scope: "insights"}
      return `{${expression.getText()}}`;
    }
    this.debug(`Unhandled expression type: ${typescript.SyntaxKind[expression.kind]}`);

    // For other expression types, return the raw text representation
    return `{${expression.getText()}}`;
  }

  private getAttributeValue(attr: typescript.JsxAttribute) {
    if (!attr.initializer) {
      // Happens if prop is passed as boolean <Component isDisabled /> -> isDisabled=true
      return true;
    }

    if (typescript.isStringLiteral(attr.initializer)) {
      // Happens when prop is a literal value <Component module="myModule" />
      return attr.initializer.text;
    }

    if (typescript.isJsxExpression(attr.initializer)) {
      // Happens when prop is an expression <Component module={myModule} />
      return this.getExpressionValue(attr.initializer.expression);
    }
    this.debug(`Unsupported initializer kind: ${typescript.SyntaxKind[attr.initializer.kind]}`);

    return null;
  }
  private extractScalprumProps(node: typescript.JsxElement | typescript.JsxSelfClosingElement) {
    const openingElement = typescript.isJsxElement(node) ? node.openingElement : node;
    const result: {
      scope: string | null | boolean;
      module: string | null | boolean;
      importName: string | null | boolean;
      spreadAttributes: any[];
    } = {
      scope: null,
      module: null,
      importName: null,
      spreadAttributes: [],
    };

    // no function attributes, return empty result
    if (!openingElement.attributes) {
      return result;
    }

    openingElement.attributes.properties.forEach((attr) => {
      if (typescript.isJsxAttribute(attr)) {
        const propName = attr.name.getText();
        if (['scope', 'module', 'importName'].includes(propName)) {
          // @ts-ignore
          result[propName as keyof typeof result] = this.getAttributeValue(attr);
        }
      } else if (typescript.isJsxSpreadAttribute(attr)) {
        const spreadValue = this.getExpressionValue(attr.expression);
        result.spreadAttributes.push(spreadValue);

        // If it's a simple identifier, try to resolve it!
        if (typescript.isIdentifier(attr.expression)) {
          const variableName = attr.expression.text;
          this.debug(`Resolving spread: ${variableName}`);

          // resolve in current file
          let resolvedProps = this.resolveSpreadAttribute(variableName, node.getSourceFile());
          if (!resolvedProps.scope || !resolvedProps.module) {
            //  try to resolve as import
            const importPath = this.findImportSource(variableName, node.getSourceFile());
            if (importPath) {
              const resolvedFilePath = this.resolveImportPath(importPath, node.getSourceFile().fileName);
              if (resolvedFilePath) {
                this.addDependency(node.getSourceFile().fileName, resolvedFilePath);
                const resolvedSourceFile = typescript.createSourceFile(
                  resolvedFilePath,
                  fs.readFileSync(resolvedFilePath, 'utf-8'),
                  typescript.ScriptTarget.Latest,
                  true,
                  this.getScriptKind(resolvedFilePath)
                );
                resolvedProps = this.resolveSpreadAttribute(variableName, resolvedSourceFile);
              }
            }
          }

          // Merge resolved props (only if not already set)
          if (!result.scope && resolvedProps.scope) result.scope = resolvedProps.scope;
          if (!result.module && resolvedProps.module) result.module = resolvedProps.module;
          if (!result.importName && resolvedProps.importName) result.importName = resolvedProps.importName;
        }
      }
    });

    return result;
  }

  private analyzeJSXElement(node: typescript.JsxElement | typescript.JsxSelfClosingElement, file: string) {
    const tagName = this.getTagName(node);
    if (tagName !== this.options.componentName) {
      return;
    }

    this.info(`Found <${this.options.componentName}> in ${path.basename(file)}`);
    const props = this.extractScalprumProps(node);
    if ((props.scope === 'scope' && props.module === 'module') || typeof props.scope !== 'string' || typeof props.module !== 'string') {
      // ignore these, these values are unknown at build time or invalid.
      return;
    }

    this.debug(`Extracted props:`, props);
    this.loadRemoteTypes(props.scope);
  }

  private loadRemoteTypes(scope: string) {
    // implement gzip fetch and unpacking if needed based on the modulesResponse configuration
    // should handle the scalprum types extraction, and "combine" the types
    this.info(`Loading remote types for scope: ${scope}`);
  }

  private traverseNode(node: typescript.Node, file: string) {
    if (typescript.isJsxElement(node) || typescript.isJsxSelfClosingElement(node)) {
      this.analyzeJSXElement(node, file);
    }

    typescript.forEachChild(node, (child) => {
      this.traverseNode(child, file);
    });
  }

  private processFile(file: string) {
    this.debug(`Processing file: ${path.basename(file)}`);
    try {
      const source = fs.readFileSync(file, 'utf-8');
      let scriptKind: typescript.ScriptKind = this.getScriptKind(file);
      const sourceFile = typescript.createSourceFile(file, source, typescript.ScriptTarget.Latest, true, scriptKind);
      this.traverseNode(sourceFile, file);
    } catch (error) {
      this.debug(`Failed to process file ${path.basename(file)}:`, error);
    }
  }

  private processInBackground() {
    // push it back on the queue
    setTimeout(() => {
      const start = performance.now();

      this.debug(`Processing ${this.pendingFiles.size} files...`);

      if (this.dependencies.size > 0) {
        this.debug(
          `Current dependencies:`,
          Array.from(this.dependencies.entries()).map(
            ([dep, dependents]) =>
              `${path.basename(dep)} <- [${Array.from(dependents)
                .map((f) => path.basename(f))
                .join(', ')}]`
          )
        );
      }

      this.pendingFiles.forEach((file) => {
        this.pendingFiles.delete(file);
        this.processFile(file);
      });

      this.pendingFiles.clear();

      this.nonBlockingTimeMs += performance.now() - start;

      // Output performance stats
      this.info(`Performance: Blocking ${this.blockingTimeMs.toFixed(1)}ms, Non-blocking ${this.nonBlockingTimeMs.toFixed(1)}ms`);
    });
  }

  private shouldAnalyze(file: string): boolean {
    if (!file || typeof file !== 'string') {
      return false;
    }
    return (
      (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) &&
      file.includes('/src/') &&
      !file.includes('node_modules')
    );
  }

  apply(compiler: Compiler) {
    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      compilation.hooks.succeedModule.tap(pluginName, (module: any) => {
        const start = performance.now();

        if (this.shouldAnalyze(module.resource)) {
          this.pendingFiles.add(module.resource);
        }

        if (module.resource && this.dependencies.get(module.resource)) {
          const dependentFiles = this.dependencies.get(module.resource);
          this.debug(`Dependency changed: ${path.basename(module.resource)}, re-analyzing ${dependentFiles?.size} dependent files`);

          dependentFiles?.forEach((dependent) => {
            // should always analyze as they were created as a dependency of the initial resource
            this.pendingFiles.add(dependent);
          });
        }

        this.blockingTimeMs += performance.now() - start;
      });
    });

    compiler.hooks.done.tap(pluginName, () => {
      if (this.pendingFiles.size > 0 && this.modulesResponse) {
        this.processInBackground();
      }

      if (!this.modulesResponse && !this.modulesConfigError) {
        this.fetchModulesConfig().then(this.processInBackground.bind(this));
      }
    });
  }
}

export default ScalprumASTPlugin;
