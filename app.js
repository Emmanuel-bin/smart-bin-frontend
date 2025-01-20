// Replace with your Render backend URL
const BASE_URL = 'https://smart-bin-backend-cusz.onrender.com';
const API_URL = `${BASE_URL}/api/bins`;           // e.g. GET /api/bins
const SSE_URL = `${BASE_URL}/api/bins/stream`;    // SSE endpoint for real-time updates

// We'll keep references to the map and existing markers
let map;
let markers = {};  // e.g. { 'bin1': google.maps.Marker, 'bin2': ..., 'bin3': ... }

function initMap() {
  // Default center (somewhere in UK or near Nottingham)
  const defaultCenter = { lat: 53.0, lng: -1.2 };

  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 8,
    center: defaultCenter,
  });

  // 1) Fetch initial bins data to place markers
  fetchBinsData();

  // 2) Start listening to SSE for real-time updates
  startSSE();
}

function fetchBinsData() {
  fetch(API_URL)
    .then(response => response.json())
    .then(bins => {
      bins.forEach(bin => {
        // Create a marker for each bin if it doesn't exist
        if (!markers[bin.binId]) {
          const marker = new google.maps.Marker({
            position: {
              lat: bin.location.lat,
              lng: bin.location.lng
            },
            map: map,
            title: `Bin ID: ${bin.binId}`
          });

          // Marker click -> open details page
          marker.addListener('click', () => {
            const detailsUrl = `details.html?binId=${encodeURIComponent(bin.binId)}`;
            window.open(detailsUrl, '_blank');
          });

          markers[bin.binId] = marker;
        } else {
          // If marker exists, just update position
          markers[bin.binId].setPosition({
            lat: bin.location.lat,
            lng: bin.location.lng
          });
        }
      });

      // Optionally fit map bounds to markers
      const bounds = new google.maps.LatLngBounds();
      Object.values(markers).forEach(marker => {
        bounds.extend(marker.getPosition());
      });
      map.fitBounds(bounds);
    })
    .catch(err => {
      console.error('Error fetching bins data:', err);
    });
}

function startSSE() {
  // Connect to SSE endpoint
  const eventSource = new EventSource(SSE_URL);

  eventSource.onmessage = (evt) => {
    // evt.data should be an array of 3 bin objects if your server is broadcasting that
    const updatedBins = JSON.parse(evt.data);
    console.log("Received SSE update:", updatedBins);

    // For each bin in the SSE update, update or create markers
    updatedBins.forEach(bin => {
      if (!markers[bin.binId]) {
        // create a new marker
        const marker = new google.maps.Marker({
          position: {
            lat: bin.location.lat,
            lng: bin.location.lng
          },
          map: map,
          title: `Bin ID: ${bin.binId}`
        });

        marker.addListener('click', () => {
          const detailsUrl = `details.html?binId=${encodeURIComponent(bin.binId)}`;
          window.open(detailsUrl, '_blank');
        });

        markers[bin.binId] = marker;
      } else {
        // update existing marker's position
        markers[bin.binId].setPosition({
          lat: bin.location.lat,
          lng: bin.location.lng
        });
      }

      // If you want to display other data (temperature, humidity), 
      // you could update marker tooltips or info windows here.
      // e.g. markers[bin.binId].setTitle(`Bin ${bin.binId} Temp: ${bin.temperature}, Hum: ${bin.humidity}`);
    });
  };

  eventSource.onerror = (err) => {
    console.error('SSE error:', err);
  };
}

window.onload = initMap;
