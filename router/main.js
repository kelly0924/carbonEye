const router = require("express").Router()
const jwt = require("jsonwebtoken")
const db = require("../modules/mysql")
const mysql = require('mysql2/promise');

const nowTime = require("../modules/kst")
const dateAgo = require("../modules/date")
const accessVerify = require("../modules/access_verify")
const refreshVerify = require("../modules/refresh_verify")
const newAccessToken = require("../modules/new_access_token")
const updateRefreshToken = require("../modules/update_refresh_token")

const jwtSecretKey = process.env.JWT_SECRET_KEY

// main page 사용자 탄소배출량 가져오기
router.get("/",async(req,res)=>{
    // Request Data
    const refreshTokenValue = req.headers.refresh_token
    const accessTokenValue = req.headers.access_token
    
    //Respons Data
    
    const result = {
        "success": false,
        "message": null,
        "total_carbon": null,
        "name": null
    }
    
    try{
       
        if(accessTokenValue !== undefined || refreshTokenValue !== undefined){ 

            const accountIndexValue = accessVerify(accessTokenValue).payload

            if(accessVerify(accessTokenValue).success === true){//treu일 경우-> access_token이 유효한 경우 
                
                if(refreshVerify(refreshTokenValue).message === "token expired"){
                    const temp = await updateRefreshToken(accountIndexValue)
                    res.send(temp)
                }else{
                    console.log(accountIndexValue,"account 값")
                    const connection = await db.getConnection()
                    const sql = `
                        SELECT food_carbon, traffic_carbon FROM carbon WHERE account_index = ?
                    `
                    const values = [accountIndexValue]
                    const [rows]  = await connection.query(sql, values)

                    const nameSql = `SELECT user_name FROM account WHERE account_index = ?`
                    const nameValue = [accountIndexValue]
                    const [userNames] = await  connection.query(nameSql, nameValue)

                    result.success = true
                    result.total_carbon = rows[0].food_carbon + rows[0].traffic_carbon
                    result.name= userNames[0].user_name

                    connection.release()
                    res.send(result)
                }
            
            }else if(accessVerify(accessTokenValue).message === "token expired"){//access_token이 완료된 경우 
                //refresh_token이 유효한 경우 
                if(refreshVerify(refreshTokenValue)){//true 인 경우 -> refresh_token이 유효한 경우 새로운 access_token생성
                    const accountIndexValue = refreshVerify(refreshTokenValue).payload
                    const temp = await newAccessToken(accountIndexValue, refreshTokenValue)
                    res.send(temp)

                }else{
                    throw new Error("모든 토큰이 완료 되었습니다.")
                }

            }else{
                throw new Error("올바르지 않은 토큰입니다.")
            }
        }else{
            throw new Error("토큰이 올바르지 않습니다.")
        }
    }catch(e){
        result.message = e.message
        console.log("GET /main API ERR : ", e.message)
    }

    

})

module.exports = router