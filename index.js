const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express')
const cors = require('cors')
const app = express()
require('dotenv').config()
const port = process.env.PORT || 5000

/* Using Middleware */
app.use(cors());
app.use(express.json());

/* Starting MongoDB */

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oglq0ui.mongodb.net/?retryWrites=true&w=majority`;

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

    const foodCollection = client.db("Meal-Miracle-DB").collection('foods');

    /*Insert Food Operation*/
    app.post('/foods', async (req, res) => {
      let newFood = req.body;
      let result = await foodCollection.insertOne(newFood);
      res.send(result);
    })

    /* Load Manage my Food */
    app.get('/myfood', async (req, res) => {
      let query = {};
      console.log(req.query.email);
      if (req.query?.email) {
        query = { donorEmail: req.query.email }
      }
      const result = await foodCollection.find(query).toArray();
      res.send(result);
    })








    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Food is Sharing!')
})

app.listen(port, () => {
  console.log(`Food Sharing website is listening on port ${port}`)
})