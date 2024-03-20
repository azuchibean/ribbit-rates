//function to add more alerts from filling out the modal 
document.addEventListener('DOMContentLoaded', function () {
    const alertList = document.getElementById('alertList');
    const createAlertButton = document.querySelector('#createAlertModal button.btn-primary');

    createAlertButton.addEventListener('click', function () {
        const fromCurrency = document.getElementById('fromCurrency').value;
        const toCurrency = document.getElementById('toCurrency').value;
        const targetRate = document.getElementById('targetRate').value;
        const alertId = Date.now().toString();

        // Create a new rate alert box
        const alertBox = document.createElement('div');
        alertBox.classList.add('rounded', 'border', 'p-3', 'mb-3', 'alert-item');
        alertBox.dataset.alertId = alertId; 
        alertBox.innerHTML = `
            <div>1 ${fromCurrency} = ${targetRate} ${toCurrency}  <button class="delete-alert" style="border: none; background: none; cursor: pointer;">
            <img src="../images/trashcan.png" alt="trashcan" class="icon">
        </button>
        `;

        // Append the new rate alert box to the alertList
        alertList.appendChild(alertBox);

        // Hide the modal
        $('#createAlertModal').modal('hide');

        // Clear the form inputs for the next alert
        document.getElementById('fromCurrency').value = '';
        document.getElementById('toCurrency').value = '';
        document.getElementById('targetRate').value = '';

        //send the data to the server
        fetch('/profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fromCurrency, toCurrency, rateExchange: targetRate, alertId })
        })
            .then(response => {
                if (response.ok) {
                    console.log('Rate alert saved successfully');
                } else {
                    console.error('Failed to save rate alert');
                }
            })
            .catch(error => {
                console.error('Error saving rate alert:', error);
            });
    });
});

//function to delete items from db
document.addEventListener('DOMContentLoaded', function () {
    const deleteButtons = document.querySelectorAll('.delete-alert');
    deleteButtons.forEach(button => {
        button.addEventListener('click', async function () {
            const alertId = button.parentElement.getAttribute('data-alert-id');
            console.log('Deleting alert with ID:', alertId);

            try {
                const response = await fetch(`/profile/${alertId}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    console.log('Alert deleted successfully');
                    window.location.reload();
                } else {
                    console.error('Failed to delete alert');
                }
            } catch (error) {
                console.error('Error deleting alert:', error);
            }
        });
    });
}); 