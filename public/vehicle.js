const params = new URLSearchParams(window.location.search);
const vehicle = params.get("vehicle");
document.getElementById("vehicle-title").innerText = `Vehicle Data: ${vehicle}`;

let table;
let allRows = [];

async function fetchVehicleData() {
  const res = await fetch(`/transport/vehicle/${vehicle}`);
  const data = await res.json();
  allRows = data;
  renderTable(data);
  calculateSummary(data);
}

function renderTable(data) {
  if (table) table.destroy();

  const headers = Object.keys(data[0] || {});
  const thead = document.querySelector("#vehicleTable thead");
  const tbody = document.querySelector("#vehicleTable tbody");

  thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>`;

  tbody.innerHTML = data.map(row => {
    return `<tr>${headers.map(h => {
      if (h.includes("image") && row[h]) {
        return `<td><a href="/uploads/${row[h]}" target="_blank">View</a></td>`;
      } else if (h === "date") {
        return `<td>${new Date(row[h]).toLocaleDateString("en-GB")}</td>`;
      } else {
        return `<td>${row[h]}</td>`;
      }
    }).join("")}</tr>`;
  }).join("");

  table = new DataTable("#vehicleTable");
}

function calculateSummary(data) {
  const total = data.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  document.getElementById("summary").innerHTML = `<h3>Total Amount: ₹${total.toFixed(2)}</h3>`;
}

function filterByDate() {
  const month = document.getElementById("monthFilter").value;
  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;

  const filtered = allRows.filter(row => {
    const d = new Date(row.date);
    if (month) {
      const [y, m] = month.split("-");
      return d.getFullYear() == y && (d.getMonth() + 1) == parseInt(m);
    } else if (from && to) {
      return new Date(from) <= d && d <= new Date(to);
    }
    return true;
  });

  renderTable(filtered);
  calculateSummary(filtered);
}

fetchVehicleData();

function downloadCSV() {
  const headers = Object.keys(allRows[0] || {});
  const rows = [headers.join(",")];

  allRows.forEach(row => {
    const values = headers.map(h => {
      let val = row[h];
      if (h === "date" && val) {
        val = new Date(val).toLocaleDateString("en-GB");
      }
      return `"${(val ?? "").toString().replace(/"/g, '""')}"`; // Handle commas and quotes
    });
    rows.push(values.join(","));
  });

  const csvContent = rows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${vehicle || "data"}_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
}
