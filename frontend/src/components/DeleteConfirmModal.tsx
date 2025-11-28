import { Text, Group, Button } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { JobApplication } from "../types/job";
import { AppModal } from "../design-system";

interface DeleteConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  job: JobApplication | null;
}

export function DeleteConfirmModal({
  opened,
  onClose,
  onConfirm,
  job,
}: DeleteConfirmModalProps) {
  const { t } = useTranslation();

  return (
    <AppModal
      opened={opened}
      onClose={onClose}
      title={t("actions.delete")}
      size="sm"
      fullScreenOnMobile={false}
    >
      <Text size="sm" mb="lg">
        {t("messages.confirmDelete")}
      </Text>
      {job && (
        <Text size="sm" c="dimmed" mb="lg">
          <strong>{job.position}</strong> at <strong>{job.company}</strong>
        </Text>
      )}
      <Group justify="flex-end">
        <Button variant="subtle" onClick={onClose}>
          {t("actions.cancel")}
        </Button>
        <Button color="red" onClick={onConfirm}>
          {t("actions.delete")}
        </Button>
      </Group>
    </AppModal>
  );
}
