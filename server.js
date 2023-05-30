const express = require("express")
const cors = require("cors")
require("dotenv").config()

const app = express()
const port = process.env.PORT_NUM | 8000
app.use(cors({
    origin: "*"
}))
app.use(express.json())
app.use(express.static('img'))

const accountAPI = require("./router/account")
app.use("/account", accountAPI)

const mainPageAPI = require("./router/main")
app.use("/main", mainPageAPI)

const foodAPI = require("./router/food")
app.use("/food", foodAPI)

const trafficAPI = require("./router/traffic")
app.use("/traffic", trafficAPI)

const user_authAPI = require("./router/user_auth")
app.use("/user_auth", user_authAPI)

const groupAPI = require("./router/group")
app.use("/group",groupAPI)

const mailAPI = require("./router/mail")
app.use("/email",mailAPI)

app.listen(port, () => {
    console.log(`Server is Start at : ${port}`)
})