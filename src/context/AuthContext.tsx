/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V1 - Authentication & Session Context (V19 Timeout & Recovery Guarded)
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/index.ts';
import { ApiClient } from '../services/apiClient.ts';

interface AuthContextType {
  currentUser: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  authError: string | null;
  availableUsers: UserProfile[];
  switchUser: (userId: string) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  login: (email: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchUsersAndSession = async () => {
    try {
      setIsLoading(true);
      setAuthError(null);
      const users = await ApiClient.getUsers();
      setAvailableUsers(users);

      const savedUserId = localStorage.getItem('aros_active_user_id');
      const matched = users.find((u) => u.id === savedUserId);

      if (matched) {
        setCurrentUser(matched);
      } else if (users.length > 0) {
        const farmer = users.find((u) => u.role === 'FARMER') || users[0];
        setCurrentUser(farmer);
        localStorage.setItem('aros_active_user_id', farmer.id);
      }
    } catch (err: any) {
      console.error('Failed to load initial users:', err);
      setAuthError(err?.message || 'Unable to connect to ECONEX API server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndSession();
  }, []);

  const switchUser = async (userId: string) => {
    const user = availableUsers.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('aros_active_user_id', user.id);
    }
  };

  const switchRole = async (targetRole: UserRole) => {
    const targetUser = availableUsers.find((u) => u.role === targetRole);
    if (targetUser) {
      setCurrentUser(targetUser);
      localStorage.setItem('aros_active_user_id', targetUser.id);
    }
  };

  const login = async (email: string) => {
    const res = await ApiClient.login({ email });
    setCurrentUser(res.user);
    localStorage.setItem('aros_active_user_id', res.user.id);
    await fetchUsersAndSession();
  };

  const register = async (data: any) => {
    const res = await ApiClient.register(data);
    setCurrentUser(res.user);
    localStorage.setItem('aros_active_user_id', res.user.id);
    await fetchUsersAndSession();
  };

  const logout = () => {
    const farmer = availableUsers.find((u) => u.role === 'FARMER');
    if (farmer) {
      setCurrentUser(farmer);
      localStorage.setItem('aros_active_user_id', farmer.id);
    }
  };

  const role = currentUser ? currentUser.role : 'FARMER';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isLoading,
        authError,
        availableUsers,
        switchUser,
        switchRole,
        login,
        register,
        logout,
        refreshUsers: fetchUsersAndSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
