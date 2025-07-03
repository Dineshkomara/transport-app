async function loadAllPayments() {
  const res = await fetch("/payments/all");
  const data = await res.json();

  const container = document.getElementById("payment-table-body");
  const summary = document.getElementById("payment-summary");

  if (!data.length) {
    container.innerHTML = "<tr><td colspan='3'>No payments found.</td></tr>";
    return;
  }

  let totalPaid = 0;

  container.innerHTML = data.map(p => {
    totalPaid += p.amount_paid;
    const date = new Date(p.date).toLocaleDateString("en-GB");
    return `<tr><td>${date}</td><td>${p.contractor}</td><td>₹${p.amount_paid}</td></tr>`;
  }).join("");

  summary.innerHTML = `<h3>Total Payments: ₹${totalPaid.toFixed(2)}</h3>`;
}

loadAllPayments();
