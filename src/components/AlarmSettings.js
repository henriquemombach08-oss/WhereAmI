import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Switch, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Map, Clock, Heart } from 'lucide-react-native';
import { saveFavoriteLocal } from '../services/supabase';

export default function AlarmSettings({
  radius,
  setRadius,
  alarmTime,
  setAlarmTime,
  isLocationActive,
  setIsLocationActive,
  isTimeActive,
  setIsTimeActive,
  onStart,
  onStop,
  isActive,
  target,
  theme,
  isDarkMode,
}) {
  const styles = getStyles(theme);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleSaveFavorite = async () => {
    if (!target) {
      Alert.alert('Erro', 'Selecione um destino no mapa primeiro.');
      return;
    }

    const success = await saveFavoriteLocal({
      name: `Local salvo ${new Date().toLocaleTimeString()}`,
      latitude: target.latitude,
      longitude: target.longitude,
      radius,
    });

    if (success) {
      Alert.alert('Sucesso', 'Local salvo nos favoritos.');
      return;
    }

    Alert.alert('Erro', 'Não foi possível salvar o favorito. Verifique a configuração do Supabase.');
  };

  const onChangeTime = (event, selectedDate) => {
    setShowTimePicker(false);
    if (selectedDate) {
      setAlarmTime(selectedDate);
      setIsTimeActive(true);
    }
  };

  const formatTime = (date) => {
    if (!date) return '00:00';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={styles.title}>{'Parâmetros do Alerta'}</Text>
        <TouchableOpacity style={styles.favBtn} onPress={handleSaveFavorite}>
          <Heart color={theme.colors.secondary} size={20} />
        </TouchableOpacity>
      </View>

      <View style={[styles.card, isLocationActive && styles.cardActive]}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Map color={isLocationActive ? theme.colors.primary : theme.colors.onBackground} size={24} />
          </View>
          <View style={styles.cardTextContent}>
            <Text style={styles.cardTitle}>Proximidade</Text>
            <Text style={styles.cardDesc}>Avisar ao se aproximar</Text>
          </View>
          <Switch
            trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.primary }}
            thumbColor={isDarkMode ? '#000000' : '#ffffff'}
            onValueChange={setIsLocationActive}
            value={isLocationActive}
            disabled={isActive}
          />
        </View>

        {isLocationActive && (
          <View style={styles.cardBody}>
            <Text style={styles.label}>RAIO (METROS)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={String(radius)}
              onChangeText={(text) => setRadius(Number(text) || 0)}
              editable={!isActive}
              placeholderTextColor={theme.colors.outlineVariant}
            />
          </View>
        )}
      </View>

      <View style={[styles.card, isTimeActive && styles.cardActive]}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: isTimeActive ? 'rgba(156, 67, 42, 0.1)' : theme.colors.surfaceContainerHighest },
            ]}
          >
            <Clock color={isTimeActive ? theme.colors.secondary : theme.colors.onBackground} size={24} />
          </View>
          <View style={styles.cardTextContent}>
            <Text style={styles.cardTitle}>{'Horário Fixo'}</Text>
            <Text style={styles.cardDesc}>Tocar em momento exato</Text>
          </View>
          <Switch
            trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.secondary }}
            thumbColor={isDarkMode ? '#000000' : '#ffffff'}
            onValueChange={setIsTimeActive}
            value={isTimeActive}
            disabled={isActive}
          />
        </View>

        {isTimeActive && (
          <View style={styles.cardBody}>
            <Text style={styles.label}>{'HORÁRIO PREVISTO'}</Text>
            <TouchableOpacity style={styles.timeButton} onPress={() => !isActive && setShowTimePicker(true)}>
              <Text style={styles.timeButtonText}>{formatTime(alarmTime)}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {showTimePicker && (
        <DateTimePicker
          value={alarmTime || new Date()}
          mode="time"
          is24Hour
          display="default"
          onChange={onChangeTime}
        />
      )}

      <View style={styles.actions}>
        {isActive ? (
          <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={onStop}>
            <Text style={styles.btnText}>Pausar Monitoramento</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => void onStart()}>
            <Text style={styles.btnText}>Iniciar Monitoramento</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.onBackground,
      marginBottom: 16,
    },
    favBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    card: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.borderRadius.xxl,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      padding: 16,
      marginBottom: 16,
    },
    cardActive: {
      borderColor: theme.colors.primaryContainer,
      borderWidth: 1.5,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: theme.borderRadius.lg,
      backgroundColor: theme.colors.primaryContainer + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    cardTextContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onBackground,
    },
    cardDesc: {
      fontSize: 14,
      color: theme.colors.outlineVariant,
      marginTop: 2,
    },
    cardBody: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.surfaceContainerHighest,
    },
    label: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
      color: theme.colors.primary,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.borderRadius.lg,
      color: theme.colors.onBackground,
      padding: 12,
      fontSize: 18,
      fontWeight: '500',
    },
    timeButton: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.borderRadius.lg,
      padding: 12,
      alignItems: 'center',
    },
    timeButtonText: {
      color: theme.colors.onBackground,
      fontSize: 18,
      fontWeight: '600',
    },
    actions: {
      marginTop: 16,
    },
    btn: {
      paddingVertical: 16,
      borderRadius: theme.borderRadius.full,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    btnPrimary: {
      backgroundColor: theme.colors.primary,
    },
    btnDanger: {
      backgroundColor: '#ba1a1a',
    },
    btnText: {
      color: theme.colors.onPrimary,
      fontSize: 16,
      fontWeight: '700',
    },
  });
