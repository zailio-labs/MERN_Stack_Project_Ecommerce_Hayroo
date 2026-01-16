const mongoose = require("mongoose");

// Remove the try-catch as mongoose.connect() returns a Promise
mongoose.connect("mongodb://localhost:27017/Ecommerce")
  .then(() => {
    console.log("============== Database Connected Successfully ==============");
    
    // Check connection state
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    console.log(`MongoDB Connection State: ${states[state]}`);
  })
  .catch((err) => {
    console.error("============== Database Connection Failed ==============");
    console.error("Error Details:", err.message);
    
    // For common errors, provide helpful messages
    if (err.name === 'MongoServerError') {
      console.error("MongoDB Server Error - Check if MongoDB is running");
    } else if (err.name === 'MongooseServerSelectionError') {
      console.error("Cannot connect to MongoDB - Check connection string and network");
    }
    
    // Graceful exit for production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });

// Connection event handlers for better monitoring
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from DB');
});

// Handle application termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('Mongoose connection closed due to app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
});

// Handle other termination signals
process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  console.log('Mongoose connection closed due to SIGTERM');
  process.exit(0);
});

// Optional: Connection retry logic for production
const connectWithRetry = (retries = 5, delay = 5000) => {
  return mongoose.connect("mongodb://localhost:27017/Ecommerce")
    .catch((err) => {
      if (retries > 0) {
        console.log(`Retrying connection... (${retries} attempts left)`);
        setTimeout(() => connectWithRetry(retries - 1, delay), delay);
      } else {
        console.error('Max retries reached. Could not connect to MongoDB.');
        throw err;
      }
    });
};

// Export the mongoose instance and connection function
module.exports = {
  mongoose,
  connectDB: () => connectWithRetry()
};
