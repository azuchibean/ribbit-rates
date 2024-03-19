
function toggleAdditionalForms() {
    var checkBox = document.getElementById("notification");
    var additionalForms = document.querySelector(".additional-forms");

    if (checkBox.checked) {
        additionalForms.style.display = "block";
    } else {
        additionalForms.style.display = "none";
    }
}