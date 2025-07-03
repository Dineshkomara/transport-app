function viewAllData() {
  window.open("/all.html", "_blank");
}

async function showVehicleOptions() {
  const res = await fetch("/transport/vehicles");
  const vehicles = await res.json();

  const container = document.getElementById("dynamic-buttons");
  container.innerHTML = "<h3>Select a Vehicle:</h3>";

  vehicles.forEach(vehicle => {
    const btn = document.createElement("button");
    btn.innerText = vehicle;
    btn.onclick = () => {
      window.open(`/vehicle.html?vehicle=${encodeURIComponent(vehicle)}`, "_blank");
    };
    container.appendChild(btn);
  });
}

async function showContractorOptions() {
  const res = await fetch("/transport/contractors");
  const contractors = await res.json();

  const container = document.getElementById("dynamic-buttons");
  container.innerHTML = "<h3>Select a Contractor:</h3>";

  contractors.forEach(contractor => {
    const btn = document.createElement("button");
    btn.innerText = contractor;
    btn.onclick = () => {
      window.open(`/contractor.html?contractor=${encodeURIComponent(contractor)}`, "_blank");
    };
    container.appendChild(btn);
  });
}

// Toggle form visibility
function toggleForm(formId) {
  document.getElementById("transport-form").style.display = "none";
  document.getElementById("payment-form").style.display = "none";
  document.getElementById(formId).style.display = "block";
}

// Handle transport entry form submission
document.getElementById("transport-form").onsubmit = async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData();

  formData.append("serial_no", form.serial_no.value);
  formData.append("date", form.date.value);
  formData.append("dc_no", form.dc_no.value);
  formData.append("vehicle_no", form.vehicle_no.value);
  formData.append("material", form.material.value);
  formData.append("loading_point", form.loading_point.value);
  formData.append("unloading_point", form.unloading_point.value);
  formData.append("weight", form.weight.value);
  formData.append("rate", form.rate.value);
  formData.append("contractor", form.contractor.value);

  if (form.dc_image.files[0]) {
    formData.append("dc_image", form.dc_image.files[0]);
  }
  if (form.loading_weight_bill_image.files[0]) {
    formData.append("loading_weight_bill_image", form.loading_weight_bill_image.files[0]);
  }
  if (form.unloading_weight_bill_image.files[0]) {
    formData.append("unloading_weight_bill_image", form.unloading_weight_bill_image.files[0]);
  }

  const res = await fetch("/add-transport", {
    method: "POST",
    body: formData
  });

  if (res.ok) {
    alert("✅ Transport entry added.");
    form.reset();
    form.style.display = "none";
  } else {
    alert("❌ Failed to add transport entry.");
  }
};

// Handle payment form submission
document.getElementById("payment-form").onsubmit = async (e) => {
  e.preventDefault();
  const form = e.target;
  const body = {
    contractor: form.contractor.value,
    amount_paid: Number(form.amount_paid.value),
    date: form.date.value
  };

  const res = await fetch("/add-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    alert("💰 Payment recorded.");
    form.reset();
    form.style.display = "none";
  } else {
    alert("❌ Failed to record payment.");
  }
};

function viewAllPayments() {
  window.open("/all-payments.html", "_blank");
}

function addBulkRow() {
  const tbody = document.querySelector("#bulk-table tbody");
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input type="text" name="serial_no"></td>
    <td><input type="date" name="date"></td>
    <td><input type="text" name="dc_no"></td>
    <td><input type="text" name="vehicle_no"></td>
    <td><input type="text" name="material"></td>
    <td><input type="text" name="loading_point"></td>
    <td><input type="text" name="unloading_point"></td>
    <td><input type="number" name="weight"></td>
    <td><input type="number" name="rate"></td>
    <td><input type="text" name="contractor"></td>
    <td><button type="button" onclick="this.closest('tr').remove()">🗑</button></td>
  `;
  tbody.appendChild(row);
}

// Submit handler
document.getElementById("bulk-entry-form").onsubmit = async (e) => {
  e.preventDefault();
  const rows = document.querySelectorAll("#bulk-table tbody tr");
  const entries = [];

  rows.forEach(row => {
    const entry = {};
    row.querySelectorAll("input").forEach(input => {
      entry[input.name] = input.value;
    });
    entries.push(entry);
  });

  const res = await fetch("/add-multiple-entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entries }),
  });

  alert("✅ Bulk transport entries added!");
  document.getElementById("bulk-entry-form").reset();
  document.querySelector("#bulk-table tbody").innerHTML = "";
  document.getElementById("bulk-entry-form").style.display = "none";
};
