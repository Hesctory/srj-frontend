export type UserData = {
  id: number;
  name: string;
  email: string;
  phone: string;
  roles: string[];
};

export type LoginResponse = {
  success: boolean;
  token: string;
  user: UserData | null;
  error: string | null;
};
