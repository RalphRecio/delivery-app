import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/config/theme';
import type { ApiError } from '@/shared/lib/api';
import { Alert, Button, Input } from '@/shared/ui';

import { flattenIssues, type FieldErrors } from '../lib/formErrors';
import { PASSWORD_MIN_LENGTH, registerFormSchema } from '../schemas/authSchemas';
import type { AccountType, RegisterFormValues, RegisterInput } from '../types';

interface RegisterFormProps {
  /** Decided by the page (customer or rider register URL), not chosen in the form. */
  accountType: AccountType;
  onSubmit: (input: RegisterInput) => void;
  isSubmitting: boolean;
  /** The failed request, if any; field errors are shown inline, the rest as a banner. */
  error?: ApiError | null;
}

const EMPTY_VALUES: RegisterFormValues = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  phone: '',
};

export function RegisterForm({ accountType, onSubmit, isSubmitting, error }: RegisterFormProps) {
  const [values, setValues] = useState<RegisterFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});

  const edit = <K extends keyof RegisterFormValues>(field: K, value: RegisterFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors({});
  };

  const handleSubmit = () => {
    const result = registerFormSchema.safeParse(values);

    if (!result.success) {
      setErrors(flattenIssues(result.error));

      return;
    }

    onSubmit({ ...result.data, account_type: accountType });
  };

  const fieldError = (field: keyof RegisterFormValues) => errors[field] ?? error?.fieldError(field);
  const hasFieldError = (Object.keys(EMPTY_VALUES) as (keyof RegisterFormValues)[]).some(
    (field) => fieldError(field) !== undefined,
  );
  const bannerError =
    error !== undefined && error !== null && !hasFieldError ? error.message : undefined;

  return (
    <View style={styles.form}>
      <View style={styles.row}>
        <View style={styles.half}>
          <Input
            label="First name"
            textContentType="givenName"
            autoComplete="given-name"
            autoFocus
            value={values.first_name}
            onChangeText={(text) => edit('first_name', text)}
            editable={!isSubmitting}
            error={fieldError('first_name')}
          />
        </View>
        <View style={styles.half}>
          <Input
            label="Last name"
            textContentType="familyName"
            autoComplete="family-name"
            value={values.last_name}
            onChangeText={(text) => edit('last_name', text)}
            editable={!isSubmitting}
            error={fieldError('last_name')}
          />
        </View>
      </View>
      <Input
        label="Email"
        placeholder="you@example.com"
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        autoCapitalize="none"
        value={values.email}
        onChangeText={(text) => edit('email', text)}
        editable={!isSubmitting}
        error={fieldError('email')}
      />
      <Input
        label="Password"
        secureTextEntry
        textContentType="newPassword"
        autoComplete="new-password"
        value={values.password}
        onChangeText={(text) => edit('password', text)}
        editable={!isSubmitting}
        error={fieldError('password')}
        hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
      />
      <Input
        label="Mobile number"
        placeholder="0917 123 4567"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        value={values.phone}
        onChangeText={(text) => edit('phone', text)}
        onSubmitEditing={handleSubmit}
        editable={!isSubmitting}
        error={fieldError('phone')}
        hint={
          accountType === 'rider'
            ? 'Customers call this number about their order. You sign in with your email.'
            : 'Your rider calls this number about your order. You sign in with your email.'
        }
      />
      {bannerError !== undefined && <Alert tone="error" message={bannerError} />}
      <Button label="Create account" onPress={handleSubmit} isLoading={isSubmitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
});
