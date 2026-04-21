import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { MapPin, Plus, Navigation, Map as MapIcon, Briefcase, Clock3 } from 'lucide-react-native';

const formatCoordinates = (target) => {
  if (!target) {
    return 'Nenhum destino selecionado';
  }

  return `${target.latitude.toFixed(4)}, ${target.longitude.toFixed(4)}`;
};

const formatAlarmTime = (alarmTime) => {
  if (!alarmTime) {
    return '--:--';
  }

  return alarmTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function DashboardScreen({
  alarmTime,
  isActive,
  isLocationActive,
  isTimeActive,
  navigateToExplore,
  radius,
  target,
  theme,
}) {
  const styles = getStyles(theme);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const activeModes = [isLocationActive, isTimeActive].filter(Boolean).length;
  const statusDescription = isActive
    ? `${activeModes} ${activeModes === 1 ? 'monitoramento ativo' : 'monitoramentos ativos'}`
    : 'Nenhum monitoramento em andamento';

  useEffect(() => {
    if (isActive) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );

      pulseLoop.start();

      return () => {
        pulseLoop.stop();
        pulseAnim.setValue(1);
      };
    }

    pulseAnim.setValue(1);
  }, [isActive, pulseAnim]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
          <Text style={styles.overline}>Vis\u00E3o Geral</Text>
          <Text style={styles.title}>Alarmes de Proximidade</Text>
        </View>

        <View style={styles.scanningBox}>
          <View style={styles.scanningBackground}>
            {isActive && (
              <Animated.View
                style={[
                  styles.pulseCircle,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: pulseAnim.interpolate({ inputRange: [1, 1.5], outputRange: [0.5, 0] }),
                  },
                ]}
              />
            )}
            <View style={styles.scanningIconContainer}>
              <MapPin color={theme.colors.primary} size={32} />
            </View>
          </View>
          <Text style={styles.scanningTitle}>{isActive ? 'Monitoramento ativo' : 'Sistema em espera'}</Text>
          <Text style={styles.scanningSub}>{statusDescription}</Text>
        </View>

        <View style={styles.grid}>
          {isActive && isLocationActive && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconWrapper, { backgroundColor: theme.colors.primaryContainer + '30' }]}>
                  <Briefcase color={theme.colors.primary} size={20} />
                </View>
                <View style={[styles.badge, { backgroundColor: theme.colors.primaryContainer + '30' }]}>
                  <Text style={styles.badgeText}>ATIVO</Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>Destino monitorado</Text>
              <View style={styles.locationRow}>
                <MapIcon color={theme.colors.onBackground} size={14} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {formatCoordinates(target)}
                </Text>
              </View>

              <View style={styles.radiusBox}>
                <View>
                  <Text style={styles.radiusLabel}>RAIO</Text>
                  <Text style={styles.radiusValue}>{radius} metros</Text>
                </View>
                <View style={styles.navIconBox}>
                  <Navigation color={theme.colors.primary} size={18} />
                </View>
              </View>
            </View>
          )}

          {isActive && isTimeActive && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconWrapper, { backgroundColor: theme.colors.secondary + '20' }]}>
                  <Clock3 color={theme.colors.secondary} size={20} />
                </View>
                <View style={[styles.badge, { backgroundColor: theme.colors.secondary + '20' }]}>
                  <Text style={[styles.badgeText, { color: theme.colors.secondary }]}>ATIVO</Text>
                </View>
              </View>
              <Text style={styles.cardTitle}>Hor\u00E1rio fixo</Text>
              <View style={styles.locationRow}>
                <MapIcon color={theme.colors.onBackground} size={14} />
                <Text style={styles.locationText} numberOfLines={1}>
                  Disparo previsto para {formatAlarmTime(alarmTime)}
                </Text>
              </View>

              <View style={styles.radiusBox}>
                <View>
                  <Text style={styles.radiusLabel}>MODO</Text>
                  <Text style={styles.radiusValue}>Alarme por hor\u00E1rio</Text>
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.addCard} onPress={navigateToExplore}>
            <View style={styles.addIconWrapper}>
              <MapPin color={theme.colors.onBackground} size={28} />
            </View>
            <Text style={styles.addCardTitle}>Adicionar novo destino</Text>
            <Text style={styles.addCardSub}>Defina uma nova zona para alerta por proximidade</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={navigateToExplore}>
        <Plus color={theme.colors.onPrimary} size={32} />
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: 24,
    },
    headerSection: {
      marginBottom: 24,
    },
    overline: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    title: {
      fontSize: 32,
      fontWeight: '600',
      color: theme.colors.onBackground,
      marginTop: 4,
    },
    scanningBox: {
      backgroundColor: theme.colors.surfaceContainerHighest,
      borderRadius: 24,
      height: 180,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 32,
      overflow: 'hidden',
    },
    scanningBackground: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    pulseCircle: {
      position: 'absolute',
      width: 64,
      height: 64,
      borderRadius: 32,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
    scanningIconContainer: {
      zIndex: 10,
    },
    scanningTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    scanningSub: {
      fontSize: 14,
      color: theme.colors.outlineVariant,
      marginTop: 4,
    },
    grid: {
      gap: 16,
    },
    card: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    iconWrapper: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeText: {
      color: theme.colors.primary,
      fontSize: 10,
      fontWeight: '700',
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.onBackground,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 6,
      marginBottom: 20,
      gap: 6,
    },
    locationText: {
      color: theme.colors.outlineVariant,
      fontSize: 14,
      flex: 1,
    },
    radiusBox: {
      backgroundColor: theme.colors.surfaceContainerHighest,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    radiusLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.outlineVariant,
      letterSpacing: 0.5,
    },
    radiusValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onBackground,
      marginTop: 2,
    },
    navIconBox: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addCard: {
      borderWidth: 2,
      borderColor: theme.colors.outlineVariant,
      borderStyle: 'dashed',
      borderRadius: 24,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addIconWrapper: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.surfaceContainerHighest,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    addCardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onBackground,
    },
    addCardSub: {
      fontSize: 12,
      color: theme.colors.outlineVariant,
      textAlign: 'center',
      marginTop: 4,
    },
    fab: {
      position: 'absolute',
      bottom: 120,
      right: 24,
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 8,
      zIndex: 100,
    },
  });
