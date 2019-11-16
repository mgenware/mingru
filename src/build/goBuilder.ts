import * as mm from 'mingru-models';
import { throwIfEmpty } from 'throw-if-arg-empty';
import GoTABuilder from './goTABuilder';
import GoBuilderContext from './goBuilderContext';
import { TAIO } from '../io/taIO';
import Dialect from '../dialect';
import { BuildOption } from './buildOption';
import * as nodepath from 'path';
import * as mfs from 'm-fs';

export default class GoBuidler {
  async buildAsync(
    tas: mm.TableActions[],
    outDir: string,
    dialect: Dialect,
    opts: BuildOption,
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
  }
}
