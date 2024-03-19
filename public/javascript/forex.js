document.getElementById("fetchButton").addEventListener("click", async () => {
  try {
      const response = await axios.get(`http://localhost:3000/api/table`);

      if (response.status !== 200) {
          throw new Error('Failed to fetch data');
      }

      const tasks = response.data;
      console.log(tasks);

      // Update the content of the dataContainer with the response data
      document.getElementById("result").innerText = JSON.stringify(tasks);
  } catch (error) {
      console.error(error);
      // Handle error appropriately, e.g., display an error message
      alert('Error fetching data');
  }
});
