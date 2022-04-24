/* eslint-disable class-methods-use-this */
import * as mm from 'mingru-models';
import * as np from 'path';
import * as mfs from 'm-fs';
import logger from '../logger.js';
import CoreBuilder from './coreBuilder.js';
import CoreBuilderContext from './coreBuilderContext.js';
import { AGIO } from '../io/agIO.js';
import { BuildOptions } from './buildOptions.js';
import * as go from './goCodeUtil.js';
import * as defs from '../def/defs.js';
import { ActionToIOOptions } from '../io/actionToIOOptions.js';
import * as stringUtil from '../lib/stringUtils.js';
import { buildTSInterface } from './tsCodeBuilder.js';
import { dedup } from '../lib/arrayUtils.js';

// Wraps a `CoreBuilder` and handles input options and file operations.
export default class CoreBuilderWrapper {
  async buildAsync(
    source: Array<mm.ActionGroup | mm.Table>,
    outDir: string,
    ioOpts: ActionToIOOptions,
    opts: BuildOptions,
  ) {
    let actions: mm.ActionGroup[] = [];
    let tables: mm.Table[] = [];
    for (const item of source) {
      if (item instanceof mm.ActionGroup) {
        actions.push(item);
        tables.push(item.__getData().groupTable);
      } else {
        tables.push(item);
      }
    }

    actions = dedup(actions);
    tables = dedup(tables);

    const context = new CoreBuilderContext();
    await Promise.all(
      actions.map(async (ag) => {
        const agName = ag.constructor.name;
        const agIO = new AGIO(ag, ioOpts);
        const builder = new CoreBuilder(agIO, opts, context);
        const code = builder.build();
        const fileName = stringUtil.toSnakeCase(agName);
        const outFile = np.join(outDir, fileName + '.go');
        await mfs.writeFileAsync(outFile, code);
        if (builder.tsTypeCollector?.count) {
          const { tsOutDir } = opts;
          if (!tsOutDir) {
            throw new Error('`Options.tsOut` is required if TypeScript interfaces are used');
          }
          await Promise.all(
            builder.tsTypeCollector.values().map(async (type) => {
              logger.debug(`⛱ Building TypeScript definition "${type.name}"`);
              await mfs.writeFileAsync(
                np.join(tsOutDir, stringUtil.toCamelCase(type.name) + '.ts'),
                (opts.goFileHeader ?? defs.fileHeader) + type.code,
              );
            }),
          );
        }
      }),
    );

    await Promise.all([
      this.buildTypes(context, outDir, opts),
      this.buildTables(tables, outDir, opts),
    ]);
  }

  private async buildTables(tables: mm.Table[], outDir: string, opts: BuildOptions) {
    let code = `package ${opts.packageName || defs.defaultPackageName}\n\n`;
    for (const t of tables) {
      code += `const ${defs.tableNameCode(t)} = ${JSON.stringify(t.__getDBName())}\n`;
    }
    const outFile = np.join(outDir, 'tables.go');
    await mfs.writeFileAsync(outFile, (opts.goFileHeader ?? '') + code);
  }

  private async buildTypes(context: CoreBuilderContext, outDir: string, opts: BuildOptions) {
    let code = `package ${opts.packageName || defs.defaultPackageName}\n\n`;
    const imports = new go.ImportList();
    let resultTypesCode = '';

    const resultTypes = Object.keys(context.resultTypes);
    if (resultTypes.length) {
      resultTypesCode += go.sep('Result types') + '\n';
      // Sort type names alphabetically.
      resultTypes.sort((a, b) => a.localeCompare(b));

      let tsCode = '';
      let firstTsMember = true;
      for (const name of resultTypes) {
        const resultTypeStructData = context.resultTypes[name];
        if (!resultTypeStructData) {
          throw new Error('Unexpected undefined context value');
        }
        imports.addVars(resultTypeStructData.members);
        resultTypesCode += go.struct(resultTypeStructData);
        resultTypesCode += '\n';

        if (opts.tsOutDir && context.hasTsResultType(name)) {
          if (firstTsMember) {
            firstTsMember = false;
          } else {
            tsCode += '\n';
          }
          tsCode += buildTSInterface(resultTypeStructData);
        }
      }

      if (opts.tsOutDir) {
        const outFile = np.join(opts.tsOutDir, 'types.ts');
        await mfs.writeFileAsync(outFile, (opts.goFileHeader ?? '') + tsCode);
      }
    }

    // Generating additional interface types.
    const interfaces = Object.keys(context.interfaces);
    let interfacesCode = '';
    if (interfaces.length) {
      interfacesCode += go.sep('Interfaces') + '\n';
      // Sort interfaces alphabetically.
      interfaces.sort((a, b) => a.localeCompare(b));
      for (const name of interfaces) {
        const contextValue = context.interfaces[name];
        if (!contextValue) {
          throw new Error('Unexpected undefined context value');
        }
        // Sort interface members alphabetically.
        const members = [...contextValue.values()];
        members.sort((a, b) => a.name.localeCompare(b.name));

        interfacesCode += go.interfaceType(
          name,
          members.map((m) => m.sig),
        );
        interfacesCode += '\n';

        for (const mem of members) {
          imports.addVars(mem.params);
          imports.addVars(mem.returnType);
        }
      }
    }

    if (resultTypesCode || interfacesCode) {
      code += imports.code();
      code += resultTypesCode + interfacesCode;
      if (code.endsWith('\n\n')) {
        code = code.substr(0, code.length - 1);
      }
      const outFile = np.join(outDir, 'types.go');
      await mfs.writeFileAsync(outFile, (opts.goFileHeader ?? '') + code);
    }
  }
}
