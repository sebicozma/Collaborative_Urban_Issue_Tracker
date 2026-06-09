import { TokenRequest, TokenResponse, UserRegistrationRequest, UserRegistrationResponse } from '../../types/api';
import { ApiError } from '../client';
import { generateId, getUsers, MockUser, saveUsers } from './store';

export async function mockRegister(data: UserRegistrationRequest): Promise<UserRegistrationResponse> {
  const users = await getUsers();

  if (users.find((u) => u.email === data.email)) {
    throw new ApiError(409, { type: 'conflict', title: 'Email already registered', status: 409 });
  }

  const user: MockUser = {
    userId: generateId(),
    email: data.email,
    password: data.password, // plain-text is fine for a local mock
    fullName: data.fullName,
    role: data.role,
    createdAt: new Date().toISOString(),
  };

  await saveUsers([...users, user]);

  return { userId: user.userId, email: user.email, role: user.role, createdAt: user.createdAt };
}

export async function mockLogin(data: TokenRequest): Promise<TokenResponse> {
  const users = await getUsers();
  const user = users.find((u) => u.email === data.email && u.password === data.password);

  if (!user) {
    throw new ApiError(401, { type: 'unauthorized', title: 'Invalid email or password', status: 401 });
  }

  return {
    accessToken: `mock_token_${user.userId}`,
    tokenType: 'Bearer',
    expiresIn: 3600,
  };
}
