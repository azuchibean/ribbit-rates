document.addEventListener('DOMContentLoaded', function () {
    const fromCurrency = document.getElementById('exchange-from');
    const toCurrency = document.getElementById('exchange-to');

    console.log(selectedOption1)
    console.log(selectedOption2)
    console.log(selectedOption1.value)
    console.log(selectedOption2.value)

    async function fetchData() {
        const selectedOption1 = fromCurrency.value;
        const selectedOption2 = toCurrency.value;

    
        try {
            const response = await axios.post("/query", { selectedOption1, selectedOption2 });
    
            const exchangeRate = response.data.exchangeRate;
    
            document.getElementById(
                "result"
            ).innerText = `Rate: ${exchangeRate}`;
            document.getElementById("result").style.color = "black"
        } catch (error) {
            console.error("Error fetching exchange rate:", error);
            document.getElementById("result").innerText =
                "Error fetching exchange rate";
        }
    }

    // Add event listeners to both select elements after defining fetchData
    fromCurrency.addEventListener('change', fetchData);
    toCurrency.addEventListener('change', fetchData);
});
