export enum JSONEncodingStyle {
  none,
  camelCase,
  snakeCase,
}

export interface JSONEncodingOptions {
  encodingStyle?: JSONEncodingStyle;
  excludeEmptyValues?: boolean;
}

export interface BuildOptions {
  packageName?: string;
  noFileHeader?: boolean;
  cleanBuild?: boolean;
  noOutput?: boolean;
  jsonEncoding?: JSONEncodingOptions;
}
