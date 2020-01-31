export enum JSONEncodingStyle {
  none,
  camelCase,
  snakeCase,
}

export interface BuildOption {
  packageName?: string;
  noFileHeader?: boolean;
  cleanBuild?: boolean;
  noOutput?: boolean;
  jsonEncodingStyle?: JSONEncodingStyle;
}
