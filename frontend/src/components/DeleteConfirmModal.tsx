import { Modal, Text, Group, Button, useMantineColorScheme } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { JobApplication } from '../types/job';

interface DeleteConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  job: JobApplication | null;
}

export function DeleteConfirmModal({ opened, onClose, onConfirm, job }: DeleteConfirmModalProps) {
  const { t } = useTranslation();
  const { colorScheme } = useMantineColorScheme();

  const modalHeaderBg = colorScheme === 'dark'
    ? "linear-gradient(135deg, rgba(30, 30, 40, 0.98) 0%, rgba(20, 20, 30, 0.99) 100%)"
    : "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 249, 250, 0.99) 100%)";

  const modalContentBg = colorScheme === 'dark'
    ? "linear-gradient(180deg, rgba(25, 25, 35, 0.98) 0%, rgba(15, 15, 25, 0.99) 100%)"
    : "linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 249, 250, 0.99) 100%)";

  const borderColor = colorScheme === 'dark'
    ? "rgba(255, 255, 255, 0.06)"
    : "rgba(0, 0, 0, 0.08)";

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t('actions.delete')}
      size="sm"
      styles={{
        header: {
          background: modalHeaderBg,
          borderBottom: `1px solid ${borderColor}`,
        },
        content: {
          background: modalContentBg,
        },
      }}
    >
      <Text size="sm" mb="lg">
        {t('messages.confirmDelete')}
      </Text>
      {job && (
        <Text size="sm" c="dimmed" mb="lg">
          <strong>{job.position}</strong> at <strong>{job.company}</strong>
        </Text>
      )}
      <Group justify="flex-end">
        <Button variant="subtle" onClick={onClose}>
          {t('actions.cancel')}
        </Button>
        <Button color="red" onClick={onConfirm}>
          {t('actions.delete')}
        </Button>
      </Group>
    </Modal>
  );
}
