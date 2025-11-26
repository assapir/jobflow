import { useEffect } from "react";
import {
  Modal,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Stack,
  useMantineColorScheme,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useMediaQuery } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import type { JobApplication, CreateJobInput } from "../types/job";
import { STAGES } from "../types/job";

interface JobFormModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: CreateJobInput) => Promise<void>;
  job?: JobApplication | null;
}

export function JobFormModal({
  opened,
  onClose,
  onSubmit,
  job,
}: JobFormModalProps) {
  const { t } = useTranslation();
  const { colorScheme } = useMantineColorScheme();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const form = useForm<CreateJobInput>({
    initialValues: {
      company: job?.company || "",
      position: job?.position || "",
      location: job?.location || "",
      salary: job?.salary || "",
      linkedinUrl: job?.linkedinUrl || "",
      description: job?.description || "",
      stage: job?.stage || "wishlist",
      notes: job?.notes || "",
    },
    validate: {
      company: (value) => (value.length < 1 ? "Company is required" : null),
      position: (value) => (value.length < 1 ? "Position is required" : null),
      linkedinUrl: (value) => {
        if (!value) return null;
        try {
          new URL(value);
          return null;
        } catch {
          return "Invalid URL";
        }
      },
    },
  });

  // Reset form when modal opens or job changes
  useEffect(() => {
    if (opened) {
      form.setValues({
        company: job?.company || "",
        position: job?.position || "",
        location: job?.location || "",
        salary: job?.salary || "",
        linkedinUrl: job?.linkedinUrl || "",
        description: job?.description || "",
        stage: job?.stage || "wishlist",
        notes: job?.notes || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, job]);

  const handleSubmit = async (values: CreateJobInput) => {
    await onSubmit(values);
    form.reset();
    onClose();
  };

  const stageOptions = STAGES.map((stage) => ({
    value: stage,
    label: t(`stages.${stage}`),
  }));

  const modalHeaderBg =
    colorScheme === "dark"
      ? "linear-gradient(135deg, rgba(30, 30, 40, 0.98) 0%, rgba(20, 20, 30, 0.99) 100%)"
      : "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 249, 250, 0.99) 100%)";

  const modalContentBg =
    colorScheme === "dark"
      ? "linear-gradient(180deg, rgba(25, 25, 35, 0.98) 0%, rgba(15, 15, 25, 0.99) 100%)"
      : "linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 249, 250, 0.99) 100%)";

  const borderColor =
    colorScheme === "dark"
      ? "rgba(255, 255, 255, 0.06)"
      : "rgba(0, 0, 0, 0.08)";

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={job ? t("actions.edit") : t("actions.add")}
      size="lg"
      fullScreen={isMobile}
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
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput
            label={t("job.company")}
            placeholder="Google, Microsoft, etc."
            required
            {...form.getInputProps("company")}
          />

          <TextInput
            label={t("job.position")}
            placeholder="Software Engineer"
            required
            {...form.getInputProps("position")}
          />

          {isMobile ? (
            <>
              <TextInput
                label={t("job.location")}
                placeholder="San Francisco, CA"
                {...form.getInputProps("location")}
              />
              <TextInput
                label={t("job.salary")}
                placeholder="$150,000 - $200,000"
                {...form.getInputProps("salary")}
              />
            </>
          ) : (
            <Group grow>
              <TextInput
                label={t("job.location")}
                placeholder="San Francisco, CA"
                {...form.getInputProps("location")}
              />
              <TextInput
                label={t("job.salary")}
                placeholder="$150,000 - $200,000"
                {...form.getInputProps("salary")}
              />
            </Group>
          )}

          <TextInput
            label={t("job.linkedinUrl")}
            placeholder="https://linkedin.com/jobs/..."
            {...form.getInputProps("linkedinUrl")}
          />

          <Select
            label={t("stages.wishlist").split(" ")[0]}
            data={stageOptions}
            {...form.getInputProps("stage")}
          />

          <Textarea
            label={t("job.description")}
            placeholder="Job description..."
            rows={3}
            {...form.getInputProps("description")}
          />

          <Textarea
            label={t("job.notes")}
            placeholder="Your notes about this job..."
            rows={2}
            {...form.getInputProps("notes")}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={onClose}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit">{t("actions.save")}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
