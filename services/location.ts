
export interface GeoLocation {
  lat: number;
  lng: number;
  address: string;
}

export const getCurrentLocation = (): Promise<GeoLocation> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 0, lng: 0, address: "Geolocation not supported" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // In a real app, we would use a reverse geocoding API here.
        // For this implementation, we'll return a formatted string.
        resolve({
          lat: latitude,
          lng: longitude,
          address: `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)} (Verified Node)`
        });
      },
      (error) => {
        console.error("Location error:", error);
        resolve({ lat: 0, lng: 0, address: "Location access denied" });
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
};
