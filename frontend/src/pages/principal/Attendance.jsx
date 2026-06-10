import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Search, Filter, Edit2, X, ChevronLeft, ChevronRight, List, MapPin } from 'lucide-react';
import { format } from 'date-fns';

const STATUSES = ['present', 'absent', 'medical_leave', 'holiday', 'day_off', 'short_leave', 'not_marked_yet'];
const EDIT_STATUSES = ['present', 'absent', 'medical_leave', 'holiday', 'day_off', 'short_leave'];

const STATUS_LABELS = {
  present:        'Present',
  absent:         'Absent',
  medical_leave:  'Medical Leave',
  holiday:        'Holiday',
  day_off:        'Day Off',
  short_leave:    'Short Leave',
  not_marked_yet: 'Not Marked Yet',
};

const STATUS_CLASSES = {
  present:        'badge-present',
  absent:         'badge-absent',
  medical_leave:  'badge-medical_leave',
  holiday:        'px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700',
  day_off:        'px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700',
  short_leave:    'px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700',
  not_marked_yet: 'px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500',
};

function StatusBadge({ status }) {
  return <span className={STATUS_CLASSES[status] || 'badge-not_marked'}>{STATUS_LABELS[status] || status}</span>;
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

function LogsModal({ record, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const res = await api.get('/admin/attendance/logs', {
          params: {
            teacher_id: record.teacher_id,
            date: String(record.attendance_date).split('T')[0],
          },
        });
        setLogs(res.data.logs || []);
      } catch {
        toast.error('Failed to load movement logs');
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [record]);

  return (
    <Modal title={`Movement Log — ${record.teacher_name}`} onClose={onClose}>
      <p className="text-xs text-gray-500 mb-3">
        Date: <strong>{String(record.attendance_date).split('T')[0].split('-').reverse().join('/')}</strong>
      </p>
      {loading ? (
        <p className="text-gray-400 text-sm text-center py-4">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">No movement records found.</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log, i) => (
            <div key={i} className={`px-3 py-2 rounded-lg text-sm ${log.action_type === 'check_in' ? 'bg-green-50' : 'bg-orange-50'}`}>
              <div className="flex items-center justify-between">
                <span className={`font-medium ${log.action_type === 'check_in' ? 'text-green-700' : 'text-orange-700'}`}>
                  {log.action_type === 'check_in' ? 'Check In' : 'Check Out'}
                </span>
                <span className="text-gray-600">{format(new Date(log.timestamp), 'HH:mm')}</span>
              </div>
              {log.latitude && log.longitude && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <MapPin size={10} />
                  {parseFloat(log.latitude).toFixed(6)}, {parseFloat(log.longitude).toFixed(6)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
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
  const [logsModal, setLogsModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/attendance', { params: { ...filters, page, limit: 20 } });
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

  function formatDate(val) {
    if (!val) return '-';
    return String(val).split('T')[0].split('-').reverse().join('/');
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
          <div className="flex flex-col gap-1 flex-1">
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-gray-400 flex-shrink-0" />
              <input
                type="date"
                className="input text-sm flex-1"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
              />
            </div>
            {filters.date && (
              <p className="text-xs text-gray-400 pl-5">{formatDate(filters.date)}</p>
            )}
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
                <th className="text-right py-3 px-4 text-gray-500 font-medium">Actions</th>
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
                  <td className="py-3 px-4 text-gray-600">{formatDate(r.attendance_date)}</td>
                  <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                  <td className="py-3 px-4 text-gray-600">
                    {r.check_in_time ? format(new Date(r.check_in_time), 'HH:mm') : '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {r.check_out_time ? format(new Date(r.check_out_time), 'HH:mm') : '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-500 max-w-[140px] truncate">{r.remarks || '-'}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setLogsModal(r)}
                        className="p-1.5 hover:bg-gray-100 text-gray-500 rounded-lg transition-colors"
                        title="View movement logs"
                      >
                        <List size={14} />
                      </button>
                      <button
                        onClick={() => openEdit(r)}
                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary text-xs py-1 px-2 disabled:opacity-40"><ChevronLeft size={14} /></button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="btn-secondary text-xs py-1 px-2 disabled:opacity-40"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModal && (
        <Modal title={`Edit Attendance — ${editModal.teacher_name}`} onClose={() => setEditModal(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
              <p>Date: <strong>{formatDate(editModal.attendance_date)}</strong></p>
              <p>Current Status: <strong>{STATUS_LABELS[editModal.status] || editModal.status}</strong></p>
            </div>
            <div>
              <label className="label">New Status</label>
              <select className="input" value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                {EDIT_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Remarks</label>
              <textarea
                className="input h-20 resize-none"
                value={editForm.remarks}
                onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                placeholder="Add remarks (optional) — e.g. Arrived Late, Official Duty, Excused Absence"
              />
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

      {/* Logs Modal */}
      {logsModal && <LogsModal record={logsModal} onClose={() => setLogsModal(null)} />}
    </div>
  );
}
