import mongoose from 'mongoose';

const maintenanceSchema = new mongoose.Schema({
  maintenanceId: { type: String, required: true, unique: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  category: { type: String, required: true },
  description: { type: String, required: true },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['Open', 'In Progress', 'Completed', 'Cancelled'], default: 'Open' },
  estimatedCost: { type: Number },
  actualCost: { type: Number },
  completedAt: { type: Date }
}, { timestamps: true });

const Maintenance = mongoose.model('Maintenance', maintenanceSchema);
export default Maintenance;
