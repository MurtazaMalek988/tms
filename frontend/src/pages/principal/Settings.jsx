import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { MapPin, Clock, Save, School, Lock, Crosshair } from 'lucide-react';
import useGeolocation from '../../hooks/useGeolocation';

const DEFAULT = {
  school_name: '',
  school_latitude: '',
  school_longitude: '',
  allowed_radius: 100,
  late_cutoff_time: '09:00',
  absence_processing_time: '17:00',
};

export default function Settings() {
  const [form, setForm] = useState(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const { getLocation, locLoading: geoLoading } = useGeolocation();

  useEffect(() => {
    api.get('/admin/settings')
      .then((res) => {
        const s = res.data.settings;
        setForm({
          school_name: s.school_name || '',
          school_latitude: s.school_latitude != null ? String(s.school_latitude) : '',
          school_longitude: s.school_longitude != null ? String(s.school_longitude) : '',
          allowed_radius: s.allowed_radius || 100,
          late_cutoff_time: s.late_cutoff_time?.slice(0, 5) || '09:00',
          absence_processing_time: s.absence_processing_time?.slice(0, 5) || '17:00',
        });
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  function set(key, value) { setForm((f) => ({ ...f, [key]: value })); }

  const captureSchoolLocation = useCallback(async () => {
    try {
      const coords = await getLocation();
      setForm((f) => ({
        ...f,
        school_latitude: coords.latitude.toFixed(6),
        school_longitude: coords.longitude.toFixed(6),
      }));
      toast.success('School location captured from your device');
    } catch (err) {
      toast.error(err.message || 'Could not get your location');
    }
  }, [getLocation]);

  async function handleSave(e) {
    e.preventDefault();
    const lat = form.school_latitude ? parseFloat(form.school_latitude) : 0;
    const lon = form.school_longitude ? parseFloat(form.school_longitude) : 0;
    if (lat === 0 && lon === 0) {
      toast.error('Set school latitude and longitude so teachers can only mark attendance on premises.');
      return;
    }
    setSaving(true);
    try {
      await api.put('/admin/settings', {
        ...form,
        school_latitude: form.school_latitude ? parseFloat(form.school_latitude) : 0,
        school_longitude: form.school_longitude ? parseFloat(form.school_longitude) : 0,
        allowed_radius: parseInt(form.allowed_radius),
        late_cutoff_time: form.late_cutoff_time + ':00',
        absence_processing_time: form.absence_processing_time + ':00',
      });
      toast.success('Settings saved successfully');
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      return toast.error('Enter your current and new password');
    }
    if (passwordForm.newPassword.length < 4) {
      return toast.error('New password must be at least 4 characters');
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('New passwords do not match');
    }

    setChangingPassword(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>
        <p className="text-gray-500 text-sm">Configure school geofence and attendance rules</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* School Info */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 text-gray-700 font-semibold">
            <School size={18} />
            School Information
          </div>
          <div>
            <label className="label">School Name</label>
            <input className="input" value={form.school_name} onChange={(e) => set('school_name', e.target.value)} placeholder="Enter school name" />
          </div>
        </div>

        {/* Geofence */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 text-gray-700 font-semibold">
            <MapPin size={18} />
            Geofence Settings
          </div>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-700">
            Set your school&apos;s GPS coordinates and radius. Teachers can only check in/out when they are within this distance of the school.
          </div>
          <button
            type="button"
            onClick={captureSchoolLocation}
            disabled={geoLoading}
            className="btn-secondary w-full sm:w-auto py-2 px-4 text-sm"
          >
            {geoLoading ? (
              <span className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Crosshair size={16} />
                Use my current location as school
              </>
            )}
          </button>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">School Latitude</label>
              <input
                type="number"
                step="0.000001"
                className="input"
                value={form.school_latitude}
                onChange={(e) => set('school_latitude', e.target.value)}
                placeholder="e.g. 33.6844"
              />
            </div>
            <div>
              <label className="label">School Longitude</label>
              <input
                type="number"
                step="0.000001"
                className="input"
                value={form.school_longitude}
                onChange={(e) => set('school_longitude', e.target.value)}
                placeholder="e.g. 73.0479"
              />
            </div>
          </div>
          <div>
            <label className="label">Allowed Radius (meters)</label>
            <input
              type="number"
              min={10}
              max={5000}
              className="input"
              value={form.allowed_radius}
              onChange={(e) => set('allowed_radius', e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Teachers must be within this radius from school to check in/out</p>
          </div>
        </div>

        {/* Time Rules */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 text-gray-700 font-semibold">
            <Clock size={18} />
            Attendance Time Rules
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Late Arrival Cutoff</label>
              <input type="time" className="input" value={form.late_cutoff_time} onChange={(e) => set('late_cutoff_time', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">Check-in after this time is considered late</p>
            </div>
            <div>
              <label className="label">Absence Processing Time</label>
              <input type="time" className="input" value={form.absence_processing_time} onChange={(e) => set('absence_processing_time', e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">Teachers not checked in by this time are auto-marked absent</p>
            </div>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full sm:w-auto py-2.5 px-8" disabled={saving}>
          {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={16} />Save Settings</>}
        </button>
      </form>

      <form onSubmit={handlePasswordChange} className="card space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-semibold">
          <Lock size={18} />
          Change Password
        </div>
        <p className="text-xs text-gray-500">
          Update your administrator login password. You will stay signed in after changing it.
        </p>
        <div>
          <label className="label">Current Password</label>
          <input
            type="password"
            className="input"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
            autoComplete="current-password"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              className="input"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              className="input"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              autoComplete="new-password"
            />
          </div>
        </div>
        <button type="submit" className="btn-secondary w-full sm:w-auto py-2.5 px-8" disabled={changingPassword}>
          {changingPassword ? (
            <span className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Lock size={16} />
              Update Password
            </>
          )}
        </button>
      </form>
    </div>
  );
}
