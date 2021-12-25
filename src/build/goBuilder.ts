/* eslint-disable class-methods-use-this */
import * as mm from 'mingru-models';
import { throwIfEmpty } from 'throw-if-arg-empty';
import * as nodepath from 'path';
import * as mfs from 'm-fs';
import GoTABuilder from './goTABuilder.js';
import GoBuilderContext from './goBuilderContext.js';
import { TAIO } from '../io/taIO.js';
import { BuildOptions } from './buildOptions.js';
import * as go from './goCodeUtil.js';
import * as defs from '../defs.js';
import { ActionToIOOptions } from '../io/actionToIOOptions.js';
import { toSnakeCase } from '../lib/stringUtils.js';

export default class GoBuilder {
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

    const context = new GoBuilderContext();
    await Promise.all(
      tas.map((ta) => {
        const taTable = ta.__getData().table;
        const taIO = new TAIO(ta, ioOpts);
        const builder = new GoTABuilder(taIO, opts, context);
        const code = builder.build();
        const fileName = toSnakeCase(taTable.__getData().name) + '_ta'; // Add a "_ta" suffix to table actions file.
        const outFile = nodepath.join(outDir, fileName + '.go');
        return mfs.writeFileAsync(outFile, code);
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
      const outFile = nodepath.join(outDir, 'types.go');
      await mfs.writeFileAsync(outFile, (opts.goFileHeader ?? '') + code);
    }
  }
}
