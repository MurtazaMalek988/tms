import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Umbrella } from 'lucide-react';
import { format } from 'date-fns';

const HOLIDAY_TYPES = [
  { value: 'public_holiday',   label: 'Public Holiday' },
  { value: 'summer_vacation',  label: 'Summer Vacation' },
  { value: 'school_closure',   label: 'School Closure' },
  { value: 'special_holiday',  label: 'Special Holiday' },
];

const TYPE_LABELS = Object.fromEntries(HOLIDAY_TYPES.map((t) => [t.value, t.label]));

const EMPTY_FORM = { holiday_name: '', holiday_type: 'public_holiday', start_date: '', end_date: '', description: '' };

function dayCount(start, end) {
  if (!start || !end) return 0;
  const diff = new Date(end) - new Date(start);
  return Math.max(0, Math.floor(diff / 86400000) + 1);
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

function HolidayForm({ initial, onSubmit, onClose, submitting }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.holiday_name || !form.start_date || !form.end_date) {
      toast.error('Name, start date and end date are required');
      return;
    }
    if (new Date(form.start_date) > new Date(form.end_date)) {
      toast.error('Start date cannot be after end date');
      return;
    }
    onSubmit(form);
  }

  const days = dayCount(form.start_date, form.end_date);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Holiday Name</label>
        <input className="input" placeholder="e.g. National Day" value={form.holiday_name}
          onChange={(e) => set('holiday_name', e.target.value)} />
      </div>
      <div>
        <label className="label">Holiday Type</label>
        <select className="input" value={form.holiday_type} onChange={(e) => set('holiday_type', e.target.value)}>
          {HOLIDAY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Start Date</label>
          <input type="date" className="input" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
        </div>
        <div>
          <label className="label">End Date</label>
          <input type="date" className="input" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} />
        </div>
      </div>
      {days > 0 && (
        <p className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">{days} day{days > 1 ? 's' : ''}</p>
      )}
      <div>
        <label className="label">Description (optional)</label>
        <textarea className="input h-20 resize-none" placeholder="Additional notes..."
          value={form.description} onChange={(e) => set('description', e.target.value)} />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" className="btn-primary flex-1" disabled={submitting}>
          {submitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save'}
        </button>
      </div>
    </form>
  );
}

function formatDateDisplay(val) {
  if (!val) return '-';
  return String(val).split('T')[0].split('-').reverse().join('/');
}

function formatDateForInput(val) {
  if (!val) return '';
  return String(val).split('T')[0];
}

export default function Holidays() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/holidays', { params: { year } });
      setHolidays(res.data.holidays);
    } catch {
      toast.error('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

  async function handleAdd(form) {
    setSubmitting(true);
    try {
      await api.post('/admin/holidays', form);
      toast.success('Holiday added');
      setAddOpen(false);
      fetchHolidays();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add holiday');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(form) {
    setSubmitting(true);
    try {
      await api.put(`/admin/holidays/${editTarget.id}`, form);
      toast.success('Holiday updated');
      setEditTarget(null);
      fetchHolidays();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update holiday');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    try {
      await api.delete(`/admin/holidays/${deleteTarget.id}`);
      toast.success('Holiday deleted');
      setDeleteTarget(null);
      fetchHolidays();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete holiday');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Holidays</h1>
          <p className="text-gray-500 text-sm">{holidays.length} configured for {year}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="input text-sm py-2 w-28"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
          >
            {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => setAddOpen(true)} className="btn-primary text-sm">
            <Plus size={16} /> Add Holiday
          </button>
        </div>
      </div>

      {/* Weekly off info banner */}
      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-sm text-indigo-700">
        <strong>Weekly Off Days:</strong> Friday &amp; Saturday — automatically marked as Day Off for all teachers.
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Holiday Name</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Type</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Start Date</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">End Date</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Days</th>
                <th className="text-left py-3 px-4 text-gray-500 font-medium">Description</th>
                <th className="text-right py-3 px-4 text-gray-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading...</td></tr>
              ) : holidays.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <Umbrella size={32} className="mx-auto mb-2 opacity-30" />
                    No holidays configured for {year}
                  </td>
                </tr>
              ) : holidays.map((h) => (
                <tr key={h.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-800">{h.holiday_name}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      {TYPE_LABELS[h.holiday_type] || h.holiday_type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{formatDateDisplay(h.start_date)}</td>
                  <td className="py-3 px-4 text-gray-600">{formatDateDisplay(h.end_date)}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {dayCount(formatDateForInput(h.start_date), formatDateForInput(h.end_date))}
                  </td>
                  <td className="py-3 px-4 text-gray-500 max-w-[160px] truncate">{h.description || '-'}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditTarget(h)}
                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(h)}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {addOpen && (
        <Modal title="Add Holiday" onClose={() => setAddOpen(false)}>
          <HolidayForm onSubmit={handleAdd} onClose={() => setAddOpen(false)} submitting={submitting} />
        </Modal>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <Modal title="Edit Holiday" onClose={() => setEditTarget(null)}>
          <HolidayForm
            initial={{
              holiday_name: editTarget.holiday_name,
              holiday_type: editTarget.holiday_type,
              start_date: formatDateForInput(editTarget.start_date),
              end_date: formatDateForInput(editTarget.end_date),
              description: editTarget.description || '',
            }}
            onSubmit={handleEdit}
            onClose={() => setEditTarget(null)}
            submitting={submitting}
          />
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <Modal title="Delete Holiday" onClose={() => setDeleteTarget(null)}>
          <p className="text-gray-600 mb-5">
            Are you sure you want to delete <strong>{deleteTarget.holiday_name}</strong>?
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleDelete} disabled={submitting}
              className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50">
              {submitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto block" /> : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
