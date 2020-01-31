export enum JSONEncodingStyle {
  none,
  camelCase,
  snakeCase,
}

export interface BuildOptions {
  packageName?: string;
  noFileHeader?: boolean;
  cleanBuild?: boolean;
  noOutput?: boolean;
  jsonEncodingStyle?: JSONEncodingStyle;
}
