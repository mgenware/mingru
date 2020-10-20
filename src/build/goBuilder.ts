/* eslint-disable class-methods-use-this */
import * as mm from 'mingru-models';
import { throwIfEmpty } from 'throw-if-arg-empty';
import * as nodepath from 'path';
import * as mfs from 'm-fs';
import GoTABuilder from './goTABuilder';
import GoBuilderContext from './goBuilderContext';
import { TAIO } from '../io/taIO';
import { BuildOptions } from './buildOptions';
import * as go from './goCode';
import * as defs from '../defs';
import { ActionToIOOptions } from '../io/actionToIOOptions';

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
        const taTable = ta.__table;
        const taIO = new TAIO(ta, ioOpts);
        const builder = new GoTABuilder(taIO, opts, context);
        const code = builder.build();
        const fileName = mm.utils.toSnakeCase(taTable.__name) + '_ta'; // Add a "_ta" suffix to table actions file.
        const outFile = nodepath.join(outDir, fileName + '.go');
        return mfs.writeFileAsync(outFile, code);
      }),
    );

    let code = `package ${opts.packageName || defs.defaultPackageName}\n\n`;
    const imports = new go.ImportList();
    let resultTypesCode = '';

    // Generating renamed result types.
    const resultTypes = Object.keys(context.resultTypes);
    if (resultTypes.length) {
      resultTypesCode += go.sep('Result types') + '\n';
      // Sort types alphabetically.
      resultTypes.sort((a, b) => a.localeCompare(b));
      for (const name of resultTypes) {
        const info = context.resultTypes[name];
        imports.addVars(info.members);
        resultTypesCode += go.struct(
          info.typeName,
          info.members,
          info.nameStyle,
          info.ignoredMembers,
          info.omitEmptyMembers,
        );
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
        // Sort interface members alphabetically.
        const members = [...context.interfaces[name].values()];
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
      await mfs.writeFileAsync(outFile, code);
    }
  }
}
