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
  fileHeader?: string;
  cleanBuild?: boolean;
  noOutput?: boolean;
  jsonEncoding?: JSONEncodingOptions;
  noColumnAlias?: boolean;
}
