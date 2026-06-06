export const ADMIN_LOGIN = '/admin/login';
export const TEACHER_LOGIN = '/teacher/login';

export function getLoginPath(role) {
  return role === 'teacher' ? TEACHER_LOGIN : ADMIN_LOGIN;
}

export function getLoginPathFromLocation() {
  const path = window.location.pathname;
  if (path.startsWith('/teacher')) return TEACHER_LOGIN;
  if (path.startsWith('/admin') || path.startsWith('/principal')) return ADMIN_LOGIN;

  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user?.role) return getLoginPath(user.role);
  } catch {
    // ignore invalid stored user
  }

  return ADMIN_LOGIN;
}
