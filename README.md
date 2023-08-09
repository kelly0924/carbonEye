# 졸업 프로젝트 - CarbonEye

## 프로젝트 설명
2050 탄소중립 시나리오와 2030 국가 온실가스 감축목표 상향안이 확정, 발표됨에 따라 본 프로젝트는 개개인의 탄소 소비량을 계산하고 그에 따른 탄소 절감 솔루션 제공, 탄소 소비량 랭킹 시스템을 활용해 보다 쉽고 재미있게 탄소 사용량에 대한 심각성을 인지시키고 더 나아가 절감할 수 있는 방법까지 제공할 수 있는 웹/앱 입니다.

## 담당 역할: Back-end 구현

## 개발환경 및 사용한 스킬
1.	Mysql → npm mysql-server 패키지
2.	ubuntu 18.00 → GroomID 에서 계정으로 구매 후 사용
3.	express -> express를 사용한 웹서버 구축
4.	node.js → npm 을 이용한 패키지 관리
5.	JWT → jsonwebtoken 사용자 인증을 위한 인증 방법
6.	node-multer →  node.js 에서 사용하는 이미지 업로드 모듈
7.	서버를 background 실행 → pm2 node.js에서 백그라운드로 서버 돌리는 모듈



## 협업 틀
1. 피그마
2. 노션
3. git

## 프로젝트 특징
#### 회원가입 & 로그인

1. Node mailer 모듈을 이용한 이메일 인증
2. 로그인시 access token 발급
3. MySQL을 사용한 회원정보 저장 및 관리

![](https://velog.velcdn.com/images/kelly2017/post/3d3d30ce-7254-44c2-8f1e-099c32181f55/image.png)

#### 이미지 upload
1. access token을 기반으로 사용자 인증 
2. Node Multer를 이용한 GroomIDE 웹서버에 이미지 업로드
3. MySQL을 사용한 이미지 링크 데이터 저장

![](https://velog.velcdn.com/images/kelly2017/post/d34c479e-eff0-4734-868c-c485f4738b9e/image.png)

#### 파이썬 웹서버 구축 

1. Flask  웹 프레임워크를 이용한 웹서버 구축
2. 이미지 업로드 API 작성
3. Machine learning 으로 이미지 보내고 결과 값 가져오는 API 작성


## 데이터 베이스 설계
#### ERD
![](https://velog.velcdn.com/images/kelly2017/post/222a368c-6a9b-463c-aa0b-1a8ee8798ae4/image.png)
