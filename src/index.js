import express from "express"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import cors from "cors"
import authRoutes from "./routes/auth.route.js";
import searchRoute from "./routes/search.route.js";
import {connectdb} from "./lib/db.js"

dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cookieParser())
app.use(cors({
  origin: "https://fashionate-frontend.vercel.app",
  credentials: true // if using cookies/auth
}));

app.use(express.json({ limit: "5mb" }))
app.use(express.json());
app.use("/api/auth",authRoutes)
app.use("/api/search",searchRoute)

app.listen(PORT,()=>{
    console.log("The server is running on the port ",PORT)
    connectdb();
})