window.__roleCache = window.__roleCache || { value: null, expiresAt: 0 };

async function getCachedRole(force = false) {
  const now = Date.now();
  if (!force && window.__roleCache.value && window.__roleCache.expiresAt > now) return window.__roleCache.value;
  const { data: userData } = await getCachedUser();
  const user = userData?.user;
  if (!user) return null;
  const { data, error } = await supabaseClient.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (error) return null;
  const role = data?.role || 'user';
  window.__roleCache = { value: role, expiresAt: now + 15000 };
  return role;
}

async function requireAuth() {
  const { data, error } = await getCachedSession();
  if (error || !data.session) {
    window.location.href = window.location.pathname.includes('/admin/') || window.location.pathname.includes('/courier/') ? '../login.html' : './login.html';
    return null;
  }
  return data.session;
}

async function requireRole(roleName) {
  const session = await requireAuth();
  if (!session) return false;
  const role = await getCachedRole();
  if (role !== roleName) {
    window.location.href = window.location.pathname.includes('/admin/') || window.location.pathname.includes('/courier/') ? '../index.html' : './index.html';
    return false;
  }
  return true;
}

async function redirectAfterLogin() {
  const role = await getCachedRole(true);
  if (role === 'admin') return window.location.href = './admin/index.html';
  if (role === 'courier') return window.location.href = './courier/index.html';
  window.location.href = './index.html';
}
