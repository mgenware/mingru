import * as mm from 'mingru-models';
import * as mfs from 'm-fs';
import * as np from 'path';
import { promises as fs } from 'fs';
import del from 'del';
import { temporaryDirectory } from 'tempy';
import toTypeString from 'to-type-string';
import * as defs from '../def/defs.js';
import * as go from './goCodeUtil.js';
import logger from '../logger.js';
import CSQLBuilder from './csqlBuilder.js';
import { BuildOptions } from './buildOptions.js';
import * as su from '../lib/stringUtils.js';
import { AGIO } from '../io/agIO.js';
import { dedup } from '../lib/arrayUtils.js';
import AGBuilderContext from './agBuilderContext.js';
import AGBuilder from './agBuilder.js';
import { buildTSInterface } from './tsCodeBuilder.js';
import ctx from '../ctx.js';

const tableSQLDir = 'table_sql';
const migSQLDir = 'migration_sql';

export default class Builder {
  opt: BuildOptions;

  // This is a tmp dir. When build is done successfully.
  // `workingDir` contents get copied to `ourDir`.
  // If `cleanOutDir` is on, `ourDir` gets deleted before copying.
  workingDir: string;

  constructor(public outDir: string, opt?: BuildOptions) {
    // eslint-disable-next-line no-param-reassign
    opt = opt ?? {};
    logger.enabled = !opt.noOutput;
    this.opt = opt;
    this.workingDir = temporaryDirectory();
  }

  async build(source: Array<mm.ActionGroup | mm.Table>): Promise<void> {
    const { opt, workingDir, outDir } = this;

    let ags: mm.ActionGroup[] = [];
    let tables: mm.Table[] = [];
    for (const item of source) {
      if (item instanceof mm.ActionGroup) {
        ags.push(item);
        tables.push(item.__getData().groupTable);
      } else if (item instanceof mm.Table) {
        tables.push(item);
      } else {
        throw new Error(`Unknown source type ${toTypeString(item)}`);
      }
    }

    ags = dedup(ags);
    tables = dedup(
      tables.filter((t) => !t.__getData().tableParam && t instanceof mm.GhostTable === false),
    );

    await Promise.all([
      this.buildActionGroups(ags),
      this.buildCreateTableSQL(tables),
      this.buildTables(tables),
    ]);

    if (opt.cleanOutDir) {
      logger.info(`🛀  Cleaning directory "${outDir}"`);
      await del(outDir, { force: true });
    }
    await fs.cp(workingDir, this.outDir, { recursive: true });
  }

  private async buildActionGroups(groups: mm.ActionGroup[]) {
    const { opt } = this;
    if (opt.noSourceBuilding) {
      return;
    }
    const context = new AGBuilderContext();
    const outDir = this.workingDir;
    await Promise.all(
      groups.map(async (ag) => {
        const agName = defs.agInstanceName(ag);
        const agIO = new AGIO(ag, {});
        const builder = new AGBuilder(agIO, opt, context);
        const code = builder.build();
        const fileName = su.toSnakeCase(agName) + '_ag';
        const outFile = np.join(outDir, fileName + '.go');
        await mfs.writeFileAsync(outFile, code);
        if (builder.tsTypeCollector?.count) {
          const { tsOutDir } = opt;
          if (!tsOutDir) {
            throw new Error('`Options.tsOut` is required if TypeScript interfaces are used');
          }
          await Promise.all(
            builder.tsTypeCollector.values().map(async (type) => {
              logger.debug(`⛱ Building TypeScript definition "${type.name}"`);
              await mfs.writeFileAsync(
                np.join(tsOutDir, su.toCamelCase(type.name) + '.ts'),
                (this.opt.goFileHeader ?? defs.fileHeader) + type.code,
              );
            }),
          );
        }
      }),
    );

    await this.buildTypes(context);
  }

  private async buildTables(tables: mm.Table[]) {
    const { opt } = this;
    let code = `package ${opt.packageName || defs.defaultPackageName}\n\n`;
    if (tables.length) {
      code += 'import "github.com/mgenware/mingru-go-lib"\n\n';
      for (const t of tables) {
        code += `const ${defs.tableNameCode(t)} mingru.Table = ${JSON.stringify(
          ctx.dialect.encodeTableName(t),
        )}\n`;
      }
    } else {
      code += '/* No tables available. */\n';
    }
    const outFile = np.join(this.workingDir, 'tables.go');
    await mfs.writeFileAsync(outFile, (opt.goFileHeader ?? '') + code);
  }

  private async buildTypes(context: AGBuilderContext) {
    const { opt } = this;
    let code = `package ${opt.packageName || defs.defaultPackageName}\n\n`;
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

        if (opt.tsOutDir && context.hasTsResultType(name)) {
          if (firstTsMember) {
            firstTsMember = false;
          } else {
            tsCode += '\n';
          }
          tsCode += buildTSInterface(resultTypeStructData);
        }
      }

      if (opt.tsOutDir) {
        const outFile = np.join(opt.tsOutDir, 'types.ts');
        await mfs.writeFileAsync(outFile, (opt.goFileHeader ?? '') + tsCode);
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
      const outFile = np.join(this.workingDir, 'types.go');
      await mfs.writeFileAsync(outFile, (opt.goFileHeader ?? '') + code);
    }
  }

  private async buildCreateTableSQL(tables: mm.Table[]): Promise<void> {
    const { opt } = this;
    if (!opt.createTableSQL || !tables.length) {
      return;
    }
    const csqlBuilders = await Promise.all(tables.map((t) => this.buildCSQLCore(t)));

    // Generate migration up file.
    const migUpSQLFile = np.join(this.workingDir, migSQLDir, 'up.sql');
    let upSQL = opt.sqlFileHeader ?? defs.fileHeader;
    let first = true;
    for (const builder of csqlBuilders) {
      if (first) {
        first = false;
      } else {
        upSQL += '\n';
      }
      upSQL += builder.sql;
    }
    await mfs.writeFileAsync(migUpSQLFile, upSQL);

    // Generate migration down file.
    const migDownSQLFile = np.join(this.workingDir, migSQLDir, 'down.sql');
    let downSQL = opt.sqlFileHeader ?? defs.fileHeader;
    // Drop tables in reverse order.
    for (let i = tables.length - 1; i >= 0; i--) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const table = tables[i]!;
      logger.debug(`🏗 Building table SQL [${table.__getDBName()}]`);
      downSQL += `DROP TABLE IF EXISTS ${table.__getDBName()};\n`;
    }
    await mfs.writeFileAsync(migDownSQLFile, downSQL);
  }

  private async buildCSQLCore(table: mm.Table): Promise<CSQLBuilder> {
    const { opt } = this;
    let { workingDir } = this;
    workingDir = np.join(workingDir, tableSQLDir);
    const builder = new CSQLBuilder(table);
    const fileName = su.toSnakeCase(table.__getData().name);
    const outFile = np.join(workingDir, fileName + '.sql');
    const sql = builder.build(opt.sqlFileHeader);
    await mfs.writeFileAsync(outFile, sql);
    return builder;
  }
}
