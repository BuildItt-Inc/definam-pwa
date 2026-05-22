export type ApiResponse<T = unknown> = {
  data?: T;
  error?: string;
};
