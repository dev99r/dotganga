import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function ShiftConfig() {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({
    officeName: '',
    officeStartTime: '09:30',
    officeEndTime: '18:30',
    gracePeriodMinutes: 15,
    officeLatitude: '',
    officeLongitude: '',
    allowedRadiusMeter: 50,
    allowedWiFiSSID: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geoFetching, setGeoFetching] = useState(false);

  useEffect(() => {
    api.get('/company')
      .then(({ data }) => {
        setConfig(data.company);
        setForm({
          officeName: data.company.officeName || '',
          officeStartTime: data.company.officeStartTime || '09:30',
          officeEndTime: data.company.officeEndTime || '18:30',
          gracePeriodMinutes: data.company.gracePeriodMinutes ?? 15,
          officeLatitude: data.company.officeLatitude || '',
          officeLongitude: data.company.officeLongitude || '',
          allowedRadiusMeter: data.company.allowedRadiusMeter ?? 50,
          allowedWiFiSSID: data.company.allowedWiFiSSID || '',
        });
      })
      .catch(() => { /* no config yet */ })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.officeName.trim()) { toast.error('Office name is required.'); return; }
    if (!form.officeLatitude || !form.officeLongitude) { toast.error('GPS coordinates are required.'); return; }
    if (!form.allowedWiFiSSID.trim()) { toast.error('WiFi SSID is required.'); return; }

    setSaving(true);
    try {
      await api.put('/company', {
        ...form,
        officeLatitude: parseFloat(form.officeLatitude),
        officeLongitude: parseFloat(form.officeLongitude),
        gracePeriodMinutes: parseInt(form.gracePeriodMinutes),
        allowedRadiusMeter: parseInt(form.allowedRadiusMeter),
      });
      toast.success('Configuration saved successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported.');
      return;
    }
    setGeoFetching(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          officeLatitude: pos.coords.latitude.toFixed(6),
          officeLongitude: pos.coords.longitude.toFixed(6),
        }));
        toast.success('Office location set to current position.');
        setGeoFetching(false);
      },
      (err) => {
        toast.error(`Location error: ${err.message}`);
        setGeoFetching(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const Field = ({ label, hint, children }) => (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="card p-5 animate-pulse bg-slate-100 h-20 rounded-2xl" />)}</div>;
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h2 className="section-header">Office Configuration</h2>
        <p className="text-sm text-slate-500 mt-1">Configure shift timings, geofencing boundaries, and network restrictions.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Office identity */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Office Identity</h3>
          <Field label="Office / Company Name">
            <input type="text" className="input-field" placeholder="e.g. DotGanga HQ" value={form.officeName}
              onChange={(e) => setForm({ ...form, officeName: e.target.value })} />
          </Field>
        </div>

        {/* Shift timings */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Shift Timings</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Shift Start Time">
              <input type="time" className="input-field" value={form.officeStartTime}
                onChange={(e) => setForm({ ...form, officeStartTime: e.target.value })} />
            </Field>
            <Field label="Shift End Time">
              <input type="time" className="input-field" value={form.officeEndTime}
                onChange={(e) => setForm({ ...form, officeEndTime: e.target.value })} />
            </Field>
          </div>
          <Field
            label="Grace Period (minutes)"
            hint={`Staff arriving within ${form.gracePeriodMinutes} minute(s) after shift start get Full-Day. After this window, auto Half-Day applies.`}
          >
            <input type="number" className="input-field" min={0} max={120} value={form.gracePeriodMinutes}
              onChange={(e) => setForm({ ...form, gracePeriodMinutes: e.target.value })} />
          </Field>
        </div>

        {/* Geofencing */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Geofence Boundary</h3>
            <button
              type="button"
              onClick={detectCurrentLocation}
              disabled={geoFetching}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              {geoFetching ? 'Detecting...' : 'Use My Location'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Office Latitude">
              <input type="number" step="any" className="input-field font-mono" placeholder="e.g. 19.075984"
                value={form.officeLatitude}
                onChange={(e) => setForm({ ...form, officeLatitude: e.target.value })} />
            </Field>
            <Field label="Office Longitude">
              <input type="number" step="any" className="input-field font-mono" placeholder="e.g. 72.877656"
                value={form.officeLongitude}
                onChange={(e) => setForm({ ...form, officeLongitude: e.target.value })} />
            </Field>
          </div>

          <Field
            label="Allowed Radius (meters)"
            hint="Staff must be within this distance from the office GPS point to check in."
          >
            <div className="flex items-center gap-3">
              <input type="range" min={10} max={500} step={5} className="flex-1 accent-blue-700"
                value={form.allowedRadiusMeter}
                onChange={(e) => setForm({ ...form, allowedRadiusMeter: e.target.value })} />
              <span className="font-mono font-bold text-blue-700 w-16 text-right">{form.allowedRadiusMeter}m</span>
            </div>
          </Field>
        </div>

        {/* Network constraint */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Network Restriction</h3>
          <Field
            label="Allowed WiFi SSID"
            hint="Staff must report being on this exact network to complete check-in. Case-insensitive match."
          >
            <input type="text" className="input-field font-mono" placeholder="e.g. DotGanga-Office-5G"
              value={form.allowedWiFiSSID}
              onChange={(e) => setForm({ ...form, allowedWiFiSSID: e.target.value })} />
          </Field>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
            <strong>Note:</strong> Web browsers cannot automatically read the device's connected WiFi SSID. Staff
            are required to manually enter their current network name, which is validated against this setting.
            For 100% enforcement, a native mobile app is recommended.
          </div>
        </div>

        {/* Config summary */}
        {config && (
          <div className="card p-4 bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Current Configuration</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-slate-500">Shift:</span>
              <span className="font-mono font-semibold">{config.officeStartTime} – {config.officeEndTime}</span>
              <span className="text-slate-500">Grace Period:</span>
              <span className="font-mono font-semibold">{config.gracePeriodMinutes} min</span>
              <span className="text-slate-500">Radius:</span>
              <span className="font-mono font-semibold">{config.allowedRadiusMeter}m</span>
              <span className="text-slate-500">WiFi SSID:</span>
              <span className="font-mono font-semibold">{config.allowedWiFiSSID}</span>
            </div>
          </div>
        )}

        <button type="submit" disabled={saving} className="w-full btn-primary py-3.5 text-base">
          {saving ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
          ) : 'Save Configuration'}
        </button>
      </form>
    </div>
  );
}
