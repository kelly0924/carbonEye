const express = require("express")
const cors = require("cors")
require("dotenv").config()

const app = express()
const port = process.env.PORT_NUM | 8000
app.use(cors({
    origin: "*"
}))
app.use(express.json())

const accountAPI = require("./router/account")
app.use("/account",accountAPI)

const mainPageAPI = require("./router/main")
app.use("/main",mainPageAPI)

const foodAPI = require("./router/food")
app.use("/food",foodAPI)

app.listen(port, () => {
    console.log(`Server is Start at : ${port}`)
})