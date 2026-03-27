const CLIENT_ID = "WU4bVxk5Df0g5JC8ULzW77Ry7OM10Lyj";
const TRACK_URL = "https://soundcloud.com/arekkuzzera/psycho-dreams-hardstyle-remix";

let previousCount = null;

function formatNumber(num) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(num);
}

async function getTrackData() {
  const playsEl = document.getElementById("plays");
  const changeEl = document.getElementById("change");
  const statusEl = document.getElementById("status");

  try {
    statusEl.textContent = "Updating...";

    const res = await fetch(
      `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(TRACK_URL)}&client_id=${CLIENT_ID}`
    );

    const text = await res.text();
    console.log("status:", res.status);
    console.log("raw response:", text);

    let track;
    try {
      track = JSON.parse(text);
    } catch {
      throw new Error("Response is not JSON");
    }

    if (!res.ok) {
      throw new Error(track.error || `HTTP ${res.status}`);
    }

    if (typeof track.playback_count !== "number") {
      throw new Error("playback_count not found");
    }

    const currentCount = track.playback_count;
    playsEl.textContent = formatNumber(currentCount);

    if (previousCount !== null) {
      const diff = currentCount - previousCount;
      changeEl.textContent = diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : "No change";
    } else {
      changeEl.textContent = "First load";
    }

    previousCount = currentCount;
    statusEl.textContent = `Last update: ${new Date().toLocaleTimeString()}`;
  } catch (err) {
    console.error("SoundCloud error:", err);
    playsEl.textContent = "Error";
    changeEl.textContent = err.message;
    changeEl.className = "change down";
    statusEl.textContent = "Update failed";
  }
}

setInterval(getTrackData, 30000);
getTrackData();