import { Audio } from 'expo-av';
import { Vibration } from 'react-native';

class AlarmEngine {
  constructor() {
    this.sound = null;
    this.isPlaying = false;
  }

  async startAlarm(vibrationPattern = [500, 500, 500]) {
    if (this.isPlaying) return;
    this.isPlaying = true;

    try {
      Vibration.vibrate(vibrationPattern, true);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync({
        uri: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=analog-watch-alarm-111422.mp3',
      });
      this.sound = sound;
      await this.sound.setIsLoopingAsync(true);
      await this.sound.playAsync();
    } catch (e) {
      console.error('Erro ao tocar \u00E1udio', e);
    }
  }

  async stopAlarm() {
    this.isPlaying = false;
    Vibration.cancel();
    if (this.sound) {
      await this.sound.stopAsync();
      await this.sound.unloadAsync();
      this.sound = null;
    }
  }
}

export default new AlarmEngine();
