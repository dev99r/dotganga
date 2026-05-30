const express = require('express');
const router  = express.Router();
const Lead    = require('../models/Lead');
const { protect, managerOrAdmin } = require('../middleware/auth');
const xlsx    = require('xlsx');

// GET /api/leads
router.get('/', protect, async (req, res) => {
  try {
    const { status, source, assignedTo, search, priority } = req.query;
    const filter = {};
    if (status)     filter.status = status;
    if (source)     filter.source = source;
    if (priority)   filter.priority = priority;
    if (assignedTo) filter['assignedTo.userId'] = assignedTo;
    if (search) {
      filter.$or = [
        { name:    { $regex: search, $options: 'i' } },
        { phone:   { $regex: search, $options: 'i' } },
        { email:   { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }
    const leads = await Lead.find(filter).sort({ createdAt: -1 }).lean();
    const today = new Date().toISOString().slice(0,10);
    const stats = {
      total:      leads.length,
      new:        leads.filter(l => l.status === 'New').length,
      contacted:  leads.filter(l => l.status === 'Contacted').length,
      interested: leads.filter(l => l.status === 'Interested').length,
      won:        leads.filter(l => l.status === 'Won').length,
      lost:       leads.filter(l => l.status === 'Lost').length,
      hot:        leads.filter(l => l.priority === 'Hot').length,
      overdue:    leads.filter(l => l.followUpDate && l.followUpDate < today && !['Won','Lost','Not Interested'].includes(l.status)).length,
      conversionRate: leads.length > 0 ? Math.round((leads.filter(l=>l.status==='Won').length / leads.length) * 100) : 0,
    };
    res.json({ success: true, leads, stats });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/leads
router.post('/', protect, async (req, res) => {
  try {
    const lead = await Lead.create({ ...req.body, createdBy: req.user.name });
    res.status(201).json({ success: true, lead });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/leads/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, lead });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PATCH /api/leads/:id/status
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, lead });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/leads/:id/note
router.post('/:id/note', protect, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    lead.notes.unshift({ text: req.body.text, addedBy: req.user.name, addedAt: new Date() });
    if (req.body.followUpDate) lead.followUpDate = req.body.followUpDate;
    lead.lastContactDate = new Date().toISOString().slice(0,10);
    await lead.save();
    res.json({ success: true, lead });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/leads/:id
router.delete('/:id', protect, managerOrAdmin, async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/leads/import — base64 file upload
router.post('/import', protect, async (req, res) => {
  try {
    const { fileData } = req.body;
    if (!fileData) return res.status(400).json({ success: false, message: 'No file data provided' });

    const buffer = Buffer.from(fileData, 'base64');
    const wb     = xlsx.read(buffer, { type: 'buffer' });
    const ws     = wb.Sheets[wb.SheetNames[0]];
    const rows   = xlsx.utils.sheet_to_json(ws, { defval: '' });

    const leads = [];
    for (const row of rows) {
      const name  = String(row['Name'] || row['name'] || row['Full Name'] || row['full_name'] || row['Customer Name'] || '').trim();
      const phone = String(row['Phone'] || row['phone'] || row['Mobile'] || row['mobile'] || row['Phone Number'] || row['Contact'] || '').trim();
      if (!name && !phone) continue;
      leads.push({
        name:    name || phone || 'Unknown',
        phone,
        email:      String(row['Email']   || row['email']         || '').trim(),
        company:    String(row['Company'] || row['company']       || row['Business'] || '').trim(),
        source:     'Meta Ads',
        adCampaign: String(row['Campaign Name'] || row['campaign_name'] || row['Campaign'] || '').trim(),
        adSet:      String(row['Ad Set Name']   || row['adset_name']    || row['Ad Set']    || '').trim(),
        adName:     String(row['Ad Name']       || row['ad_name']       || row['Ad']        || '').trim(),
        status:  'New',
        priority:'Warm',
        createdBy: 'Import',
      });
    }

    if (!leads.length) return res.status(400).json({ success: false, message: 'No valid leads in file. Ensure columns: Name, Phone' });
    const inserted = await Lead.insertMany(leads, { ordered: false }).catch(e => e.result?.insertedIds ? e : (() => { throw e; })());
    const count = Array.isArray(inserted) ? inserted.length : (inserted.insertedCount || 0);
    res.json({ success: true, imported: count, message: `${count} leads imported!` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/leads/export
router.get('/export', protect, async (req, res) => {
  try {
    const leads = await Lead.find({}).sort({ createdAt: -1 }).lean();
    const data  = leads.map(l => ({
      Name: l.name, Phone: l.phone, Email: l.email, Company: l.company,
      Source: l.source, Service: l.service, Status: l.status, Priority: l.priority,
      Budget: l.budget, Location: l.location,
      'Assigned To': l.assignedTo?.userName || '',
      'Follow Up Date': l.followUpDate,
      'Last Contact': l.lastContactDate,
      'Campaign': l.adCampaign, 'Ad Set': l.adSet, 'Ad': l.adName,
      'Notes Count': l.notes?.length || 0,
      'Created At': new Date(l.createdAt).toLocaleDateString('en-IN'),
    }));
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, xlsx.utils.json_to_sheet(data), 'Leads');
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename=leads-${new Date().toISOString().slice(0,10)}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
