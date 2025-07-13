import express, { Request, Response } from "express";
import connectMongo from "../config/database";

const app = express();
const port = process.env.PORT || 5002;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  connectMongo();
});

export default app;
