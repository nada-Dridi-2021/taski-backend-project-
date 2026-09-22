require ("dotenv").config();
// console.log(process.env.NODE_ENV);
const mongoose = require('mongoose');
const express = require ("express");
const app = express();
const connectDB = require("./config/db.config");
connectDB();
const PORT = process.env.PORT || 5000;
    
const cors = require('cors');
const cookieParser = require('cookie-parser');
app.use(cors({
    origin:'http://localhost:5000',
    credentials:true
}));

app.use(cookieParser());
app.use(express.json());


app.use("/auth",require('./routes/authRoutes'));
app.use("/users",require('./routes/userRoutes'));
app.use("/projects",require('./routes/projectRoutes'));
app.use("/tasks",require('./routes/taskRoutes'));
app.use("/lists",require('./routes/listRoutes'));
app.use("/comments",require('./routes/commentRoutes'));


app.get('/', (req, res) => {
    res.send('Server is running!');
  });

mongoose.connection.once('open',()=>{
    console.log('connected to the db');
    app.listen(PORT,()=>{
    console.log(`server in running on http://localhost:${PORT}/ `);
});

})