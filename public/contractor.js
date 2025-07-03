const params = new URLSearchParams(window.location.search);
const contractor = params.get("contractor");
document.getElementById("contractor-title").innerText = `Contractor Data: ${contractor}`;

let table;
let allRows = [];
let paymentLogs = [];

async function fetchContractorData() {
  const res = await fetch(`/transport/contractor/${contractor}`);
  const data = await res.json();
  allRows = data;

  await fetchPaymentLog();  // Fetch payments first
  renderTable(data);
  updateSummary(data);      // Then update summary
}

async function fetchPaymentLog() {
  const res = await fetch(`/payments/${contractor}`);
  paymentLogs = await res.json();
}

function renderTable(data) {
  if (table) table.destroy();
  const headers = Object.keys(data[0] || {});
  const thead = document.querySelector("#contractorTable thead");
  const tbody = document.querySelector("#contractorTable tbody");

  thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>`;
  tbody.innerHTML = data.map(row => {
    return `<tr>${headers.map(h => `<td>${formatValue(h, row[h])}</td>`).join("")}</tr>`;
  }).join("");

  table = new DataTable("#contractorTable");
}

function formatValue(key, value) {
  if (key === "date" && value) {
    return new Date(value).toLocaleDateString("en-GB");
  }
  return value ?? "";
}

function updateSummary(filteredData) {
  const totalAmount = filteredData.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalPaid = paymentLogs.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
  const pending = totalAmount - totalPaid;

  const summaryEl = document.getElementById("summary");
  summaryEl.innerHTML = `
    <h3>Total Amount: ₹${totalAmount.toFixed(2)}</h3>
    <h3>Paid Amount: ₹${totalPaid.toFixed(2)}</h3>
    <h3>Pending Amount: ₹${pending.toFixed(2)}</h3>
    <h4>Payment History:</h4>
    <div id="payments-log">${renderPaymentLog()}</div>
  `;
}

function renderPaymentLog() {
  if (!paymentLogs.length) return "No payments yet.";
  return paymentLogs.map(p => {
    const d = new Date(p.date).toLocaleDateString("en-GB");
    return `${d}: ₹${p.amount_paid}`;
  }).join("<br>");
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
  updateSummary(filtered);
}

fetchContractorData();

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
  link.download = `${contractor || "data"}_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
}
