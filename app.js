// Replace with your Render backend URL
const BASE_URL = 'https://smart-bin-backend-cusz.onrender.com';
const API_URL = `${BASE_URL}/api/bins`;           // e.g. GET /api/bins
const SSE_URL = `${BASE_URL}/api/bins/stream`;    // SSE endpoint for real-time updates

// Reference a local bin.png stored in your frontend folder
// e.g. place bin.png next to index.html, app.js, etc.
const BIN_ICON_URL = './bin.png';

// We'll keep references to the map and existing markers
let map;
let markers = {};  // e.g. { 'bin1': google.maps.Marker, 'bin2': ..., 'bin3': ... }

// To track bins that have already triggered an alert
let alertedBins = {};

// Initialize the map
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

// Fetch initial bins data and place markers
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
            title: `Bin ID: ${bin.binId}`,
            icon: {
              url: BIN_ICON_URL,
              scaledSize: new google.maps.Size(40, 40) // adjust as needed
            }
          });

          // Marker click -> open details page
          marker.addListener('click', () => {
            const detailsUrl = `details.html?binId=${encodeURIComponent(bin.binId)}`;
            window.open(detailsUrl, '_blank');
          });

          markers[bin.binId] = marker;
        } else {
          // If marker exists, just update position and icon
          markers[bin.binId].setPosition({
            lat: bin.location.lat,
            lng: bin.location.lng
          });
          markers[bin.binId].setIcon({
            url: BIN_ICON_URL,
            scaledSize: new google.maps.Size(50, 50)
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

// Start Server-Sent Events connection
function startSSE() {
  // Connect to SSE endpoint
  const eventSource = new EventSource(SSE_URL);

  eventSource.onmessage = (evt) => {
    // evt.data should be an array of bin objects
    const updatedBins = JSON.parse(evt.data);
    console.log("Received SSE update:", updatedBins);

    // 1) Check for high waste levels and trigger notifications
    updatedBins.forEach(bin => {
      const hasHighLevel = bin.wasteLevel.some(level => level >= 95);
      if (hasHighLevel && !alertedBins[bin.binId]) {
        showNotification(`⚠️ Warning: Bin ${bin.binId} has a compartment nearly or completely full!`);
        alertedBins[bin.binId] = true; // Mark as alerted
      } else if (!hasHighLevel && alertedBins[bin.binId]) {
        // Reset alert status if waste level drops below threshold
        alertedBins[bin.binId] = false;
      }
    });

    // 2) Update markers or create them if they don't exist
    updatedBins.forEach(bin => {
      if (!markers[bin.binId]) {
        const marker = new google.maps.Marker({
          position: {
            lat: bin.location.lat,
            lng: bin.location.lng
          },
          map: map,
          title: `Bin ID: ${bin.binId}`,
          icon: {
            url: BIN_ICON_URL,
            scaledSize: new google.maps.Size(40, 40)
          }
        });

        marker.addListener('click', () => {
          const detailsUrl = `details.html?binId=${encodeURIComponent(bin.binId)}`;
          window.open(detailsUrl, '_blank');
        });

        markers[bin.binId] = marker;
      } else {
        // Update position and icon
        markers[bin.binId].setPosition({
          lat: bin.location.lat,
          lng: bin.location.lng
        });
        markers[bin.binId].setIcon({
          url: BIN_ICON_URL,
          scaledSize: new google.maps.Size(40, 40)
        });
      }
    });
  };

  eventSource.onerror = (err) => {
    console.error('SSE error:', err);
  };
}

// Function to display notifications
function showNotification(message) {
  const container = document.getElementById('notification-container');

  // Create a new notification div
  const notification = document.createElement('div');
  notification.classList.add('notification');
  notification.innerText = message;

  // Append to the container
  container.appendChild(notification);

  // Automatically remove the notification after 5 seconds
  setTimeout(() => {
    notification.classList.add('hide');
    // Remove from DOM after transition
    notification.addEventListener('transitionend', () => {
      notification.remove();
    });
  }, 5000);
}

// Initialize the map on window load
window.onload = initMap;
