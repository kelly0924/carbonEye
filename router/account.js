const router = require("express").Router()
const jwt = require("jsonwebtoken")
const db = require("../modules/mysql")
const nowTime = require("../modules/kst")

const jwtSecretKey = process.env.JWT_SECRET_KEY

// 로그인
router.post("/login",(req, res) => {

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
            // //mysql 연결
            db.getConnection(function(err, connection) {

                const sql = `
                    SELECT account_index  FROM account WHERE email = ? AND  pw = ?
                `
                const values = [emailValue, passwordValue]
            
                connection.query(sql, values, function (error, results) {
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
                        //refresh upload 
                        const refreshSql ='UPDATE account SET refresh_token = ? WHERE account_index =?'
                        const tokenValues=[refreshJwtToken,results[0].account_index]
                        connection.query(refreshSql, tokenValues, function (error) {
                            if (error) {
                                console.log("token sql err",error)
                            }

                            connection.release()
                        })
    

                        result.success = true
                        result.refresh_token = refreshJwtToken
                        result.access_token = accessJwtToken
                        result.data = results[0]
                    
                        res.send(result)
                        
                    }
                })
            })
            

        }
    } catch(e) {
        result.message = e.message
        console.log("POST /account/login API ERR : ", e.message)
    }

})

//회원가입 
router.post("/",(req, res) => {

    const joinTime = nowTime()//회원가입 시간 

    // Request Data
    const emailValue = req.body.email
    const passwordValue = req.body.pw
    const nameValue =  req.body.name
    
    // Response Data
    const result = {
        "success": false,
        "message": null
    }

    try {
        if (emailValue === null || emailValue === undefined || emailValue === "") {
            throw new Error("이메일 값이 올바르지 않습니다.")
        } else if(passwordValue === null || passwordValue === undefined || passwordValue === "") {
            throw new Error("비밀번호 값이 올바르지 않습니다.")
        } else if(nameValue === null || nameValue === undefined || nameValue === "") {
            throw new Error("이름 값이 올바르지 않습니다.")
        }else {
            
            db.getConnection(function(err, connection) {

                const sql = `
                    INSERT INTO account (user_name, email, pw, date)  VALUES (?,?,?,?)
                `
                const values = [nameValue, emailValue, passwordValue, joinTime]
            
                connection.query(sql, values, function (error, results) {
                    if (error) {
                        console.log("db qeryerr",error)
                    }else{
                        result.success = true
                        result.message = "회원가입 성공"
                        connection.release()
                        res.send(result)
                    }
                        
                    
                })
            })
            

        }
    } catch(e) {
        result.message = e.message
        console.log("POST /account API ERR : ", e.message)
    }

})



module.exports = router