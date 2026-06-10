import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight, X, LogIn, LogOut } from 'lucide-react';

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
  present:        'px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700',
  absent:         'px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700',
  medical_leave:  'px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700',
  holiday:        'px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700',
  day_off:        'px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700',
  short_leave:    'px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700',
  not_marked_yet: 'px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500',
};

function LogsModal({ date, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/teacher/attendance/logs', { params: { date } })
      .then((r) => setLogs(r.data.logs || []))
      .catch(() => toast.error('Failed to load movements'))
      .finally(() => setLoading(false));
  }, [date]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">
            Movements — {date.split('-').reverse().join('/')}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <div className="p-5">
          {loading ? (
            <p className="text-gray-400 text-sm text-center py-4">Loading...</p>
          ) : logs.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No movement records for this date.</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log, i) => (
                <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${log.action_type === 'check_in' ? 'bg-green-50' : 'bg-orange-50'}`}>
                  {log.action_type === 'check_in'
                    ? <LogIn size={14} className="text-green-600 flex-shrink-0" />
                    : <LogOut size={14} className="text-orange-600 flex-shrink-0" />}
                  <span className={`font-medium ${log.action_type === 'check_in' ? 'text-green-700' : 'text-orange-700'}`}>
                    {log.action_type === 'check_in' ? 'Check In' : 'Check Out'}
                  </span>
                  <span className="text-gray-500 ml-auto">{format(new Date(log.timestamp), 'HH:mm')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TeacherAttendance() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [logsDate, setLogsDate] = useState(null);
  const LIMIT = 20;

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/teacher/attendance', { params: { page, limit: LIMIT } });
      setRecords(res.data.records);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  function fmtDate(val) {
    if (!val) return '-';
    return String(val).split('T')[0].split('-').reverse().join('/');
  }

  function fmtTime(val) {
    if (!val) return '-';
    return format(new Date(val), 'HH:mm');
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Attendance</h1>
        <p className="text-gray-500 text-sm">{total} records total</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="card text-center py-12">
          <CalendarDays size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No attendance records yet.</p>
        </div>
      ) : (
        <>
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Check In</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Check Out</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Remarks</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Movements</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-4 text-gray-700 font-medium">{fmtDate(r.attendance_date)}</td>
                      <td className="py-2.5 px-4">
                        <span className={STATUS_CLASSES[r.status] || STATUS_CLASSES.not_marked_yet}>
                          {STATUS_LABELS[r.status] || r.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-gray-600">{fmtTime(r.check_in_time)}</td>
                      <td className="py-2.5 px-4 text-gray-600">{fmtTime(r.check_out_time)}</td>
                      <td className="py-2.5 px-4 text-gray-500 max-w-[140px] truncate">{r.remarks || '-'}</td>
                      <td className="py-2.5 px-4">
                        {['present', 'short_leave'].includes(r.status) && (
                          <button
                            onClick={() => setLogsDate(String(r.attendance_date).split('T')[0])}
                            className="text-xs text-green-600 hover:text-green-700 font-medium underline"
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">
                  <ChevronLeft size={15} />
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {logsDate && <LogsModal date={logsDate} onClose={() => setLogsDate(null)} />}
    </div>
  );
}
