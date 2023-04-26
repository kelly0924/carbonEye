const router = require("express").Router()
const jwt = require("jsonwebtoken")
const db = require("../modules/mysql")
const uuid = require('uuid');
const shortid = require('shortid');


const nowTime = require("../modules/kst")
const accessVerify = require("../modules/access_verify")
const refreshVerify = require("../modules/refresh_verify")
const newAccessToken = require("../modules/new_access_token")
const updateRefreshToken = require("../modules/update_refresh_token")
const updateFoodCarbon = require("../modules/update_food_carbon")

const jwtSecretKey = process.env.JWT_SECRET_KEY

//그룹 새성 api 
router.post("/", async(req, res) => {

    //초대 코드 만들기 
    shortid.characters(process.env.INVISI_CH)
    const inviteCode = shortid.generate(uuid.v4())

    // Request Data
    const groupNameValue = req.body.group_name
    const startTimeValue = req.body.start_time
    const endTimeValue = req.body.end_time
    const is_foodValue = req.body.is_food
    const is_trafficValue = req.body.is_traffic
    
    const refreshTokenValue = req.headers.refresh_token
    const accessTokenValue = req.headers.access_token
    
    // Response Data
    const result = {
        "success": false,
        "message": null
    }

    try{
        if(groupNameValue === undefined || groupNameValue === null || groupNameValue === ""){
            throw new Error("그룹 이름 값이 올바르지 않습니다.")
        }else if (startTimeValue === undefined || startTimeValue === null || startTimeValue === ""){
            throw new Error("시작 시간 값이 올바르지 않습니다.")
        }else if(endTimeValue === undefined || endTimeValue === null || endTimeValue === ""){
            throw new Error("끝 시간 값이 올바르지 않습니다.")
        }else if(is_foodValue === undefined || is_foodValue === null || is_foodValue === ""){
            throw new Error("음식 선택 값이 올바르지 않습니다.")
        }else if(is_trafficValue === undefined || is_trafficValue === null || is_trafficValue === ""){
            throw new Error("교통 선택 값이 올바르지 않습니다.")
        } else{
       
            if(accessTokenValue !== undefined || refreshTokenValue !== undefined){ 

                const accountIndexValue = accessVerify(accessTokenValue).payload

                if(accessVerify(accessTokenValue).success === true){//treu일 경우-> access_token이 유효한 경우 
                    
                    if(refreshVerify(refreshTokenValue).message === "token expired"){
                        const temp = await updateRefreshToken(accountIndexValue)
                        console.log("여기동",temp)
                        res.send(temp)
                    }else{
                    
                        const connection = await db.getConnection()
                        const groupSql = `
                            CREATE TABLE \`${groupNameValue}\` (
                                groud_join_index INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
                                group_index INT REFERENCES carbon_group(group_index),
                                account_index INT REFERENCES account(account_index),
                                total_carbon INT DEFAULT 0,
                                date TIMESTAMP DEFAULT NULL
                            );
                            
                        `
                        await connection.query(groupSql)

                      //group table에 insert 하기 
                       const insertSql =`
                            INSERT INTO carbon_group(group_name,manager_account,start_date, end_data,invite_code, is_food,is_traffic) VALUES(?, ?, ?, ?, ?, ?, ?) 
                       `
                       const values =[groupNameValue, accountIndexValue, startTimeValue, endTimeValue, inviteCode, is_foodValue, is_trafficValue]
                       await connection.query(insertSql, values)

                       result.success = true
                       result.message="group 생성."

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
        console.log("POST /group API ERR : ", e.message)
    }

})


// 모든 그룹 보기 
router.get("/", async(req, res) => {


    const refreshTokenValue = req.headers.refresh_token
    const accessTokenValue = req.headers.access_token
    
    // Response Data
    const result = {
        "success": false,
        "data":null,
        "message": null
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
                        SELECT group_index, group_name FROM carbon_group;
                    `
                    const [rows] = await connection.query(sql)

                    result.success = true
                    result.data = rows
                    result.message="성공"

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
          
        }
    }catch(e){
        result.message = e.message
        console.log("GET /group API ERR : ", e.message)
    }

})


//group 참여하기-> 초대 코드 보내기
router.get("/join", async(req, res) => {

   
    // Request Data
    const groupNameValue = req.query.group_name
    const groudIndexValue = req.query.group_index
    
    const refreshTokenValue = req.headers.refresh_token
    const accessTokenValue = req.headers.access_token
    
    // Response Data
    const result = {
        "success": false,
        "invite_code":null,
        "message": null
    }

    try{
        if(groupNameValue === undefined || groupNameValue === null || groupNameValue === ""){
            throw new Error("그룹 이름 값이 올바르지 않습니다.")
        }else if (groudIndexValue === undefined || groudIndexValue === null || groudIndexValue === ""){
            throw new Error("그룹 인덱스 값이 올바르지 않습니다.")
        } else{
       
            if(accessTokenValue !== undefined || refreshTokenValue !== undefined){ 

                const accountIndexValue = accessVerify(accessTokenValue).payload

                if(accessVerify(accessTokenValue).success === true){//treu일 경우-> access_token이 유효한 경우 
                    
                    if(refreshVerify(refreshTokenValue).message === "token expired"){
                        const temp = await updateRefreshToken(accountIndexValue)
                        res.send(temp)
                    }else{
                    
                        const connection = await db.getConnection()
                        //invite code 가져오기 
                        const selceSql = `
                             SELECT invite_code FROM carbon_group WHERE group_index = ?
                        `
                        const selectValues = [groudIndexValue]
                        const [rows] =await connection.query(selceSql, selectValues)

                       result.success = true
                       result.invite_code = rows[0].invite_code
                       result.message="성공"

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
        console.log("GET /group/join API ERR : ", e.message)
    }

})

// 초대코드 확인 후 참여 확인 
router.post("/join", async(req, res) => {

   
    // Request Data
    const inviteCodeValue = req.body.invite_code    
    const groudIndexValue = req.body.group_index
    const groupNameValue = req.body.group_name
    const refreshTokenValue = req.headers.refresh_token
    const accessTokenValue = req.headers.access_token
    
    // Response Data
    const result = {
        "success": false,
        "message": null
    }

    try{
        if(inviteCodeValue === undefined || inviteCodeValue === null || inviteCodeValue === ""){
            throw new Error("초대코드 값이 올바르지 않습니다.")
        }else if(groudIndexValue === undefined || groudIndexValue === null || groudIndexValue === ""){
            throw new Error("그룹 index 값이 올바르지 않습니다.")
        }else if(groupNameValue === undefined || groupNameValue === null || groupNameValue === ""){
            throw new Error("그룹 이름 값이 올바르지 않습니다.")
        } else{
       
            if(accessTokenValue !== undefined || refreshTokenValue !== undefined){ 

                const accountIndexValue = accessVerify(accessTokenValue).payload

                if(accessVerify(accessTokenValue).success === true){//treu일 경우-> access_token이 유효한 경우 
                    
                    if(refreshVerify(refreshTokenValue).message === "token expired"){
                        const temp = await updateRefreshToken(accountIndexValue)
                        res.send(temp)
                    }else{
                    
                        const connection = await db.getConnection()
                         //invite code 가져오기 
                        const selceSql = `
                            SELECT invite_code FROM carbon_group WHERE group_index = ?
                        `
                        const selectValues = [groudIndexValue]
                        const [rows] =await connection.query(selceSql, selectValues)
                        const tempInviteCode = rows[0].invite_code

                        if(tempInviteCode === inviteCodeValue){
                            const sql = `
                                INSERT INTO \`${groupNameValue}\` (group_index, account_index)  VALUES(?, ?)
                            `
                            const values =[groudIndexValue, accountIndexValue]
                            await connection.query(sql, values)
                            result.success = true
                            result.message="가입 성공."

                        }

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
        console.log("POST /group/join API ERR : ", e.message)
    }

})

//그룹 참여 후 자신의 탄소량을 update 하는 api
router.put("/carbon", async(req, res) => {

   
    // Request Data 
    const groudIndexValue = req.body.group_index
    const groupNameValue = req.body.group_name
    const myCarbonValue= req.body.my_carbon

    const refreshTokenValue = req.headers.refresh_token
    const accessTokenValue = req.headers.access_token
    
    // Response Data
    const result = {
        "success": false,
        "message": null
    }

    try{
        if(myCarbonValue === undefined || myCarbonValue === null || myCarbonValue === ""){
            throw new Error("초대코드 값이 올바르지 않습니다.")
        }else if(groudIndexValue === undefined || groudIndexValue === null || groudIndexValue === ""){
            throw new Error("그룹 index 값이 올바르지 않습니다.")
        }else if(groupNameValue === undefined || groupNameValue === null || groupNameValue === ""){
            throw new Error("그룹 이름 값이 올바르지 않습니다.")
        } else{
       
            if(accessTokenValue !== undefined || refreshTokenValue !== undefined){ 

                const accountIndexValue = accessVerify(accessTokenValue).payload

                if(accessVerify(accessTokenValue).success === true){//treu일 경우-> access_token이 유효한 경우 
                    
                    if(refreshVerify(refreshTokenValue).message === "token expired"){
                        const temp = await updateRefreshToken(accountIndexValue)
                        res.send(temp)
                    }else{
                    
                        const connection = await db.getConnection()
                         //invite code 가져오기 
                        const sql = `
                            UPDATE  \`${groupNameValue}\` SET total_carbon = total_carbon + ?, date =? WHERE account_index = ?
                        `
                        const values = [myCarbonValue, nowTime(), accountIndexValue]
                        await connection.query(sql, values)
                        
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
        console.log("POST /group/join API ERR : ", e.message)
    }

})

// 그룹 랭킹 가져오기 
router.get("/ranking", async(req, res) => {

    // Request Data
    const groupNameValue = req.query.group_name
    
    const refreshTokenValue = req.headers.refresh_token
    const accessTokenValue = req.headers.access_token
    
    // Response Data
    const result = {
        "success": false,
        "data":null,
        "message": null
    }

    try{
        if(groupNameValue === undefined || groupNameValue === null || groupNameValue === ""){
            throw new Error("그룹 이름 값이 올바르지 않습니다.")
        }else{
       
            if(accessTokenValue !== undefined || refreshTokenValue !== undefined){ 

                const accountIndexValue = accessVerify(accessTokenValue).payload

                if(accessVerify(accessTokenValue).success === true){//treu일 경우-> access_token이 유효한 경우 
                    
                    if(refreshVerify(refreshTokenValue).message === "token expired"){
                        const temp = await updateRefreshToken(accountIndexValue)
                        res.send(temp)
                    }else{
                    
                        const connection = await db.getConnection()
                        
                            const Sql = `
                                SELECT user_name, total_carbon FROM \`${groupNameValue}\` JOIN account 
                                ON \`${groupNameValue}\`.account_index = account.account_index ORDER BY total_carbon DESC
                            `
                            const [rows ] =await connection.query(sql)

                            result.success = true
                        
                            result.message="성공"
                            result.data = rows
                            connection.release()
                            res.send(result)
                        }
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
            }
        
    }catch(e){
        result.message = e.message
        console.log("GET /group/ranking API ERR : ", e.message)
    }   

})

module.exports = router
