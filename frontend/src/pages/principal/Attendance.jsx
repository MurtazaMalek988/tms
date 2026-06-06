import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Search, Filter, Edit2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const STATUSES = ['present', 'absent', 'short_leave', 'medical_leave'];

const STATUS_LABELS = {
  present: 'Present',
  absent: 'Absent',
  short_leave: 'Short Leave',
  medical_leave: 'Medical Leave',
};

function StatusBadge({ status }) {
  const classes = {
    present: 'badge-present',
    absent: 'badge-absent',
    short_leave: 'badge-short_leave',
    medical_leave: 'badge-medical_leave',
  };
  return <span className={classes[status] || 'badge-not_marked'}>{STATUS_LABELS[status] || status}</span>;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    status: '',
    search: '',
  });
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({ status: '', remarks: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/attendance', {
        params: { ...filters, page, limit: 20 },
      });
      setRecords(res.data.attendance);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch { toast.error('Failed to load attendance records'); }
    finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  function openEdit(record) {
    setEditModal(record);
    setEditForm({ status: record.status, remarks: record.remarks || '' });
  }

  async function handleEdit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/admin/attendance/${editModal.id}`, editForm);
      toast.success('Attendance updated');
      setEditModal(null);
      fetchRecords();
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setSubmitting(false); }
  }

  function handleFilterChange(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Attendance Records</h1>
        <p className="text-gray-500 text-sm">{total} records found</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Filter size={15} className="text-gray-400 flex-shrink-0" />
            <input
              type="date"
              className="input text-sm"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
            />
          </div>
          <select
            className="input text-sm flex-1"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="input pl-8 text-sm"
              placeholder="Search teacher..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <button
            onClick={() => { setFilters({ date: '', status: '', search: '' }); setPage(1); }}
            className="btn-secondary text-sm flex-shrink-0"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Teacher</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Check In</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Check Out</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Remarks</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">Edit</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No records found</td></tr>
              ) : records.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-800">{r.teacher_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{r.username}</p>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {r.attendance_date ? String(r.attendance_date).split('T')[0] : '-'}
                  </td>
                  <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                  <td className="py-3 px-4 text-gray-600">
                    {r.check_in_time ? format(new Date(r.check_in_time), 'hh:mm a') : '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {r.check_out_time ? format(new Date(r.check_out_time), 'hh:mm a') : '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-500 max-w-[150px] truncate">{r.remarks || '-'}</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors">
                      <Edit2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-xs py-1 px-2 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary text-xs py-1 px-2 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <Modal title={`Edit Attendance – ${editModal.teacher_name}`} onClose={() => setEditModal(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
              <p>Date: <strong>{String(editModal.attendance_date).split('T')[0]}</strong></p>
              <p>Current Status: <strong>{STATUS_LABELS[editModal.status]}</strong></p>
            </div>
            <div>
              <label className="label">New Status</label>
              <select className="input" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Remarks</label>
              <textarea className="input h-20 resize-none" value={editForm.remarks} onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })} placeholder="Add remarks (optional)" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1" disabled={submitting}>
                {submitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
