const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);



app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ProjectPulse API Running",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});