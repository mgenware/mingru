export function capitalizeFirstLetter(s: string): string {
  if (!s) {
    return s;
  }
  return s.charAt(0).toUpperCase() + s.substr(1);
}

export function capitalizeColumnName(name: string): string {
  if (name === 'id') {
    return 'ID';
  }
  return capitalizeFirstLetter(name);
}
