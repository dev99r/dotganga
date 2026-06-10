require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leaves');
const payrollRoutes = require('./routes/payroll');
const companyRoutes = require('./routes/company');
const staffRoutes = require('./routes/staff');
const dailyReportRoutes = require('./routes/dailyReport');
const taskRoutes           = require('./routes/tasks');
const leadRoutes           = require('./routes/leads');
const userManagementRoutes = require('./routes/userManagement');
const clientRoutes         = require('./routes/clients');
const postRoutes           = require('./routes/posts');
const metaAdsRoutes        = require('./routes/metaAds');
const approvalsRoutes      = require('./routes/approvals');
const mediaRoutes          = require('./routes/media');
const notificationsRoutes  = require('./routes/notifications');
const whatsappRoutes       = require('./routes/whatsapp');
const seedNowRoutes        = require('./routes/seedNow');
const errorHandler = require('./middleware/error');

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (origin.endsWith('.vercel.app')) return cb(null, true);
    if (origin.includes('localhost')) return cb(null, true);
    const allowed = process.env.FRONTEND_URL;
    if (allowed && origin.startsWith(allowed)) return cb(null, true);
    cb(null, true); // allow all in production for now
  },
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});
app.use('/api/auth/login', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/daily-report', dailyReportRoutes);
app.use('/api/tasks',         taskRoutes);
app.use('/api/leads',         leadRoutes);
app.use('/api/users',         userManagementRoutes);
app.use('/api/clients',       clientRoutes);
app.use('/api/posts',         postRoutes);
app.use('/api/meta-ads',      metaAdsRoutes);
app.use('/api/approvals',     approvalsRoutes);
app.use('/api/media',         mediaRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/whatsapp',     whatsappRoutes);
app.use('/api/seed-now',    seedNowRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
