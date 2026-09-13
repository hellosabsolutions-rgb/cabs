import React, { useState, useMemo } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../components/ScreenHeader';
import { AttachmentPicker } from '../components/AttachmentPicker';
import { RootStackParamList } from '../navigation/types';
import { radius, space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';
import { useSession, DocEntry } from '../state/session';
import type { MessageKey } from '../i18n/en';
import type { Attachment } from '../media/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Documents'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DOC_TYPES: { id: string; key: MessageKey; icon: keyof typeof Ionicons.glyphMap; color: string; bgLight: string; bgDark: string }[] = [
  {
    id: 'Delivery Challan',
    key: 'docs.challan',
    icon: 'receipt-outline',
    color: '#2563EB',
    bgLight: '#EFF6FF',
    bgDark: 'rgba(37, 99, 235, 0.18)',
  },
  {
    id: 'POD',
    key: 'docs.pod',
    icon: 'checkbox-outline',
    color: '#059669',
    bgLight: '#ECFDF5',
    bgDark: 'rgba(5, 150, 105, 0.18)',
  },
  {
    id: 'Invoice',
    key: 'docs.invoice',
    icon: 'document-text-outline',
    color: '#7C3AED',
    bgLight: '#F5F3FF',
    bgDark: 'rgba(124, 58, 237, 0.18)',
  },
  {
    id: 'Vehicle Documents',
    key: 'docs.vehicleDocs',
    icon: 'car-outline',
    color: '#D97706',
    bgLight: '#FFFBEB',
    bgDark: 'rgba(217, 119, 6, 0.18)',
  },
  {
    id: 'Other',
    key: 'docs.other',
    icon: 'folder-outline',
    color: '#4B5563',
    bgLight: '#F3F4F6',
    bgDark: 'rgba(75, 85, 99, 0.18)',
  },
];

export function DocumentsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, scheme, t } = useAppTheme();
  const isDark = scheme === 'dark';
  const session = useSession();

  const [selectedType, setSelectedType] = useState('Delivery Challan');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [file, setFile] = useState<Attachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadCard, setShowUploadCard] = useState(false);

  // Document Viewer & Downloader Modal State
  const [viewerDoc, setViewerDoc] = useState<DocEntry | null>(null);

  const filterTabs = useMemo(() => {
    return [
      { id: 'All', label: `All (${session.documents.length})` },
      { id: 'Delivery Challan', label: 'Challan' },
      { id: 'POD', label: 'POD' },
      { id: 'Invoice', label: 'Invoice' },
      { id: 'Vehicle Documents', label: 'Vehicle' },
    ];
  }, [session.documents.length]);

  const filteredDocuments = useMemo(() => {
    if (selectedFilter === 'All') return session.documents;
    return session.documents.filter((doc) => doc.type === selectedFilter);
  }, [session.documents, selectedFilter]);

  const handleUpload = () => {
    if (!file) {
      Alert.alert(t('docs.title'), t('common.photoNeeded') || 'Please select a document or take a photo.');
      return;
    }
    setUploading(true);
    setTimeout(() => {
      session.uploadDoc(selectedType, file);
      setFile(null);
      setUploading(false);
      setShowUploadCard(false);
      Alert.alert('Upload Successful', `${selectedType} has been securely uploaded and saved to fleet records.`);
    }, 450);
  };

  const handleDownload = async (doc: DocEntry) => {
    try {
      const shareMessage = `KABPRO Fleet Document\nType: ${doc.type}\nTrip Ref: ${doc.tripId}\nDate: ${doc.at}\nStatus: ${doc.status.toUpperCase()}`;
      if (Platform.OS === 'ios') {
        await Share.share({
          title: `${doc.type} - ${doc.tripId}`,
          message: shareMessage,
          url: doc.uri || undefined,
        });
      } else {
        await Share.share({
          title: `${doc.type} - ${doc.tripId}`,
          message: `${shareMessage}${doc.uri ? `\nFile Link: ${doc.uri}` : ''}`,
        });
      }
      Alert.alert('Document Ready', `${doc.type} (${doc.tripId}) has been prepared and shared/saved to your device.`);
    } catch (err: any) {
      console.warn('Download/Share error:', err);
      Alert.alert('Download', 'Could not open save dialog: ' + (err?.message || 'Unknown error'));
    }
  };

  const getDocTypeMeta = (type: string) => {
    return DOC_TYPES.find((d) => d.id === type) || DOC_TYPES[4];
  };

  return (
    <View style={[styles.screenWrap, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* ─── NATIVE CLEAN HEADER ─── */}
      <ScreenHeader
        title={t('docs.title') || 'Documents'}
        subtitle="Challan, POD, invoices & vehicle papers"
        onBack={() => navigation.goBack()}
        rightAction={
          <Pressable
            onPress={() => setShowUploadCard(!showUploadCard)}
            style={({ pressed }) => [
              styles.headerUploadBtn,
              {
                backgroundColor: showUploadCard
                  ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2')
                  : (isDark ? 'rgba(37, 99, 235, 0.18)' : '#EFF6FF'),
                borderColor: showUploadCard
                  ? (isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5')
                  : (isDark ? 'rgba(37, 99, 235, 0.28)' : '#BFDBFE'),
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <Ionicons
              name={showUploadCard ? 'close' : 'cloud-upload'}
              size={15}
              color={showUploadCard ? '#EF4444' : '#2563EB'}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.headerUploadText,
                { color: showUploadCard ? '#EF4444' : '#2563EB' },
              ]}
            >
              {showUploadCard ? 'Close' : 'Upload'}
            </Text>
          </Pressable>
        }
      />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 36 }]}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ─── UPLOAD NEW DOCUMENT CARD (TOGGLEABLE OR COMPACT) ─── */}
        {showUploadCard ? (
          <View
            style={[
              styles.uploadCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.uploadCardHeader}>
              <View style={styles.uploadCardTitleRow}>
                <View style={[styles.uploadIconBadge, { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#EFF6FF' }]}>
                  <Ionicons name="cloud-upload" size={16} color="#2563EB" />
                </View>
                <View>
                  <Text style={[styles.uploadCardTitle, { color: colors.text }]}>Upload New Document</Text>
                  <Text style={[styles.uploadCardSub, { color: colors.textDim }]}>Attach PDF or camera image for fast sync</Text>
                </View>
              </View>
            </View>

            <Text style={[styles.sectionLabel, { color: colors.textDim }]}>{t('docs.pickType') || 'DOCUMENT TYPE'}</Text>

            {/* Type selector pills */}
            <View style={styles.typeSelectorRow}>
              {DOC_TYPES.map((dt) => {
                const active = selectedType === dt.id;
                return (
                  <Pressable
                    key={dt.id}
                    onPress={() => setSelectedType(dt.id)}
                    style={[
                      styles.typePill,
                      {
                        backgroundColor: active
                          ? '#2563EB'
                          : (isDark ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6'),
                        borderColor: active
                          ? '#2563EB'
                          : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB'),
                      },
                    ]}
                  >
                    <Ionicons
                      name={dt.icon}
                      size={13}
                      color={active ? '#FFFFFF' : colors.textDim}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.typePillText,
                        { color: active ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {t(dt.key)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Attachment Dropzone */}
            <View style={styles.pickerWrap}>
              <AttachmentPicker
                label={t('docs.upload') || 'Choose File or Camera'}
                value={file}
                onChange={setFile}
              />
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleUpload}
              disabled={uploading}
              style={({ pressed }) => [
                styles.submitUploadBtn,
                { opacity: pressed || uploading ? 0.8 : 1 },
              ]}
            >
              <Ionicons name="arrow-up-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.submitUploadText}>
                {uploading ? 'Uploading...' : `Upload ${selectedType}`}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* ─── STATS & QUICK BANNER ─── */}
        <View style={styles.metaBannerRow}>
          <View
            style={[
              styles.metaStatBox,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.metaStatTop}>
              <Ionicons name="document-attach" size={16} color="#2563EB" />
              <Text style={[styles.metaStatNum, { color: colors.text }]}>{session.documents.length}</Text>
            </View>
            <Text style={[styles.metaStatLabel, { color: colors.textDim }]}>Total Documents</Text>
          </View>

          <View
            style={[
              styles.metaStatBox,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.metaStatTop}>
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              <Text style={[styles.metaStatNum, { color: '#10B981' }]}>
                {session.documents.filter((d) => d.status === 'uploaded').length}
              </Text>
            </View>
            <Text style={[styles.metaStatLabel, { color: colors.textDim }]}>Verified & Active</Text>
          </View>

          <View
            style={[
              styles.metaStatBox,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.metaStatTop}>
              <Ionicons name="time-outline" size={16} color="#F59E0B" />
              <Text style={[styles.metaStatNum, { color: '#F59E0B' }]}>
                {session.documents.filter((d) => d.status === 'pending').length}
              </Text>
            </View>
            <Text style={[styles.metaStatLabel, { color: colors.textDim }]}>Pending Review</Text>
          </View>
        </View>

        {/* ─── CATEGORY FILTER STRIP ─── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterStrip}
        >
          {filterTabs.map((tab) => {
            const active = selectedFilter === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setSelectedFilter(tab.id)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active
                      ? (isDark ? '#2563EB' : '#1E40AF')
                      : (isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF'),
                    borderColor: active
                      ? '#2563EB'
                      : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB'),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: active ? '#FFFFFF' : colors.text,
                      fontWeight: active ? '700' : '600',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ─── SECTION TITLE ─── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>
            {selectedFilter === 'All' ? 'All Shift Documents' : selectedFilter}
          </Text>
          <Text style={[styles.sectionCountText, { color: colors.textDim }]}>
            {filteredDocuments.length} {filteredDocuments.length === 1 ? 'file' : 'files'}
          </Text>
        </View>

        {/* ─── DOCUMENTS LIST ─── */}
        {filteredDocuments.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="folder-open-outline" size={42} color={colors.textFaint} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No documents found</Text>
            <Text style={[styles.emptySub, { color: colors.textDim }]}>
              There are no documents filed under {selectedFilter}. Tap upload above to attach one.
            </Text>
          </View>
        ) : (
          filteredDocuments.map((doc) => {
            const meta = getDocTypeMeta(doc.type);
            const isUploaded = doc.status === 'uploaded';

            return (
              <View
                key={doc.id}
                style={[
                  styles.docCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                {/* Card Top Row: Icon + Type & Meta + Status */}
                <View style={styles.docCardHeader}>
                  <View
                    style={[
                      styles.docIconBox,
                      {
                        backgroundColor: isDark ? meta.bgDark : meta.bgLight,
                      },
                    ]}
                  >
                    <Ionicons name={meta.icon} size={22} color={meta.color} />
                  </View>

                  <View style={styles.docInfoCol}>
                    <View style={styles.docTitleRow}>
                      <Text style={[styles.docTypeTitle, { color: colors.text }]} numberOfLines={1}>
                        {doc.type}
                      </Text>
                    </View>

                    {/* Subtitle with date and trip reference */}
                    <View style={styles.docSubRow}>
                      <View style={[styles.tripRefBadge, { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF' }]}>
                        <Text style={styles.tripRefText}>{doc.tripId}</Text>
                      </View>
                      <Text style={[styles.docDateText, { color: colors.textDim }]}>
                        {doc.at}
                      </Text>
                    </View>
                  </View>

                  {/* Status Pill */}
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: isUploaded
                          ? (isDark ? 'rgba(16, 185, 129, 0.16)' : '#DCFCE7')
                          : (isDark ? 'rgba(245, 158, 11, 0.16)' : '#FEF3C7'),
                        borderColor: isUploaded
                          ? (isDark ? 'rgba(16, 185, 129, 0.3)' : '#86EFAC')
                          : (isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A'),
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: isUploaded ? '#10B981' : '#F59E0B' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: isUploaded ? '#15803D' : '#B45309' },
                      ]}
                    >
                      {isUploaded ? t('docs.uploaded') : t('docs.pending')}
                    </Text>
                  </View>
                </View>

                {/* File info bar */}
                <View
                  style={[
                    styles.fileInfoRow,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F9FAFB',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F3F4F6',
                    },
                  ]}
                >
                  <Ionicons
                    name={doc.kind === 'image' ? 'image' : 'document-attach'}
                    size={14}
                    color={colors.textDim}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.fileNameText, { color: colors.textDim }]} numberOfLines={1}>
                    {doc.fileName || `${doc.type.toLowerCase().replace(/\s+/g, '_')}.pdf`}
                  </Text>
                  <Text style={[styles.fileSizeText, { color: colors.textFaint }]}>
                    {doc.size || '1.4 MB'}
                  </Text>
                </View>

                {/* Card Action Buttons (View & Download) */}
                <View style={styles.actionButtonsRow}>
                  {/* View Document Button */}
                  <Pressable
                    onPress={() => setViewerDoc(doc)}
                    style={({ pressed }) => [
                      styles.viewBtn,
                      {
                        backgroundColor: isDark ? 'rgba(37, 99, 235, 0.16)' : '#EFF6FF',
                        borderColor: isDark ? 'rgba(37, 99, 235, 0.3)' : '#BFDBFE',
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <Ionicons name="eye-outline" size={15} color="#2563EB" style={{ marginRight: 5 }} />
                    <Text style={styles.viewBtnText}>View Document</Text>
                  </Pressable>

                  {/* Download Document Button */}
                  <Pressable
                    onPress={() => handleDownload(doc)}
                    style={({ pressed }) => [
                      styles.downloadBtn,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F3F4F6',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E5E7EB',
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <Ionicons name="download-outline" size={15} color={colors.text} style={{ marginRight: 5 }} />
                    <Text style={[styles.downloadBtnText, { color: colors.text }]}>Download</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ─── DOCUMENT VIEWER & DOWNLOAD MODAL ─── */}
      <Modal
        visible={!!viewerDoc}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setViewerDoc(null)}
      >
        {viewerDoc && (
          <View style={[styles.modalRoot, { backgroundColor: colors.bg }]}>
            {/* Modal Header */}
            <View
              style={[
                styles.modalHeader,
                {
                  backgroundColor: colors.surface,
                  borderBottomColor: colors.border,
                  paddingTop: Platform.OS === 'android' ? insets.top + 8 : 16,
                },
              ]}
            >
              <View style={styles.modalHeaderLeft}>
                <Text style={[styles.modalDocTitle, { color: colors.text }]}>{viewerDoc.type}</Text>
                <View style={styles.modalMetaTagRow}>
                  <View style={[styles.tripRefBadge, { backgroundColor: '#EFF6FF' }]}>
                    <Text style={styles.tripRefText}>{viewerDoc.tripId}</Text>
                  </View>
                  <Text style={[styles.modalDateText, { color: colors.textDim }]}>{viewerDoc.at}</Text>
                </View>
              </View>

              <Pressable
                onPress={() => setViewerDoc(null)}
                style={({ pressed }) => [
                  styles.modalCloseBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#F3F4F6',
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>

            {/* Modal Body Preview */}
            <ScrollView
              style={styles.flex}
              contentContainerStyle={styles.modalBodyScroll}
              showsVerticalScrollIndicator={false}
            >
              {viewerDoc.kind === 'image' && viewerDoc.uri ? (
                <View style={[styles.imagePreviewWrap, { backgroundColor: colors.surface }]}>
                  <Image
                    source={{ uri: viewerDoc.uri }}
                    style={styles.fullImagePreview}
                    resizeMode="contain"
                  />
                </View>
              ) : (
                /* High-fidelity Document Paper Preview */
                <View style={[styles.paperPreview, { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }]}>
                  {/* Official Header */}
                  <View style={styles.paperHeader}>
                    <View>
                      <Text style={styles.paperOrgName}>KABPRO CAB SERVICES</Text>
                      <Text style={styles.paperDocSub}>Official Fleet Logistics Record</Text>
                    </View>
                    <View style={styles.paperVerifiedBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginRight: 3 }} />
                      <Text style={styles.paperVerifiedText}>VERIFIED</Text>
                    </View>
                  </View>

                  <View style={styles.paperDivider} />

                  {/* Document Fields */}
                  <View style={styles.paperFieldGrid}>
                    <View style={styles.paperFieldItem}>
                      <Text style={styles.paperFieldLabel}>DOCUMENT TYPE</Text>
                      <Text style={styles.paperFieldValue}>{viewerDoc.type}</Text>
                    </View>
                    <View style={styles.paperFieldItem}>
                      <Text style={styles.paperFieldLabel}>TRIP REFERENCE</Text>
                      <Text style={[styles.paperFieldValue, { color: '#2563EB' }]}>{viewerDoc.tripId}</Text>
                    </View>
                    <View style={styles.paperFieldItem}>
                      <Text style={styles.paperFieldLabel}>FILE NAME</Text>
                      <Text style={styles.paperFieldValue} numberOfLines={1}>
                        {viewerDoc.fileName || `${viewerDoc.type.toLowerCase().replace(/\s+/g, '_')}.pdf`}
                      </Text>
                    </View>
                    <View style={styles.paperFieldItem}>
                      <Text style={styles.paperFieldLabel}>FILE SIZE</Text>
                      <Text style={styles.paperFieldValue}>{viewerDoc.size || '1.4 MB'}</Text>
                    </View>
                    <View style={styles.paperFieldItem}>
                      <Text style={styles.paperFieldLabel}>DATE UPLOADED</Text>
                      <Text style={styles.paperFieldValue}>{viewerDoc.at}</Text>
                    </View>
                    <View style={styles.paperFieldItem}>
                      <Text style={styles.paperFieldLabel}>STATUS</Text>
                      <Text
                        style={[
                          styles.paperFieldValue,
                          { color: viewerDoc.status === 'uploaded' ? '#10B981' : '#F59E0B' },
                        ]}
                      >
                        {viewerDoc.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Document Security Watermark Stamp */}
                  <View style={styles.stampWrap}>
                    <View style={styles.stampBox}>
                      <Text style={styles.stampText}>DIGITALLY SIGNED & VERIFIED</Text>
                      <Text style={styles.stampSub}>KABPRO FLEET AUTOMATION · ID: {viewerDoc.id.toUpperCase()}</Text>
                    </View>
                  </View>

                  {/* Barcode Mock */}
                  <View style={styles.barcodeWrap}>
                    <View style={styles.barcodeLines}>
                      {Array.from({ length: 42 }).map((_, i) => (
                        <View
                          key={i}
                          style={{
                            width: (i % 3 === 0 ? 3 : i % 2 === 0 ? 1 : 2),
                            height: 32,
                            backgroundColor: '#1E293B',
                            marginRight: 3,
                          }}
                        />
                      ))}
                    </View>
                    <Text style={styles.barcodeText}>* {viewerDoc.tripId} - {viewerDoc.id.toUpperCase()} *</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Modal Bottom Actions */}
            <View
              style={[
                styles.modalFooter,
                {
                  backgroundColor: colors.surface,
                  borderTopColor: colors.border,
                  paddingBottom: Math.max(insets.bottom, 16),
                },
              ]}
            >
              <Pressable
                onPress={() => handleDownload(viewerDoc)}
                style={({ pressed }) => [
                  styles.modalDownloadPrimary,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Ionicons name="download" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.modalDownloadText}>Download & Save File</Text>
              </Pressable>

              <Pressable
                onPress={() => handleDownload(viewerDoc)}
                style={({ pressed }) => [
                  styles.modalShareSecondary,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6',
                    borderColor: colors.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Ionicons name="share-social-outline" size={18} color={colors.text} />
              </Pressable>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screenWrap: { flex: 1 },
  scrollContent: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
  },

  /* Header Upload Toggle Button */
  headerUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  headerUploadText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  /* Upload Card */
  uploadCard: {
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: space.lg,
    marginBottom: space.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  uploadCardHeader: {
    marginBottom: space.md,
  },
  uploadCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  uploadCardSub: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: space.md,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pickerWrap: {
    marginBottom: space.md,
  },
  submitUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 12,
    borderCurve: 'continuous',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  submitUploadText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },

  /* Meta Stat Boxes */
  metaBannerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: space.md,
  },
  metaStatBox: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  metaStatTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metaStatNum: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  metaStatLabel: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Horizontal Filter Strip */
  filterStrip: {
    gap: 8,
    paddingBottom: 6,
    marginBottom: space.sm,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7.5,
    borderRadius: radius.pill,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12.5,
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* Document Cards */
  docCard: {
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  docCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfoCol: {
    flex: 1,
  },
  docTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docTypeTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  docSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  tripRefBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderCurve: 'continuous',
  },
  tripRefText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  docDateText: {
    fontSize: 12,
    fontWeight: '500',
  },

  /* Status Pill */
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },

  /* File Info Row */
  fileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderCurve: 'continuous',
    borderWidth: 1,
    marginTop: 10,
  },
  fileNameText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '500',
  },
  fileSizeText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 8,
  },

  /* Action Buttons (View & Download) */
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  viewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  viewBtnText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
  },
  downloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  downloadBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* Empty State */
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },

  /* Modal Viewer */
  modalRoot: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalHeaderLeft: {
    flex: 1,
  },
  modalDocTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalMetaTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  modalDateText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  /* Modal Body */
  modalBodyScroll: {
    padding: space.lg,
    alignItems: 'center',
  },
  imagePreviewWrap: {
    width: '100%',
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  fullImagePreview: {
    width: '100%',
    height: SCREEN_WIDTH * 1.1,
  },

  /* Official Paper Preview */
  paperPreview: {
    width: '100%',
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  paperHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  paperOrgName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.4,
  },
  paperDocSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  paperVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  paperVerifiedText: {
    color: '#065F46',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  paperDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  paperFieldGrid: {
    gap: 12,
  },
  paperFieldItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F1F5F9',
  },
  paperFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.3,
  },
  paperFieldValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: '60%',
    textAlign: 'right',
  },
  stampWrap: {
    alignItems: 'center',
    marginVertical: 20,
  },
  stampBox: {
    borderWidth: 1.5,
    borderColor: '#10B981',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  stampText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  stampSub: {
    color: '#059669',
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 2,
  },
  barcodeWrap: {
    alignItems: 'center',
    marginTop: 8,
  },
  barcodeLines: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barcodeText: {
    fontSize: 10,
    color: '#64748B',
    letterSpacing: 1.5,
    marginTop: 4,
    fontWeight: '600',
  },

  /* Modal Footer */
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: space.lg,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  modalDownloadPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 14,
    borderCurve: 'continuous',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  modalDownloadText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalShareSecondary: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
