const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema(
  {
    officeName: { type: String, required: [true, 'Office name is required'], trim: true },
    officeStartTime: { type: String, default: '09:30' },
    officeEndTime: { type: String, default: '18:30' },
    gracePeriodMinutes: { type: Number, default: 15, min: 0, max: 120 },
    officeLatitude: { type: Number, required: [true, 'Office latitude is required'] },
    officeLongitude: { type: Number, required: [true, 'Office longitude is required'] },
    allowedRadiusMeter: { type: Number, default: 50, min: 10 },
    allowedWiFiSSID: { type: String, required: [true, 'Office WiFi SSID is required'], trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', CompanySchema);
