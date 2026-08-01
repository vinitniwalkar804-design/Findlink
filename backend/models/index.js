const mongoose = require('mongoose');

// --- User Model ---
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  fullName: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['family', 'citizen', 'police', 'admin'], default: 'citizen' },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedAt: { type: Date },
  badgeNumber: { type: String },
  department: { type: String },
  avatarUrl: { type: String },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (this.isNew && this.role !== 'police') {
    this.approvalStatus = 'approved';
  }
  if (this.isModified('password') && this.password && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
    const bcrypt = require('bcryptjs');
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  const bcrypt = require('bcryptjs');
  if (!this.password || typeof this.password !== 'string') {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

const familySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  address: { type: String },
  cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
  stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
  policeStationId: { type: mongoose.Schema.Types.ObjectId, ref: 'PoliceStation' },
}, { timestamps: true });

const citizenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  address: { type: String },
  cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
  stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
}, { timestamps: true });

const policeOfficerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  badgeNumber: { type: String, required: true },
  department: { type: String },
  policeStationId: { type: mongoose.Schema.Types.ObjectId, ref: 'PoliceStation' },
  cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
  stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
}, { timestamps: true });

const adminSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  permissions: [{ type: String }],
}, { timestamps: true });

const countrySchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String },
  phoneCode: { type: String },
}, { timestamps: true });

const stateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  stateCode: { type: String },
  type: { type: String, enum: ['state', 'union_territory'], default: 'state' },
  countryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
}, { timestamps: true });

stateSchema.index({ name: 1 });
stateSchema.index({ stateCode: 1 });
stateSchema.index({ countryId: 1 });

const districtSchema = new mongoose.Schema({
  name: { type: String, required: true },
  stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true },
  stateCode: { type: String },
}, { timestamps: true });

districtSchema.index({ name: 1, stateId: 1 });
districtSchema.index({ stateId: 1 });
districtSchema.index({ stateCode: 1 });

const citySchema = new mongoose.Schema({
  name: { type: String, required: true },
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
  stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
  isMetro: { type: Boolean, default: false },
}, { timestamps: true });

citySchema.index({ name: 1, districtId: 1 });
citySchema.index({ districtId: 1 });
citySchema.index({ stateId: 1 });

const policeStationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
  stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
  address: { type: String },
  phone: { type: String },
}, { timestamps: true });

policeStationSchema.index({ cityId: 1 });
policeStationSchema.index({ districtId: 1 });
policeStationSchema.index({ stateId: 1 });
policeStationSchema.index({ name: 1 });

// --- Missing Person Model (MULTI-EMBEDDING support) ---
const faceEmbeddingRefSchema = new mongoose.Schema({
  embedding: { type: [Number], required: true },
  photoUrl: { type: String },
  qualityScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const missingPersonSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  age: { type: Number },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  photoUrl: { type: String },
  lastSeenLocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
  lastSeenAddress: { type: String },
  lastSeenDate: { type: Date },
  description: { type: String },
  status: { type: String, enum: ['active', 'found', 'closed'], default: 'active' },
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
  stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
  // Legacy single embedding (backward compatible)
  faceEmbedding: { type: [Number], default: null },
  // New multi-embedding support
  faceEmbeddings: { type: [faceEmbeddingRefSchema], default: [] },
  embeddingVersion: { type: String, default: 'v2' },
  modelName: { type: String, default: 'insightface_buffalo_l' },
}, { timestamps: true });

const foundPersonSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  photoUrl: { type: String },
  foundLocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
  foundAddress: { type: String },
  foundDate: { type: Date },
  description: { type: String },
  status: { type: String, enum: ['unidentified', 'identified', 'reunited'], default: 'unidentified' },
  matchedMissingPersonId: { type: mongoose.Schema.Types.ObjectId, ref: 'MissingPerson', default: null },
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'District' },
  stateId: { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
}, { timestamps: true });

const unknownFoundPersonSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  photoUrl: { type: String },
  foundLocation: { type: String },
  foundDate: { type: Date },
  ageApprox: { type: String },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  distinguishingFeatures: { type: String },
  clothing: { type: String },
  status: { type: String, enum: ['open', 'matched', 'closed'], default: 'open' },
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['match', 'status_update', 'approval', 'system'], default: 'system' },
  relatedId: { type: String },
  read: { type: Boolean, default: false },
}, { timestamps: true });

const caseHistorySchema = new mongoose.Schema({
  missingPersonId: { type: mongoose.Schema.Types.ObjectId, ref: 'MissingPerson' },
  foundPersonId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoundPerson' },
  action: { type: String, required: true },
  actionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: { type: String },
  statusBefore: { type: String },
  statusAfter: { type: String },
}, { timestamps: true });

const aiMatchResultSchema = new mongoose.Schema({
  foundPersonId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoundPerson', required: true },
  missingPersonId: { type: mongoose.Schema.Types.ObjectId, ref: 'MissingPerson', required: true },
  confidenceScore: { type: Number, required: true },
  matchRank: { type: Number },
  status: { type: String, enum: ['pending', 'confirmed', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = {
  User: mongoose.model('User', userSchema),
  Family: mongoose.model('Family', familySchema),
  Citizen: mongoose.model('Citizen', citizenSchema),
  PoliceOfficer: mongoose.model('PoliceOfficer', policeOfficerSchema),
  Admin: mongoose.model('Admin', adminSchema),
  MissingPerson: mongoose.model('MissingPerson', missingPersonSchema),
  FoundPerson: mongoose.model('FoundPerson', foundPersonSchema),
  UnknownFoundPerson: mongoose.model('UnknownFoundPerson', unknownFoundPersonSchema),
  Country: mongoose.model('Country', countrySchema),
  State: mongoose.model('State', stateSchema),
  District: mongoose.model('District', districtSchema),
  City: mongoose.model('City', citySchema),
  PoliceStation: mongoose.model('PoliceStation', policeStationSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  CaseHistory: mongoose.model('CaseHistory', caseHistorySchema),
  AIMatchResult: mongoose.model('AIMatchResult', aiMatchResultSchema),
};
