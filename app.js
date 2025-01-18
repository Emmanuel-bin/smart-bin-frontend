// Replace with your Render backend URL
const API_URL = 'https://smart-bin-backend-cusz.onrender.com/api/bins';

function initMap() {
  // Default center (somewhere in UK or near Nottingham)
  const defaultCenter = { lat: 53.0, lng: -1.2 };

  const map = new google.maps.Map(document.getElementById('map'), {
    zoom: 8,
    center: defaultCenter,
  });

  // Fetch bins data
  fetchBinsData(map);
}

function fetchBinsData(map) {
  fetch(API_URL)
    .then(response => response.json())
    .then(bins => {
      bins.forEach(bin => {
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
      });

      // Optionally fit map bounds to markers
      const bounds = new google.maps.LatLngBounds();
      bins.forEach(bin => {
        bounds.extend({ lat: bin.location.lat, lng: bin.location.lng });
      });
      map.fitBounds(bounds);
    })
    .catch(err => {
      console.error('Error fetching bins data:', err);
    });
}

window.onload = initMap;
