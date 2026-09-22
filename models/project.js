const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true, 
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
    }],
    status: {
        type: String,
        enum: ['not started', 'in progress', 'completed', 'on hold'],
        default: 'not started', 
    },
}, { 
    timestamps: true 
});


module.exports = mongoose.model('Project', projectSchema);
