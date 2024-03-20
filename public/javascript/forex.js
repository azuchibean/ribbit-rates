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
