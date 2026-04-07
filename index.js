const mongoose = require("mongoose");
const express = require("express");
const jwt = require("jsonwebtoken");
const { authMiddleware } = require("./middleware")
const {userModel, organizationModel, boardsModel, issueModel} = require("./models");

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

//BOARDS
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
    const board = await boardsModel.create({
        title,
        organizationId,
        createdBy:userId
    })
    res.json({
        message: "Board is Created",
        BoardId: board._id
    })
})

//ISSUES
app.post("/issue", authMiddleware, async (req, res) => {
    const userId = req.userId;
    const title =  req.body.title;
    const description = req.body.description;
    const boardId = req.body.boardId;
    const assignedMemberId = req.body.assignedMemberId;

    if(!assignedMemberId) {
        res.status(400).json({
            message: "This user does not exist"
        })
        return;
    }
    if(!title ||  typeof title !== "string"){
        res.status(400).json({
            message : "Required title is not found"
        })
        return;
    }    
    if(!description || typeof description !== "string") {
        res.status(400).json({
            message: "Required description is not found"
        })
        return;
    }
    if(!boardId) {
        res.status(400).json({
            message: "Board id is Required"
        })
        return;

    }
    const board = await boardsModel.findById(boardId);
    if(!board) {
        res.status(400).json({
            message: "This board does not exist"
        })
        return;
    }
   
  const assigned = await userModel.findById(assignedMemberId);

    const issues = await issueModel.create({
        title:title,
        description:description,
        boardId:boardId,
        createBy:userId,
        assignedTo:assigned
    })

    res.json({
        message: "Issue is created"
        
    })

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

//FETCH BOARDS
app.get("/boards", authMiddleware, async (req, res) => {
    const { organizationId } = req.query;
    if (!organizationId) {
        res.status(400).json({
            message: "This organization does not exist"
        })
        return;
    }
    const Boards = await boardsModel.find({
        organizationId
    }).populate('createdBy','username')
    res.json({
        Boards
    })
})


//FETCH ISSUES
app.get("/issues", authMiddleware, async (req, res) => {
    const { issueId } = req.query;
    if (!issueId) { 
        res.status(400).json({
            message: "This issue does not exist"
        })
        return;
    }
    const issue = await issueModel.findById(issueId).populate('assignedTo', 'username')
    res.json({
        issue
    })
})

app.get("/members", authMiddleware, async (req, res) => {
    const { organizationId } = req.query;
    if(!organizationId) {
        res.status(400).json({
            message: "Organization id is required"
        })
        return;
    }
    const organization = await organizationModel.findById(organizationId).populate('members','username');
    res.json({
        members:organization.members
    })

})

// UPDATE
app.put("/issues", authMiddleware, async (req, res) => {
    const userId = req.userId;
    const { issueId } = req.query;
    const {title, description, boardId, assignedTo} = req.body;

    if(!title || typeof title !== "string") {
        res.json({
            message: "Title is required"
        })
        return;
    }
    if (!description || typeof description !== "string"){
        res.json({
            message: "Description is required"
        })
        return;
    }
    if (!boardId) {
        res.json({
            message: "Incorrect Board Id"
        })
        return;
    }
    if(!assigned) {
        res.json({
            message: "User is not the memebr"
        })
        return;
    }
    const issue = await issueModel.findByIdAndUpdate(issueId,{
        title,
        description,
        boardId,
        userId,
        assignedTo
    })
    res.json({
        issue
    })

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
