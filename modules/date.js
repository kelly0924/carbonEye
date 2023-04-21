

   
const moment = require("../modules/kst")

const dateConverter = (date) => {

    const today = moment()
    const timeValue = new Date(date)
    betweenTime = Math.floor((today.getTime() - timeValue.getTime()) / 1000 / 60)

   
    const betweenTimeDay = Math.floor(betweenTime / 60 / 24)
    if (betweenTimeDay < 365) {
        return betweenTimeDay
    }
}


module.exports = dateConverter