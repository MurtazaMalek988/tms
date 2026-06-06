import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api';
import toast from 'react-hot-toast';
import { LogIn, LogOut, Stethoscope, MapPin, Clock, CheckCircle2, XCircle, AlertCircle, Upload } from 'lucide-react';
import { format } from 'date-fns';
import useGeolocation from '../../hooks/useGeolocation';
import { getPremisesStatus } from '../../utils/geofence';

const STATUS_CONFIG = {
  not_marked: { label: 'Not Marked', color: 'bg-gray-100 text-gray-600', icon: AlertCircle },
  present: { label: 'Present', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  absent: { label: 'Absent', color: 'bg-red-100 text-red-700', icon: XCircle },
  short_leave: { label: 'Short Leave', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
  medical_leave: { label: 'Medical Leave', color: 'bg-blue-100 text-blue-700', icon: Stethoscope },
};

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [medLeaveOpen, setMedLeaveOpen] = useState(false);
  const [medForm, setMedForm] = useState({ remarks: '', certificate: null });
  const [geofence, setGeofence] = useState(null);
  const { loc, locError, locLoading, getLocation, useTestLocation } = useGeolocation();

  const premises = getPremisesStatus(loc, geofence);
  const locationRequired = geofence?.enabled;
  const canMarkAttendanceHere = !locationRequired || (loc && premises.withinPremises);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/teacher/attendance/today');
      setAttendance(res.data.attendance);
      setGeofence(res.data.geofence);
    } catch {
      toast.error('Failed to load attendance status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  useEffect(() => {
    getLocation().catch(() => {});
  }, [getLocation]);

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
      await api.post('/teacher/medical-leave', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Medical leave applied successfully!');
      setMedLeaveOpen(false);
      setMedForm({ remarks: '', certificate: null });
      fetchStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply medical leave');
    } finally {
      setActionLoading(false);
    }
  }

  const status = attendance?.status || 'not_marked';
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.not_marked;
  const StatusIcon = cfg.icon;

  const canCheckIn = !attendance?.check_in_time && status !== 'medical_leave';
  const canCheckOut = !!attendance?.check_in_time && !attendance?.check_out_time;
  const canMedLeave = !attendance?.check_in_time && status !== 'medical_leave';

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
        <p className="text-gray-500 mt-1">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
      </div>

      {/* Status card */}
      <div className="card">
        <h2 className="text-sm font-medium text-gray-500 mb-3">Today's Status</h2>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${cfg.color}`}>
          <StatusIcon size={16} />
          {cfg.label}
        </div>

        {attendance?.check_in_time && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Clock size={12} /> Check In
              </p>
              <p className="text-sm font-semibold text-gray-800 mt-1">
                {format(new Date(attendance.check_in_time), 'hh:mm a')}
              </p>
            </div>
            {attendance.check_out_time && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock size={12} /> Check Out
                </p>
                <p className="text-sm font-semibold text-gray-800 mt-1">
                  {format(new Date(attendance.check_out_time), 'hh:mm a')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

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
            <>
              <LogIn size={20} />
              Check In
            </>
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
            <>
              <LogOut size={20} />
              Check Out
            </>
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
            locError
              ? 'text-red-600'
              : premises.enabled && loc && premises.withinPremises
                ? 'text-green-600'
                : premises.enabled && loc && !premises.withinPremises
                  ? 'text-orange-600'
                  : 'text-yellow-600'
          }`} />
          <div className="flex-1 text-xs">
            {geofence?.enabled && (
              <p className="font-semibold text-gray-700 mb-1">
                School: {geofence.school_name} · Allowed radius: {geofence.allowed_radius}m
              </p>
            )}

            {loc ? (
              <div>
                {geofence?.enabled ? (
                  premises.withinPremises ? (
                    <>
                      <p className="font-semibold text-green-700">✓ Inside school premises</p>
                      <p className="text-green-600 mt-0.5">
                        You are within {geofence.allowed_radius}m of the school ({premises.distance}m away). You can check in/out.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-orange-700">✗ Outside school premises</p>
                      <p className="text-orange-600 mt-0.5">
                        You are about {premises.distance}m from school. Move within {geofence.allowed_radius}m to mark attendance.
                      </p>
                    </>
                  )
                ) : (
                  <>
                    <p className="font-semibold text-yellow-700">Location acquired</p>
                    <p className="text-yellow-600 mt-0.5">
                      School geofence is not configured yet. Ask admin to set school location in Settings.
                    </p>
                  </>
                )}
              </div>
            ) : locError ? (
              <div>
                <p className="font-semibold text-red-700">✗ Location Error</p>
                <p className="text-red-600 mt-1">{locError}</p>
                <div className="mt-2 space-y-1">
                  <p className="text-red-600 font-medium">How to fix:</p>
                  <ul className="text-red-600 list-disc pl-4 space-y-0.5">
                    <li>Click the lock icon in the address bar and allow Location for this site</li>
                    <li>On Windows, turn on Location in Settings → Privacy &amp; security → Location</li>
                    <li>Retry after a few seconds — desktop browsers often use Wi‑Fi, not GPS</li>
                  </ul>
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => getLocation().catch(() => {})}
                    disabled={locLoading}
                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    {locLoading ? 'Retrying...' : 'Retry'}
                  </button>
                  {import.meta.env.DEV && (
                    <button
                      onClick={useTestLocation}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      title="Dev only: bypass geolocation when school coords are 0,0"
                    >
                      Use Test Location
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-yellow-700">⊙ Requesting location...</p>
                <p className="text-yellow-600 mt-0.5">Please allow browser to access your location when prompted</p>
              </div>
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
                  onClick={() => { setMedLeaveOpen(false); setMedForm({ remarks: '', certificate: null }); }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={actionLoading}>
                  {actionLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : 'Apply Leave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
