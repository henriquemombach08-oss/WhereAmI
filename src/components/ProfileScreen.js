import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Switch, FlatList } from 'react-native';
import { User, Moon, Sun, MapPin } from 'lucide-react-native';
import { getFavoritesLocal } from '../services/supabase';

export default function ProfileScreen({ theme, isDarkMode, toggleTheme }) {
  const styles = getStyles(theme);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    const favs = await getFavoritesLocal();
    setFavorites(favs);
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatarLarge}>
        <User color={theme.colors.primary} size={48} />
      </View>
      <Text style={styles.name}>Henri</Text>
      <Text style={styles.email}>Meus Alertas Favoritos</Text>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            {isDarkMode ? (
              <Moon color={theme.colors.onBackground} size={24} />
            ) : (
              <Sun color={theme.colors.primary} size={24} />
            )}
          </View>
          <View style={styles.cardTextContent}>
            <Text style={styles.cardTitle}>Modo Escuro</Text>
            <Text style={styles.cardDesc}>Alterar apar\u00EAncia do aplicativo</Text>
          </View>
          <Switch
            trackColor={{ false: theme.colors.outlineVariant, true: theme.colors.primary }}
            thumbColor={isDarkMode ? '#000000' : '#ffffff'}
            onValueChange={toggleTheme}
            value={isDarkMode}
          />
        </View>
      </View>

      <View style={[styles.card, { flex: 1, alignItems: 'stretch' }]}>
        <Text style={[styles.cardTitle, { marginBottom: 16 }]}>Locais Salvos</Text>

        {favorites.length === 0 ? (
          <Text style={styles.cardDesc}>Voc\u00EA pode salvar endere\u00E7os para usar como \u00E2ncoras r\u00E1pidas.</Text>
        ) : (
          <FlatList
            data={favorites}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.favItem}>
                <MapPin color={theme.colors.primary} size={20} />
                <View style={styles.favTextContainer}>
                  <Text style={styles.favTitle}>{item.name}</Text>
                  <Text style={styles.favDesc} numberOfLines={1}>
                    Raio: {item.radius}m
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 24,
      alignItems: 'center',
      paddingTop: 40,
      backgroundColor: theme.colors.background,
    },
    avatarLarge: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: theme.colors.surfaceContainerHighest,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.colors.primaryContainer,
      marginBottom: 16,
    },
    name: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.onBackground,
    },
    email: {
      fontSize: 14,
      color: theme.colors.primary,
      marginTop: 4,
      marginBottom: 32,
    },
    card: {
      width: '100%',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      marginBottom: 16,
      alignItems: 'center',
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: theme.colors.surfaceContainerHighest,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    cardTextContent: {
      flex: 1,
      alignItems: 'flex-start',
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
      textAlign: 'center',
    },
    favItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant + '40',
    },
    favTextContainer: {
      marginLeft: 12,
      flex: 1,
    },
    favTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onBackground,
    },
    favDesc: {
      fontSize: 12,
      color: theme.colors.outlineVariant,
      marginTop: 2,
    },
  });
