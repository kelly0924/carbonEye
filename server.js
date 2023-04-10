const express = require("express")
//const cors = require("cors")
require("dotenv").config()

const app = express()
const port = process.env.PORT_NUM | 3000
// app.use(cors({
//     origin: "*"
// }))
app.use(express.json())

const accountAPI = require("./router/account")
app.use("/account",accountAPI)

app.listen(port, () => {
    console.log(`Server is Start at : ${port}`)
})