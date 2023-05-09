const router = require("express").Router()
const nodemailer = require("nodemailer")

const db = require("../modules/mysql")
const transporter = require("../modules/transporter")


router.post("/", async(req,res) => {

    // Request Data
    const emailValue = req.body.email 

    // Response Data
    const result = {
        "success": false,
        "message": null,
        "code": null
    }

    // Rules
    const emailRule = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i

    try {
        if (!emailRule.test(emailValue)){
            throw new Error("이메일 양식이 올바르지 않습니다.")
        } else if (emailValue === null || emailValue === undefined || emailValue === "" || emailValue === "@") {
            throw new Error("이메일 값이 올바르지 않습니다.")
        }

        const connection = await db.getConnection()
        const sql = `
            SELECT email FROM account WHERE email = ?
        `
        const values = [ emailValue]
        const [rows] = await connection.query(sql, values)
       

        if(rows.length !== 0){
            throw new Error("중복된 메일입니다.")
        }else{

            const random_code = Math.floor(Math.random() * 1000000)

            transporter.sendMail({
                from: process.env.NAVER_USER ,
                to: emailValue,
                subject: '[CarbonEye] 인증코드 안내',
                html: `
                    <html lang="kr">
                    <body>
                        <div>
                            <div style="margin-top: 30px;">
                                <p style="font-size: 14px; color: #222222;">인증코드를 확인해주세요.</p>
                                <h3 style="font-size: 20px;">[${random_code}]</h3>
                                <p style="font-size: 14px; color: #222222;"> 이메일 인증코드를 발급해드립니다.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            })
            
            console.log(random_code,'메일 인증번호')

            result.success = true
            result.code = random_code 

            await db.end()
            res.send(result)
        }
       
    } catch(e) {
        result.message = e.message
        console.log("POST /mail API ERR : ", e.message)
    }
    
})

module.exports = router 