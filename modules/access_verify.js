
// JWT Token 검증 모듈

const jwt = require("jsonwebtoken")
const jwtSecretKey = process.env.JWT_SECRET_KEY

const  toeknVerify = (access_token) => {

    let result = {
        "success": false,//true 이면 데이터 보내기  fales이면 access token 완료 
        "payload": null,
        "message": null
    }

    try {
        const decoded = jwt.verify(access_token, jwtSecretKey)
        result.payload= decoded.account_index
        result.success = true
    } 
    catch(err) {
        if (err.message === "jwt expired") {//access token이 완료된 상황 -> 완료 됬다고 알려줘야 함
            result.message = "token expired"
        } else {
            result.message = "token_not_verified"
            console.log("access_token Module ERR : token_not_verified")
        }
    }

    return result
}

module.exports = toeknVerify
