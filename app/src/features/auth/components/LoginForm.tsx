import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/config/theme';
import type { ApiError } from '@/shared/lib/api';
import { Alert, Button, Input } from '@/shared/ui';

import { flattenIssues, type FieldErrors } from '../lib/formErrors';
import { loginFormSchema } from '../schemas/authSchemas';
import type { LoginFormValues, LoginInput } from '../types';

interface LoginFormProps {
  onSubmit: (input: LoginInput) => void;
  isSubmitting: boolean;
  /** The failed request, if any; field errors are shown inline, the rest as a banner. */
  error?: ApiError | null;
}

export function LoginForm({ onSubmit, isSubmitting, error }: LoginFormProps) {
  const [values, setValues] = useState<LoginFormValues>({ email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors>({});

  const edit = (field: keyof LoginFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors({});
  };

  const handleSubmit = () => {
    const result = loginFormSchema.safeParse(values);

    if (!result.success) {
      setErrors(flattenIssues(result.error));

      return;
    }

    onSubmit(result.data);
  };

  const emailError = errors.email ?? error?.fieldError('email');
  const passwordError = errors.password ?? error?.fieldError('password');
  const bannerError =
    error !== undefined && error !== null && emailError === undefined && passwordError === undefined
      ? error.message
      : undefined;

  return (
    <View style={styles.form}>
      <Input
        label="Email"
        placeholder="you@example.com"
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        autoCapitalize="none"
        autoFocus
        value={values.email}
        onChangeText={(text) => edit('email', text)}
        editable={!isSubmitting}
        error={emailError}
      />
      <Input
        label="Password"
        secureTextEntry
        textContentType="password"
        autoComplete="current-password"
        value={values.password}
        onChangeText={(text) => edit('password', text)}
        onSubmitEditing={handleSubmit}
        editable={!isSubmitting}
        error={passwordError}
      />
      {bannerError !== undefined && <Alert tone="error" message={bannerError} />}
      <Button label="Sign in" onPress={handleSubmit} isLoading={isSubmitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
});
