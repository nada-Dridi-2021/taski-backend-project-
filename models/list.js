const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
    },
    position: {
        type: Number,
        required: true,
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('List', listSchema);
