import mongoose from 'mongoose';

const wardenSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  hostelBlock: { type: String }
}, { timestamps: true });

const Warden = mongoose.model('Warden', wardenSchema);
export default Warden;
