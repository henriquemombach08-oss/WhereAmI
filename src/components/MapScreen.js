import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View, Text, TextInput, TouchableOpacity, Keyboard, ScrollView } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Search, MapPin } from 'lucide-react-native';
import { searchAddresses } from '../services/addressSearch';

const MIN_QUERY_LENGTH = 3;

export default function MapScreen({ location, target, setTarget, radius, theme }) {
  const styles = getStyles(theme);
  const [address, setAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const mapRef = useRef(null);
  const requestRef = useRef(0);
  const skipNextAutoSearchRef = useRef(false);

  const runSearch = async (query, options = {}) => {
    const { showNoResultsAlert = false, includeFallback = false } = options;
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setSearchResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setIsSearching(true);
    setHasSearched(true);

    try {
      const results = await searchAddresses(trimmedQuery, location?.coords ?? null, { includeFallback });

      if (requestRef.current !== requestId) {
        return;
      }

      setSearchResults(results);
      if (!results.length && showNoResultsAlert) {
        Alert.alert('Busca sem resultados', 'Nenhum local encontrado. Tente informar mais detalhes do endereço.');
      }
    } catch (error) {
      if (requestRef.current !== requestId) {
        return;
      }

      if (showNoResultsAlert) {
        Alert.alert('Erro', 'Não foi possível buscar o endereço. Verifique sua conexão.');
      }
    } finally {
      if (requestRef.current === requestId) {
        setIsSearching(false);
      }
    }
  };

  const handleSearch = async () => {
    Keyboard.dismiss();
    await runSearch(address, { showNoResultsAlert: true, includeFallback: true });
  };

  const handleSelectResult = (item) => {
    skipNextAutoSearchRef.current = true;
    setTarget({ latitude: item.latitude, longitude: item.longitude });
    setSearchResults([]);
    setHasSearched(false);
    setAddress(item.displayName);
    Keyboard.dismiss();

    mapRef.current?.animateToRegion({
      latitude: item.latitude,
      longitude: item.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  useEffect(() => {
    const trimmedQuery = address.trim();

    if (skipNextAutoSearchRef.current) {
      skipNextAutoSearchRef.current = false;
      return undefined;
    }

    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      requestRef.current += 1;
      setSearchResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      void runSearch(trimmedQuery, { includeFallback: /\b\d+[A-Za-z]?\b/.test(trimmedQuery) });
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [address, location?.coords?.latitude, location?.coords?.longitude]);

  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={'Digite um endereço...'}
            placeholderTextColor={theme.colors.outlineVariant}
            value={address}
            onChangeText={(text) => {
              setAddress(text);
              if (text.length === 0) {
                setSearchResults([]);
                setHasSearched(false);
              }
            }}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={isSearching}>
            <Search color={theme.colors.onPrimary} size={20} />
          </TouchableOpacity>
        </View>

        {(isSearching || searchResults.length > 0 || (hasSearched && address.trim().length >= MIN_QUERY_LENGTH)) && (
          <View style={styles.resultsContainer}>
            <ScrollView style={styles.resultsScroll} keyboardShouldPersistTaps="handled">
              {isSearching ? (
                <View style={styles.searchState}>
                  <ActivityIndicator color={theme.colors.primary} />
                  <Text style={styles.searchStateText}>{'Buscando endereços próximos...'}</Text>
                </View>
              ) : searchResults.length > 0 ? (
                <>
                  <Text style={styles.resultsHint}>
                    {'Resultados ordenados por texto parecido, número e proximidade da sua localização.'}
                  </Text>
                  {searchResults.map((item) => (
                    <TouchableOpacity key={item.id} style={styles.resultItem} onPress={() => handleSelectResult(item)}>
                      <MapPin color={theme.colors.primary} size={16} style={{ marginTop: 3 }} />
                      <View style={styles.resultCopy}>
                        <Text style={styles.resultText} numberOfLines={1}>
                          {item.primaryText}
                        </Text>
                        {!!item.secondaryText && (
                          <Text style={styles.resultSubtext} numberOfLines={2}>
                            {item.secondaryText}
                          </Text>
                        )}
                      </View>
                      {!!item.distanceLabel && <Text style={styles.distanceText}>{item.distanceLabel}</Text>}
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                <View style={styles.searchState}>
                  <Text style={styles.searchStateText}>
                    {'Nenhuma sugestão ainda. Tente digitar rua, número, bairro ou cidade.'}
                  </Text>
                </View>
              )}
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
      maxHeight: 240,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 5,
    },
    resultsScroll: {
      paddingVertical: 8,
    },
    resultsHint: {
      color: theme.colors.outlineVariant,
      fontSize: 12,
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    resultItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant + '40',
    },
    resultCopy: {
      flex: 1,
      marginLeft: 12,
    },
    resultText: {
      color: theme.colors.onBackground,
      fontSize: 14,
      fontWeight: '600',
    },
    resultSubtext: {
      color: theme.colors.outlineVariant,
      fontSize: 12,
      marginTop: 2,
    },
    distanceText: {
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: '700',
      marginLeft: 12,
      marginTop: 1,
    },
    searchState: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      alignItems: 'center',
      gap: 8,
    },
    searchStateText: {
      color: theme.colors.outlineVariant,
      fontSize: 13,
      textAlign: 'center',
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
