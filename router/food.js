const router = require("express").Router()
const jwt = require("jsonwebtoken")
const db = require("../modules/mysql")
const mysql = require('mysql2/promise');

const nowTime = require("../modules/kst")
const accessVerify = require("../modules/access_verify")
const refreshVerify = require("../modules/refresh_verify")
const newAccessToken = require("../modules/new_access_token")
const updateRefreshToken = require("../modules/update_refresh_token")
const updateFoodCarbon = require("../modules/update_food_carbon")

const jwtSecretKey = process.env.JWT_SECRET_KEY

router.get("/",async(req,res)=>{
    // Request Data
    const refreshTokenValue = req.headers.refresh_token
    const accessTokenValue = req.headers.access_token
    const menuValue = []// 메뉴들을 넣을 배열 

    if(req.query.menu === undefined || req.query.menu === null || req.query.menu === ""){
        throw new Error("옳바르지 않은 메뉴 입력입니다")   
    }else{
        let temp = req.query.menu.split(",")
        for(let i = 0; i < temp.length; i++){
            menuValue.push(temp[i])
        }
        console.log(menuValue)
    }
    //Respons Data
    
    const result = {
        "success": false,
        "message": null,
        "access_token": null,
        "refresh_token": null,
        "data": 0
    }
    
    try{
        
    
        if(accessTokenValue !== undefined || refreshTokenValue !== undefined){ 

            const accountIndexValue = accessVerify(accessTokenValue).payload
            if(accessVerify(accessTokenValue).success === true){//treu일 경우-> access_token이 유효한 경우 
                
                if(refreshVerify(refreshTokenValue).message === "token expired"){
                    const temp = await updateRefreshToken(accountIndexValue)
                    console.log("여기동",temp)
                    res.send(temp)
                }else{
                   
                    const connection = await db.getConnection()
                    const sql = `
                        SELECT sum(carbon) AS food_carbon  FROM food WHERE menu IN(?)
                    `
                    const values = [menuValue]
                    const [rows]  = await connection.query(sql, values)

                    result.success = true
                    result.data = rows[0].food_carbon
                    console.log(rows)
                    
                    await connection.release()

                    //update carbon , 누가, 언제  인지를 업데트 하기
                    await updateFoodCarbon(rows[0].food_carbon, accountIndexValue, nowTime())

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
            throw new Error("올바르지 않은 토큰입니다.")
        }
    }catch(e){
        result.message = e.message
        console.log("GET /food API ERR : ", e.message)
    }

    

})

//food 솔류션 가져오기_ carbon 배출량이 적은 것 부터 나열해주기

router.get("/solution",async(req,res)=>{
    // Request Data
    const refreshTokenValue = req.headers.refresh_token
    const accessTokenValue = req.headers.access_token

    //Respons Data
    
    const result = {
        "success": false,
        "message": null,
        "access_token": null,
        "refresh_token": null,
        "data": 0
    }
    
    try{
        
    
        if(accessTokenValue !== undefined || refreshTokenValue !== undefined){ 

            const accountIndexValue = accessVerify(accessTokenValue).payload
            if(accessVerify(accessTokenValue).success === true){//treu일 경우-> access_token이 유효한 경우 
                
                if(refreshVerify(refreshTokenValue).message === "token expired"){
                    const temp = await updateRefreshToken(accountIndexValue)
                    console.log("여기동",temp)
                    res.send(temp)
                }else{
                   
                    const connection = await db.getConnection()
                    const sql = `
                        SELECT menu, carbon  FROM food ORDER BY carbon ASC
                    `
                    const [rows]  = await connection.query(sql)
                    result.success = true
                    result.data = rows
    
                    await connection.release()
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
            throw new Error("올바르지 않은 토큰입니다.")
        }
    }catch(e){
        result.message = e.message
        console.log("GET /food/solution API ERR : ", e.message)
    }

    

})


module.exports = router
