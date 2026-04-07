const mongoose = require("mongoose");

/// schemas and models

const userSchema = mongoose.Schema({
    username: String,
    password: String
})

const organizationSchema = mongoose.Schema({
    title: String,
    description: String,
    admin:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    members: [{
        type:mongoose.Schema.Types.ObjectId, 
        ref:"users"
    }]
    
})
const boardsSchema = mongoose.Schema({
    title:String,
    organizationId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'organizations'
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }
})

const issueSchema = mongoose.Schema({
    title:String,
    description:String,
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'users'
    },
    
    boardId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'boards'
    },
    assignedTo:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'users'
    }
})



const boardsModel = mongoose.model("boards", boardsSchema);
const issueModel = mongoose.model("issues", issueSchema);
const organizationModel = mongoose.model("organizations", organizationSchema);
const userModel = mongoose.model("users", userSchema);

module.exports = {
    organizationModel,
    userModel,
    boardsModel,
    issueModel
}