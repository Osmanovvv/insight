// Утилиты для работы с авторизацией через localStorage

export interface User {
  email: string;
  name?: string;
}

export const AUTH_KEY = 'insight_user';

export const saveUser = (user: User) => {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
};

export const getUser = (): User | null => {
  const data = localStorage.getItem(AUTH_KEY);
  return data ? JSON.parse(data) : null;
};

export const removeUser = () => {
  localStorage.removeItem(AUTH_KEY);
};

export const isAuthenticated = (): boolean => {
  return getUser() !== null;
};
