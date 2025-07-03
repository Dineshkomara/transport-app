let allData = [];

async function loadAllData() {
  const res = await fetch("/transport/all");
  allData = await res.json();
  renderTable(allData);
  calculateSummary(allData);
  fetchAllPayments();
}

function renderTable(data) {
  const headers = Object.keys(data[0] || {});
  const thead = document.querySelector("#allDataTable thead");
  const tbody = document.querySelector("#allDataTable tbody");

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

  new DataTable("#allDataTable");
}

function calculateSummary(data) {
  const totalAmount = data.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  document.getElementById("summary").innerHTML = `<h3>Total Transport Amount: ₹${totalAmount.toFixed(2)}</h3>`;
}

function applyFilter() {
  const month = document.getElementById("monthFilter").value;
  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;

  const filtered = allData.filter(row => {
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

// Fetch all payments
async function fetchAllPayments() {
  const res = await fetch("/payments/all"); // You need to implement this API
  const data = await res.json();

  const paid = data.reduce((sum, p) => sum + Number(p.amount_paid), 0);
  const paymentLog = data.map(p => {
    const date = new Date(p.date).toLocaleDateString("en-GB");
    return `<li>${date} — ₹${Number(p.amount_paid).toFixed(2)} from ${p.contractor}</li>`;
  }).join("");

  const totalAmount = allData.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const pending = totalAmount - paid;

  document.getElementById("summary").innerHTML += `
    <h3>Total Paid: ₹${paid.toFixed(2)}</h3>
    <h3>Total Pending: ₹${pending.toFixed(2)}</h3>
  `;
  document.getElementById("payments-log").innerHTML = `<h3>All Payments</h3><ul>${paymentLog}</ul>`;
  console.log("Payment data:", data);
}

loadAllData();

function downloadCSV() {
  const headers = Object.keys(allData[0] || {});
  const rows = [headers.join(",")];

  allData.forEach(row => {
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
  link.download = `transport_data_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
}

