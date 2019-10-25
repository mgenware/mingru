export enum MemberJSONKeyStyle {
  none,
  camelCase,
  snakeCase,
}

export interface BuildOption {
  packageName?: string;
  noFileHeader?: boolean;
  cleanBuild?: boolean;
  noOutput?: boolean;
  memberJSONKeyStyle?: MemberJSONKeyStyle;
}
