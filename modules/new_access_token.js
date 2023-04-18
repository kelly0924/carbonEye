const router = require("express").Router()
const jwt = require("jsonwebtoken")
const db = require("./mysql")
const accessVerify = require("./access_verify")
const refreshVerify = require("./refresh_verify")

const jwtSecretKey = process.env.JWT_SECRET_KEY

//new access_token 생성 
const  newAccessToken = async(accountIndexValue, refreshTokenValue)=>{

    const result = {
        "success": false,
        "access_token": null,
        "message": null
    }

   try{ 
        const connection = await db.getConnection()
        const sql = `
            SELECT refresh_token, email FROM account WHERE account_index = ?
        `
        const values = [accountIndexValue]
        const [rows] = await connection.query(sql, values)
            
        if(rows[0].refresh_token === refreshTokenValue){//db에서의 토큰과 같은 경우 

            // new access_token 발급
            const newAccessJwtToken=jwt.sign(
                {
                    "account_index": accountIndexValue,
                    "email": rows[0].email,
                    "role": "client"
                },
                jwtSecretKey,
                {
                    "issuer": "kelly",
                    "expiresIn": "1h"
                }
            )
            result.success = true
            result.access_token = newAccessJwtToken
            result.message = "new access_token"
        }
        await connection.release()
        return result

       
                    
    }catch(e) {
        result.message = e.message
        console.log("new_accesstoken module ERR : ", e.message)
    }
    
   
}

module.exports = newAccessToken