"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface AuthUser {
  id: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  logout: () => void;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
  isAdmin: false,
  isEditor: false,
  isViewer: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  if (!user) {
    // 未登录，直接跳转登录页
    if (typeof window !== 'undefined') {
      window.location.replace('/login');
    }
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        isAdmin: user.role === 'admin',
        isEditor: user.role === '编辑' || user.role === 'admin',
        isViewer: user.role === '查看',
      }}
    >
      <div className="bg-white border-b px-6 py-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">未缴费台账管理系统</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {user.username}
            <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
              user.role === 'admin' ? 'bg-red-100 text-red-700' :
              user.role === '编辑' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
            }`}>{user.role}</span>
          </span>
          <button onClick={logout} className="text-xs text-gray-500 hover:text-red-600">退出</button>
        </div>
      </div>
      {children}
    </AuthContext.Provider>
  );
}
