const mongoose = require('mongoose');
const crypto   = require('crypto');

const ALG = 'aes-256-cbc';
const KEY = crypto.scryptSync(
  process.env.VAULT_SECRET || 'dotganga-vault-2025-secure',
  'dotganga-salt',
  32
);

function encrypt(text) {
  if (!text) return '';
  const iv       = crypto.randomBytes(16);
  const cipher   = crypto.createCipheriv(ALG, KEY, iv);
  const encrypted= Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text || !text.includes(':')) return text;
  try {
    const [ivHex, encHex] = text.split(':');
    const iv        = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encHex, 'hex');
    const decipher  = crypto.createDecipheriv(ALG, KEY, iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch { return '[decryption error]'; }
}

const CredentialSchema = new mongoose.Schema(
  {
    clientId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    platform:  {
      type: String,
      enum: ['Instagram','Facebook','YouTube','LinkedIn','Twitter','Google My Business',
             'Email','Website','Hosting','Domain','WhatsApp Business','Google Ads',
             'Meta Ads Manager','Canva','Other'],
      required: true,
    },
    label:     { type: String, default: '' },
    username:  { type: String, default: '' },
    _passwordEnc: { type: String, default: '', select: true },
    twoFAEnabled: { type: Boolean, default: false },
    twoFASecret:  { type: String, default: '' },
    notes:     { type: String, default: '' },
    documents: [
      {
        name: { type: String },
        url:  { type: String },
        type: { type: String, enum: ['PDF','Image','Link','Other'], default: 'Other' },
        addedAt: { type: Date, default: Date.now },
      }
    ],
    addedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Virtual: set password → auto-encrypt
CredentialSchema.virtual('password').set(function(val) {
  this._passwordEnc = val ? encrypt(val) : '';
});

// Virtual: get decrypted password
CredentialSchema.virtual('password').get(function() {
  return this._passwordEnc ? decrypt(this._passwordEnc) : '';
});

CredentialSchema.set('toJSON', { virtuals: true });
CredentialSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ClientCredential', CredentialSchema);
module.exports.encrypt = encrypt;
module.exports.decrypt = decrypt;
