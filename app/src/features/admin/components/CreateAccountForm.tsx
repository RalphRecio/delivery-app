import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/config/theme';
import { flattenIssues, PASSWORD_MIN_LENGTH, type FieldErrors } from '@/features/auth';
import { Alert, Input } from '@/shared/ui';

import { useCreateAdmin, useCreateRider } from '../hooks/useAdminQueries';
import {
  ADMIN_PASSWORD_MIN_LENGTH,
  createAdminFormSchema,
  createRiderFormSchema,
} from '../schemas/adminSchemas';
import type { CreateAccountFormValues } from '../types';
import { AdminButton, Panel } from '../ui';

/** Accounts an admin provisions; customers sign up themselves. */
export type StaffRole = 'rider' | 'admin';

const EMPTY_VALUES: CreateAccountFormValues = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  password: '',
};

/** What differs between the two account types; the fields themselves are the same. */
export const ACCOUNT_COPY = {
  rider: {
    title: 'Add a rider',
    subtitle: 'Give the rider this email and password; they can change it later.',
    passwordHint: `At least ${PASSWORD_MIN_LENGTH} characters.`,
    submitLabel: 'Create rider',
  },
  admin: {
    title: 'Add an admin',
    subtitle:
      'Admins can manage fares, stores, bookings and accounts. Share the password privately.',
    passwordHint: `At least ${ADMIN_PASSWORD_MIN_LENGTH} characters, with letters and numbers.`,
    submitLabel: 'Create admin',
  },
} as const satisfies Record<StaffRole, Record<string, string>>;

interface CreateAccountFormProps {
  role: StaffRole;
  /** `plain` renders the fields only, for a dialog that brings its own title. */
  layout?: 'panel' | 'plain';
  /** Called after the account is created, e.g. to close the dialog. */
  onCreated?: () => void;
}

export function CreateAccountForm({ role, layout = 'panel', onCreated }: CreateAccountFormProps) {
  const createRider = useCreateRider();
  const createAdmin = useCreateAdmin();
  const create = role === 'admin' ? createAdmin : createRider;
  const copy = ACCOUNT_COPY[role];
  const [values, setValues] = useState<CreateAccountFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});

  const edit = (field: keyof CreateAccountFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors({});
    create.reset();
  };

  const submit = () => {
    const schema = role === 'admin' ? createAdminFormSchema : createRiderFormSchema;
    const parsed = schema.safeParse(values);

    if (!parsed.success) {
      setErrors(flattenIssues(parsed.error));

      return;
    }

    const onSuccess = () => {
      setValues(EMPTY_VALUES);
      onCreated?.();
    };

    if (role === 'admin') {
      createAdmin.mutate(parsed.data, { onSuccess });
    } else {
      createRider.mutate(parsed.data, { onSuccess });
    }
  };

  const fieldError = (field: keyof CreateAccountFormValues) =>
    errors[field] ?? create.error?.fieldError(field);
  const hasFieldError = (Object.keys(EMPTY_VALUES) as (keyof CreateAccountFormValues)[]).some(
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
        hint={copy.passwordHint}
      />
      {create.isError && !hasFieldError && <Alert tone="error" message={create.error.message} />}
      {create.isSuccess && <Alert message={`${create.data.name} can now sign in.`} />}
      <AdminButton
        size="lg"
        label={copy.submitLabel}
        onPress={submit}
        isLoading={create.isPending}
      />
    </>
  );

  if (layout === 'plain') {
    return <View style={styles.plain}>{fields}</View>;
  }

  return (
    <Panel title={copy.title} subtitle={copy.subtitle}>
      {fields}
    </Panel>
  );
}

const styles = StyleSheet.create({
  plain: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
});
