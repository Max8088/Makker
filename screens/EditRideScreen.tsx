import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, StyleSheet, Alert, Platform, Modal
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../lib/supabase';
import SwipeBack from '../components/SwipeBack';

const SPORTS = [
  { id: 'route', label: 'Route', emoji: '🚴' },
  { id: 'vtt', label: 'VTT', emoji: '🚵' },
  { id: 'trail', label: 'Trail', emoji: '🏔️' },
  { id: 'running', label: 'Running', emoji: '🏃' },
];

const NIVEAUX = [
  { id: 'facile', label: 'Facile', color: '#22c55e' },
  { id: 'intermediaire', label: 'Intermédiaire', color: '#f59f00' },
  { id: 'difficile', label: 'Difficile', color: '#e05c3a' },
];

const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

type Sortie = {
  id: string; titre: string; sport: string; distance: string;
  elevation: string; allure: string; lieu: string; lieu_rencontre: string;
  date_sortie: string; heure: string; participants_max: number;
  niveau: string; description: string; createur_id: string;
  latitude?: number; longitude?: number;
};

type Suggestion = {
  display_name: string; lat: string; lon: string;
  address: {
    amenity?: string; tourism?: string; leisure?: string;
    neighbourhood?: string; suburb?: string; quarter?: string;
    road?: string; city_district?: string;
    city?: string; town?: string; village?: string;
    municipality?: string; county?: string; state?: string;
  };
};

type Props = { sortie: Sortie; onBack: () => void; onSaved: () => void; };

// ─── Mini calendrier ──────────────────────────────────────────────────────────

function MiniCalendar({ selectedDate, onSelect }: { selectedDate: string; onSelect: (date: string) => void; }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [viewYear, setViewYear] = useState(() => {
    const parts = selectedDate?.split('/');
    return parts?.length === 3 ? parseInt(parts[2]) : today.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const parts = selectedDate?.split('/');
    return parts?.length === 3 ? parseInt(parts[1]) - 1 : today.getMonth();
  });

  const parseSelected = (): Date | null => {
    if (!selectedDate) return null;
    const p = selectedDate.split('/');
    if (p.length !== 3) return null;
    const d = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
    return isNaN(d.getTime()) ? null : d;
  };
  const selectedObj = parseSelected();

  const firstDay = new Date(viewYear, viewMonth, 1);
  let startOffset = firstDay.getDay() - 1;
  if (startOffset < 0) startOffset = 6;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const handleDay = (day: number) => {
    const picked = new Date(viewYear, viewMonth, day); picked.setHours(0, 0, 0, 0);
    if (picked < today) return;
    onSelect(`${String(day).padStart(2, '0')}/${String(viewMonth + 1).padStart(2, '0')}/${viewYear}`);
  };

  const isSelected = (day: number) => selectedObj?.getDate() === day && selectedObj?.getMonth() === viewMonth && selectedObj?.getFullYear() === viewYear;
  const isToday = (day: number) => today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear;
  const isPast = (day: number) => { const d = new Date(viewYear, viewMonth, day); d.setHours(0, 0, 0, 0); return d < today; };

  const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <View style={cal.wrapper}>
      <View style={cal.nav}>
        <TouchableOpacity style={cal.navBtn} onPress={prevMonth}><Text style={cal.navArrow}>‹</Text></TouchableOpacity>
        <Text style={cal.navTitle}>{MOIS[viewMonth]} {viewYear}</Text>
        <TouchableOpacity style={cal.navBtn} onPress={nextMonth}><Text style={cal.navArrow}>›</Text></TouchableOpacity>
      </View>
      <View style={cal.weekRow}>{JOURS.map((j, i) => <Text key={i} style={cal.weekDay}>{j}</Text>)}</View>
      <View style={cal.grid}>
        {cells.map((day, idx) => {
          if (day === null) return <View key={`e-${idx}`} style={cal.cell} />;
          const past = isPast(day); const selected = isSelected(day); const todayCell = isToday(day);
          return (
            <TouchableOpacity key={day} style={[cal.cell, todayCell && !selected && cal.todayCell, selected && cal.selectedCell, past && cal.pastCell]} onPress={() => handleDay(day)} disabled={past} activeOpacity={0.7}>
              <Text style={[cal.dayText, todayCell && !selected && cal.todayText, selected && cal.selectedText, past && cal.pastText]}>{day}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Sélecteur d'heure (roulette native) ─────────────────────────────────────

function TimePicker({ time, onConfirm }: { time: string; onConfirm: (time: string) => void; }) {
  const strToDate = (t: string): Date => {
    const d = new Date();
    const parts = t.split(':');
    if (parts.length === 2) d.setHours(parseInt(parts[0]) || 7, parseInt(parts[1]) || 0, 0, 0);
    else d.setHours(7, 0, 0, 0);
    return d;
  };

  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(strToDate(time));

  const handleOpen = () => { setTempDate(strToDate(time)); setShowPicker(true); };

  const handleChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (selected) onConfirm(`${String(selected.getHours()).padStart(2, '0')}:${String(selected.getMinutes()).padStart(2, '0')}`);
    } else {
      if (selected) setTempDate(selected);
    }
  };

  const handleConfirm = () => {
    onConfirm(`${String(tempDate.getHours()).padStart(2, '0')}:${String(tempDate.getMinutes()).padStart(2, '0')}`);
    setShowPicker(false);
  };

  return (
    <>
      <TouchableOpacity style={[styles.input, styles.dateBtn, time && styles.inputConfirmed]} onPress={handleOpen} activeOpacity={0.8}>
        <Text style={[styles.dateBtnText, !time && { color: '#bbbbdd' }]}>🕐  {time || 'Heure'}</Text>
        <Text style={styles.dateBtnChevron}>▼</Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' && (
        <Modal visible={showPicker} transparent animationType="slide">
          <TouchableOpacity style={tp.overlay} activeOpacity={1} onPress={() => setShowPicker(false)} />
          <View style={tp.sheet}>
            <View style={tp.sheetHeader}>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={tp.cancelText}>Annuler</Text>
              </TouchableOpacity>
              <Text style={tp.sheetTitle}>Heure de départ</Text>
              <TouchableOpacity onPress={handleConfirm}>
                <Text style={tp.confirmText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={tempDate}
              mode="time"
              display="spinner"
              onChange={handleChange}
              locale="fr-FR"
              minuteInterval={5}
              themeVariant="light"
              style={{ height: 180, backgroundColor: '#fff' }}
            />
          </View>
        </Modal>
      )}

      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker value={tempDate} mode="time" display="default" onChange={handleChange} minuteInterval={5} />
      )}
    </>
  );
}

