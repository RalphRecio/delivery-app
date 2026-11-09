import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/config/theme';
import { flattenIssues, PASSWORD_MIN_LENGTH, type FieldErrors } from '@/features/auth';
import { Alert, Input } from '@/shared/ui';

import { useCreateRider } from '../hooks/useAdminQueries';
import { createRiderFormSchema } from '../schemas/adminSchemas';
import type { CreateRiderFormValues } from '../types';
import { AdminButton, Panel } from '../ui';

const EMPTY_VALUES: CreateRiderFormValues = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
};

interface CreateRiderFormProps {
  /** `plain` renders the fields only, for a dialog that brings its own title. */
  layout?: 'panel' | 'plain';
  /** Called after the rider is created, e.g. to close the dialog. */
  onCreated?: () => void;
}

export function CreateRiderForm({ layout = 'panel', onCreated }: CreateRiderFormProps) {
  const create = useCreateRider();
  const [values, setValues] = useState<CreateRiderFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});

  const edit = (field: keyof CreateRiderFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors({});
    create.reset();
  };

  const submit = () => {
    const parsed = createRiderFormSchema.safeParse(values);

    if (!parsed.success) {
      setErrors(flattenIssues(parsed.error));

      return;
    }

    create.mutate(parsed.data, {
      onSuccess: () => {
        setValues(EMPTY_VALUES);
        onCreated?.();
      },
    });
  };

  const fieldError = (field: keyof CreateRiderFormValues) =>
    errors[field] ?? create.error?.fieldError(field);
  const hasFieldError = (Object.keys(EMPTY_VALUES) as (keyof CreateRiderFormValues)[]).some(
    (field) => fieldError(field) !== undefined,
  );

  const fields = (
    <>
      <View style={styles.row}>
        <View style={styles.half}>
          <Input
            size="compact"
            label="First name"
            value={values.first_name}
            onChangeText={(text) => edit('first_name', text)}
            error={fieldError('first_name')}
          />
        </View>
        <View style={styles.half}>
          <Input
            size="compact"
            label="Last name"
            value={values.last_name}
            onChangeText={(text) => edit('last_name', text)}
            error={fieldError('last_name')}
          />
        </View>
      </View>
      <Input
        size="compact"
        label="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={values.email}
        onChangeText={(text) => edit('email', text)}
        error={fieldError('email')}
      />
      <Input
        size="compact"
        label="Mobile number"
        placeholder="0917 123 4567"
        keyboardType="phone-pad"
        value={values.phone}
        onChangeText={(text) => edit('phone', text)}
        error={fieldError('phone')}
      />
      <Input
        size="compact"
        label="First password"
        secureTextEntry
        value={values.password}
        onChangeText={(text) => edit('password', text)}
        error={fieldError('password')}
        hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
      />
      {create.isError && !hasFieldError && <Alert tone="error" message={create.error.message} />}
      {create.isSuccess && <Alert message={`${create.data.name} can now sign in.`} />}
      <AdminButton size="lg" label="Create rider" onPress={submit} isLoading={create.isPending} />
    </>
  );

  if (layout === 'plain') {
    return <View style={styles.plain}>{fields}</View>;
  }

  return (
    <Panel
      title="Add a rider"
      subtitle="Give the rider this email and password; they can change it later."
    >
      {fields}
    </Panel>
  );
}

const styles = StyleSheet.create({
  plain: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
});
