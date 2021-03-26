const mongoose = require ("mongoose")

const Schema = mongoose.Schema

const storage = new Schema({
    data: Schema.Types.Mixed
})

module.exports = mongoose.model('Storage', storage)