// ─── EditRideScreen ───────────────────────────────────────────────────────────

export default function EditRideScreen({ sortie, onBack, onSaved }: Props) {
  const [titre, setTitre] = useState(sortie.titre);
  const [sport, setSport] = useState(sortie.sport);
  const [distance, setDistance] = useState(sortie.distance);
  const [elevation, setElevation] = useState(sortie.elevation);
  const [allure, setAllure] = useState(sortie.allure);
  const [lieu, setLieu] = useState(sortie.lieu);
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(
    sortie.latitude ? { latitude: sortie.latitude, longitude: sortie.longitude! } : null
  );
  const [lieuRencontre, setLieuRencontre] = useState(sortie.lieu_rencontre || '');
  const [date, setDate] = useState(sortie.date_sortie);
  const [showCalendar, setShowCalendar] = useState(false);
  const [heure, setHeure] = useState(sortie.heure);
  const [participantsMax, setParticipantsMax] = useState(String(sortie.participants_max));
  const [niveau, setNiveau] = useState(sortie.niveau);
  const [description, setDescription] = useState(sortie.description || '');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchLocation = async (text: string) => {
    setLieu(text); setLocationCoords(null);
    if (text.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=8&addressdetails=1&countrycodes=fr`,
          { headers: { 'User-Agent': 'MakkerApp/1.0' } }
        );
        setSuggestions(await response.json()); setShowSuggestions(true);
      } catch (e) { console.log('Erreur recherche:', e); }
    }, 400);
  };

  const buildLabel = (s: Suggestion): string => {
    const addr = s.address;
    const lieu = addr.amenity || addr.tourism || addr.leisure || addr.neighbourhood || addr.suburb || addr.quarter || addr.road || '';
    const ville = addr.city || addr.town || addr.village || addr.municipality || addr.county || '';
    if (lieu && ville) return `${lieu}, ${ville}`;
    if (ville) return ville;
    return s.display_name.split(',').slice(0, 3).join(',').trim();
  };

  const selectSuggestion = (s: Suggestion) => {
    setLieu(buildLabel(s));
    setLocationCoords({ latitude: parseFloat(s.lat), longitude: parseFloat(s.lon) });
    setSuggestions([]); setShowSuggestions(false);
  };

  const handleSave = async () => {
    if (!titre || !lieu || !date || !heure) { Alert.alert('Erreur', "Remplis au moins le titre, le lieu, la date et l'heure."); return; }
    setLoading(true);
    const { error } = await supabase.from('sorties').update({
      titre, sport, distance, elevation, allure,
      lieu, lieu_rencontre: lieuRencontre, date_sortie: date, heure,
      participants_max: parseInt(participantsMax) || 5, niveau, description,
      ...(locationCoords && { latitude: locationCoords.latitude, longitude: locationCoords.longitude }),
    }).eq('id', sortie.id);
    setLoading(false);
    if (error) Alert.alert('Erreur', error.message);
    else Alert.alert('Sortie mise à jour ! ✅', '', [{ text: 'OK', onPress: onSaved }]);
  };

  const dateBtnLabel = () => {
    if (!date) return 'Choisir une date';
    const p = date.split('/');
    if (p.length !== 3) return date;
    const d = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <SwipeBack onSwipeBack={onBack}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}><Text style={styles.backArrow}>←</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier la sortie</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Titre de la sortie *</Text>
            <TextInput style={styles.input} value={titre} onChangeText={setTitre} placeholder="ex: Sortie matinale Croix-Rousse" placeholderTextColor="#bbbbdd" />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Sport</Text>
            <View style={styles.sportGrid}>
              {SPORTS.map(s => (
                <TouchableOpacity key={s.id} style={[styles.sportBtn, sport === s.id && styles.sportBtnActive]} onPress={() => setSport(s.id)}>
                  <Text style={styles.sportEmoji}>{s.emoji}</Text>
                  <Text style={[styles.sportLabel, sport === s.id && styles.sportLabelActive]}>{s.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Distance (km)</Text>
              <TextInput style={styles.input} value={distance} onChangeText={setDistance} keyboardType="numeric" placeholder="ex: 45" placeholderTextColor="#bbbbdd" />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Dénivelé (m)</Text>
              <TextInput style={styles.input} value={elevation} onChangeText={setElevation} keyboardType="numeric" placeholder="ex: 600" placeholderTextColor="#bbbbdd" />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Allure</Text>
              <TextInput style={styles.input} value={allure} onChangeText={setAllure} placeholder="ex: 28km/h" placeholderTextColor="#bbbbdd" />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Participants max</Text>
              <TextInput style={styles.input} value={participantsMax} onChangeText={setParticipantsMax} keyboardType="numeric" placeholder="ex: 8" placeholderTextColor="#bbbbdd" />
            </View>
          </View>

          {/* Date + Heure */}
          <View style={styles.row}>
            <View style={[styles.fieldGroup, { flex: 2 }]}>
              <Text style={styles.label}>Date *{date ? <Text style={styles.confirmed}> ✓</Text> : ''}</Text>
              <TouchableOpacity style={[styles.input, styles.dateBtn, date && styles.inputConfirmed]} onPress={() => setShowCalendar(v => !v)} activeOpacity={0.8}>
                <Text style={[styles.dateBtnText, !date && { color: '#bbbbdd' }]}>📅  {dateBtnLabel()}</Text>
                <Text style={styles.dateBtnChevron}>{showCalendar ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {showCalendar && (
                <MiniCalendar selectedDate={date} onSelect={(d) => { setDate(d); setShowCalendar(false); }} />
              )}
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.label}>Heure *{heure ? <Text style={styles.confirmed}> ✓</Text> : ''}</Text>
              <TimePicker time={heure} onConfirm={setHeure} />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Lieu *{locationCoords && <Text style={styles.confirmed}> ✓ Confirmé</Text>}</Text>
            <TextInput style={[styles.input, locationCoords && styles.inputConfirmed]} value={lieu} onChangeText={searchLocation} placeholder="ex: Lyon, Col de l'Oeillon..." placeholderTextColor="#bbbbdd" onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} />
            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsBox}>
                {suggestions.map((s, i) => (
                  <TouchableOpacity key={i} style={[styles.suggestionItem, i < suggestions.length - 1 && styles.suggestionBorder]} onPress={() => selectSuggestion(s)}>
                    <Text style={styles.suggestionIcon}>📍</Text>
                    <Text style={styles.suggestionText}>{buildLabel(s)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Point de rencontre</Text>
            <TextInput style={styles.input} value={lieuRencontre} onChangeText={setLieuRencontre} placeholder="ex: Place de la Croix-Rousse" placeholderTextColor="#bbbbdd" />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Niveau</Text>
            <View style={styles.niveauxRow}>
              {NIVEAUX.map(n => (
                <TouchableOpacity key={n.id} style={[styles.niveauBtn, niveau === n.id && { borderColor: n.color, backgroundColor: n.color + '15' }]} onPress={() => setNiveau(n.id)}>
                  <Text style={[styles.niveauText, niveau === n.id && { color: n.color }]}>{n.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Décris ta sortie..." placeholderTextColor="#bbbbdd" multiline numberOfLines={4} />
          </View>

          <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
            <Text style={styles.saveBtnText}>{loading ? 'Enregistrement...' : 'Enregistrer les modifications'}</Text>
          </TouchableOpacity>

        </ScrollView>
      </View>
    </SwipeBack>
  );
}

// ─── Styles TimePicker modal ──────────────────────────────────────────────────

const tp = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EEEDFE' },
  sheetTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a2e' },
  cancelText: { fontSize: 14, color: '#8888bb', fontWeight: '500' },
  confirmText: { fontSize: 14, color: '#5B52F0', fontWeight: '700' },
});

// ─── Styles calendrier ────────────────────────────────────────────────────────

const cal = StyleSheet.create({
  wrapper: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#DDD8FF', padding: 14, marginTop: 8, shadowColor: '#5B52F0', shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#EEEDFE', alignItems: 'center', justifyContent: 'center' },
  navArrow: { fontSize: 20, color: '#5B52F0', lineHeight: 24 },
  navTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a2e', textTransform: 'capitalize' },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#8888bb' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  todayCell: { borderWidth: 1.5, borderColor: '#5B52F0' },
  selectedCell: { backgroundColor: '#5B52F0', borderRadius: 8 },
  pastCell: { opacity: 0.3 },
  dayText: { fontSize: 13, fontWeight: '500', color: '#1a1a2e' },
  todayText: { color: '#5B52F0', fontWeight: '700' },
  selectedText: { color: '#fff', fontWeight: '700' },
  pastText: { color: '#8888bb' },
});

// ─── Styles écran ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F3FF', paddingTop: 56 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#EEEDFE', alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 18, color: '#5B52F0' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e' },
  fieldGroup: { gap: 6 },
  label: { fontSize: 12, fontWeight: '600', color: '#8888bb' },
  confirmed: { fontSize: 12, fontWeight: '600', color: '#22c55e' },
  input: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#DDD8FF', padding: 11, fontSize: 13, color: '#1a1a2e' },
  inputConfirmed: { borderColor: '#22c55e', backgroundColor: '#f0fdf4' },
  textArea: { height: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, paddingHorizontal: 11 },
  dateBtnText: { fontSize: 13, color: '#1a1a2e', flex: 1 },
  dateBtnChevron: { fontSize: 10, color: '#8888bb', marginLeft: 6 },
  sportGrid: { flexDirection: 'row', gap: 8 },
  sportBtn: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1.5, borderColor: '#DDD8FF', backgroundColor: '#fff' },
  sportBtnActive: { borderColor: '#5B52F0', backgroundColor: '#EEEDFE' },
  sportEmoji: { fontSize: 20, marginBottom: 4 },
  sportLabel: { fontSize: 11, fontWeight: '500', color: '#8888bb' },
  sportLabelActive: { color: '#5B52F0', fontWeight: '600' },
  niveauxRow: { flexDirection: 'row', gap: 8 },
  niveauBtn: { flex: 1, padding: 9, borderRadius: 10, borderWidth: 1.5, borderColor: '#DDD8FF', backgroundColor: '#fff', alignItems: 'center' },
  niveauText: { fontSize: 11, fontWeight: '600', color: '#8888bb' },
  suggestionsBox: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: '#DDD8FF', marginTop: 4, overflow: 'hidden', shadowColor: '#5B52F0', shadowOpacity: 0.08, shadowRadius: 8, elevation: 4 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  suggestionBorder: { borderBottomWidth: 1, borderBottomColor: '#F4F3FF' },
  suggestionIcon: { fontSize: 14 },
  suggestionText: { fontSize: 13, color: '#1a1a2e', flex: 1 },
  saveBtn: { backgroundColor: '#5B52F0', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});