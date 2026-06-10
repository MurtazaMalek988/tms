import React, { useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { BarChart2, FileSpreadsheet, FileText, Download, Search } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';

const STATUS_LABELS = {
  present:        'Present',
  absent:         'Absent',
  medical_leave:  'Medical Leave',
  holiday:        'Holiday',
  day_off:        'Day Off',
  not_marked_yet: 'Not Marked Yet',
};

const STATUS_CLASSES = {
  present:        'badge-present',
  absent:         'badge-absent',
  medical_leave:  'badge-medical_leave',
  holiday:        'px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700',
  day_off:        'px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700',
  not_marked_yet: 'px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500',
};

export default function Reports() {
  const [reportType, setReportType] = useState('daily');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  async function fetchReport() {
    setLoading(true);
    try {
      let res;
      if (reportType === 'daily') {
        res = await api.get('/admin/reports/daily', { params: { date } });
        setSummary(res.data.summary);
      } else if (reportType === 'weekly') {
        res = await api.get('/admin/reports/weekly', { params: { end_date: date } });
        setSummary(null);
      } else {
        const [year, m] = month.split('-');
        res = await api.get('/admin/reports/monthly', { params: { year, month: m } });
        setSummary(null);
      }
      setRecords(res.data.records);
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  }

  async function handleExport(format) {
    setExportLoading(format);
    try {
      let params = {};
      if (reportType === 'daily') params = { date };
      else if (reportType === 'weekly') params = { start_date: weekStart, end_date: weekEnd };
      else {
        const [year, m] = month.split('-');
        const lastDay = new Date(year, m, 0).getDate();
        params = {
          start_date: `${year}-${String(m).padStart(2, '0')}-01`,
          end_date: `${year}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
        };
      }

      const endpoint = `/reports/export/${format}`;
      const res = await api.get(`/admin/${endpoint}`, {
        params,
        responseType: 'blob',
      });

      const contentType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const blob = new Blob([res.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_report.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Report exported as ${ext.toUpperCase()}`);
    } catch { toast.error('Export failed'); }
    finally { setExportLoading(''); }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <p className="text-gray-500 text-sm">Generate and export attendance reports</p>
      </div>

      {/* Report Controls */}
      <div className="card space-y-4">
        {/* Report Type */}
        <div>
          <label className="label">Report Type</label>
          <div className="flex gap-2 flex-wrap">
            {['daily', 'weekly', 'monthly'].map((t) => (
              <button
                key={t}
                onClick={() => { setReportType(t); setRecords([]); setSummary(null); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  reportType === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)} Report
              </button>
            ))}
          </div>
        </div>

        {/* Date selector */}
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            {reportType === 'monthly' ? (
              <>
                <label className="label">Month</label>
                <input type="month" className="input" value={month} onChange={(e) => setMonth(e.target.value)} />
              </>
            ) : (
              <>
                <label className="label">{reportType === 'weekly' ? 'Week ending' : 'Date'}</label>
                <input type="date" className="input" value={date} max={today} onChange={(e) => setDate(e.target.value)} />
                {date && <p className="text-xs text-gray-400 mt-1">{date.split('-').reverse().join('/')}</p>}
              </>
            )}
          </div>
          <button onClick={fetchReport} className="btn-primary" disabled={loading}>
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Search size={15} />Generate</>}
          </button>
        </div>
      </div>

      {/* Summary (daily only) */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(summary).map(([key, val]) => (
            <div key={key} className="card text-center py-4">
              <p className="text-2xl font-bold text-gray-800">{val}</p>
              <p className="text-xs text-gray-500 mt-1">{STATUS_LABELS[key] || key}</p>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {records.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{records.length} records</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('excel')}
                disabled={!!exportLoading}
                className="btn-secondary text-sm"
              >
                {exportLoading === 'excel' ? <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" /> : <FileSpreadsheet size={15} />}
                Excel
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={!!exportLoading}
                className="btn-secondary text-sm"
              >
                {exportLoading === 'pdf' ? <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" /> : <FileText size={15} />}
                PDF
              </button>
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Date</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Teacher</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Check In</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Check Out</th>
                    <th className="text-left py-3 px-4 text-gray-500 font-medium">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 px-4 text-gray-600">{String(r.attendance_date).split('T')[0].split('-').reverse().join('/')}</td>
                      <td className="py-2.5 px-4 font-medium text-gray-800">{r.teacher_name}</td>
                      <td className="py-2.5 px-4">
                        <span className={STATUS_CLASSES[r.status] || 'badge-not_marked'}>
                          {STATUS_LABELS[r.status] || r.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-gray-600">
                        {r.check_in_time ? format(new Date(r.check_in_time), 'HH:mm') : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-gray-600">
                        {r.check_out_time ? format(new Date(r.check_out_time), 'HH:mm') : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-gray-500 max-w-[150px] truncate">{r.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {records.length === 0 && !loading && (
        <div className="card text-center py-12">
          <BarChart2 size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Generate a report to view records</p>
        </div>
      )}
    </div>
  );
}
