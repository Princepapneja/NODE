import dotenv from 'dotenv'
import { app } from './app.js'
dotenv.config()

const port = process.env.PORT

app.on("error", (err) => {
    console.error("error in express", err);
    throw err
})
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

import connectDB from "./db/index.js";

dotenv.config()

connectDB()








