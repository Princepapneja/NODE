import moment from "moment-timezone";
export default function createCronPattern(datetimeStr) {
    const dt = moment(datetimeStr);

    const dtMinus30 = dt.subtract(30, 'minutes');

    const minute = dtMinus30.minute();
    const hour = dtMinus30.hour();
    const day = dtMinus30.date();
    const month = dtMinus30.month() + 1; 
    const cronPattern = `${minute} ${hour} ${day} ${month} *`;

    return cronPattern;
}
