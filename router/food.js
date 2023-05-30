const router = require("express").Router()
const jwt = require("jsonwebtoken")
const db = require("../modules/mysql")


const nowTime = require("../modules/kst")
const accessVerify = require("../modules/access_verify")
const refreshVerify = require("../modules/refresh_verify")
const newAccessToken = require("../modules/new_access_token")
const updateRefreshToken = require("../modules/update_refresh_token")
const updateFoodCarbon = require("../modules/update_food_carbon")

const jwtSecretKey = process.env.JWT_SECRET_KEY

//food 탄소량 넣기 
router.post("/",async(req, res) => {


    // Request Data
    const temp =  req.body.carbon
    const carbonValue = parseInt(temp)

    const refreshTokenValue = req.headers.authorization
    const accessTokenValue = req.headers.authorization
    
    // Response Data
    const result = {
        "success": false,
        "message": null
    }

    try{
        if(carbonValue === undefined || carbonValue === null || carbonValue === ""){
            throw new Error("carbon 값이 올바르지 않습니다.")
        }else{
       
            if(accessTokenValue !== undefined || refreshTokenValue !== undefined){ 

                const accountIndexValue = accessVerify(accessTokenValue).payload

                if(accessVerify(accessTokenValue).success === true){//treu일 경우-> access_token이 유효한 경우 
                    
                    if(refreshVerify(refreshTokenValue).message === "token expired"){
                        const temp = await updateRefreshToken(accountIndexValue)
                        res.send(temp)
                    }else{
                    
                        const connection = await db.getConnection()
                        const sql = `
                            INSERT INTO carbon (account_index, food_carbon, date) VALUES(?, ?, ?) 
                        `
                        const values = [accountIndexValue, carbonValue, nowTime()]
                        await connection.query(sql, values)

                        result.success = true
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
                    throw new Error("토큰이 올바르지 않습니다.")
                }
            }else{
                throw new Error("토큰이 올바르지 않습니다.")
            }
        }
    }catch(e){
        result.message = e.message
        console.log("POST /food API ERR : ", e.message)
    }

    

})



//음식 넣은 것에 대한 탄소량 가져오기 api 
router.get("/",async(req,res)=>{
    // Request Data
    const refreshTokenValue = req.headers.authorization
    const accessTokenValue = req.headers.authorization
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
            throw new Error("토큰이 올바르지 않습니다.")
        }
    }catch(e){
        result.message = e.message
        console.log("GET /food API ERR : ", e.message)
    }

    

})

//food 솔류션 가져오기_ carbon 배출량이 적은 것 부터 나열해주기

router.get("/solution",async(req,res)=>{

    let randomNumber = Math.floor(Math.random() * (20 - 1 + 1))

    // Request Data
    const refreshTokenValue = req.headers.authorization
    const accessTokenValue = req.headers.authorization

    //Respons Data
    const result = {
        "success": false,
        "message": null,
        "data": null
    }
    
    try{
        
    
        if(accessTokenValue !== undefined || refreshTokenValue !== undefined){ 

            const accountIndexValue = accessVerify(accessTokenValue).payload
            if(accessVerify(accessTokenValue).success === true){//treu일 경우-> access_token이 유효한 경우 
                
                if(refreshVerify(refreshTokenValue).message === "token expired"){
                    const temp = await updateRefreshToken(accountIndexValue)
                    res.send(temp)
                }else{
                   
                    const connection = await db.getConnection()
                    const sql = `
                        SELECT * FROM food_solution
                    `
                    const [rows]  = await connection.query(sql)
                    result.success = true
                    result.data = rows[randomNumber]
    
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
            throw new Error("토큰이 올바르지 않습니다.")
        }
    }catch(e){
        result.message = e.message
        console.log("GET /food/solution API ERR : ", e.message)
    }

    

})


module.exports = router
