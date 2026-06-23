"use client";

import { useAuth } from "@/lib/auth-store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== 'undefined') window.location.replace('/login');
    return null;
  }

  const isAdmin = user.role === 'admin';
  const isEditor = user.role === 'admin' || user.role === '编辑';

  return (
    <>
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
    </>
  );
}
