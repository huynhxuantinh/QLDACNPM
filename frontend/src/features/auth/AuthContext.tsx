import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { api, tokenStore } from "../../api";
import type { User } from "../../types";

interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenStore.getAccess()) {
      setLoading(false);
      return;
    }
    api.me().then(setUser).catch(tokenStore.clear).finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    tokenStore.set(data.access, data.refresh);
    setUser(data.user);
  };

  const logout = async () => {
    const refresh = tokenStore.getRefresh();
    try {
      if (refresh) await api.logout(refresh);
    } finally {
      tokenStore.clear();
      setUser(null);
    }
  };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

