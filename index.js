const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const requestedFoodCollection = client.db("Meal-Miracle-DB").collection('reqFoods');



    // ------------------------------------(All Food)--------------------------------------
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


    /*for sorting in available food page */
    app.get('/available-food', async (req, res) => {
      let query = {};
      let sortVal = parseInt(req.query.sortOrder);

      if (req.query?.foodStatus) {
        query = { foodStatus: req.query.foodStatus }
      }
      const result = await foodCollection.find(query)
        .sort({ expDate: sortVal })
        .toArray();
      res.send(result)
    });

    /*For count data in food Available page */
    app.get('/available-food/productCount', async (req, res) => {
      let count = await foodCollection.estimatedDocumentCount()
      res.send({ count });
    })

    /*Load Single food (ViewDetails) */
    app.get('/food/:id', async (req, res) => {
      let id = req.params.id;
      let query = { _id: new ObjectId(id) };
      let result = await foodCollection.findOne(query);
      res.send(result);
    })
    /*Load Single food (Update Food) */
    app.get('/update/:id', async (req, res) => {
      let id = req.params.id;
      let query = { _id: new ObjectId(id) };
      let result = await foodCollection.findOne(query);
      res.send(result);
    })

    /*For Home page data */
    app.get('/', async (req, res) => {
      let result = await foodCollection.find().sort({ foodQuantity: -1 }).limit(6).toArray();
      res.send(result);
    })
    /*Delete Manage my food */
    app.delete('/manage-my-food/:id', async (req, res) => {
      let id = req.params.id;
      console.log(id);
      let query = { _id: new ObjectId(id) };
      let result = await foodCollection.deleteOne(query)
      res.send(result);
    })
    /*Update a Product */
    app.put('/update-one/:id', async (req, res) => {
      let id = req.params.id;
      let query = { _id: new ObjectId(id) }
      const options = { upsert: true };
      let updatedFood = req.body;
      // foodName, foodQuantity, pickupPoint, expDate, foodImg, foodDesp
      let Food = {
        $set: {
          foodName: updatedFood.foodName,
          foodQuantity: updatedFood.foodQuantity,
          pickupPoint: updatedFood.pickupPoint,
          expDate: updatedFood.expDate,
          foodImg: updatedFood.foodImg,
          foodDesp: updatedFood.foodDesp,

        }
      }
      const result = await foodCollection.updateOne(query, Food, options);
      res.send(result);
    })



    /*-----------------------------Requested Foods--------------------------*/
    /*Requested Food Insertion*/
    app.post('/requested-food', async (req, res) => {
      let newFood = req.body;
      let result = await requestedFoodCollection.insertOne(newFood);
      res.send(result);
    })
    /*Get the data for my requested food */
    app.get('/my-requested-food', async (req, res) => {
      let email = req.query.email;
      let query = { reqUserEmail: email };
      let result = await requestedFoodCollection.find(query).toArray();
      res.send(result);
    })
    /*Delete my requested food */
    app.delete('/my-requested-food/:id', async (req, res) => {
      let id = req.params.id;
      console.log(id);
      let query = { _id: new ObjectId(id) };
      let result = await requestedFoodCollection.deleteOne(query)
      res.send(result);
    })
    /*Delete manage-my-food */
    app.delete('/request-delete/:id', async (req, res) => {
      let id = req.params.id;
      // console.log(id);
      let query = { id: id };
      let result = await requestedFoodCollection.deleteOne(query)
      res.send(result);
    })

    /*Update a Requested Product */
    app.put('/updateOne/:id', async (req, res) => {
      let id = req.params.id;
      let query = { id: id }
      const options = { upsert: true };
      let updatedFood = req.body;
      let Food = {
        $set: {
          foodName: updatedFood.foodName,
          foodQuantity: updatedFood.foodQuantity,
          pickupPoint: updatedFood.pickupPoint,
          expDate: updatedFood.expDate,
          foodImg: updatedFood.foodImg,
          foodDesp: updatedFood.foodDesp,

        }
      }
      const result = await requestedFoodCollection.updateOne(query, Food, options);
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