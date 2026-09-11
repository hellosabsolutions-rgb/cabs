import React, { useState } from 'react';
import { Alert, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/Screen';
import { PrimaryButton } from '../components/PrimaryButton';
import { Card } from '../components/Card';
import { ChipSelect } from '../components/ChipSelect';
import { AttachmentPicker } from '../components/AttachmentPicker';
import { ListRow } from '../components/ListRow';
import { StatusBadge, statusTone } from '../components/StatusBadge';
import { RootStackParamList } from '../navigation/types';
import { space } from '../theme/colors';
import { useAppTheme } from '../theme/ThemeProvider';
import { useSession } from '../state/session';
import type { MessageKey } from '../i18n/en';
import type { Attachment } from '../media/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Documents'>;

const TYPES: { id: string; key: MessageKey }[] = [
  { id: 'Delivery Challan', key: 'docs.challan' },
  { id: 'POD', key: 'docs.pod' },
  { id: 'Invoice', key: 'docs.invoice' },
  { id: 'Vehicle Documents', key: 'docs.vehicleDocs' },
  { id: 'Other', key: 'docs.other' },
];

export function DocumentsScreen(_props: Props) {
  const { colors, type, t } = useAppTheme();
  const session = useSession();
  const [docType, setDocType] = useState('Delivery Challan');
  const [file, setFile] = useState<Attachment | null>(null);

  const upload = () => {
    if (!file) {
      Alert.alert(t('docs.title'), t('common.photoNeeded'));
      return;
    }
    session.uploadDoc(docType, file);
    setFile(null);
    Alert.alert(t('docs.title'), t('docs.saved'));
  };

  return (
    <Screen>
      <Text style={[type.body, { color: colors.textFaint, marginBottom: space.lg }]}>
        {t('docs.sub')}
      </Text>

      <Card style={{ marginBottom: space.lg }}>
        <Text style={type.label}>{t('docs.pickType')}</Text>
        <ChipSelect
          value={docType}
          onChange={setDocType}
          items={TYPES.map((item) => ({ id: item.id, label: t(item.key) }))}
        />
        <AttachmentPicker label={t('docs.upload')} value={file} onChange={setFile} />
        <PrimaryButton title={t('docs.upload')} onPress={upload} />
      </Card>

      {session.documents.map((d) => (
        <ListRow
          key={d.id}
          icon={d.kind === 'image' ? 'image-outline' : 'document-text-outline'}
          title={d.type}
          subtitle={`${d.at} · ${t('docs.trip', { id: d.tripId })}${d.fileName ? ` · ${d.fileName}` : ''}`}
          trailing={
            <StatusBadge
              label={d.status === 'uploaded' ? t('docs.uploaded') : t('docs.pending')}
              tone={statusTone(d.status)}
            />
          }
        />
      ))}
    </Screen>
  );
}
