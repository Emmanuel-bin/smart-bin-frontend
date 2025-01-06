// app.js

const API_URL = 'https://smart-bin-backend-mymi.onrender.com/api/bins'; // Replace with your Render backend URL

function initMap() {
    // Default center (center of USA)
    const defaultCenter = { lat: 39.8283, lng: -98.5795 };

    const map = new google.maps.Map(document.getElementById('map'), {
        zoom: 4,
        center: defaultCenter,
    });

    // Fetch bins data and place markers
    fetchBinsData(map);
}

function fetchBinsData(map) {
    fetch(API_URL)
        .then(response => response.json())
        .then(bins => {
            bins.forEach(bin => {
                const marker = new google.maps.Marker({
                    position: { lat: bin.location.lat, lng: bin.location.lng },
                    map: map,
                    title: `Bin ID: ${bin.binId}`,
                });

                // Add click listener to open details page
                marker.addListener('click', () => {
                    const detailsUrl = `details.html?binId=${encodeURIComponent(bin.binId)}`;
                    window.open(detailsUrl, '_blank'); // Opens in a new tab/window
                });
            });

            // Optionally, adjust map bounds to fit all markers
            const bounds = new google.maps.LatLngBounds();
            bins.forEach(bin => {
                bounds.extend(new google.maps.LatLng(bin.location.lat, bin.location.lng));
            });
            map.fitBounds(bounds);
        })
        .catch(error => {
            console.error('Error fetching bins data:', error);
        });
}

// Initialize the map once the window loads
window.onload = initMap;
