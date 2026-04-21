import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AlarmEngine from './AlarmEngine';

export const LOCATION_TASK_NAME = 'background-location-task';

// Global state for background task
let activeAlarmConfig = null;

// Helper to calculate distance in meters (Haversine formula)
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; 
  return d;
}

export function setAlarmConfig(config) {
  activeAlarmConfig = config;
}

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error(error);
    return;
  }
  if (data) {
    const { locations } = data;
    const currentLocation = locations[0].coords;

    if (activeAlarmConfig && activeAlarmConfig.isLocationActive) {
      const distance = getDistanceFromLatLonInM(
        currentLocation.latitude,
        currentLocation.longitude,
        activeAlarmConfig.target.latitude,
        activeAlarmConfig.target.longitude
      );

      if (distance <= activeAlarmConfig.radius) {
        // Trigger alarm
        AlarmEngine.startAlarm();
        // Prevent continuous triggering
        activeAlarmConfig.isLocationActive = false;
      }
    }
  }
});
