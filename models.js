const mongoose = require("mongoose");
mongoose.connect("mongodb+srv://kanhamahajan73:kanha123@cluster0.lmz1a4r.mongodb.net/trello");

/// schemas and models

const userSchema = mongoose.Schema({
    username: String,
    password: String
})

const organizationSchema = mongoose.Schema({
    title: String,
    description: String,
    admin: mongoose.Types.ObjectId,
    members: [mongoose.Types.ObjectId],
    boards:[{
        title:String,
        userId:mongoose.Types.ObjectId
    }]
})


const organizationModel = mongoose.model("organizations", organizationSchema);
const userModel = mongoose.model("users", userSchema);

module.exports = {
    organizationModel,
    userModel
}