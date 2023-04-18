
const router = require("express").Router()
const jwt = require("jsonwebtoken")
const db = require("./mysql")


const jwtSecretKey = process.env.JWT_SECRET_KEY
const updateRefreshToken = async(accountIndexValue)=> {

    const result = {
        "success": false,
        "refresh_token": null,
        "message": null
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
    const connection = await db.getConnection()
    const refreshSql ='UPDATE account SET refresh_token = ? WHERE account_index =?'
    const tokenValues=[refreshJwtToken, accountIndexValue]
    await connection.query(refreshSql, tokenValues)
     
    result.success = true
    result.refresh_token = refreshJwtToken
    result.message = "new refresh_token"

    await connection.release()
    return result

}

module.exports = updateRefreshToken