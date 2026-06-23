"use client";

import { useState, useEffect, useSyncExternalStore } from "react";

interface AuthUser {
  id: number;
  username: string;
  role: string;
}

// 全局单例 —— 缓存 snapshot 避免每次返回新对象导致死循环
let _user: AuthUser | null = null;
let _loading = true;
const _listeners = new Set<() => void>();
let _snap: { user: AuthUser | null; loading: boolean } = { user: null, loading: true };

function notify() {
  _snap = { user: _user, loading: _loading };
  _listeners.forEach(fn => fn());
}

function subscribe(cb: () => void) {
  _listeners.add(cb);
  return () => { _listeners.delete(cb); };
}

function getSnapshot() {
  return _snap;
}

let _init = false;
function init() {
  if (_init) return;
  _init = true;
  fetch('/api/auth/me')
    .then(async (r) => {
      if (r.ok) {
        const data = await r.json();
        _user = data.user;
      } else {
        _user = null;
      }
    })
    .catch(() => { _user = null; })
    .finally(() => {
      _loading = false;
      notify();
    });
}

export function useAuth(): { user: AuthUser | null; loading: boolean; logout: () => void } {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => { init(); }, []);

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST' });
    _user = null;
    _loading = false;
    notify();
    window.location.replace('/login');
  };

  return { user: snap.user, loading: snap.loading, logout };
}
