const admin = require('firebase-admin');

const collectionName = 'daily_rates'


const getExchangeRates = async () => {
    const db = admin.firestore()
    try {
        const ref = db.collection(collectionName);
        const query = await ref.get();
        if (query.empty) return [];
        const records = query.docs.map((doc) => {
            const data = doc.data();
            const { sellingRate, buyingRate, date, month, day, year } = data;
            return { sellingRate, buyingRate, date: new Date(date.seconds * 1000), month, day, year };
        });
        return records;
    } catch (error) {
        throw error;
    }
}
const getRates = async () => {
    const db = admin.firestore()
    try {
        const ref = db.collection(collectionName);
        const query = await ref.get();
        if (query.empty) return [];
        const records = query.docs.map((doc) => {
            const data = doc.data();
            const { sellingRate, buyingRate } = data;
            const strDate = data.date;
            const date = new Date(strDate.seconds * 1000);
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const year = date.getFullYear();
            return { sellingRate, buyingRate, date, month, day, year };
        });
        return records;
    } catch (error) {
        throw error;
    }
}


const getExchangeRatesPerMonth = async (year, month) => {
    const db = admin.firestore()
    try {
        const ref = db.collection(collectionName);
        const query = await ref.where("year", "==", year)
            .where("month", "==", month)
            .get();
        if (query.empty || query === undefined) return [];
        const records = query.docs.map((doc) => {
            const data = doc.data();
            const { sellingRate, buyingRate, date } = data;
            return { sellingRate, buyingRate, date: new Date(date.seconds * 1000) };
        });
        return records;
    } catch (error) {
        throw error;
    }
}
const getDailyRate = async (year, month, day) => {
    const db = admin.firestore()
    const dateOfRequest = new Date(year, month - 1, day);
    const weekDay = dateOfRequest.getDay();
    let dayOfRequest;
    let monthOfRequest;
    let yearOfRequest;
    if (weekDay === 0) {
        if (day === 1) {
            if (month === 1) {
                monthOfRequest = 12;
                dayOfRequest = 31;
                yearOfRequest = year - 1;
            }
        }
        else {
            dayOfRequest = day - 1;
            monthOfRequest = month;
            yearOfRequest = year;
        }
    }
    else {
        dayOfRequest = day;
        monthOfRequest = month;
        yearOfRequest = year;
    }

    const ref = db.collection(collectionName);
    const rateDoc = await ref.doc(`${monthOfRequest}-${dayOfRequest}-${yearOfRequest}`).get();
    if (!rateDoc.exists) return {};
    const record = rateDoc.data();
    const { sellingRate, buyingRate, date } = record;
    return { sellingRate, buyingRate, date: new Date(date.seconds * 1000) };
}
const getExchangeRatePerDay = async (year, month, day) => {
    try {
        const dailyRate = await getDailyRate(year, month, day);
        return dailyRate;
    } catch (error) {
        throw error;
    }
}
const getCurrentExchangeRate = async () => {
    try {
        const db = admin.firestore()
        const rateDoc = await db.collection(collectionName).orderBy('year', 'desc').orderBy("month", "desc").orderBy('day', 'desc').limit(1).get();
        if (rateDoc.empty) return {};
        const record = rateDoc.docs[0].data();
        const { sellingRate, buyingRate, date } = record;
        return { sellingRate, buyingRate, date: new Date(date.seconds * 1000) };
    } catch (error) {
        throw error;
    }
}
module.exports = {
    getCurrentExchangeRate,
    getExchangeRatePerDay,
    getExchangeRatesPerMonth,
    getExchangeRates
}