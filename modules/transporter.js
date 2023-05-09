
const nodemailer = require("nodemailer")


const transporter = nodemailer.createTransport({
	service: 'naver',
	host: 'smtp.naver.com',  // SMTP 서버명
	port: 465,  // SMTP 포트
	auth: {
		user: process.env.NAVER_USER,  // 네이버 아이디
		pass: process.env.NAVER_PASS,  // 네이버 비밀번호
	},
})

module.exports = transporter