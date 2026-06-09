import { TokenRequest, TokenResponse, UserRegistrationRequest, UserRegistrationResponse } from '../types/api';
import { API_CONFIG } from './config';
import { request } from './client';
import { mockLogin, mockRegister } from './mock';

export async function register(data: UserRegistrationRequest): Promise<UserRegistrationResponse> {
  if (API_CONFIG.useMock) return mockRegister(data);
  return request<UserRegistrationResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function login(data: TokenRequest): Promise<TokenResponse> {
  if (API_CONFIG.useMock) return mockLogin(data);
  return request<TokenResponse>('/auth/token', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
