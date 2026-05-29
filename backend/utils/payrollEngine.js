const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const SalaryProfile = require('../models/SalaryProfile');
const User = require('../models/User');

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate(); // month is 1-based here
}

function getDateRange(monthYear) {
  const [year, month] = monthYear.split('-').map(Number);
  const totalDays = getDaysInMonth(year, month);
  const dates = [];
  for (let d = 1; d <= totalDays; d++) {
    const dd = String(d).padStart(2, '0');
    const mm = String(month).padStart(2, '0');
    dates.push(`${year}-${mm}-${dd}`);
  }
  return { year, month, totalDays, dates };
}

async function calculateUserPayroll(userId, monthYear, generatedBy) {
  const salaryProfile = await SalaryProfile.findOne({ userId });
  if (!salaryProfile) {
    throw new Error('Salary profile not configured for this employee.');
  }

  const { year, month, totalDays, dates } = getDateRange(monthYear);

  // Fetch attendance records for the month
  const attendanceRecords = await Attendance.find({
    userId,
    date: { $in: dates },
  });

  const attendanceMap = {};
  attendanceRecords.forEach((rec) => {
    attendanceMap[rec.date] = rec;
  });

  // Fetch approved leaves overlapping the month
  const [startDate, endDate] = [`${year}-${String(month).padStart(2, '0')}-01`, dates[dates.length - 1]];
  const approvedLeaves = await Leave.find({
    userId,
    status: 'Approved',
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
    ],
  });

  // Build set of approved leave dates
  const leaveDates = new Set();
  approvedLeaves.forEach((leave) => {
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (dates.includes(dateStr)) {
        leaveDates.add(dateStr);
      }
    }
  });

  // Tally counts
  let totalPresentDays = 0;
  let totalHalfDays = 0;
  let totalPaidLeaves = 0;
  let totalUnpaidAbsents = 0;

  // Only count up to today's date (not future dates)
  const todayStr = new Date().toISOString().split('T')[0];

  for (const date of dates) {
    if (date > todayStr) continue; // don't penalise future dates

    const rec = attendanceMap[date];
    const isWeekend = [0, 6].includes(new Date(date).getDay()); // Sun=0, Sat=6

    if (isWeekend) continue; // weekends are not working days

    if (leaveDates.has(date)) {
      totalPaidLeaves++;
    } else if (rec) {
      if (rec.status === 'Full-Day') totalPresentDays++;
      else if (rec.status === 'Half-Day') totalHalfDays++;
      else if (rec.status === 'Leave') totalPaidLeaves++;
    } else {
      totalUnpaidAbsents++;
    }
  }

  // Payroll formula from spec
  const dailyWageRate = salaryProfile.baseMonthlySalary / totalDays;
  const payableDays = totalPresentDays + totalPaidLeaves + totalHalfDays * 0.5;
  const grossPay = dailyWageRate * payableDays;
  const calculatedDeductions = salaryProfile.baseMonthlySalary - grossPay;
  const finalNetPayout = grossPay + salaryProfile.allowances;

  return {
    userId,
    monthYear,
    baseSalary: salaryProfile.baseMonthlySalary,
    allowances: salaryProfile.allowances,
    totalCalendarDays: totalDays,
    totalPresentDays,
    totalHalfDays,
    totalPaidLeaves,
    totalUnpaidAbsents,
    payableDays: Math.round(payableDays * 100) / 100,
    dailyWageRate: Math.round(dailyWageRate * 100) / 100,
    calculatedDeductions: Math.round(Math.max(0, calculatedDeductions) * 100) / 100,
    finalNetPayout: Math.round(finalNetPayout * 100) / 100,
    generatedBy,
  };
}

module.exports = { calculateUserPayroll, getDaysInMonth, getDateRange };
