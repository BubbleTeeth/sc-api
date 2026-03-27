const PROXY_URL = "https://proxy-sc.vercel.app/api/plays";
const STATS_URL = "./stats.json";

let previousCount = null;
let statsData = null;

function full(num) {
  return Number(num).toLocaleString("en-US");
}

function compact(num) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(num);
}

function estimateExtraMetrics(totalPlays) {
  return {
    likes: Math.round(totalPlays * 0.0108),
    comments: Math.round(totalPlays * 0.00021),
    reposts: Math.round(totalPlays * 0.00022),
    downloads: 1
  };
}

function buildYAxis(maxValue) {
  const yAxis = document.getElementById("yAxis");
  yAxis.innerHTML = "";

  const steps = 5;
  for (let i = steps; i >= 0; i -= 1) {
    const value = Math.round((maxValue / steps) * i);
    const label = document.createElement("span");
    label.textContent = i === 0 ? "0" : compact(value).toUpperCase();
    yAxis.appendChild(label);
  }
}

function renderChart(series, subtitle) {
  const chartArea = document.getElementById("chartArea");
  const chartSubtitle = document.getElementById("chartSubtitle");

  chartArea.innerHTML = "";
  chartSubtitle.textContent = subtitle;

  chartArea.style.gridTemplateColumns = `repeat(${series.length}, 1fr)`;

  const maxSeriesValue = Math.max(...series.map(item => item.plays), 1);
  const visualMax = Math.ceil(maxSeriesValue * 1.15);

  buildYAxis(visualMax);

  const maxBarHeight = 100;

  series.forEach((item, index) => {
    const group = document.createElement("div");
    group.className = "bar-group";

    const col = document.createElement("div");
    col.className = "bar-col";

    const bar = document.createElement("div");
    bar.className = index >= Math.max(series.length - 4, 0) ? "bar active" : "bar";

    const h = Math.max((item.plays / visualMax) * maxBarHeight, item.plays > 0 ? 4 : 0);
    bar.style.height = `${h}%`;
    bar.title = `${item.label}: ${full(item.plays)}`;

    const label = document.createElement("div");
    label.className = "bar-label";
    label.textContent = item.label;

    col.appendChild(bar);
    col.appendChild(label);
    group.appendChild(col);
    chartArea.appendChild(group);
  });
}

async function loadStatsJson() {
  const res = await fetch(STATS_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`stats.json HTTP ${res.status}`);
  }
  return res.json();
}

async function loadProxyData() {
  const res = await fetch(PROXY_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`proxy HTTP ${res.status}`);
  }
  return res.json();
}

function applyMetrics(totalPlays) {
  const extra = estimateExtraMetrics(totalPlays);

  document.getElementById("playsValue").textContent = full(totalPlays);
  document.getElementById("headlinePlays").textContent = full(totalPlays);
  document.getElementById("likesValue").textContent = full(extra.likes);
  document.getElementById("commentsValue").textContent = full(extra.comments);
  document.getElementById("repostsValue").textContent = full(extra.reposts);
  document.getElementById("downloadsValue").textContent = full(extra.downloads);
}

function applyGrowth(totalPlays) {
  const growthText = document.getElementById("growthText");

  if (previousCount === null) {
    growthText.textContent = "(+0)";
    previousCount = totalPlays;
    return;
  }

  const diff = totalPlays - previousCount;

  if (diff > 0) {
    growthText.textContent = `(+${full(diff)})`;
  } else if (diff < 0) {
    growthText.textContent = `(${full(diff)})`;
  } else {
    growthText.textContent = "(0)";
  }

  previousCount = totalPlays;
}

function renderSelectedRange(rangeKey) {
  if (!statsData || !statsData.history || !statsData.history[rangeKey]) return;

  const subtitleMap = {
    yearly: "All-time yearly view",
    monthly: "This year by month",
    daily: "This month by day"
  };

  renderChart(statsData.history[rangeKey], subtitleMap[rangeKey] || "");
}

async function initDashboard() {
  try {
    const [stats, proxy] = await Promise.all([
      loadStatsJson(),
      loadProxyData()
    ]);

    statsData = stats;

    const totalPlays = proxy.playback_count;
    if (typeof totalPlays !== "number") {
      throw new Error("playback_count not found");
    }

    document.getElementById("sinceYear").textContent = stats.sinceYear || 2016;
    document.getElementById("trackTitle").textContent = proxy.title || "Unknown track";
    document.getElementById("lastUpdate").textContent =
      `Last update: ${new Date().toLocaleTimeString()}`;

    applyMetrics(totalPlays);
    applyGrowth(totalPlays);

    const selectedRange = document.getElementById("rangeSelect").value;
    renderSelectedRange(selectedRange);
  } catch (err) {
    console.error("Dashboard error:", err);
    document.getElementById("headlinePlays").textContent = "Error";
    document.getElementById("playsValue").textContent = "Error";
    document.getElementById("trackTitle").textContent = err.message;
    document.getElementById("lastUpdate").textContent = "Update failed";
  }
}

document.getElementById("rangeSelect").addEventListener("change", (e) => {
  renderSelectedRange(e.target.value);
});

initDashboard();
setInterval(initDashboard, 30000);