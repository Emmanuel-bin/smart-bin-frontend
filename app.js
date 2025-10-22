// app.js — no breaking changes; works with new API shape

const BASE_URL = 'https://smart-bin-backend-cusz.onrender.com';
const API_URL = `${BASE_URL}/api/bins`;
const SSE_URL = `${BASE_URL}/api/bins/stream`;
const BIN_ICON_URL = './bin.png';

let map;
let markers = {};
let alertedBins = {};

function initMap() {
  const defaultCenter = { lat: 53.0, lng: -1.2 };
  map = new google.maps.Map(document.getElementById('map'), { zoom: 8, center: defaultCenter });
  fetchBinsData();
  startSSE();
}

function fetchBinsData() {
  fetch(API_URL)
    .then(r => r.json())
    .then(bins => {
      bins.forEach(bin => upsertMarker(bin));
      const bounds = new google.maps.LatLngBounds();
      Object.values(markers).forEach(m => bounds.extend(m.getPosition()));
      if (!bounds.isEmpty()) map.fitBounds(bounds);
    })
    .catch(err => console.error('Error fetching bins:', err));
}

function startSSE() {
  const es = new EventSource(SSE_URL);
  es.onmessage = (evt) => {
    const updates = JSON.parse(evt.data);
    updates.forEach(bin => {
      // alerts
      const high = (bin.wasteLevel || []).some(v => v >= 95);
      const id = String(bin.binId);
      if (high && !alertedBins[id]) {
        showNotification(`⚠️ Bin ${id} has a compartment at 95%+`);
        alertedBins[id] = true;
      } else if (!high && alertedBins[id]) {
        alertedBins[id] = false;
      }
      upsertMarker(bin);
    });
  };
  es.onerror = (e) => console.error('SSE error:', e);
}

function upsertMarker(bin) {
  const id = String(bin.binId);
  if (!markers[id]) {
    const marker = new google.maps.Marker({
      position: { lat: bin.location.lat, lng: bin.location.lng },
      map,
      title: `Bin ID: ${id}`,
      icon: { url: BIN_ICON_URL, scaledSize: new google.maps.Size(70, 70) }
    });
    marker.addListener('click', () => {
      const url = `details.html?binId=${encodeURIComponent(id)}`;
      window.open(url, '_blank');
    });
    markers[id] = marker;
  } else {
    markers[id].setPosition({ lat: bin.location.lat, lng: bin.location.lng });
    markers[id].setIcon({ url: BIN_ICON_URL, scaledSize: new google.maps.Size(70, 70) });
  }
}

function showNotification(message) {
  const container = document.getElementById('notification-container');
  const n = document.createElement('div');
  n.classList.add('notification');
  n.innerText = message;
  container.appendChild(n);
  setTimeout(() => {
    n.classList.add('hide');
    n.addEventListener('transitionend', () => n.remove());
  }, 5000);
}

window.onload = initMap;
