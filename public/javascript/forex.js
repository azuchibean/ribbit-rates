document.getElementById("fetchButton").addEventListener("click", async () => {
  const fromCurrency = document.getElementById("exchange-from").value;
  const toCurrency = document.getElementById("exchange-to").value;

  // Make a POST request to the server with selected currencies
  try {
    const response = await axios.post("/query", { fromCurrency, toCurrency });

    const exchangeRate = response.data.exchangeRate;

    document.getElementById(
      "result"
    ).innerText = `Exchange rate from ${fromCurrency} to ${toCurrency}: ${exchangeRate}`;
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    document.getElementById("result").innerText =
      "Error fetching exchange rate";
  }
});

// Update table on selections
document.addEventListener('DOMContentLoaded', function() {
  const fromCurrency = document.getElementById('exchange-from');
  const toCurrency = document.getElementById('exchange-to');

  // Add event listeners to both select elements
  fromCurrency.addEventListener('change', fetchData);
  toCurrency.addEventListener('change', fetchData);

  fetchData()

  async function fetchData() {
      const selectedOption1 = fromCurrency.value;
      const selectedOption2 = toCurrency.value;

      try {
        const response = await axios.post("/getTableData", {selectedOption1, selectedOption2})
        updateTable(response.data.exchangeRates)
        
      } catch (error) {
        console.log(error)
      }

  }

  function updateTable(data) {
      const tableBody = document.querySelector('#dataTable tbody');
      tableBody.innerHTML = ''; // Clear existing table data

      // Populate table with fetched data
      data.forEach(function(row) {
          const tr = document.createElement('tr');
          const date = new Date(row.Date*1000)

          const year = date.getFullYear();
          const month = ('0' + (date.getMonth() + 1)).slice(-2);
          const day = ('0' + date.getDate()).slice(-2);

          const dateString = `${year}-${month}-${day}`;

          tr.innerHTML = `<td>${dateString}</td><td>${row.ConversionRate}</td>`;
          tableBody.appendChild(tr);
      });
  }
});
