const router = require("express").Router()
const db = require("../modules/mysql")
const uuid = require('uuid');
const shortid = require('shortid');
const cron = require('node-cron');

const accessVerify = require("../modules/access_verify")
const refreshVerify = require("../modules/refresh_verify")
const newAccessToken = require("../modules/new_access_token")
const updateRefreshToken = require("../modules/update_refresh_token")


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
    console.log(groupNameValue, startTimeValue, endTimeValue, is_foodValue,is_trafficValue , req.body)

    const refreshTokenValue = req.headers.authorization
    const accessTokenValue = req.headers.authorization
    
    // Response Data
    const result = {
        "success": false,
        "message": null,
        "invite_code": null
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
                                account_index INT REFERENCES account(account_index)
                                
                            );
                            
                        `
                        await connection.query(groupSql)

                        //group table에 insert 하기 
                        const insertSql =`
                                INSERT INTO carbon_group(group_name,manager_account,start_date, end_data,invite_code, is_food,is_traffic) VALUES(?, ?, ?, ?, ?, ?, ?) 
                        `
                        const values =[groupNameValue, accountIndexValue, startTimeValue, endTimeValue, inviteCode, is_foodValue, is_trafficValue]
                        await connection.query(insertSql, values)

                        // 그룹을 생성한 사람도 그 그룹에 참여하게 하기 
                    
                        const joinSql = `
                                INSERT INTO \`${groupNameValue}\` (account_index) VALUES(?)
                            `
                        const joinValues =[accountIndexValue]
                        console.log(joinValues)
                        await connection.query(joinSql, joinValues)

                        // 그룹을 만든 사람을  account table invite에 넣어주기 
                        const insertJoinSql = `UPDATE account SET invite = ? WHERE account_index = ? `
                        const insertJoinValues = [String(inviteCode), accountIndexValue]
                        await connection.query(insertJoinSql, insertJoinValues)

                        result.success = true
                        result.invite_code = inviteCode
                        result.message="group 생성."

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
        }
    }catch(e){
        result.message = e.message
        console.log("POST /group API ERR : ", e.message)
    }

})


// 초대코드 확인 후 참여 확인 // 이미 참여한 사람인지 체크 하기??
router.post("/join", async(req, res) => {
   
    // Request Data
    const inviteCodeValue = req.body.invite_code    

    const refreshTokenValue = req.headers.authorization
    const accessTokenValue = req.headers.authorization
    
    // Response Data
    const result = {
        "success": false,
        "message": null
    }

    try{
        if(inviteCodeValue === undefined || inviteCodeValue === null || inviteCodeValue === ""){
            throw new Error("초대코드 값이 올바르지 않습니다.")
        }else{
       
            if(accessTokenValue !== undefined || refreshTokenValue !== undefined){ 

                const accountIndexValue = accessVerify(accessTokenValue).payload

                if(accessVerify(accessTokenValue).success === true){//treu일 경우-> access_token이 유효한 경우 
                    
                    if(refreshVerify(refreshTokenValue).message === "token expired"){
                        const temp = await updateRefreshToken(accountIndexValue)
                        res.send(temp)
                    }else{
                    
                        const connection = await db.getConnection()
                         //invite code & 그룹 이름 가져오기 
                        const selceSql = `
                            SELECT invite_code, group_name FROM carbon_group WHERE invite_code = ?
                        `
                        const selectValues = [inviteCodeValue]
                        const [rows] =await connection.query(selceSql, selectValues)
                        //그룹이름, 초대 초드 
                        const tempInviteCode = rows[0].invite_code
                        const groupNameValue = rows[0].group_name

                        console.log(tempInviteCode, groupNameValue, "여기 제대로 잘 나오나?")

                        if(tempInviteCode === inviteCodeValue){

                            //이미 가입한 그룹에 또다시 가입 하지 않도록 하기!
                            const checkSql = `SELECT account_index FROM \`${groupNameValue}\` WHERE account_index = ? `
                            const checkValues = [accountIndexValue]
                            const [ rows ] = await connection.query(checkSql, checkValues)
                            
                            if(rows.length === 0){
                                const sql = `
                                    INSERT INTO \`${groupNameValue}\` (account_index) VALUES(?)
                                `
                                const values =[accountIndexValue]
                                await connection.query(sql, values)

                                // 가입시 account table invite에 넣어 주기 
                                const insertSql = `UPDATE account SET invite = ? WHERE account_index = ? `
                                const insertValues = [String(inviteCodeValue), accountIndexValue]
                                await connection.query(insertSql, insertValues)

                                result.success = true
                                result.message="가입 성공."
                            }else {
                                result.message="이미 가입한 그룹 입니다."
                            }
                            
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

// 그룹 랭킹 가져오기 
router.get("/rank", async(req, res) => {

    // Request Data
    //const groupNameValue = req.query.group_name
    const groupInviteCordValue = req.query.invite_code
    
    const refreshTokenValue = req.headers.authorization
    const accessTokenValue = req.headers.authorization
    
    console.log(groupInviteCordValue,"ranking", accessTokenValue)
    // Response Data
    const result = {
        "success": false,
        "data":null,
        "message": null
    }

    try{
        if(groupInviteCordValue === undefined || groupInviteCordValue === null || groupInviteCordValue === ""){
            throw new Error("초대 코드가 올바르지 않습니다.")
        }else{
       
            if(accessTokenValue !== undefined || refreshTokenValue !== undefined){ 

                const accountIndexValue = accessVerify(accessTokenValue).payload

                if(accessVerify(accessTokenValue).success === true){//treu일 경우-> access_token이 유효한 경우 
                    
                    if(refreshVerify(refreshTokenValue).message === "token expired"){
                        const temp = await updateRefreshToken(accountIndexValue)
                        res.send(temp)
                    }else{
                    
                        const connection = await db.getConnection()
                        //group 이름 가져오기 

                        console.log("여기??")
                        const selectNameSql = `
                            SELECT group_name from carbon_group WHERE invite_code =?
                        `
                        const selectValues = [groupInviteCordValue]
                        const [tempRows] = await connection.query(selectNameSql, selectValues)
                        console.log(tempRows," 이름")

                        const groupNameValue = tempRows[0].group_name

                        console.log(groupNameValue,"이름")

                       //랭킹 api 호출 시 사용자 update total_carbon 한다음 select 하기 
                       const updateSql = ` 
                            UPDATE carbon AS t1
                            JOIN (
                            SELECT account_index, SUM(food_carbon) AS total_food_carbon
                            FROM carbon
                            GROUP BY account_index
                            ) AS subquery
                            ON t1.account_index = subquery.account_index
                            SET t1.total_carbon = subquery.total_food_carbon

                       `
                       await connection.query(updateSql)

                       console.log(" 출력됨?")
                        const sql = `
                            SELECT user_name, carbon.total_carbon FROM \`${groupNameValue}\` JOIN account 
                            ON \`${groupNameValue}\`.account_index = account.account_index  
                            JOIN carbon ON \`${groupNameValue}\`.account_index = carbon.account_index ORDER BY total_carbon ASC
                        `
                        const [rows ] =await connection.query(sql)

                        result.success = true
                    
                        result.message="성공"
                        result.data = rows
                        console.log(rows,"랭킹 데이터")
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
        }
        
    }catch(e){
        result.message = e.message
        console.log(e.message)
        console.log("GET /group/rank API ERR : ", e.message)
    }   

})

//그룹 종료 ~ 삭제하기 

module.exports = router
