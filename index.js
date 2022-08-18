const express = require("express");
const cors = require("cors");

require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

const app = express();
const corsConfig = {
  origin: true,
  credentials: true,
};

app.use(cors(corsConfig));
app.use(express.json());
app.options("*", cors(corsConfig));

const uri = `mongodb+srv://${process.env.DB_Name}:${process.env.DB_KEY}@cluster0.u6i9ya9.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    await client.connect();
    console.log("db connected");

    const membersCollection = client.db('gameOfRL').collection('members')
    const tasksCollection = client.db("gameOfRL").collection("tasks");

    app.get('/member-login/:id', async (req, res) => {
      const memberId = req.params.id;
      const query = { id: memberId };
      const member = await membersCollection.findOne(query)

      if (member) {
        return res.send(member)
      }

      return res.send({ message: 'user not found' })
    })

    app.post('/add-new-member', async (req, res) => {
      const newMember = req.body;
      const result = await membersCollection.insertOne(newMember)
      res.send(result)
    })

    app.get("/manage-attendance", async (req, res) => {
      const filter = {};
      const cursor = tasksCollection.find(filter);
      const result = await cursor.toArray();
      res.send(result);
    });


    app.put('/manage-attendance/present/:id', async (req, res) => {
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
    // get all task
    app.get("/task", async (req, res) => {
      const query = {};
      const cursor = tasksCollection.find(query);
      const tasks = await cursor.toArray();
      res.send(tasks);
    });
    // get task of a member
    app.get("/task/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const task = await tasksCollection.findOne(query);
      res.send(task);
    });

    // get all member 
    
    app.get("/members", async (req, res) => {
      const query = {};
      const cursor = membersCollection.find(query);
      const tasks = await cursor.toArray();
      res.send(tasks);
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
