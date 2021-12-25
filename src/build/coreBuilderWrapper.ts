/* eslint-disable class-methods-use-this */
import * as mm from 'mingru-models';
import { throwIfEmpty } from 'throw-if-arg-empty';
import * as np from 'path';
import * as mfs from 'm-fs';
import CoreBuilder from './coreBuilder.js';
import CoreBuilderContext from './coreBuilderContext.js';
import { TAIO } from '../io/taIO.js';
import { BuildOptions } from './buildOptions.js';
import * as go from './goCodeUtil.js';
import * as defs from '../defs.js';
import { ActionToIOOptions } from '../io/actionToIOOptions.js';
import { toSnakeCase } from '../lib/stringUtils.js';

// Wraps a `CoreBuilder` and handles input options and file operations.
export default class CoreBuilderWrapper {
  async buildAsync(
    tas: mm.TableActions[],
    outDir: string,
    ioOpts: ActionToIOOptions,
    opts: BuildOptions,
  ) {
    throwIfEmpty(tas, 'tas');
    // Remove duplicate values.
    // eslint-disable-next-line no-param-reassign
    tas = [...new Set(tas)];

    const context = new CoreBuilderContext();
    await Promise.all(
      tas.map(async (ta) => {
        const taTable = ta.__getData().table;
        const taIO = new TAIO(ta, ioOpts);
        const builder = new CoreBuilder(taIO, opts, context);
        const [code, tsInterfaces] = builder.build();
        const fileName = toSnakeCase(taTable.__getData().name) + '_ta'; // Add a "_ta" suffix to table actions file.
        const outFile = np.join(outDir, fileName + '.go');
        await mfs.writeFileAsync(outFile, code);
        if (tsInterfaces.length) {
          const { tsOutDir } = opts;
          if (!tsOutDir) {
            throw new Error('`Options.tsOut` is required if TypeScript interfaces are used');
          }
          await Promise.all(
            tsInterfaces.map((type) =>
              mfs.writeFileAsync(np.join(tsOutDir, type.fileName), type.code),
            ),
          );
        }
      }),
    );

    let code = `package ${opts.packageName || defs.defaultPackageName}\n\n`;
    const imports = new go.ImportList();
    let resultTypesCode = '';

    // Generate shared result types.
    const resultTypes = Object.keys(context.resultTypes);
    if (resultTypes.length) {
      resultTypesCode += go.sep('Result types') + '\n';
      // Sort type names alphabetically.
      resultTypes.sort((a, b) => a.localeCompare(b));
      for (const name of resultTypes) {
        const resultTypeStructData = context.resultTypes[name];
        if (!resultTypeStructData) {
          throw new Error('Unexpected undefined context value');
        }
        imports.addVars(resultTypeStructData.members);
        resultTypesCode += go.struct(resultTypeStructData);
        resultTypesCode += '\n';
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
