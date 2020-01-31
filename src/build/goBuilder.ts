import * as mm from 'mingru-models';
import { throwIfEmpty } from 'throw-if-arg-empty';
import GoTABuilder from './goTABuilder';
import GoBuilderContext from './goBuilderContext';
import { TAIO } from '../io/taIO';
import Dialect from '../dialect';
import { BuildOptions } from './buildOptions';
import * as nodepath from 'path';
import * as mfs from 'm-fs';
import * as go from './goCode';
import * as defs from '../defs';

export default class GoBuilder {
  async buildAsync(
    tas: mm.TableActions[],
    outDir: string,
    dialect: Dialect,
    opts: BuildOptions,
  ) {
    throwIfEmpty(tas, 'tas');
    // Remove duplicate values.
    tas = [...new Set(tas)];

    const context = new GoBuilderContext();
    for (const ta of tas) {
      if (!ta.__table) {
        throw new Error('Table action group is not initialized');
      }
      const taIO = new TAIO(ta, dialect);
      const builder = new GoTABuilder(taIO, opts, context);
      const code = builder.build();
      const fileName = mm.utils.toSnakeCase(ta.__table.__name) + '_ta'; // Add a "_ta" suffix to table actions file.
      const outFile = nodepath.join(outDir, fileName + '.go');
      await mfs.writeFileAsync(outFile, code);
    }

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
          members.map(m => m.sig),
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
