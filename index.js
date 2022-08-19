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
    console.log('db connected')
    // These all codes done by faridul haque for manage attendance page. 
    const faridCollection = client.db("Farid").collection("first");
    const taskCollection = client.db("Arif").collection("memberTasks");
    const reviewCollection = client.db("Arif").collection("reviews");
    app.get('/manage-attendance', async (req, res) => {
      const filter = {};
      const cursor = faridCollection.find(filter);
      const result = await cursor.toArray();
      res.send(result);
    })
    app.put('/manage-attendance/present/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const data = {
        $set: {
          presentStatus: true,
        },
      };
      const result = await faridCollection.updateOne(filter, data, options);
      res.send(result);
    })
    // codes for manageAttendance page by faridul haque done here


     //create api by arif islam

       // get all task
    app.get("/task", async (req, res) => {
      const query = {};
      const cursor = taskCollection.find(query);
      const tasks = await cursor.toArray();
      res.send(tasks);
    });
    // get task of a member
     app.get("/task/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const task = await taskCollection.findOne(query);
      res.send(task);
    });
     // post review to a member
     app.post("/review", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });
    // get all the reviews
    app.get("/review", async (req, res) => {
      const query = {};
      const cursor = reviewCollection.find(query);
      const review = await cursor.toArray();
      res.send(review);
    });

       //update member's task status 
       app.put('/task/:id' , async (req, res) => {
        const id = req.params.id;
        const filter = {_id: ObjectId(id)}
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            status : "completed"

          },
        };
        const result = await taskCollection.updateOne(filter, updateDoc, options);
        res.send(result);
      })
  
  }
  finally {

  }
}
run().catch(console.dir);
// testing localhost 5000
app.get("/", (req, res) => {
  res.send("hello world");
});
app.listen(port, () => {
  console.log("listening to port", port);
});