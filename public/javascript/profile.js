//function to add more alerts from filling out the modal 
document.addEventListener('DOMContentLoaded', function () {
    const alertList = document.getElementById('alertList');
    const createAlertButton = document.querySelector('#createAlertModal button.btn-green');

    //event listener for createalert button 
    createAlertButton.addEventListener('click', async function () {
        const fromCurrency = document.getElementById('fromCurrency').value;
        const toCurrency = document.getElementById('toCurrency').value;
        const targetRate = document.getElementById('targetRate').value;
        const alertId = Date.now().toString();

        //check if currencies are not empty
        if (fromCurrency === '' || toCurrency === '') {
            document.getElementById('error-message').innerText = 'Please select an option for both currencies.';
            console.log('cannot leave currency empty');
            return;
        }
        // Check if fromCurrency and toCurrency are different
        if (fromCurrency === toCurrency) {
            document.getElementById('error-message').innerText = 'Error: "From Currency" and "To Currency" must be different.';
            console.log('cannot input same currency')
            return;
        }

        //check if the targetRate is a number or not
        if (isNaN(targetRate) || targetRate === '') {
            document.getElementById('error-message').innerText = 'Error: "Target Exchange Rate" must be a non-empty valid number.';
            console.log('cannot input invalid numbers')
            return;
        }

        // Send a request to the server to check for duplicate entries
        try {
            const response = await fetch('/check-duplicate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fromCurrency, toCurrency, rateExchange: targetRate })
            });

            if (!response.ok) {
                document.getElementById('error-message').innerText = 'You already have this alert saved!';
                console.log('Duplicate entry found');
                return;
            }
        } catch (error) {
            console.error('Error checking for duplicate entry:', error);
            document.getElementById('error-message').innerText = 'Error checking for duplicate entry.';
            return;
        }

        // Create a new rate alert box
        const alertBox = document.createElement('div');
        alertBox.classList.add('rounded', 'border', 'p-3','mb-3', 'alert-item');
        alertBox.dataset.alertId = alertId; //assign unique alertId to each alert 
        alertBox.innerHTML = `
            <div>1 ${fromCurrency} = ${targetRate} ${toCurrency} </div>
        `;

        // Append the new rate alert box to the alertList
        alertList.appendChild(alertBox);

        //reload the page
        setTimeout(() => {
            location.reload();
        }, 10);

        // Hide the modal
        $('#createAlertModal').modal('hide');

        //send the data to the server and store in DB
        try {
            await fetch('/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fromCurrency, toCurrency, rateExchange: targetRate, alertId })
            });
        } catch (error) {
            console.error('Error saving rate alert:', error);
        }

    });

    //reset alert modal values
    $('#createAlertModal').on('hidden.bs.modal', function () {
        document.getElementById('fromCurrency').value = '';
        document.getElementById('toCurrency').value = '';
        document.getElementById('targetRate').value = '';
        document.getElementById('error-message').innerText = '';
    });

});

//event listener for delete alert button
document.addEventListener('DOMContentLoaded', function () {
    const deleteButtons = document.querySelectorAll('.delete-alert');
    const confirmDeleteModal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));

    //retrieve alertId for each alert and add listener to its delete button 
    deleteButtons.forEach(button => {
        button.addEventListener('click', async function () {
            const alertId = button.parentElement.getAttribute('data-alert-id');
            console.log('Deleting alert with ID:', alertId);

            //show confirmation delete modal
            confirmDeleteModal.show();

            const confirmDeleteButton = document.getElementById('confirmDeleteButton');

            //add event listener to confirm delete button in modal
            confirmDeleteButton.addEventListener('click', async function () {
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
}); 