const express = require("express")
const jwt = require('jsonwebtoken');
const cors = require("cors")
require('dotenv').config()
const stripe = require("stripe")(process.env.Screate_key)

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


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
    // await client.connect();




    const userCollection = client.db("Music-Camp").collection("users")
    const classCollection = client.db("Music-Camp").collection("class")
    const BookingCollection = client.db("Music-Camp").collection("Book")






    app.post("/jwt", (req, res)=>{

      const user = req.body;
      const token = jwt.sign(user, process.env.Access_Token,{
        expiresIn:"30 days"
      } )
      res.send({token})
    })

    const verifyAdmin = async(req, res, next)=>{

      const email = req.decoded.email;
      console.log(req.decoded);
      const query = {email : email}
      const user = await userCollection.findOne(query)
      if(user?.role !== "admin"){
            return res.status(403).send({error:true, message:"forbidden message"})
      }
      next()
    }
    const verifyInstructor = async(req, res, next)=>{

      const email = req.decoded.email;
      console.log(req.decoded);
      const query = {email : email}
      const user = await userCollection.findOne(query)
      if(user?.role !== "instructor"){
            return res.status(403).send({error:true, message:"forbidden message"})
      }
      next()
    }


    app.get("/users/admin/:email",  verifyJWT, async(req, res)=>{

      const email = req.decoded.email;

      if(req.decoded.email !== email){
        res.send({admin:false})
      }

      const query = {email : email}
      const user = await userCollection.findOne(query)
      const result ={admin: user?.role === "admin"}
      res.send(result)
    })

    app.get("/users/instructor/:email",  verifyJWT, async(req, res)=>{

      const email = req.decoded.email;

      if(req.decoded.email !== email){
        res.send({instructor:false})
      }

      const query = {email : email}
      const user = await userCollection.findOne(query)
      const result ={instructor: user?.role === "instructor"}
      res.send(result)
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

    app.get("/users", async(req, res)=>{

      const result = await userCollection.find().toArray()
      res.send(result)

    })

    app.post("/classes", async(req, res)=>{

     const classes = req.body;

     const result = await classCollection.insertOne(classes)
     res.send(result)

    })

    app.get("/classes", async(req, res)=>{

      const result = await classCollection.find().sort({totalEnrolled:-1}).toArray()
      res.send(result)

    })

 
    app.get("/classes/:id", async(req, res)=>{
      const id =req.params.id;
      const query = { _id: id }
      const result = await classCollection.find(query).toArray()
      res.send(result)
    })

    app.put("/classes/:id", async(req, res)=>{

      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const updateData = req.body;
      console.log(updateData);

      
      const updateDoc ={
        $set :{
           className: updateData?.className,
           seats:updateData?.seats,
           price:updateData?.price,
           image: updateData?.image

        }
      }

      const result = await classCollection.updateOne(query, updateDoc)
      res.send(result)
      
    })

    app.put("/feedback/:id", async(req, res)=>{

      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const feedback = req.body;
      console.log(feedback.feedback);
      const options = { upsert: true };
      const updateDoc={
        $set:{
          feedback:feedback.feedback,
        }
      }

      const result = await classCollection.updateOne( query,updateDoc,options)
      res.send(result)
    })

    app.put("/classEnroll/:id", async(req, res)=>{

      

      const id = req.params.id;
      const query = {_id:new ObjectId(id)}
      const updateData = req.body;
      const updateDoc={
        $set:{
          seat:updateData.seat -1,
          totalEnrolled: updateData.totalEnrolled + 1 
        }
      }
      const result = await classCollection.updateOne(query, updateDoc)
      res.send(result)
    })
    
    app.patch("/class/approve/:id", async(req, res)=>{

      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const updateDoc ={
        $set :{
           status: "approve"
        }
      }
      const result = await classCollection.updateOne(query,updateDoc)
      res.send(result)
    })
    app.patch("/class/deny/:id", async(req, res)=>{

      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const updateDoc ={
        $set :{
           status: "deny"
        }
      }
      const result = await classCollection.updateOne(query,updateDoc)
      res.send(result)
    })

    app.get("/myClasses", async(req, res)=>{

      const email = req.query.email;
      const query = {email : email}

      const result = await classCollection.find(query).toArray()
      res.send(result)
    })

    app.get("/myClasses/:id", async(req, res)=>{
      const id = req.params.id;

      const query = {_id: new ObjectId(id)}
      const result = await classCollection.find(query).toArray()
      res.send(result)
    })

    app.post("/selected", async(req, res)=>{

      const Book = req.body;
      const result = await BookingCollection.insertOne(Book)
      res.send(result)
    })

    app.get("/selected", async(req, res)=>{

      const result = await BookingCollection.find().toArray()
      res.send(result)
    })

    app.get("/mySelected", async(req, res)=>{

      const email = req.query.email;
      const query = {email : email}
      const result = await BookingCollection.find(query).toArray()
      res.send(result)
    })

    app.get("/mySelected/:id", async(req, res)=>{
      
      const id = req.params.id;
      const query = {_id:new ObjectId(id)}
      const result = await BookingCollection.find(query).toArray()
      res.send(result)
    })

    app.delete("/mySelected/:id", async(req, res)=>{

      const id = req.params.id;
      const query = {_id: new ObjectId(id)}

      const result =  await BookingCollection.deleteOne(query)
      res.send(result)
    })

    app.patch("/mySelected/:id", async(req, res)=>{
      
      const id = req.params.id;
      const query = {_id : new ObjectId(id)}
      const updateDoc ={
        $set:{
           status:"booked"
        }
      }
      const result =await BookingCollection.updateOne(query, updateDoc)
      res.send(result)
    })

    // payment

    app.post("/create-payment-intent",  async(req, res)=>{

      const { price } = req.body;
      const amount = price*100
      
        console.log("price",amount);

      if(price){
        const paymentIntent = await stripe.paymentIntents.create({

          amount: amount,
          currency:"usd",
          payment_method_types: [
            "card"
          ],
        });
        res.send({
          clientSecret: paymentIntent.client_secret,
        })
      }
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