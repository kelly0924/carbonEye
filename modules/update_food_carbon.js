const router = require("express").Router()
const jwt = require("jsonwebtoken")
const db = require("../modules/mysql")

//사용자가 음식을 통해서 사용한 량을 저장하는 모듈

const updateFoodCarbon =async(foodCarbonValue, accountIndexValue, dateValue) =>{

    try{

        const connection = await db.getConnection()
        const sql = `
            INSERT INTO carbon ( account_index, food_carbon, date) VALUES(?, ?, ?) 
        `
        const values = [accountIndexValue, foodCarbonValue, dateValue]
        await connection.query(sql, values)

        connection.release()
    }catch(err){
        console.log("err: insert food_carbon module")
    }

}

module.exports = updateFoodCarbon