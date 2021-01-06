require('dotenv').config();
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const { getCurrentExchangeRate,
    getExchangeRatePerDay,
    getExchangeRatesPerMonth,
    getExchangeRates } = require('./exchange-rate-services.js');

const {scrapeCbl} = require('./cbl-rate-scraper.js');


const app = express();
app.use(cors({ origin: true }));
admin.initializeApp();
const CACHE_TIME = 3600;

let currentRateCache;
let currentRateCacheTime;

let allRatesCache;
let allRateCacheTime;

let monthlyRatesCache;
let monthlyRateCacheTime;
let monthlyRateYearParam;
let monthlyRateMonthParam;

let dailyRateCache;
let dailtlyRateCacheTime;
let dailyRateYearParam;
let dailyRateMonthParam;
let dailyRateDayParam;
app.get('/', async (req, res) => {
    try {
        if (currentRateCache && currentRateCacheTime > Date.now() - CACHE_TIME * 1000) {
            return res.status(200).json(currentRateCache);
        }
        const currentRate = await getCurrentExchangeRate();
        currentRateCache = currentRate;
        currentRateCacheTime = Date.now();
        return res.status(200).json(currentRate);
    } catch (error) {
        handleError(res, error);
    }
});
app.get('/all', async (req, res) => {
    try {
        if (allRatesCache && allRateCacheTime > Date.now() - CACHE_TIME * 1000) {
            return res.status(200).json(allRatesCache);
        }
        const rates = await getExchangeRates();
        allRatesCache = rates;
        allRateCacheTime = Date.now();
        return res.status(200).json(rates);
    } catch (error) {
        handleError(res, error);
    }
});
app.get('/monthly-rates/:month/:year', async (req, res) => {
    try {
        const { month, year } = req.params;
        if (monthlyRatesCache && monthlyRateMonthParam === month && monthlyRateYearParam === year && monthlyRateCacheTime > Date.now() - CACHE_TIME * 1000) {
            return res.status(200).json(monthlyRatesCache);
        }
        const rates = await getExchangeRatesPerMonth(parseInt(year), parseInt(month));
        monthlyRateCacheTime = Date.now();
        monthlyRatesCache = rates;
        monthlyRateMonthParam = month;
        monthlyRateYearParam = year;
        return res.status(200).json(rates);
    } catch (error) {
        handleError(res, error);
    }
});
app.get('/daily-rate/:month/:day/:year', async (req, res) => {
    try {
        const { month, year, day } = req.params;
        if (dailyRateCache && dailyRateDayParam === day
            && dailyRateMonthParam === month
            && dailyRateYearParam === year
            && dailtlyRateCacheTime > Date.now() - CACHE_TIME * 1000) {
            return res.status(200).json(dailyRateCache);
        }
        const rates = await getExchangeRatePerDay(parseInt(year), parseInt(month), parseInt(day));
        dailyRateCache = rates;
        dailyRateDayParam = day
        dailyRateMonthParam = month
        dailyRateYearParam = year
        dailtlyRateCacheTime = Date.now();
        return res.status(200).json(rates);
    } catch (error) {
        handleError(res, error);
    }
});
app.get('/scrape-rates', async(req, res)=>{
    try {      
        const rates = await scrapeCbl();
        uploadExchangeRates(rates);
        return res.status(200).json(rates);
       
    } catch (error) {
        handleError(res, error);
    }
})
const handleError = (res, err) => {
    return res.status(500).send({ message: `${err.code} - ${err.message}` });
};

const uploadExchangeRates = (rates)=>{
    const db = admin.firestore();
    rates.forEach(rate=>{
        const id = rate.month + '-'+rate.day+'-'+rate.year;
        console.log(rate);
        db.collection('daily_rates')
            .doc(id)
            .set(rate)
            .then(res=>{
                console.log(res);
            }).catch(error=>{
                console.error("Error writing document: ", error);
            });
    })
}

exports.cbl_rate_job = functions
  .runWith({ memory: "1GB", timeoutSeconds:300 })
  .pubsub.schedule("every 2 hours")
  .onRun(async (context) => {
    try {
      const rates = await scrapeCbl();
      uploadExchangeRates(rates);
      return rates;
    } catch (error) {
      return error;
    }
  });
exports.cbl_api = functions.runWith({ memory: "1GB", timeoutSeconds: 300 }).https.onRequest(app);
