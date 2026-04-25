export type TSignUpPayload = {
  fullName: string;
  email: string;
  password: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
};

export type TSignInPayload = {
  email: string;
  password: string;
};

export type TRefreshTokenPayload = {
  refreshToken: string;
};