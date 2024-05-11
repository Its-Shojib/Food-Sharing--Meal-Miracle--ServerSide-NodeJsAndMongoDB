const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express')
const cors = require('cors')
const app = express()
let jwt = require('jsonwebtoken');
require('dotenv').config()
let cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000

/* Using Middleware */
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://food-sharing-system.web.app',
    'https://food-sharing-system.firebaseapp.com',
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser())

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

/*Verify Middleware of JWT */
const verifyToken = async (req, res, next) => {
  let token = req?.cookies?.token;
  console.log('Value of token in middleware: ', token);
  if (!token) {
    return res.status(401).send({ message: 'Not Authorized' })
  }
  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: 'UnAuthorized' })
    }
    console.log('value in the token', decoded);
    req.user = decoded;
    next();
  })

}

async function run() {
  try {

    const foodCollection = client.db("Meal-Miracle-DB").collection('foods');
    const requestedFoodCollection = client.db("Meal-Miracle-DB").collection('reqFoods');

    // -------------------------------------AUTH---------------------------------------------
    app.post('/jwt', async (req, res) => {
      let user = req.body;
      let token = jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: '1h' });
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none'
        })
        .send({ token });
    })

    /*Logout APi */
    app.post('/logout', async (req, res) => {
      let user = req.body;
      res.clearCookie('token', { maxAge: 0,sameSite: 'none', secure: true }).send({ success: true })
    });


    // ------------------------------------(All Food)--------------------------------------
    /*Insert Food Operation (Add Food)*/
    app.post('/foods', async (req, res) => {
      let newFood = req.body;
      let result = await foodCollection.insertOne(newFood);
      res.send(result);
    });

    /* Load Manage my Food(Manage My Food) */
    app.get('/myfood',verifyToken, async (req, res) => {
      if(req.user.email != req.query.email){
        return res.status(403).send({message: 'Forbidded access'})
      }
      let query = {};
      if (req.query?.email) {
        query = { donorEmail: req.query.email }
      }
      const result = await foodCollection.find(query).toArray();
      res.send(result);
    });


    /*for sorting in available food page (Available Food)*/
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



    /*Load Single food (ViewDetails) */
    app.get('/food/:id',verifyToken, async (req, res) => {
      let id = req.params.id;
      let query = { _id: new ObjectId(id) };
      let result = await foodCollection.findOne(query);
      res.send(result);
    });


    /*Load Single food (Update Food) */
    app.get('/update/:id',verifyToken, async (req, res) => {
      let id = req.params.id;
      let query = { _id: new ObjectId(id) };
      let result = await foodCollection.findOne(query);
      res.send(result);
    });



    /*For Home page data */
    app.get('/home', async (req, res) => {
      let query = { foodStatus: 'available' }
      let result = await foodCollection.find(query).sort({ foodQuantity: -1 }).limit(6).toArray();
      res.send(result);
    });



    /*Delete Manage my food */
    app.delete('/manage-my-food/:id', async (req, res) => {
      let id = req.params.id;
      console.log(id);
      let query = { _id: new ObjectId(id) };
      let result = await foodCollection.deleteOne(query)
      res.send(result);
    });


    /*Update a Product */
    app.put('/update-one/:id', async (req, res) => {
      let id = req.params.id;
      let query = { _id: new ObjectId(id) }
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
      const result = await foodCollection.updateOne(query, Food, options);
      res.send(result);
    });


    /*Update Food Status */
    app.put('/updateStatus/:id', async (req, res) => {
      let id = req.params.id;
      let query = { _id: new ObjectId(id) }
      const options = { upsert: true };
      let updatedStatus = req.body;
      let Food = {
        $set: {
          foodStatus: updatedStatus.foodStatus
        }
      }
      const result = await foodCollection.updateOne(query, Food, options);
      res.send(result);
    });



    /*-----------------------------Requested Foods--------------------------*/
    /*Requested Food Insertion*/
    app.post('/requested-food', async (req, res) => {
      let newFood = req.body;
      let result = await requestedFoodCollection.insertOne(newFood);
      res.send(result);
    });


    /*Get the data for my requested food */
    app.get('/my-requested-food', verifyToken, async (req, res) => {
      console.log(req.user.email);
      console.log(req.query.email);
      if (req.query.email !== req.user.email) {
        return res.status(403).send({ message: 'Forbidded access' })
      }
      let email = req.query.email;
      let query = { reqUserEmail: email };
      let result = await requestedFoodCollection.find(query).toArray();
      res.send(result);
    });


    /*Delete my requested food */
    app.delete('/my-requested-food/:id', async (req, res) => {
      let id = req.params.id;
      console.log(id);
      let query = { _id: new ObjectId(id) };
      let result = await requestedFoodCollection.deleteOne(query)
      res.send(result);
    });


    /*Delete manage-my-food */
    app.delete('/request-delete/:id', async (req, res) => {
      let id = req.params.id;
      // console.log(id);
      let query = { id: id };
      let result = await requestedFoodCollection.deleteOne(query)
      res.send(result);
    });


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
    });

    /*Manage a Single Food */
    app.get('/manage/:id',verifyToken, async (req, res) => {
      let id = req.params.id;
      console.log(id);
      let query = { id: id };
      let result = await requestedFoodCollection.find(query).toArray();
      res.send(result);
    });

    /*Update Food Status */
    app.put('/updateReqStatus/:id', async (req, res) => {
      let id = req.params.id;
      let query = { id: id }
      const options = { upsert: true };
      let updatedStatus = req.body;
      let Food = {
        $set: {
          foodStatus: updatedStatus.foodStatus
        }
      }
      const result = await requestedFoodCollection.updateOne(query, Food, options);
      res.send(result);
    });


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