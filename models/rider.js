const mongoose = require('mongoose');

const { Schema } = mongoose;


const riderSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    vehicle: {
      make: String,
      model: String,
      year: Number,
      licensePlate: String
    },
    currentRoute: {
      start: { type: { type: String, default: 'Point' }, coordinates: [Number] },
      end: { type: { type: String, default: 'Point' }, coordinates: [Number] }
    },
    status: String
  });
  
  riderSchema.index({ 'currentRoute.start': '2dsphere' });
  riderSchema.index({ 'currentRoute.end': '2dsphere' });

  module.exports = mongoose.model('Rider',riderSchema);