export enum JSONKeyStyle {
  camelCase,
  snakeCase,
}

export interface JSONTagsOptions {
  keyStyle: JSONKeyStyle;
  excludeEmptyValues?: boolean;
}

export interface BuildOptions {
  packageName?: string;
  goFileHeader?: string;
  sqlFileHeader?: string;
  cleanOutDir?: boolean;
  noOutput?: boolean;
  jsonTags?: JSONTagsOptions;
  tsOutDir?: string;
}
