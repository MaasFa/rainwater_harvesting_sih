const cityRainfall = { mumbai: 2167, delhi: 797, bangalore: 970, chennai: 1345 };
const runoffByMaterial = { concrete: 0.85, tile: 0.75, metal: 0.9, green_roof: 0.5 };

let currentStep = 1;
function showStep(n) {
  currentStep = n;
  document.querySelectorAll(".step").forEach(s => s.style.display = (parseInt(s.dataset.step) === n) ? "block" : "none");
  document.querySelectorAll(".step-btn").forEach(b => b.classList.toggle("active", parseInt(b.dataset.step) === n));
}
showStep(1);

// Navigation
document.getElementById("toStep2").onclick = () => showStep(2);
document.getElementById("backTo1").onclick = () => showStep(1);
document.getElementById("toStep3").onclick = () => {
  document.getElementById("runoffCoeff").value = runoffByMaterial[document.getElementById("roofMaterial").value] || 0.8;
  showStep(3);
};
document.getElementById("backTo2").onclick = () => showStep(2);
document.getElementById("backTo3").onclick = () => showStep(3);

// GPS rainfall fetch
document.getElementById("getLocationBtn").onclick = () => {
  const st = document.getElementById("gpsStatus");
  st.textContent = "Locating...";
  navigator.geolocation.getCurrentPosition(async pos => {
    st.textContent = `Lat:${pos.coords.latitude.toFixed(2)}, Lon:${pos.coords.longitude.toFixed(2)}`;
    const rain = await fetchAvgRainfall(pos.coords.latitude, pos.coords.longitude);
    if (rain > 0) document.getElementById("rainfallManual").value = Math.round(rain);
  }, () => st.textContent = "Failed");
};

async function fetchAvgRainfall(lat, lon) {
  try {
    const url = `https://climate-api.open-meteo.com/v1/climate?latitude=${lat}&longitude=${lon}&monthly=precipitation_sum&start=1991-01&end=2020-12`;
    const r = await fetch(url);
    if (!r.ok) return -1;
    const d = await r.json();
    if (!d.monthly || !d.monthly.precipitation_sum) return -1;
    return d.monthly.precipitation_sum.reduce((a, b) => a + (+b || 0), 0);
  } catch { return -1; }
}

// Compute
document.getElementById("computeBtn").onclick = () => {
  const dwellers = +document.getElementById("dwellers").value || 1;
  const area = +document.getElementById("roofArea").value;
  const city = document.getElementById("city").value;
  const manual = +document.getElementById("rainfallManual").value || 0;
  let rain = manual || (cityRainfall[city] || 0);

  if (!rain) { alert("Enter rainfall or select valid city"); return; }

  const coeff = +document.getElementById("runoffCoeff").value || 0.8;
  const runoff = Math.round(area * rain * coeff * 0.623);
  const demand = (+document.getElementById("consumption").value || 150) * 365 * dwellers;
  const ratio = runoff / demand;

  let feas = ratio >= 0.8 ? "Highly Feasible" : (ratio >= 0.4 ? "Moderately Feasible" : "Limited Feasibility");

  document.getElementById("harvestL").textContent = runoff.toLocaleString();
  document.getElementById("demandL").textContent = demand.toLocaleString();
  document.getElementById("feasibilityLabel").textContent = feas;
  document.getElementById("tankRec").textContent = "Approx storage: " + Math.round(runoff * 0.25).toLocaleString() + " L";

  renderCharts(runoff, demand, rain);
  showStep(4);
  let strategies = "";
if (feas === "Highly Feasible") {
  strategies = `
    <ul>
      <li>Install a 5000–10,000 L storage tank with first-flush filter.</li>
      <li>Consider dual-piping for domestic use (non-potable applications).</li>
      <li>Encourage community-level recharge pits for surplus water.</li>
    </ul>`;
} else if (feas === "Moderately Feasible") {
  strategies = `
    <ul>
      <li>Use medium tanks (1000–2000 L) for partial storage.</li>
      <li>Combine rooftop collection with surface runoff.</li>
      <li>Install mesh filters and silt traps.</li>
    </ul>`;
} else {
  strategies = `
    <ul>
      <li>Focus on groundwater recharge (percolation pits/trenches).</li>
      <li>Use harvested water for gardening/flushing.</li>
      <li>Adopt water-saving devices indoors.</li>
    </ul>`;
}
document.getElementById("rechargeRec").innerHTML += `<div class="rec"><strong>Recommended Strategies:</strong>${strategies}</div>`;

};

// Charts
function renderCharts(supply, demand, rain) {
  if (window.sdChart) window.sdChart.destroy();
  if (window.mChart) window.mChart.destroy();

  window.sdChart = new Chart(document.getElementById("supplyDemandChart").getContext("2d"), {
    type: "doughnut",
    data: {
      labels: ["Supply", "Demand"],
      datasets: [{ data: [supply, demand], backgroundColor: ["#10b981", "#3b82f6"] }]
    }
  });

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const arr = months.map((m, i) => ((rain / 12) * ((i >= 5 && i <= 9) ? 1.8 : 0.6)).toFixed(1));

  window.mChart = new Chart(document.getElementById("monthlyChart").getContext("2d"), {
    type: "bar",
    data: { labels: months, datasets: [{ label: "Monthly Rainfall (mm est.)", data: arr }] }
  });
}

// PDF export
document.getElementById("downloadPdf").onclick = () => {
  html2pdf().from(document.getElementById("resultsCard")).save();
};

// Reset
document.getElementById("startNew").onclick = () => location.reload();
