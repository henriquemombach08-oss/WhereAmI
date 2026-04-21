import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { Leaf, Map, Settings as SettingsIcon, Bell, User as UserIcon } from 'lucide-react-native';

import MapScreen from './src/components/MapScreen';
import AlarmSettings from './src/components/AlarmSettings';
import DashboardScreen from './src/components/DashboardScreen';
import ProfileScreen from './src/components/ProfileScreen';
import useAlarmController, { ALARM_START_RESULT } from './src/hooks/useAlarmController';
import useThemePreference from './src/hooks/useThemePreference';

export default function App() {
  const { isDarkMode, theme, toggleTheme } = useThemePreference();
  const styles = getStyles(theme);
  const [activeTab, setActiveTab] = useState('alarms');

  const {
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
    startAlarm,
    stopAlarm,
    testAlarm,
    target,
  } = useAlarmController();

  const handleStartAlarm = async () => {
    const result = await startAlarm();

    if (result === ALARM_START_RESULT.MISSING_TARGET) {
      setActiveTab('explore');
      return;
    }

    if (result === ALARM_START_RESULT.STARTED) {
      setActiveTab('alarms');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'alarms':
        return (
          <DashboardScreen
            alarmTime={alarmTime}
            isActive={isActive}
            isLocationActive={isLocationActive}
            isTimeActive={isTimeActive}
            navigateToExplore={() => setActiveTab('explore')}
            radius={radius}
            target={target}
            theme={theme}
          />
        );
      case 'explore':
        return (
          <View style={{ flex: 1, padding: 16 }}>
            <View style={{ height: '80%' }}>
              <MapScreen location={location} target={target} setTarget={setTarget} radius={radius} theme={theme} />
            </View>
            <View style={{ marginTop: 16, alignItems: 'center' }}>
              <TouchableOpacity style={styles.fabSecondary} onPress={() => setActiveTab('settings')}>
                <Text style={styles.fabSecondaryText}>Configurar alerta &gt;</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'settings':
        return (
          <View style={{ flex: 1, padding: 16 }}>
            <AlarmSettings
              radius={radius}
              setRadius={setRadius}
              alarmTime={alarmTime}
              setAlarmTime={setAlarmTime}
              isLocationActive={isLocationActive}
              setIsLocationActive={setIsLocationActive}
              isTimeActive={isTimeActive}
              setIsTimeActive={setIsTimeActive}
              isActive={isActive}
              onStart={handleStartAlarm}
              onStop={stopAlarm}
              onTestAlarm={testAlarm}
              target={target}
              theme={theme}
              isDarkMode={isDarkMode}
            />
          </View>
        );
      case 'profile':
        return (
          <ProfileScreen
            isDarkMode={isDarkMode}
            isVisible={activeTab === 'profile'}
            onSelectFavorite={(favorite) => {
              setTarget({
                latitude: favorite.latitude,
                longitude: favorite.longitude,
              });
              setRadius(favorite.radius);
              setActiveTab('explore');
            }}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.navBg} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Leaf color={theme.colors.primary} size={24} />
          <Text style={styles.headerTitle}>Proximity</Text>
        </View>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>H</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>{renderContent()}</View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('alarms')}>
          <View style={[styles.navIconBg, activeTab === 'alarms' && styles.navIconBgActive]}>
            <Bell color={activeTab === 'alarms' ? theme.colors.primary : theme.colors.outlineVariant} size={24} />
          </View>
          <Text style={[styles.navText, activeTab === 'alarms' && styles.navTextActive]}>Alarmes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('explore')}>
          <View style={[styles.navIconBg, activeTab === 'explore' && styles.navIconBgActive]}>
            <Map color={activeTab === 'explore' ? theme.colors.primary : theme.colors.outlineVariant} size={24} />
          </View>
          <Text style={[styles.navText, activeTab === 'explore' && styles.navTextActive]}>Explorar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('settings')}>
          <View style={[styles.navIconBg, activeTab === 'settings' && styles.navIconBgActive]}>
            <SettingsIcon color={activeTab === 'settings' ? theme.colors.primary : theme.colors.outlineVariant} size={24} />
          </View>
          <Text style={[styles.navText, activeTab === 'settings' && styles.navTextActive]}>Ajustes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('profile')}>
          <View style={[styles.navIconBg, activeTab === 'profile' && styles.navIconBgActive]}>
            <UserIcon color={activeTab === 'profile' ? theme.colors.primary : theme.colors.outlineVariant} size={24} />
          </View>
          <Text style={[styles.navText, activeTab === 'profile' && styles.navTextActive]}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingTop: 16,
      paddingBottom: 16,
      backgroundColor: theme.colors.navBg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.navBorder,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 22, fontWeight: '900', color: theme.colors.primary, letterSpacing: -0.5 },
    avatarContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceContainerHighest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: theme.colors.primary, fontWeight: '700', fontSize: 16 },
    contentContainer: { flex: 1 },
    fabSecondary: {
      backgroundColor: theme.colors.primaryContainer,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
    },
    fabSecondaryText: { color: theme.colors.onPrimaryContainer, fontWeight: '700', fontSize: 16 },
    bottomNav: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingBottom: 32,
      paddingTop: 12,
      backgroundColor: theme.colors.navBg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.navBorder,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.08,
      shadowRadius: 30,
    },
    navItem: { alignItems: 'center', justifyContent: 'center' },
    navIconBg: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: 16, marginBottom: 4 },
    navIconBgActive: { backgroundColor: theme.colors.primaryContainer + '30' },
    navText: { fontSize: 11, fontWeight: '600', color: theme.colors.outlineVariant, textTransform: 'uppercase' },
    navTextActive: { color: theme.colors.primary },
  });
