import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AlarmEngine from '../services/AlarmEngine';
import { LOCATION_TASK_NAME, setAlarmConfig } from '../services/LocationTask';

export const ALARM_START_RESULT = {
  STARTED: 'started',
  MISSING_MODE: 'missing_mode',
  MISSING_TARGET: 'missing_target',
  MISSING_TIME: 'missing_time',
  INVALID_RADIUS: 'invalid_radius',
};

export default function useAlarmController() {
  const [location, setLocation] = useState(null);
  const [target, setTarget] = useState(null);
  const [radius, setRadius] = useState(500);
  const [isLocationActive, setIsLocationActive] = useState(true);
  const [isTimeActive, setIsTimeActive] = useState(false);
  const [alarmTime, setAlarmTime] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const timeCheckerRef = useRef(null);
  const debugStopRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadLocation = async () => {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        Alert.alert('Permiss\u00E3o negada', 'Precisamos da permiss\u00E3o de localiza\u00E7\u00E3o para o alarme funcionar.');
        return;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        Alert.alert('Aviso', 'A permiss\u00E3o de localiza\u00E7\u00E3o em segundo plano \u00E9 recomendada para o alarme tocar com o celular no bolso.');
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      if (isMounted) {
        setLocation(currentLocation);
      }
    };

    void loadLocation();

    return () => {
      isMounted = false;
      if (timeCheckerRef.current) {
        clearInterval(timeCheckerRef.current);
        timeCheckerRef.current = null;
      }
      if (debugStopRef.current) {
        clearTimeout(debugStopRef.current);
        debugStopRef.current = null;
      }
      void AlarmEngine.stopAlarm();
      setAlarmConfig(null);
      void TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME)
        .then((isTaskRegistered) => {
          if (isTaskRegistered) {
            return Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
          }

          return null;
        })
        .catch(() => null);
    };
  }, []);

  const startAlarm = async () => {
    if (!isLocationActive && !isTimeActive) {
      Alert.alert('Erro', 'Ative proximidade ou hor\u00E1rio fixo antes de iniciar o monitoramento.');
      return ALARM_START_RESULT.MISSING_MODE;
    }

    if (isLocationActive && !target) {
      Alert.alert('Erro', 'Selecione um destino no mapa primeiro (na aba Explorar).');
      return ALARM_START_RESULT.MISSING_TARGET;
    }

    if (isLocationActive && radius <= 0) {
      Alert.alert('Erro', 'Defina um raio maior que zero metros.');
      return ALARM_START_RESULT.INVALID_RADIUS;
    }

    if (isTimeActive && !alarmTime) {
      Alert.alert('Erro', 'Defina um hor\u00E1rio para o alarme na aba Ajustes.');
      return ALARM_START_RESULT.MISSING_TIME;
    }

    setIsActive(true);

    if (isLocationActive && target) {
      setAlarmConfig({ target, radius, isLocationActive: true });
      const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      if (!isTaskRegistered) {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000,
          distanceInterval: 50,
          showsBackgroundLocationIndicator: true,
        });
      }
    } else {
      setAlarmConfig(null);
    }

    if (timeCheckerRef.current) {
      clearInterval(timeCheckerRef.current);
      timeCheckerRef.current = null;
    }
    if (debugStopRef.current) {
      clearTimeout(debugStopRef.current);
      debugStopRef.current = null;
    }

    if (isTimeActive && alarmTime) {
      timeCheckerRef.current = setInterval(() => {
        const now = new Date();
        if (now.getHours() === alarmTime.getHours() && now.getMinutes() === alarmTime.getMinutes()) {
          void AlarmEngine.startAlarm();
          clearInterval(timeCheckerRef.current);
          timeCheckerRef.current = null;
        }
      }, 10000);
    }

    return ALARM_START_RESULT.STARTED;
  };

  const testAlarm = async () => {
    if (debugStopRef.current) {
      clearTimeout(debugStopRef.current);
      debugStopRef.current = null;
    }

    await AlarmEngine.startAlarm([300, 200, 300, 200, 600]);
    setIsActive(true);

    debugStopRef.current = setTimeout(() => {
      debugStopRef.current = null;
      void stopAlarm();
    }, 6000);

    return ALARM_START_RESULT.STARTED;
  };

  const stopAlarm = async () => {
    setIsActive(false);
    await AlarmEngine.stopAlarm();

    if (timeCheckerRef.current) {
      clearInterval(timeCheckerRef.current);
      timeCheckerRef.current = null;
    }
    if (debugStopRef.current) {
      clearTimeout(debugStopRef.current);
      debugStopRef.current = null;
    }

    setAlarmConfig(null);
    const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isTaskRegistered) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  };

  return {
    alarmTime,
    isActive,
    isLocationActive,
    isTimeActive,
    location,
    radius,
    setAlarmTime,
    setIsLocationActive,
    setIsTimeActive,
    setRadius,
    setTarget,
    testAlarm,
    startAlarm,
    stopAlarm,
    target,
  };
}
