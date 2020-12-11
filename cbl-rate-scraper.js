const axios = require("axios").default;
const cheerio = require("cheerio");

const fethHtml = async url => {
  try {
    const { data } = await axios.get(url);
    return data;
  } catch {
    console.error(
      `ERROR: An error occurred while trying to fetch the URL: ${url}`
    );
  }
};

const scrapeCbl = async ()=>{
  const url = "https://cbl.org.lr/";
  const html = await fethHtml(url);
  const selector = cheerio.load(html);
  const searchResults = selector("body").find("#background-image tbody tr");
  const rates = searchResults
    .map((idx, el) => {
      const elementSelector = selector(el);
       const value = elementSelector.find('td').text().trim();
       return value;
    })
    .get();
    const txtRates = rates.map(rate => {
      const rateArr = rate.split('/');
      return rateArr;
    });

    const exchangeRates = txtRates.map(txtRate =>{
      const [dateAndBuying, selling] = txtRate;
      const dateAndBuyingArr = dateAndBuying.split('L$');
      const sellingArr = selling.split('L$');
      const dateStr = dateAndBuyingArr[0];
      const buyingStr = dateAndBuyingArr[1];
      const sellingStr = sellingArr[1];

      const date = new Date(dateStr);
      const month = date.getMonth()+1;
      const year = date.getFullYear();
      const day = date.getDate();
      const buyingRate = parseFloat(buyingStr);
      const sellingRate = parseFloat(sellingStr);
      return {date, month, day, year, buyingRate, sellingRate};
    })
  
  return exchangeRates;
}

module.exports = {
    scrapeCbl
}