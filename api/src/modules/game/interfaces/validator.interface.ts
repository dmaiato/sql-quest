export interface IChallengeValidator {
  validate(
    userResult: any[],
    expectedResult: any[],
  ): { success: boolean; message: string };
}
