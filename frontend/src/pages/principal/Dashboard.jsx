import React, { useEffect, useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Users, CheckCircle2, XCircle, Stethoscope, AlertCircle, RefreshCw, Sun, Umbrella } from 'lucide-react';
import { format } from 'date-fns';

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={22} className={color} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

const STATUS_BADGE = {
  present:       <span className="badge-present">Present</span>,
  absent:        <span className="badge-absent">Absent</span>,
  medical_leave: <span className="badge-medical_leave">Medical Leave</span>,
  holiday:       <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Holiday</span>,
  day_off:       <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">Day Off</span>,
};

export default function PrincipalDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await api.get('/admin/dashboard');
      setData(res.data);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchStats(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { stats, recentActivity } = data || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">{format(new Date(), 'EEEE, dd/MM/yyyy')}</p>
        </div>
        <button onClick={fetchStats} className="btn-secondary text-sm">
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard label="Total Teachers" value={stats?.totalTeachers ?? 0} icon={Users}        color="text-slate-700"   bg="bg-slate-100" />
        <StatCard label="Present"        value={stats?.present      ?? 0} icon={CheckCircle2}  color="text-green-600"   bg="bg-green-100" />
        <StatCard label="Absent"         value={stats?.absent       ?? 0} icon={XCircle}       color="text-red-600"     bg="bg-red-100" />
        <StatCard label="Medical Leave"  value={stats?.medicalLeave ?? 0} icon={Stethoscope}   color="text-blue-600"    bg="bg-blue-100" />
        <StatCard label="Holiday"        value={stats?.holiday      ?? 0} icon={Umbrella}      color="text-purple-600"  bg="bg-purple-100" />
        <StatCard label="Day Off"        value={stats?.dayOff       ?? 0} icon={Sun}           color="text-indigo-600"  bg="bg-indigo-100" />
        <StatCard label="Not Marked Yet" value={stats?.notMarked    ?? 0} icon={AlertCircle}   color="text-gray-500"    bg="bg-gray-100" />
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Today's Recent Activity</h2>
        {recentActivity?.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No activity recorded yet today.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Teacher</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Check In</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">Check Out</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity?.map((a, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-gray-800">{a.teacher_name}</td>
                    <td className="py-2.5 px-3">{STATUS_BADGE[a.status] || <span className="badge-not_marked">-</span>}</td>
                    <td className="py-2.5 px-3 text-gray-600">
                      {a.check_in_time ? format(new Date(a.check_in_time), 'HH:mm') : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600">
                      {a.check_out_time ? format(new Date(a.check_out_time), 'HH:mm') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
