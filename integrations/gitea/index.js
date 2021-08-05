// Require express
const express = require('express');
// Initialize express and define a port
const app = express();
const PORT = process.env.PORT || 7500;

// const mongoURI = 'mongodb://root:password@localhost:27017/db';

// Start express on the defined port
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
