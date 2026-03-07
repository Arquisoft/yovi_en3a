const gameFactory = require("/gameFactory")
const mongoose = require("mongoose")

const gameSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    botId: {
        type: String,
        required: true,
        enum: ["random_bot"],
        default: "random_bot",
    },
    boardSize: {
        type: Number,
        required: true,
        default: 5,
    },
    // board state
    yen: {
        size: { type: Number, required: true },
        turn: { type: Number, required: true },
        players: { type: [String], required: true },
        layout: { type: String, required: true },
    },
    status: {
        type: String,
        enum: ["ongoing", "won", "lost", "resigned"],
        default: "ongoing",
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    type: {
        type: String,
        enum: gameFactory.getValidGames(),
        required: true,
    },
})

module.exports = mongoose.model("Game", gameSchema)