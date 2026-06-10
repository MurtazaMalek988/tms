import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api';
import toast from 'react-hot-toast';
import { LogIn, LogOut, Stethoscope, MapPin, Clock, CheckCircle2, XCircle, AlertCircle, Upload, Sun, Umbrella } from 'lucide-react';
import { format } from 'date-fns';
import useGeolocation from '../../hooks/useGeolocation';
import { getPremisesStatus } from '../../utils/geofence';

const STATUS_CONFIG = {
  not_marked_yet: { label: 'Not Marked Yet', color: 'bg-gray-100 text-gray-600', icon: AlertCircle },
  present:        { label: 'Present',         color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  absent:         { label: 'Absent',           color: 'bg-red-100 text-red-700',    icon: XCircle },
  medical_leave:  { label: 'Medical Leave',    color: 'bg-blue-100 text-blue-700',  icon: Stethoscope },
  holiday:        { label: 'Holiday',          color: 'bg-purple-100 text-purple-700', icon: Umbrella },
  day_off:        { label: 'Day Off',          color: 'bg-indigo-100 text-indigo-700', icon: Sun },
};

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [medLeaveOpen, setMedLeaveOpen] = useState(false);
  const [medForm, setMedForm] = useState({ remarks: '', certificate: null, start_date: '', end_date: '' });
  const [geofence, setGeofence] = useState(null);
  const { loc, locError, locLoading, getLocation, useTestLocation } = useGeolocation();

  const today = format(new Date(), 'yyyy-MM-dd');
  const premises = getPremisesStatus(loc, geofence);
  const locationRequired = geofence?.enabled;
  const canMarkAttendanceHere = !locationRequired || (loc && premises.withinPremises);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/teacher/attendance/today');
      setAttendance(res.data.attendance);
      setLogs(res.data.logs || []);
      setGeofence(res.data.geofence);
    } catch {
      toast.error('Failed to load attendance status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);
  useEffect(() => { getLocation().catch(() => {}); }, [getLocation]);

  async function handleCheckIn() {
    setActionLoading(true);
    try {
      const coords = await getLocation();
      await api.post('/teacher/checkin', coords);
      toast.success('Checked in successfully!');
      fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut() {
    setActionLoading(true);
    try {
      const coords = await getLocation();
      const res = await api.post('/teacher/checkout', coords);
      toast.success(res.data.message);
      fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMedicalLeave(e) {
    e.preventDefault();
    setActionLoading(true);
    try {
      const formData = new FormData();
      if (medForm.remarks) formData.append('remarks', medForm.remarks);
      if (medForm.certificate) formData.append('certificate', medForm.certificate);
      if (medForm.start_date) formData.append('start_date', medForm.start_date);
      if (medForm.end_date) formData.append('end_date', medForm.end_date);
      const res = await api.post('/teacher/medical-leave', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(res.data.message);
      setMedLeaveOpen(false);
      setMedForm({ remarks: '', certificate: null, start_date: '', end_date: '' });
      fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply medical leave');
    } finally {
      setActionLoading(false);
    }
  }

  const status = attendance?.status || 'not_marked_yet';
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_marked_yet;
  const StatusIcon = cfg.icon;

  // Multiple check-in/out: derive ability from last log action
  const lastAction = logs.length > 0 ? logs[logs.length - 1].action_type : null;
  const isRestrictedDay = ['day_off', 'holiday', 'medical_leave'].includes(status);
  const canCheckIn  = !isRestrictedDay && lastAction !== 'check_in';
  const canCheckOut = lastAction === 'check_in';
  const canMedLeave = !attendance?.check_in_time && !['medical_leave', 'day_off', 'holiday'].includes(status);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Good day, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-gray-500 mt-1">{format(new Date(), 'EEEE, dd/MM/yyyy')}</p>
      </div>

      {/* Status card */}
      <div className="card">
        <h2 className="text-sm font-medium text-gray-500 mb-3">Today's Status</h2>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${cfg.color}`}>
          <StatusIcon size={16} />
          {cfg.label}
          {status === 'holiday' && attendance?.holiday_name && ` — ${attendance.holiday_name}`}
        </div>

        {attendance?.check_in_time && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 flex items-center gap-1"><Clock size={12} /> First Check In</p>
              <p className="text-sm font-semibold text-gray-800 mt-1">
                {format(new Date(attendance.check_in_time), 'HH:mm')}
              </p>
            </div>
            {attendance.check_out_time && (
              <div className={`rounded-lg p-3 ${lastAction === 'check_in' ? 'bg-gray-50 opacity-50' : 'bg-gray-50'}`}>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock size={12} /> Last Check Out {lastAction === 'check_in' && '(re-entered)'}
                </p>
                <p className="text-sm font-semibold text-gray-800 mt-1">
                  {format(new Date(attendance.check_out_time), 'HH:mm')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Movement log */}
      {logs.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-medium text-gray-500 mb-3">Today's Movements</h2>
          <div className="space-y-2">
            {logs.map((log, i) => (
              <div key={i} className={`flex items-center gap-3 text-sm px-3 py-2 rounded-lg ${log.action_type === 'check_in' ? 'bg-green-50' : 'bg-orange-50'}`}>
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
        </div>
      )}

      {/* Actions */}
      <div className="card space-y-3">
        <h2 className="text-sm font-medium text-gray-500 mb-1">Actions</h2>

        <button
          onClick={handleCheckIn}
          disabled={!canCheckIn || actionLoading || locLoading || !canMarkAttendanceHere}
          className="btn-success w-full py-3 text-base"
          title={!canMarkAttendanceHere ? 'You must be on school premises to check in' : undefined}
        >
          {actionLoading || locLoading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <><LogIn size={20} /> Check In</>
          )}
        </button>

        <button
          onClick={handleCheckOut}
          disabled={!canCheckOut || actionLoading || locLoading || !canMarkAttendanceHere}
          className="btn-warning w-full py-3 text-base"
          title={!canMarkAttendanceHere ? 'You must be on school premises to check out' : undefined}
        >
          {actionLoading || locLoading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <><LogOut size={20} /> Check Out</>
          )}
        </button>

        <button
          onClick={() => setMedLeaveOpen(true)}
          disabled={!canMedLeave || actionLoading}
          className="btn-primary w-full py-3 text-base bg-blue-500 hover:bg-blue-600"
        >
          <Stethoscope size={20} />
          Apply Medical Leave
        </button>
      </div>

      {/* Location & premises */}
      <div className={`p-3 rounded-lg border ${
        locError
          ? 'bg-red-50 border-red-200'
          : premises.enabled && loc && premises.withinPremises
            ? 'bg-green-50 border-green-200'
            : premises.enabled && loc && !premises.withinPremises
              ? 'bg-orange-50 border-orange-200'
              : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-start gap-2">
          <MapPin size={14} className={`mt-0.5 flex-shrink-0 ${
            locError ? 'text-red-600'
              : premises.enabled && loc && premises.withinPremises ? 'text-green-600'
              : premises.enabled && loc && !premises.withinPremises ? 'text-orange-600'
              : 'text-yellow-600'
          }`} />
          <div className="flex-1 text-xs">
            {geofence?.enabled && (
              <p className="font-semibold text-gray-700 mb-1">
                School: {geofence.school_name} · Allowed radius: {geofence.allowed_radius}m
              </p>
            )}
            {loc ? (
              geofence?.enabled ? (
                premises.withinPremises ? (
                  <p className="font-semibold text-green-700">✓ Inside school premises ({premises.distance}m away)</p>
                ) : (
                  <p className="font-semibold text-orange-700">✗ Outside school premises ({premises.distance}m away)</p>
                )
              ) : (
                <p className="font-semibold text-yellow-700">Location acquired — geofence not configured</p>
              )
            ) : locError ? (
              <div>
                <p className="font-semibold text-red-700">✗ Location Error</p>
                <p className="text-red-600 mt-1">{locError}</p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => getLocation().catch(() => {})} disabled={locLoading}
                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50">
                    {locLoading ? 'Retrying...' : 'Retry'}
                  </button>
                  {import.meta.env.DEV && (
                    <button onClick={useTestLocation}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                      Use Test Location
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className="font-semibold text-yellow-700">⊙ Requesting location...</p>
            )}
          </div>
        </div>
      </div>

      {/* Medical Leave Modal */}
      {medLeaveOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Apply Medical Leave</h3>
            <form onSubmit={handleMedicalLeave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Date</label>
                  <input
                    type="date"
                    className="input"
                    value={medForm.start_date || today}
                    onChange={(e) => setMedForm({ ...medForm, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input
                    type="date"
                    className="input"
                    value={medForm.end_date || today}
                    onChange={(e) => setMedForm({ ...medForm, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="label">Reason / Remarks</label>
                <textarea
                  className="input h-24 resize-none"
                  placeholder="Describe your medical condition (optional)"
                  value={medForm.remarks}
                  onChange={(e) => setMedForm({ ...medForm, remarks: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Medical Certificate (optional)</label>
                <label className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                  <Upload size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {medForm.certificate ? medForm.certificate.name : 'Upload certificate'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setMedForm({ ...medForm, certificate: e.target.files[0] })}
                  />
                </label>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setMedLeaveOpen(false); setMedForm({ remarks: '', certificate: null, start_date: '', end_date: '' }); }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={actionLoading}>
                  {actionLoading
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : 'Apply Leave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
