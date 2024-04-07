// Button displays today's exchange rate
document.getElementById("fetchButton").addEventListener("click", async () => {
  const fromCurrency = document.getElementById("exchange-from").value;
  const toCurrency = document.getElementById("exchange-to").value;

  // Check if fromCurrency is equal to toCurrency
  if (fromCurrency === toCurrency) {
    return; // Exit the function early
  }

  // Make a POST request to the server with selected currencies
  try {
    const response = await axios.post("/query", { fromCurrency, toCurrency });

    const exchangeRate = response.data.exchangeRate;

    document.getElementById(
      "result"
    ).innerText = `Today's exchange rate from ${fromCurrency} to ${toCurrency}: ${exchangeRate}`;
    document.getElementById("result").style.color = "black"
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    document.getElementById("result").innerText =
      "Error fetching exchange rate";
  }
});

// Update table on selections
document.addEventListener('DOMContentLoaded', function () {
  const fromCurrency = document.getElementById('exchange-from');
  const toCurrency = document.getElementById('exchange-to');

  // Add event listeners to both select elements
  fromCurrency.addEventListener('change', fetchData);
  toCurrency.addEventListener('change', fetchData);

  // Fetches new data
  async function fetchData() {
    const selectedOption1 = fromCurrency.value;
    const selectedOption2 = toCurrency.value;

    try {
      const response = await axios.post("/getLastWeekData", { selectedOption1, selectedOption2 })
      const rates = response.data.exchangeRates
      console.log(rates)
      updateTable(rates.slice(1))
      getChart(rates)

    } catch (error) {
      console.log(error)
    }

  }

  // Dynamically updates table
  function updateTable(data) {
    const tableBody = document.querySelector('#dataTable tbody');
    tableBody.innerHTML = ''; // Clear existing table data

    // Populate table with fetched data
    data.forEach(function (row) {
      const tr = document.createElement('tr');
      const date = new Date(row.Date * 1000)

      const year = date.getFullYear();
      const month = ('0' + (date.getMonth() + 1)).slice(-2);
      const day = ('0' + date.getDate()).slice(-2);

      const dateString = `${year}-${month}-${day}`;

      tr.innerHTML = `<td>${dateString}</td><td>${row.ConversionRate}</td>`;
      tableBody.appendChild(tr);
    });
  }
});

// Gets chart from backend
async function getChart(data) {
  const dataArray = [];
  const labelsArray = [];

  for (const pair of data) {
    const date = new Date(pair.Date * 1000);

    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);

    const dateString = `${year}-${month}-${day}`;

    dataArray.push(pair.ConversionRate);
    labelsArray.push(dateString);
  }

  dataArray.reverse();
  labelsArray.reverse();
  const currentCurrencyPair = data[0].CurrencyPair;

  try {
    const response = await axios.post('/getChart', {dataArray, labelsArray, currencyPair: currentCurrencyPair} );
    const chartUrl = response.data;

    // Create an image element and set its source to the chart URL
    const imgElement = document.createElement('img');
    imgElement.src = chartUrl;

    // Append the image element to the div with id "graph"
    const graphDiv = document.getElementById('historicalGraph');
    graphDiv.innerHTML = ''; // Clear previous content
    graphDiv.appendChild(imgElement);

  } catch (error) {
    console.error('Error fetching chart:', error);
  }

  
}
