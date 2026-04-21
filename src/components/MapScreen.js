import React, { useState } from 'react';
import { Alert, StyleSheet, View, Text, TextInput, TouchableOpacity, Keyboard, ScrollView } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Search, MapPin } from 'lucide-react-native';

export default function MapScreen({ location, target, setTarget, radius, theme }) {
  const styles = getStyles(theme);
  const [address, setAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const mapRef = React.useRef(null);

  const handleSearch = async () => {
    if (!address.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    Keyboard.dismiss();

    try {
      let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=6`;

      // Se tiver a localiza\u00E7\u00E3o do usu\u00E1rio, prioriza os resultados pr\u00F3ximos.
      if (location && location.coords) {
        const { latitude, longitude } = location.coords;
        url += `&lat=${latitude}&lon=${longitude}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data && data.features && data.features.length > 0) {
        setSearchResults(data.features);
      } else {
        Alert.alert('Busca sem resultados', 'Nenhum local encontrado. Tente usar palavras-chave mais comuns.');
      }
    } catch (e) {
        Alert.alert('Erro', 'N\u00E3o foi poss\u00EDvel buscar o endere\u00E7o. Verifique sua conex\u00E3o.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (item) => {
    const lon = item.geometry.coordinates[0];
    const lat = item.geometry.coordinates[1];

    setTarget({ latitude: lat, longitude: lon });
    setSearchResults([]);
    setAddress('');

    mapRef.current?.animateToRegion({
      latitude: lat,
      longitude: lon,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Digite um endere\u00E7o..."
            placeholderTextColor={theme.colors.outlineVariant}
            value={address}
            onChangeText={(text) => {
              setAddress(text);
              if (text.length === 0) setSearchResults([]);
            }}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={isSearching}>
            <Search color={theme.colors.onPrimary} size={20} />
          </TouchableOpacity>
        </View>

        {searchResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <ScrollView style={styles.resultsScroll} keyboardShouldPersistTaps="handled">
              {searchResults.map((item, index) => {
                const name = item.properties.name || '';
                const street = item.properties.street || '';
                const city = item.properties.city || item.properties.state || '';
                const displayName = [name, street, city].filter(Boolean).join(', ');

                return (
                  <TouchableOpacity key={index} style={styles.resultItem} onPress={() => handleSelectResult(item)}>
                    <MapPin color={theme.colors.primary} size={16} style={{ marginTop: 3 }} />
                    <Text style={styles.resultText} numberOfLines={2}>
                      {displayName || 'Local desconhecido'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={
          location
            ? {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }
            : null
        }
        showsUserLocation
        onPress={(e) => {
          setTarget(e.nativeEvent.coordinate);
          setSearchResults([]);
          Keyboard.dismiss();
        }}
        userInterfaceStyle={theme.colors.background === '#1a1814' ? 'dark' : 'light'}
      >
        {target && (
          <>
            <Marker coordinate={target} title="Destino" pinColor={theme.colors.secondary} />
            <Circle
              center={target}
              radius={radius}
              strokeColor="rgba(156, 67, 42, 0.5)"
              fillColor="rgba(156, 67, 42, 0.15)"
            />
          </>
        )}
      </MapView>
      {!target && (
        <View style={styles.instructionBox}>
          <Text style={styles.instructionText}>Busque ou toque no mapa para ancorar o alarme.</Text>
        </View>
      )}
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      borderRadius: theme.borderRadius.xxl,
      overflow: 'hidden',
      backgroundColor: theme.colors.surfaceContainerHighest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    map: {
      width: '100%',
      height: '100%',
    },
    searchWrapper: {
      position: 'absolute',
      top: 16,
      left: 16,
      right: 16,
      zIndex: 10,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.borderRadius.full,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 5,
    },
    searchInput: {
      flex: 1,
      color: theme.colors.onBackground,
      fontSize: 16,
      paddingVertical: 8,
    },
    searchBtn: {
      backgroundColor: theme.colors.primary,
      padding: 10,
      borderRadius: theme.borderRadius.full,
      marginLeft: 8,
    },
    resultsContainer: {
      marginTop: 8,
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      maxHeight: 200,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 5,
    },
    resultsScroll: {
      paddingVertical: 8,
    },
    resultItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant + '40',
    },
    resultText: {
      color: theme.colors.onBackground,
      fontSize: 14,
      marginLeft: 12,
      flex: 1,
    },
    instructionBox: {
      position: 'absolute',
      bottom: 20,
      alignSelf: 'center',
      backgroundColor: theme.colors.navBg,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    instructionText: {
      color: theme.colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
  });
