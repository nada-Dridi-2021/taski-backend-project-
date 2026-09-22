const mongoose = require('mongoose');

const downloadSchema = new mongoose.Schema({
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    filePath: { type: String, required: true },
    originalName: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Download', downloadSchema);