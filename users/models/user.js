const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    age: {
        type: Number,
        required: false
    },
    country: {
        type: String,
        required: false,
    },
    createdAt: { 
        type: Date,
        default: Date.now,
        immutable: true,
    }
})

module.exports = mongoose.model('User', userSchema)