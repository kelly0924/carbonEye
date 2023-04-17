const router = require("express").Router()
const jwt = require("jsonwebtoken")
const db = require("../modules/mysql")
const nowTime = require("../modules/kst")
const accessVerify = require("../modules/access_verify")
const refreshVerify = require("../modules/refresh_verify")
const newAccessToken = require("../modules/new_access_token")
const updateRefreshToken = require("../modules/update_refresh_token")

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
                                "expiresIn": "20s"
                            }
                        )

                        //refresh_token 발급
                        const refreshJwtToken=jwt.sign(
                            {
                                 "account_index": results[0].account_index
                            }, //refresh token의은 payload 최소 정보로 생성하기-> payload가 있으면 토큰이 길어 지져 때문
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

// my_page 불러오기 

router.get("/",(req,res)=>{
    // Request Data
    const refreshTokenValue = req.headers.refresh_token
    const accessTokenValue = req.headers.access_token
    
    //Respons Data
    
    const result = {
        "success": false,
        "message": null,
        "access_token": null,
        "refresh_token": null,
        "data": null
    }
    
    try{

        if(accessTokenValue !== undefined || refreshTokenValue !== undefined){ 
    
            if(accessVerify(accessTokenValue).success === true){//treu일 경우-> access_token이 유효한 경우 
                
                const accountIndexValue = accessVerify(accessTokenValue).payload
              

                db.getConnection(function(err, connection) {

                    const sql = `
                        SELECT user_name,email,pw FROM account WHERE account_index = ?
                    `
                    const values = [accountIndexValue]
                    connection.query(sql, values, function (error, results) {
                        if (error) {
                            console.log("db qeryerr",error)
                        }else{

                            result.success = true
                            result.data = results[0]

                            connection.release()
                            res.send(result)
                        }
                            
                        
                    })
                })

            }else if(accessVerify(accessTokenValue).success === true){//access_token은 유효한데  refresh token이 종료 된경우
                if(refreshVerify(refreshTokenValue).message === "token expired"){
                    result.refresh_token = updateRefreshToken(accessTokenValue).refresh_token
                    res.send(result)
                }

            }else if(accessVerify(accessTokenValue).message === "token expired"){//access_token이 완료된 경우 
                //refresh_token이 유효한 경우 
                if(refreshVerify(refreshTokenValue)){//true 인 경우 -> refresh_token이 유효한 경우 새로운 access_token생성

                    const accountIndexValue = refreshVerify(refreshTokenValue).payload
                    //const temp = newAccessToken(accountIndexValue, refreshTokenValue)
                    db.getConnection(function(err, connection) {

                        const sql = `
                            SELECT refresh_token, email FROM account WHERE account_index = ?
                        `
                        const values = [accountIndexValue]
                    
                        connection.query(sql, values, function (error, results) {
                            if (error) {
                                console.log("db qeryerr",error)
                            }else{
                                if(results[0].refresh_token === refreshTokenValue){//db에서의 토큰과 같은 경우 
                        
                                    // new access_token 발급
                                    const newAccessJwtToken=jwt.sign(
                                        {
                                            "account_index": accountIndexValue,
                                            "email": results[0].email,
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
                                }
            
                                connection.release()
                                res.send(result)
                                
                            }
                            
                        })
                        
                    })

                    // console.log("여기인강?",temp)
                    // res.send(result)

                }else{
                    throw new Error("모든 토큰이 완료 되었습니다.")
                }

            }
        }else{
            throw new Error("잘못된 토큰입니다.")
        }
    }catch(e){
        result.message = e.message
        console.log("GET /account API ERR : ", e.message)
    }

    

})


module.exports = router