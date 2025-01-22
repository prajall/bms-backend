import express from "express";
import mongoose from "mongoose";

const app = express();

app.listen(4000, async () => {
  await mongoose.connect(
    "mongodb+srv://msoftetc:Clfa4ace7d+++@cluster0.3howp.mongodb.net/aayan"
  );
  console.log("Database connected");
});

app.get("/", (req, res) => {});

app.post("/post", (req, res) => {
  console.log(req.body);
  res.json({ message: "Post request" });
});
