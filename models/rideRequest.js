const mongoose = require('mongoose');

const { Schema } = mongoose;

const rideRequestSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    riderId: { type: Schema.Types.ObjectId, ref: 'Rider' },
    origin: { type: { type: String, default: 'Point' }, coordinates: [Number] },
    destination: { type: { type: String, default: 'Point' }, coordinates: [Number] },
    status: String,
    requestedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
  rideRequestSchema.index({ origin: '2dsphere' });
  rideRequestSchema.index({ destination: '2dsphere' });

module.exports = mongoose.model('RideRequest',rideRequestSchema);