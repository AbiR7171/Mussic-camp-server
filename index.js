const express = require("express")
const jwt = require('jsonwebtoken');
const cors = require("cors")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const app = express()

const port = process.env.PORT || 5000


// middleware

app.use(cors())
app.use(express.json())

const verifyJWT =(req, res, next)=>{

  const authorization = req.headers.authorization

  if(!authorization){
    return res.status(401).send({error: true, message:"unauthorized access"})
  }
  const token = authorization.split(" ")[1]

  jwt.verify(token, process.env.Access_Token, (err, decoded)=>{

    if(err){
      return res.status(401).send({error: true, message:"unauthorized access"})
    }

    req.decoded = decoded;
    next()

  })
}






const uri = `mongodb+srv://${process.env.User_Name}:${process.env.User_Pass}@cluster0.hmmbger.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("Music-Camp").collection("users")
    const classCollection = client.db("Music-Camp").collection("class")


    app.post("/jwt", (req, res)=>{

      const user = req.body;
      const token = jwt.sign(user, process.env.Access_Token,{
        expiresIn:"30 days"
      } )
      res.send({token})
    })

    app.post("/users", async(req, res)=>{

        const user = req.body;
        const result = await userCollection.insertOne(user)
        res.send(result)
        
    })

    app.delete("/users/:id", async(req, res)=>{

      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const result = await userCollection.deleteOne(query)
       
      res.send(result)
    })

    app.patch("/users/admin", async(req, res)=>{

      const user = req.body;
      console.log(user.email);
      const query = {email : user.email}

      const updateDoc = {
        $set :{
           role: "admin"
        }
      }

      const result = await userCollection.updateOne(query, updateDoc)
      res.send(result)

    })
    app.patch("/users/instructor", async(req, res)=>{

      const user = req.body;
      console.log(user.email);
      const query = {email : user.email}

      const updateDoc = {
        $set :{
           role: "instructor"
        }
      }

      const result = await userCollection.updateOne(query, updateDoc)
      res.send(result)

    })

    app.get("/users", verifyJWT, async(req, res)=>{

      const result = await userCollection.find().toArray()
      res.send(result)

    })

    app.post("/classes", async(req, res)=>{

     const classes = req.body;

     const result = await classCollection.insertOne(classes)
     res.send(result)

    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get("/", (req, res)=>{
    res.send("School is ready to Teach")
})

app.listen(port, ()=>{
    console.log(`School is running on port${port}`);
})