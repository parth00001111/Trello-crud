const mongoose = require("mongoose");
const express = require("express");
const jwt = require("jsonwebtoken");
const { authMiddleware } = require("./middleware")
const {userModel, organizationModel} = require("./models");

let BOARD_ID = 1;
let ISSUES_ID = 1;


const BOARDS = [];

const ISSUES = [];

const app = express();
app.use(express.json());

// CREATE
app.post("/signup", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const userExists = await userModel.findOne({
        username: username,     
    });

    if (userExists) {
        res.status(411).json({
            message: "User with this username already exists"
        })
        return;
    }

    const newUser = await userModel.create({
        username: username,
        password: password
    })

    res.json({
        id: newUser._id,
        message: "You have signed up successfully"
    })
})

app.post("/signin", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const userExists = await userModel.findOne({
        username: username,
        password: password
    });

    if (!userExists) {
        res.status(403).json({
            message: "Incorrect credentials"
        })
        return;
    }

    const token = jwt.sign({
        userId: userExists.id
    }, "secret123123");

    res.json({
        token
    })
})

// AUTHENTICATED ROUTE - MIDDLEWARE
app.post("/organization", authMiddleware, async (req, res) => {
    const userId = req.userId;

    const newOrg = await organizationModel.create({
        title: req.body.title,
        description: req.body.description,
        admin: userId,
        members: [],
        boards:[]
    })

    res.json({
        message: "Org created",
        id: newOrg._id
    })
})

app.post("/add-member-to-organization", authMiddleware, async (req, res) => {
    const userId = req.userId;
    const organizationId = req.body.organizationId;
    const memberUsername = req.body.memberUsername; // aakash

    // const organization = ORGANIZATIONS.find(org => org.id === organizationId);
    const organization = await organizationModel.findOne({
        _id: organizationId
    });

    if (!organization || organization.admin.toString() !== userId) {
        res.status(411).json({
            message: "Either this org doesnt exist or you are not an admin of this org"
        })
        return
    }

    const memberUser = await userModel.findOne({
        username: memberUsername
    })

    if (!memberUser) {
        res.status(411).json({
            message: "No user with this username exists in our db"
        })
        return
    }

    organization.members.push(memberUser._id)
    await organization.save()

    res.json({
        message: "New member added!"
    })
})

app.post("/board", authMiddleware, async(req, res) => {
    const userId = req.userId;
    const title = req.body.title;
    const organizationId = req.body.organizationId;
    if(!title) {
        res.status(400).json({
            message: "Title is missing!!!"
        })
        return;
    }
    if(!organizationId) {
        res.status(400).json({
            message: "Organization id is invalid or missing"
        })
    }
    const organization = await organizationModel.findOne({
        _id : organizationId
    });
    if(!organization){
        res.status(411).json({
            message: "This organization does not exist"
        })
        return;
    }
    organization.boards.push({
        title:title,
        userId:userId
    });
    await organization.save();
    res.json({
        message: "new board is created"
    })
})

app.post("/issue", (req, res) => {
    
})

//GET endpoints
app.get("/organization", authMiddleware, async (req, res) => {
    const userId = req.userId;
    const organizationId = req.query.organizationId;

    const organization = await organizationModel.findOne({
        _id: organizationId
    });

    if (!organization || organization.admin.toString() !== userId) {
        res.status(411).json({
            message: "Either this org doesnt exist or you are not an admin of this org"
        })
        return
    }

    const members = await userModel.find({
        _id: organization.members
    })

    res.json({
        organization: {
            title: organization.title,
            description: organization.description,
            members: members.map(m => ({
                username: m.username,
                id: m._id
            }))
        }
    })
})

app.get("/boards", (req, res) => {
    
    
})

app.get("/issues", (req, res) => {
    
})

app.get("/members", (req, res) => {

})

// UPDATE
app.put("/issues", (req, res) => {

})

//DELETE -- FIND THE GBUG and fix it
app.delete("/members", authMiddleware, async (req, res) => {
    const userId = req.userId;
    const organizationId = req.body.organizationId;
    const memberUsername = req.body.memberUsername; // aakash

    // const organization = ORGANIZATIONS.find(org => org.id === organizationId);
    const organization = await organizationModel.findOne({
        _id: organizationId
    });

    if (!organization || organization.admin.toString() !== userId) {
        res.status(411).json({
            message: "Either this org doesnt exist or you are not an admin of this org"
        })
        return
    }

    const memberUser = await userModel.findOne({
        username: memberUsername
    })

    if (!memberUser) {
        res.status(411).json({
            message: "No user with this username exists in our db"
        })
        return
    }

    
    organization.members = organization.members.filter(x => x.toString() !== memberUser._id.toString());
  
    await organization.save();

    res.json({
        message: "member deleted!"
    })
})

app.listen(3000);
