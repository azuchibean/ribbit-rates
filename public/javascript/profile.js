function createAlert() {
    console.log("created alert")
    //save into database new alert (from, to, amount)
}

//dummy data 
const alertsData = [
    { fromCurrency: 'USD', toCurrency: 'EUR', exchangeRate: 1.5 },
    { fromCurrency: 'EUR', toCurrency: 'GBP', exchangeRate: 0.9 }
];

// Function to create a div item for each alert 
function createAlertItem(alert) {
    const alertBox = document.createElement('div');
    alertBox.classList.add('rounded', 'border', 'p-3', 'mb-3', 'alert-item');
    alertBox.innerHTML = `
        <div>1 ${alert.fromCurrency} = ${alert.exchangeRate} ${alert.toCurrency}   <img src="" alt="trashcan" class="icon"></div>
      
    `;
    return alertBox;
}

// Function to display the list of alerts
function displayAlerts() {
    const alertContainer = document.getElementById('alertItems');
    alertContainer.innerHTML = '';
    alertsData.forEach(alert => {
        const alertBox = createAlertItem(alert);
        alertContainer.appendChild(alertBox);
    });
}

displayAlerts();

// Function to delete an alert
function deleteAlert(alertId) {
    // Add logic here to delete the alert from the database
    // After deleting, update the UI by re-fetching the alertsData and calling displayAlerts()
    console.log(`Deleting alert with ID ${alertId}`);
}