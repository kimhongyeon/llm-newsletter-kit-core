export const ensureStringArray = (value: string | string[]): string[] => {
  return typeof value === 'string' ? [value] : value;
};
