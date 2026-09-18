/**
 * Job Application Tracker
 * A simple React Native app to log and track job applications:
 * company, role, status, date applied, and notes.
 *
 * Stack: React Native (Expo) + AsyncStorage for local persistence.
 * Author: Tejaswi Sai Gadadasu
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@job_applications';
const STATUS_OPTIONS = ['Applied', 'Interview', 'Offer', 'Rejected'];

const emptyForm = {
  company: '',
  role: '',
  status: 'Applied',
  dateApplied: new Date().toISOString().slice(0, 10),
  notes: '',
};

export default function App() {
  const [applications, setApplications] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // Load saved applications on first render
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setApplications(JSON.parse(raw));
      } catch (e) {
        console.warn('Failed to load applications', e);
      }
    })();
  }, []);

  // Persist whenever the list changes
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(applications)).catch((e) =>
      console.warn('Failed to save applications', e)
    );
  }, [applications]);

  const openAddModal = useCallback(() => {
    setEditingId(null);
    setForm(emptyForm);
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((item) => {
    setEditingId(item.id);
    setForm(item);
    setModalVisible(true);
  }, []);

  const saveApplication = useCallback(() => {
    if (!form.company.trim() || !form.role.trim()) {
      Alert.alert('Missing info', 'Company and role are required.');
      return;
    }
    if (editingId) {
      setApplications((prev) =>
        prev.map((a) => (a.id === editingId ? { ...form, id: editingId } : a))
      );
    } else {
      setApplications((prev) => [...prev, { ...form, id: Date.now().toString() }]);
    }
    setModalVisible(false);
  }, [form, editingId]);

  const deleteApplication = useCallback((id) => {
    Alert.alert('Delete entry', 'Remove this application?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setApplications((prev) => prev.filter((a) => a.id !== id)),
      },
    ]);
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openEditModal(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.company}>{item.company}</Text>
        <Text style={[styles.status, styles[`status_${item.status}`]]}>{item.status}</Text>
      </View>
      <Text style={styles.role}>{item.role}</Text>
      <Text style={styles.date}>Applied: {item.dateApplied}</Text>
      {!!item.notes && <Text style={styles.notes}>{item.notes}</Text>}
      <TouchableOpacity onPress={() => deleteApplication(item.id)}>
        <Text style={styles.deleteLink}>Delete</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Job Application Tracker</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={styles.empty}>No applications logged yet. Tap "+ Add" to start.</Text>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingId ? 'Edit Application' : 'New Application'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Company"
              value={form.company}
              onChangeText={(t) => setForm((f) => ({ ...f, company: t }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Role"
              value={form.role}
              onChangeText={(t) => setForm((f) => ({ ...f, role: t }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Date applied (YYYY-MM-DD)"
              value={form.dateApplied}
              onChangeText={(t) => setForm((f) => ({ ...f, dateApplied: t }))}
            />

            <View style={styles.statusRow}>
              {STATUS_OPTIONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusChip, form.status === s && styles.statusChipActive]}
                  onPress={() => setForm((f) => ({ ...f, status: s }))}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      form.status === s && styles.statusChipTextActive,
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Notes (recruiter, next step, link...)"
              value={form.notes}
              onChangeText={(t) => setForm((f) => ({ ...f, notes: t }))}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveApplication} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA', paddingTop: Platform.OS === 'android' ? 24 : 0 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1F2430' },
  addButton: { backgroundColor: '#2F6FED', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: '#fff', fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  company: { fontSize: 16, fontWeight: '700', color: '#1F2430' },
  role: { fontSize: 14, color: '#3C4257', marginTop: 2 },
  date: { fontSize: 12, color: '#8A8F9C', marginTop: 4 },
  notes: { fontSize: 12, color: '#5A6072', marginTop: 6, fontStyle: 'italic' },
  status: { fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, overflow: 'hidden' },
  status_Applied: { backgroundColor: '#E3ECFF', color: '#2F6FED' },
  status_Interview: { backgroundColor: '#FFF4D9', color: '#B5860B' },
  status_Offer: { backgroundColor: '#E1F7E8', color: '#1E8E4C' },
  status_Rejected: { backgroundColor: '#FDE7E7', color: '#C0392B' },
  deleteLink: { color: '#C0392B', fontSize: 12, marginTop: 8, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#8A8F9C', marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#1F2430' },
  input: {
    borderWidth: 1,
    borderColor: '#E1E4EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  notesInput: { height: 70, textAlignVertical: 'top' },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  statusChip: {
    borderWidth: 1,
    borderColor: '#E1E4EA',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  statusChipActive: { backgroundColor: '#2F6FED', borderColor: '#2F6FED' },
  statusChipText: { fontSize: 12, color: '#3C4257' },
  statusChipTextActive: { color: '#fff', fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 10, marginRight: 8 },
  cancelBtnText: { color: '#5A6072', fontWeight: '600' },
  saveBtn: { backgroundColor: '#2F6FED', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});

