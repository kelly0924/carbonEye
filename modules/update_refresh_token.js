
const router = require("express").Router()
const jwt = require("jsonwebtoken")
const db = require("./mysql")


const jwtSecretKey = process.env.JWT_SECRET_KEY
const updateRefreshToken = (accountIndexValue)=> {

    const result = {
        "success": false,
        "refresh_token": null
    }

    //refresh_token 발급
    const refreshJwtToken=jwt.sign(
        {
            "account_index": accountIndexValue
        }, //refresh token의은 payload 최소 정보로 생성하기-> payload가 있으면 토큰이 길어 지져 때문
        jwtSecretKey,
        {
            "issuer": "kelly",
            "expiresIn": "14d"
        }
    )
    //refresh upload 
    const refreshSql ='UPDATE account SET refresh_token = ? WHERE account_index =?'
    const tokenValues=[refreshJwtToken, accountIndexValue]
    connection.query(refreshSql, tokenValues, function (error) {
        if (error) {
            console.log("token sql err",error)
        }else{
            result.success = true
            result.refresh_token = refreshJwtToken
        }

        connection.release()
        return result

    })


}

module.exports = updateRefreshToken