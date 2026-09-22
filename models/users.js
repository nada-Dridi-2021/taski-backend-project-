const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true, 
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, 
        lowercase: true, 
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
        type: String,
        required: true,
        minlength: 8, 
    },
    dateOfBirth: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                const today = new Date();
                const age = today.getFullYear() - value.getFullYear();
                const isOlderThan18 = age > 18 || (age === 18 && today >= new Date(value.setFullYear(today.getFullYear())));
                return isOlderThan18;
            },
            message: 'You must be at least 18 years old.',
        },
    },
    role: {
        type: [String],
        enum: ['member', 'admin','leader'], 
        default: ['member'], 
    },
    isConfirmed: { type: Boolean, default: false },
    confirmationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
}, { 
    timestamps: true 
});
module.exports = mongoose.model('User', userSchema);
