const router = require("express").Router()
const jwt = require("jsonwebtoken")
const db = require("../modules/mysql")

const jwtSecretKey = process.env.JWT_SECRET_KEY

// 로그인
router.post("/login",async(req, res) => {

    // Request Data
    const emailValue = req.body.email
    const passwordValue = req.body.pw

    
    console.log(emailValue,passwordValue)
    // Response Data
    const result = {
        "success": false,
        "message": null,
        "access_token": null,
        "refresh_token": null,
        "data": null
    }

    try {
        if (emailValue === null || emailValue === undefined || emailValue === "") {
            throw new Error("이메일 값이 올바르지 않습니다.")
        } else if(passwordValue === null || passwordValue === undefined || passwordValue === "") {
            throw new Error("비밀번호 값이 올바르지 않습니다.")
        } else {
            //mysql 연결
            db.connect()

            const sql = `
                SELECT account_index  FROM account WHERE email = ? AND  pw = ?
            `
            const values = [emailValue, passwordValue]
        
            db.query(sql, values, function (error, results) {
                if (error) {
                   console.log("db qeryerr",error)
                }
                console.log(results);

                const temp =results[0].account_index
                console.log(temp);
                if (temp.length == 0) {
                    throw new Error("계정 정보가 올바르지 않습니다.")
                } else {
                   
                    //access_token 발급
                    const accessJwtToken=jwt.sign(
                        {
                            "account_index": results[0].account_index,
                            "email": emailValue,
                            "role": "client"
                        },
                        jwtSecretKey,
                        {
                            "issuer": "kelly",
                            "expiresIn": "1h"
                        }
                    )

                    //refresh_token 발급
                    const refreshJwtToken=jwt.sign(
                        {
                            "account_index": results[0].account_index,
                            "email": emailValue,
                            "role": "client"
                        },
                        jwtSecretKey,
                        {
                            "issuer": "kelly",
                            "expiresIn": "14d"
                        }
                    )

                    const refreshSql ='UPDATE account SET refresh_token = ? WHERE account_index =?'
                    const tokenValues=[refreshJwtToken,results[0].account_index]
                    db.query(refreshSql, tokenValues, function (error) {
                        if (error) {
                            console.log("token sql err",error)
                        }

                    })
 

                    result.success = true
                    result.refresh_token = refreshJwtToken
                    result.access_token = accessJwtToken
                    result.data = results[0]

                    if (db){ 
                        db.end()
                    }
                    res.send(result)
                    
                }
            })
            
            
        }
    } catch(e) {
        result.message = e.message
        console.log("POST /account/login API ERR : ", e.message)
    }

})

module.exports = router