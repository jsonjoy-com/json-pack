export const isErrCode = (code: unknown, error: unknown): boolean =>
  !!error && typeof error === 'object' && (error as any).code === code;
