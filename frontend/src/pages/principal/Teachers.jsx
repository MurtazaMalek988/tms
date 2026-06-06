import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, KeyRound, Upload, X, UserCheck, UserX } from 'lucide-react';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

const EMPTY_FORM = { name: '', mobile_number: '', username: '', password: '' };

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // 'add' | 'edit' | 'delete' | 'password' | 'import'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [newPassword, setNewPassword] = useState('');
  const [importFile, setImportFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await api.get('/admin/teachers', { params: { search } });
      setTeachers(res.data.teachers);
    } catch { toast.error('Failed to load teachers'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  function openAdd() { setForm(EMPTY_FORM); setModal('add'); }
  function openEdit(t) { setSelected(t); setForm({ name: t.name, mobile_number: t.mobile_number || '', username: t.username, password: '' }); setModal('edit'); }
  function openDelete(t) { setSelected(t); setModal('delete'); }
  function openPassword(t) { setSelected(t); setNewPassword(''); setModal('password'); }
  function closeModal() { setModal(null); setSelected(null); setForm(EMPTY_FORM); setImportFile(null); }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.name || !form.username || !form.password) return toast.error('Name, username, and password are required');
    setSubmitting(true);
    try {
      await api.post('/admin/teachers', form);
      toast.success('Teacher added successfully');
      closeModal();
      fetchTeachers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add teacher'); }
    finally { setSubmitting(false); }
  }

  async function handleEdit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/admin/teachers/${selected.id}`, {
        name: form.name,
        mobile_number: form.mobile_number,
        username: form.username,
      });
      toast.success('Teacher updated');
      closeModal();
      fetchTeachers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update teacher'); }
    finally { setSubmitting(false); }
  }

  async function handleDelete() {
    setSubmitting(true);
    try {
      await api.delete(`/admin/teachers/${selected.id}`);
      toast.success('Teacher deleted');
      closeModal();
      fetchTeachers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete teacher'); }
    finally { setSubmitting(false); }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) return toast.error('Password must be at least 4 characters');
    setSubmitting(true);
    try {
      await api.put(`/admin/teachers/${selected.id}/reset-password`, { password: newPassword });
      toast.success('Password reset successfully');
      closeModal();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to reset password'); }
    finally { setSubmitting(false); }
  }

  async function handleImport(e) {
    e.preventDefault();
    if (!importFile) return toast.error('Please select an Excel file');
    setSubmitting(true);
    const formData = new FormData();
    formData.append('file', importFile);
    try {
      const res = await api.post('/admin/teachers/import/excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(res.data.message);
      if (res.data.skipped?.length > 0) {
        toast(`${res.data.skipped.length} rows skipped`, { icon: '⚠️' });
      }
      closeModal();
      fetchTeachers();
    } catch (err) { toast.error(err.response?.data?.message || 'Import failed'); }
    finally { setSubmitting(false); }
  }

  const filtered = teachers.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Teachers</h1>
          <p className="text-gray-500 text-sm">{teachers.length} total teachers</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModal('import')} className="btn-secondary text-sm">
            <Upload size={15} /> Import Excel
          </button>
          <button onClick={openAdd} className="btn-primary text-sm">
            <Plus size={15} /> Add Teacher
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          className="input pl-9"
          placeholder="Search by name or username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">#</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Name</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Username</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Mobile</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No teachers found</td></tr>
              ) : filtered.map((t, i) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-400">{i + 1}</td>
                  <td className="py-3 px-4 font-medium text-gray-800">{t.name}</td>
                  <td className="py-3 px-4 text-gray-600 font-mono text-xs">{t.username}</td>
                  <td className="py-3 px-4 text-gray-600">{t.mobile_number || '-'}</td>
                  <td className="py-3 px-4">
                    {t.is_active
                      ? <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full"><UserCheck size={11} />Active</span>
                      : <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded-full"><UserX size={11} />Inactive</span>
                    }
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(t)} title="Edit" className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => openPassword(t)} title="Reset Password" className="p-1.5 hover:bg-yellow-50 text-yellow-600 rounded-lg transition-colors"><KeyRound size={14} /></button>
                      <button onClick={() => openDelete(t)} title="Delete" className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {modal === 'add' && (
        <Modal title="Add Teacher" onClose={closeModal}>
          <form onSubmit={handleAdd} className="space-y-4">
            <div><label className="label">Full Name *</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Teacher name" required /></div>
            <div><label className="label">Mobile Number</label><input className="input" value={form.mobile_number} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} placeholder="e.g. 03001234567" /></div>
            <div><label className="label">Username *</label><input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Login username" required /></div>
            <div>
              <label className="label">Password *</label>
              <div className="relative">
                <input 
                  type="password" 
                  className="input pr-10" 
                  value={form.password} 
                  onChange={(e) => setForm({ ...form, password: e.target.value })} 
                  placeholder="Min 4 characters" 
                  required 
                  autoComplete="new-password"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-600" title="Password hidden for security">
                  <KeyRound size={16} />
                </div>
              </div>
              {form.password && (
                <p className="text-xs text-gray-500 mt-1">✓ Password is securely masked</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                {submitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Add Teacher'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {modal === 'edit' && (
        <Modal title="Edit Teacher" onClose={closeModal}>
          <form onSubmit={handleEdit} className="space-y-4">
            <div><label className="label">Full Name</label><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label">Mobile Number</label><input className="input" value={form.mobile_number} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} /></div>
            <div><label className="label">Username</label><input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                {submitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {modal === 'delete' && (
        <Modal title="Delete Teacher" onClose={closeModal}>
          <p className="text-gray-600 mb-6">Are you sure you want to delete <strong>{selected?.name}</strong>? This will also remove all their attendance records.</p>
          <div className="flex gap-3">
            <button onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleDelete} className="btn-danger flex-1" disabled={submitting}>
              {submitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Delete'}
            </button>
          </div>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {modal === 'password' && (
        <Modal title={`Reset Password – ${selected?.name}`} onClose={closeModal}>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-xs text-yellow-800">
              <p className="font-semibold mb-1">Security Notice:</p>
              <p>Enter a new password. The field below is securely masked and will not display the password.</p>
            </div>
            <div>
              <label className="label">New Password *</label>
              <div className="relative">
                <input 
                  type="password" 
                  className="input pr-10" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="Min 4 characters" 
                  required 
                  autoComplete="new-password"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-600" title="Password hidden for security">
                  <KeyRound size={16} />
                </div>
              </div>
              {newPassword && (
                <p className="text-xs text-gray-500 mt-1">✓ Password is securely masked</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                {submitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Reset Password'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Import Modal */}
      {modal === 'import' && (
        <Modal title="Import Teachers from Excel" onClose={closeModal}>
          <form onSubmit={handleImport} className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700 space-y-1">
              <p className="font-semibold">Required Excel columns:</p>
              <p>• Teacher Name &nbsp;• Mobile Number &nbsp;• Username &nbsp;• Password</p>
            </div>
            <div>
              <label className="label">Excel File (.xlsx or .xls)</label>
              <label className="flex flex-col items-center gap-2 px-4 py-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 transition-colors">
                <Upload size={24} className="text-gray-400" />
                <span className="text-sm text-gray-500">{importFile ? importFile.name : 'Click to upload Excel file'}</span>
                <input type="file" className="hidden" accept=".xlsx,.xls" onChange={(e) => setImportFile(e.target.files[0])} />
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                {submitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Import'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
