const mongoose = require('mongoose');

const BrawlerSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true, index: true },
  rarity: String,
  gadget: String,
  star: String,
  gears: String,
  build: String,
  createdAt: { type: Date, default: Date.now }
});

// Add text index for fast searching
BrawlerSchema.index({ name: 'text', id: 'text' });

module.exports = mongoose.model('Brawler', BrawlerSchema);
