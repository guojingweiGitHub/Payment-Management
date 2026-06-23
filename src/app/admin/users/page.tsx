"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/ui/app-layout";
import { useAuth } from "@/lib/auth-store";

interface UserItem {
  id: number;
  username: string;
  role: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [userList, setUserList] = useState<UserItem[]>([]);
  const [newUser, setNewUser] = useState({ username: "", password: "", role: "查看" });
  const [editId, setEditId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ username: "", password: "", role: "" });

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (res.ok) setUserList(data.data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async () => {
    if (!newUser.username || !newUser.password) {
      toast.error('用户名和密码不能为空'); return;
    }
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('用户创建成功');
      setNewUser({ username: "", password: "", role: "查看" });
      loadUsers();
    } catch (e) { toast.error(e instanceof Error ? e.message : '创建失败'); }
  };

  const handleUpdate = async (id: number) => {
    try {
      const body: Record<string, string> = {};
      if (editData.username) body.username = editData.username;
      if (editData.password) body.password = editData.password;
      if (editData.role) body.role = editData.role;
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('用户更新成功');
      setEditId(null);
      loadUsers();
    } catch (e) { toast.error(e instanceof Error ? e.message : '更新失败'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此用户？')) return;
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
    toast.success('用户已删除');
    loadUsers();
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Button variant="outline" onClick={() => router.push('/')} className="mb-4">返回台账</Button>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>账号管理</CardTitle>
            </CardHeader>
            <CardContent>
              {userList.length === 0 ? (
                <p className="text-gray-400 text-sm">暂无用户</p>
              ) : (
                <div className="space-y-2">
                  {userList.map((u) => (
                    <div key={u.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                      {editId === u.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <Input className="w-32" size={1} value={editData.username} placeholder="用户名"
                            onChange={e => setEditData({...editData, username: e.target.value})} />
                          <Input className="w-32" type="password" placeholder="新密码（留空不变）"
                            value={editData.password}
                            onChange={e => setEditData({...editData, password: e.target.value})} />
                          <Select value={editData.role} onValueChange={v => setEditData({...editData, role: v})}>
                            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">管理员</SelectItem>
                              <SelectItem value="编辑">编辑</SelectItem>
                              <SelectItem value="查看">查看</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" onClick={() => handleUpdate(u.id)}>保存</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditId(null)}>取消</Button>
                        </div>
                      ) : (
                        <>
                          <span className="text-sm">
                            {u.username}
                            <span className={`ml-2 text-xs px-1 py-0.5 rounded ${
                              u.role === 'admin' ? 'bg-red-100 text-red-700' :
                              u.role === '编辑' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
                            }`}>{u.role}</span>
                          </span>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => {
                              setEditId(u.id);
                              setEditData({ username: u.username, password: "", role: u.role });
                            }}>编辑</Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(u.id)}>删除</Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>新增用户</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <Input placeholder="用户名" value={newUser.username}
                  onChange={e => setNewUser({...newUser, username: e.target.value})} />
                <Input type="password" placeholder="密码" value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})} />
                <Select value={newUser.role} onValueChange={v => setNewUser({...newUser, role: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">管理员</SelectItem>
                    <SelectItem value="编辑">编辑</SelectItem>
                    <SelectItem value="查看">查看</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={!newUser.username || !newUser.password}>创建用户</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
