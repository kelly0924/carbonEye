const router = require("express").Router()
const jwt = require("jsonwebtoken")
const db = require("../modules/mysql")


const nowTime = require("../modules/kst")
const accessVerify = require("../modules/access_verify")
const refreshVerify = require("../modules/refresh_verify")
const newAccessToken = require("../modules/new_access_token")
const updateRefreshToken = require("../modules/update_refresh_token")
const updateFoodCarbon = require("../modules/update_food_carbon")
const upload = require("../modules/upload")

const jwtSecretKey = process.env.JWT_SECRET_KEY

router.post("/",upload.single('img'), async(req, res) => {

    // Request Data
    const imgValue =  req.file ? req.file.path : ""
    console.log(imgValue,"img path")

    const refreshTokenValue = req.headers.authorization
    const accessTokenValue = req.headers.authorization
    
    // Response Data
    const result = {
        "success": false,
        "message": null
    }

    try{
        if(imgValue === undefined || imgValue === null || imgValue === ""){
            throw new Error("이미지 값이 올바르지 않습니다.")
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
                            INSERT INTO user_auth (account_index, img, date) VALUES(?, ?, ?) 
                        `
                        const values = [accountIndexValue, imgValue, nowTime()]
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
        console.log("POST /user_auth API ERR : ", e.message)
    }

})


// 사용자 이미지 업로드 가져오기 
router.get("/",async(req,res)=>{
    // Request Data
    const refreshTokenValue = req.headers.authorization
    const accessTokenValue = req.headers.authorization

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
                        SELECT user_name,img FROM user_auth JOIN account ON user_auth.account_index = account.account_index AND user_auth.account_index = ?
                    `
                    const values = [accountIndexValue]
                    const [rows]  = await connection.query(sql, values)
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
                throw new Error("토큰이 올바르지 않습니다.")
            }
        }else{
            throw new Error("토큰이 올바르지 않습니다.")
        }
    }catch(e){
        result.message = e.message
        console.log("GET /user_auth API ERR : ", e.message)
    }

    

})

module.exports = router