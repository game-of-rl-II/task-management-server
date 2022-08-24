
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
var nodemailer = require('nodemailer');

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://gamerl:LmwYybhisaurSQmq@cluster0.u6i9ya9.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const transporter = nodemailer.createTransport({
  service: 'SendinBlue',
  auth: {
    user: process.env.SENDER_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});
function sendMailToMember(newMember) {
  const { teamName, adminEmail, name, id, password, memberEmail } = newMember;
  transporter.sendMail({
    from: adminEmail,
    to: memberEmail,
    subject: `Your member id is ${id} and password is ${password}.`,
    text: `Your member id is ${id} and password is ${password}.`,
    html: `
      <div>
         <h1 > Hello ${name}, </h1>
         <p style={{fontSize: "20px" , color: "#F83D06"}}>Congratulation!</p>
         <p>You are selected as a member of our team ${teamName}.</p>
         <p> Your member Id is ${id} and Password is ${password}.</p>
  
         <p>Garduara, Hathazari.</p>
         <p>Chittagong, Bangladesh</p>
      </div>
    `
  })
    .then((res) => console.log("Successfully sent", res))
    .catch((err) => console.log("Failed to send ", err))
}

const run = async () => {
  try {
    await client.connect();
    console.log("db connected");
    const adminsCollection = client.db("gameOfRL").collection("admins");
    const membersCollection = client.db("gameOfRL").collection("members");
    const tasksCollection = client.db("gameOfRL").collection("tasks");
    const teamsCollection = client.db("gameOfRL").collection("teams")
    

    app.get("/member-login/:id", async (req, res) => {
      const memberId = req.params.id;
      const query = { id: memberId };
      const member = await membersCollection.findOne(query);

      if (member) {
        return res.send(member);
      }

      return res.send({ message: "user not found" });
    });

    app.post("/add-new-member", async (req, res) => {
      const newMember = req.body;

      const memberId = newMember.id;
      const email = newMember.memberEmail;
      const filter = { id: memberId };
      const query = { memberEmail: email }
      const member = await membersCollection.findOne(filter);
      if (member) {
        return res.send({ message: "Id already used" });
      }
      const emailOwner = await membersCollection.findOne(query);
      if (emailOwner) {
        return res.send({ message: "Email is already used" })
      }
      const result = await membersCollection.insertOne(newMember);
      sendMailToMember(newMember);
      res.send(result);
    });
    // creating new team in db
    app.post("/create-team", async (req, res) => {
      const newTeam = req.body;
      const teamName = newTeam.teamName;
      const filter = { teamName: teamName }
      const team = await teamsCollection.findOne(filter);
      if (team) {
        return res.send({ message: "You already have a team with that name. Please try  a new name" })
      }
      const result = await teamsCollection.insertOne(newTeam);
      res.send(result);
    });


    app.get("/random-id-check/:id", async (req, res) => {

      const memberId = req.params.id;

      const filter = { id: memberId };

      const searchedId = await membersCollection.findOne(filter);
      if (searchedId) {
        return res.send({ message: "exist" });
      }
      res.send({ memberId })
    });

    app.post("/new-admin", async (req, res) => {
      const newAdmin = req.body;
      const result = await adminsCollection.insertOne(newAdmin);
      res.send(result);
    });

    app.put("/manage-attendance/present/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const data = {
        $set: {
          presentStatus: true,
        },
      };
      const result = await tasksCollection.updateOne(filter, data, options);
      res.send(result);
    });
    // add review
    app.put("/add-review/:memberId", async (req, res) => {
      const memberId = req.params.memberId;
      const body = req.body;
      const filter = { memberId: memberId };
      const options = { upsert: true };
      const data = {
        $set: {
          rating: body.rating,
          comment: body.description,
        },
      };
      const result = await membersCollection.updateOne(filter, data, options);
      res.send(result);
    });
    // get all task
    app.get("/task/:teamName", async (req, res) => {
      const teamName = req.params.teamName;

      const query = {
        teamName: teamName,
      };
      const cursor = tasksCollection.find(query);
      const tasks = await cursor.toArray();
      res.send(tasks);
    });
    // get task of a member
    app.get("/taskMember", async (req, res) => {
      const id = req.query.id;

      const query = { memberId: id };
      const cursor = tasksCollection.find(query);
      const tasks = await cursor.toArray();
      res.send(tasks);
    });
    // get all teamsCollection
    app.get('/teams/:email', async (req, res) => {
      const email = req.params.email;
      const query = { owner: email };
      const cursor = teamsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);

    })
    // get all member

    app.get("/members", async (req, res) => {
      const email = req.query.email;
      const teamName = req.query.teamName;

      const query = {
        adminEmail: email,
        teamName: teamName,
      };
      const cursor = membersCollection.find(query);
      const members = await cursor.toArray();

      res.send(members);
    });
    // getting todays task based on new date
    app.get("/today-tasks", async (req, res) => {
      const taskDate = req.query.todaysDate;
      const teamName = req.query.teamName;

      const query = {
        taskDate: taskDate,
        teamName: teamName,
      };
      const cursor = tasksCollection.find(query);
      const result = await cursor.toArray();

      res.send(result);
    });


    // delete a member (shuvo).......
    app.delete("/member/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await membersCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/assign-task", async (req, res) => {
      const task = req.body;
      const result = await tasksCollection.insertOne(task);
      res.send(result);
    });





    app.put("/task-member/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const options = { upsert: true };
      const data = {
        $set: {
          taskCompletion: true,
        },
      };
      const result = await tasksCollection.updateOne(query, data, options);
      res.send(result);
    });
  } finally {
  }
};
run().catch(console.dir);
// testing localhost 5000
app.get("/", (req, res) => {
  res.send("hello world");
});
app.listen(port, () => {
  console.log("listening to port", port);
});