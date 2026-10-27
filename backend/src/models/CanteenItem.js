import mongoose from 'mongoose';

const canteenItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['Breakfast', 'Snacks & Fast Food', 'Meals & Combos', 'Beverages & Drinks', 'South Indian', 'Desserts', 'Other']
  },
  price: { type: Number, required: true, min: 0 },
  isVeg: { type: Boolean, default: true },
  status: { 
    type: String, 
    enum: ['Available', 'Out of Stock'],
    default: 'Available' 
  },
  mealTiming: { 
    type: String, 
    enum: ['All Day', 'Breakfast', 'Lunch', 'Evening Snacks', 'Dinner'],
    default: 'All Day' 
  },
  description: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const CanteenItem = mongoose.model('CanteenItem', canteenItemSchema);
export default CanteenItem;
