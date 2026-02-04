export type Tokens = {
  access_token: string;
  refresh_token: string;
};

export type JwtPayload = {
  sub: string;
  email: string;
  rt_id?: string;
};
