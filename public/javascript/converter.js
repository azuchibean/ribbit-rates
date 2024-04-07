/**Automatically converts input amount to another currency */
document.addEventListener('DOMContentLoaded', function () {
    const fromCurrency = document.getElementById('exchange-from');
    const toCurrency = document.getElementById('exchange-to');
    const oldValueInput = document.getElementById('oldValue');
    const newValueInput = document.getElementById('newValue');

    fromCurrency.addEventListener('change', fetchData);
    toCurrency.addEventListener('change', fetchData);
    oldValueInput.addEventListener('input', fetchData);

    async function fetchData() {
        const selectedOption1 = fromCurrency.value;
        const selectedOption2 = toCurrency.value;
        const oldValue = parseFloat(oldValueInput.value); // Parse the input value as a number

        try {
            if (selectedOption1 === selectedOption2 || isNaN(oldValue)) { // Check if oldValue is not a number
                return;
            }

            const response = await axios.post("/query", { fromCurrency: selectedOption1, toCurrency: selectedOption2 });
            const exchangeRate = response.data.exchangeRate;

            if (typeof exchangeRate === 'object' && exchangeRate !== null) {
                return;
            }

            const newExchangeRate = parseFloat(exchangeRate); // Parse the exchange rate as a number
            newValueInput.value = (oldValue * newExchangeRate); // Calculate and update newValueInput

            // Add rate to page
            const newRate = document.createElement("p");
            newRate.innerText= `Rate: ${exchangeRate}`;

            const resultDiv = document.getElementById("result");
            resultDiv.innerHTML = '';
            newRate.style.textAlign = "center";

            resultDiv.appendChild(newRate)

            newRate.style.color = "black";

        } catch (error) {
            console.error("Error fetching exchange rate:", error);
            document.getElementById("result").innerText =
                "Error fetching exchange rate";
        }
    }

});