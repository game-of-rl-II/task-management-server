// const express = require("express");
// const cors = require("cors");

// require("dotenv").config();
// const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const port = process.env.PORT || 5000;

// const app = express();
// const corsConfig = {
//   origin: true,
//   credentials: true,
// };

// app.use(cors(corsConfig));
// app.use(express.json());
// app.options("*", cors(corsConfig));

const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://gamerl:LmwYybhisaurSQmq@cluster0.u6i9ya9.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    await client.connect();
    console.log("db connected");
    const adminsCollection = client.db("gameOfRL").collection("admins");
    const membersCollection = client.db("gameOfRL").collection("members");
    const tasksCollection = client.db("gameOfRL").collection("tasks");

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
      const filter = { id: memberId };
      const member = await membersCollection.findOne(filter);
      if (member) {
        return res.send({ message: "id already used" });
      }
      const result = await membersCollection.insertOne(newMember);
      res.send(result);
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
    app.get("/task", async (req, res) => {
      const query = {};
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

    // get all member

    app.get("/members", async (req, res) => {
      const email = req.query.email;

      const query = { adminEmail: email };
      const cursor = membersCollection.find(query);
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
