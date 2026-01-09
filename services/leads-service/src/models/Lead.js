import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  message: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: String,
    enum: ['consulta', 'reclamo', 'cotizacion', 'otros'],
    default: 'consulta',
    index: true
  },
  categoryTag: {
    type: String,
    trim: true,
    maxlength: 50,
    default: null,
    index: true
  },
  source: {
    type: String,
    default: 'web',
    index: true
  },
  utm: {
    type: Map,
    of: String,
    default: {}
  },
  ip: {
    type: String,
    default: ''
  }
}, {
  timestamps: true,
  collection: 'leads'
});

// Índice único por email (case-insensitive ya se maneja con lowercase)
leadSchema.index({ email: 1 }, { unique: true });

// Índice compuesto para búsquedas
leadSchema.index({ createdAt: -1 });
leadSchema.index({ source: 1, createdAt: -1 });
leadSchema.index({ category: 1, createdAt: -1 });
leadSchema.index({ categoryTag: 1, createdAt: -1 });
leadSchema.index({ category: 1, categoryTag: 1 });

const Lead = mongoose.model('Lead', leadSchema);

export default Lead;