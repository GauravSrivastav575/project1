const mbxClient = require('@mapbox/mapbox-sdk');
const mbxDirections = require('@mapbox/mapbox-sdk/services/directions');
const geolib = require('geolib');
const baseClient = mbxClient({accessToken: 'pk.eyJ1IjoiMTIzZ2F1cmF2IiwiYSI6ImNsd203MzFjcDFyeWYya215eno5NHpveGgifQ.HGwwKwppvbuFYvm5OSvTOQ'});
const directionsClient = mbxDirections(baseClient);

// Function to get route points from Mapbox Directions API
const getRoutePoints = async (origin, destination) => {
  const response = await directionsClient.getDirections({
    profile: 'driving',
    waypoints: [
      { coordinates: origin },
      { coordinates: destination }
    ],
    geometries: 'polyline'
  }).send();

  return response.body.routes[0].geometry;
};

// Function to decode polyline points
const decodePolyline = (polyline) => {
  return require('@mapbox/polyline').decode(polyline);
};

// Function to check if two routes overlap significantly
const doRoutesOverlap = async (origin1, destination1, origin2, destination2) => {
  try {
    const points1 = await getRoutePoints(origin1, destination1);
    const points2 = await getRoutePoints(origin2, destination2);

    // Decode polyline points
    const decodedPoints1 = decodePolyline(points1);
    const decodedPoints2 = decodePolyline(points2);

    // Compare the points to see if they overlap
    const overlap = checkOverlap(decodedPoints1, decodedPoints2);
    return overlap > 0.5; // for example, check if more than 50% of the points overlap
  } catch (error) {
    console.error('Error comparing routes:', error);
    return false;
  }
};

// Function to check overlap between two sets of points
const checkOverlap = (points1, points2) => {
  let overlapCount = 0;
  points1.forEach(point1 => {
    points2.forEach(point2 => {
      if (geolib.isPointWithinRadius(
        { latitude: point1[0], longitude: point1[1] },
        { latitude: point2[0], longitude: point2[1] },
        50 // 50 meters tolerance
      )) {
        overlapCount++;
      }
    });
  });
  return overlapCount / points1.length;
};

// Example usage
const origin1 = [77.5946, 12.9716]; // Coordinates for Bangalore
const destination1 = [77.6288, 12.9345]; // Coordinates for another point in Bangalore
const origin2 = [77.5946, 12.9716]; // Coordinates for Bangalore
const destination2 = [77.6288, 12.9345]; // Coordinates for another point in Bangalore

doRoutesOverlap(origin1, destination1, origin2, destination2)
  .then(overlap => {
    if (overlap) {
      console.log('The routes overlap significantly.');
    } else {
      console.log('The routes do not overlap significantly.');
    }
  });

  const getRider = (userStart,userEnd) => {
    // Object.values(users).forEach(value =>{
    //     console.log(value);
    // });
  };
