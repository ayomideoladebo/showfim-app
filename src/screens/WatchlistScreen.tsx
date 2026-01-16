import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface WatchlistScreenProps {
  onBack: () => void;
}

// Mock Data
const WATCHLIST_ITEMS = [
  { id: '1', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEhWJI1A6lzYQCRNP4pXN6lN_qaq7GjV7VAg00-zrDugkafc8P_7hcPEfduug037BXw_HuGw6nQEXZHK8gHzQ0DA1gP3KJzNlcX4utj2ASULHEu8hKAaLVJsPwXcdZC4MkaTklrd0i2w6lWR-77ZBjqMcOXp_NVPbgivKyJoV7HjZFyXwpdT__h-xzMGfBiI_fVgqHaeHr_XEfHW2TljLs1_m3SIgfDnfFBe811dACu2Ny-UnV5P-pmIW847s_Vq7bBkevv5cNCdfD' },
  { id: '2', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDpFCyjVco00_UyqHgh6RoJfCJytKHKZeu3bKyMzYqwjbnDMQPPsVvX-LrrxfLMbAoA22LhAYc37G7YX55dJSFEi3eZK-UvM6jDrQMmPGUxmO_CXiFrxs0kbyi2Nlka1wRWOCIqhbK69jpsYjiyI9mFm048uN28faUS6jjnwX-sIPRSIsPGhWs5M4MjDzvphjH0ZaL9ipWEps2Gz73asAuuM-ZCIaMGpOyR-p44FbpXuUdBkSw3TFRsId7LXSWd1ZvhfkpL6V_7KU1X' },
  { id: '3', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbyjDCnZPk5MtMEnnZaK8lDWA_2kX45S_6o5Rlvuijjin3OY6kMv5kKAftn2URQ_JW5ou4LwMfHVEcUbBYdO1XBcZlyp0UOUK2bSKFPc-9Uo1Y5c02Vf4RMZsEOjvgdA7QSe7ySngyCrdwn9iNkFXTdCToitMa6lx9RK4NnPsy9001ECB_ElKRclpo595tJaLETVOLP79C69uJLMkquR8ZZHKzqCrunzANRMzmjrm4h_E0ySImU5_xgcombIxvUv7EBKF87l-ds2SE' },
  { id: '4', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKcxWOgnXNH3Ffl_MjPaZymM4nle5OP0UtryiJc57wRgDs20S2SMS_bdludqKwMy_mFyuvP6oFsCyvuIJXwGkDw7AgWuDAUksp5Nw_PtAwHfcxuu9pIIZJPmiqm7kRwvxd7Fvs-YjMXChNClno2UO12LoOttE7ikzPOQLISLT3YaX2gqRALdUXl7WwIGJ1jUFOSEk9RSuhhO_6-z8DZAyGwSfWqSrJDwJhFNcAqSJnLeXQbh-wut-FCyF-jVxbssdsjmfG4TSf5rNt' },
  { id: '5', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDSqjiJ-c_VsXbTjbRr-F2dT7CZ_IpW7l5iB0jv350SLZAqoiAEsakm_ED4KBbalDoz7G-cu3vymaFILT5s-taS0cFxSI3nllr-tJg6ztaMstVILsrOf1EnrkDa9ifaoSq6sh4AOZ3PoOeH0jtx5NfVtXpW8EeI_BAL86q-4MxNu45kCIudVllAq_5q0DUDX2Gx0tduQ_uUsu5vDoglV_avaXLn4YPFVagmlt1_OP6dVr6k3Rgqd4XIJOUZ289bWwPtHopqheKLvvJA' },
  { id: '6', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5oKt589SiPLS9TwG7TCLJlMEy0t99QWF8nzXoJpNFXRGMLZ80gvovXj3PO4gwWCwSTiJzoha7bsma88Hf4aB6sD9BRGYAH9e4NvOZ83nqMjXIlhi5qevPv0o_G0zo8F_6I8K3ahZPenmZrVrda572knRKvuZYtiCRF09rX2HI8i2H_XZ4cB-YMUBs9Ltj9y2I1spauLE5lqPisP8UHTrpEjdIt4HLvdbZrIBEcRY6M7_9cADLFEg--HU250xry7FmyGKDynUwxx9t' },
  { id: '7', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpRrcdlKewLeI0On24fh5GndQ8J4cXiLJNewfcTvVNO5XommuLgGD2MMe7Q0szFB21SbDE4byRNmNu7biGrwCNuHNdcv3UV8SyE7vs-FMcEzMwsgB5FK8c3llM5ppfnPaGvxHaqPhas17uevk2mpjecKpNRi-1qFmg2ZMin_xNfmk6VmQTKNoLnmn4cbwjx24vZJ1soVzI2EZob9XCrA1r6RMVH_MlzQK57bux9v2swpLZJsP6ezopilm0FnqHPMEQzCZ7oTExeIhp' },
  { id: '8', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKwPY3RuL8ZwsusGGDaPK9Y_eFXtzIWgMxwX4Xr2zgprk-WGctrn4qguQnj6GSHLzbRk9agYmWOu-yZT49TTpM1o3EBDqBxO-9OfI4GRTvDksl05SO97D-e74X15Eion3sBcmqb7Oxk2d7fFveanxUuxgWd4IZHqu2xEwWCDFYK83D0s4iMJis7jtDdtXQ-cDltqCYTuJokqpcC40hL9IcXBAErnivJAEwYWod7bFZh-oGaYv1RpDCVc7nyK051xR_6ellAB97nkba' },
  { id: '9', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlLktYegHoVlcIiFapNYimoL6o9ERidcNmbYpkWTbulE1wyFm9NOohS86zey2yHmrhGCsxNbh8w6PjH7e1Lr648usMOCDARoPeNayZpF7JUvk69iEb1KdutlBgF8eZcNZgqPgtLUa7pvVk_-pO1geGeri9p6u-SRRQVgZ5gL2D1sIGG2s9VpjOy2FlrcLNlRsbaTQvO2vACyHaoA7MDczmlL4S4qdwEIl7WWQgchISdbNTt_EGNVTPq1pU5IY9PYodoef5_-_jXn8b' },
];

export default function WatchlistScreen({ onBack }: WatchlistScreenProps) {
  const gridItemWidth = (width - 48 - 24) / 3; // 3 columns, 24px container padding, 2x 12px gaps

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Sticky Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
             <MaterialIcons name="arrow-back" size={24} color="#d1d5db" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Watchlist</Text>
          <TouchableOpacity style={styles.filterBtn}>
             <MaterialIcons name="filter-list" size={24} color="#9ca3af" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryRow}>
           <Text style={styles.itemCount}>9 Movies</Text>
           <TouchableOpacity><Text style={styles.editBtn}>EDIT</Text></TouchableOpacity>
        </View>

        <View style={styles.grid}>
           {WATCHLIST_ITEMS.map(item => (
              <View key={item.id} style={[styles.gridItem, { width: gridItemWidth }]}>
                 <Image source={{ uri: item.image }} style={styles.poster} />
                 <View style={styles.overlay} />
                 <TouchableOpacity style={styles.removeBtn}>
                    <MaterialIcons name="close" size={14} color="rgba(255,255,255,0.8)" />
                 </TouchableOpacity>
              </View>
           ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1121',
  },
  header: {
    backgroundColor: 'rgba(26, 17, 33, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
    fontFamily: 'Manrope_800ExtraBold',
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  filterBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(45, 36, 52, 0.5)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  editBtn: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#9727e7',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    aspectRatio: 2/3,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#2d2434',
    marginBottom: 4,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  poster: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
    // Simple gradient replacement for now
    backgroundColor: 'rgba(0,0,0,0.3)', 
  },
  removeBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
});
