export interface CsonEncoderOptions {
  /**
   * Number of spaces to use for indentation.
   * @default 2
   */
  indent?: number;

  /**
   * Whether to include comments in the output.
   * @default false
   */
  includeComments?: boolean;
}
