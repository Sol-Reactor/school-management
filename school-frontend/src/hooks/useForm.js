// Minimal form state with inline validation: fields validate on blur, then live
// once touched; submit validates everything and maps server field errors back.
import { useState } from 'react';
import { getErrorMessage, getFieldErrors } from '../services/api';

export const useForm = (initial, validate = () => ({})) => {
  const [values, setValues] = useState(initial);
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const clientErrors = validate(values);
  const errors = Object.fromEntries(
    Object.keys({ ...clientErrors, ...serverErrors })
      .filter((k) => touched[k] || serverErrors[k])
      .map((k) => [k, serverErrors[k] || clientErrors[k]])
      .filter(([, v]) => v)
  );

  const field = (name) => ({
    name,
    value: values[name] ?? '',
    onChange: (e) => {
      const v = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
      setValues((s) => ({ ...s, [name]: v }));
      if (serverErrors[name]) setServerErrors(({ [name]: _omit, ...rest }) => rest);
    },
    onBlur: () => setTouched((t) => ({ ...t, [name]: true })),
  });

  const handleSubmit = (onValid) => async (e) => {
    e?.preventDefault();
    setTouched(Object.fromEntries(Object.keys({ ...initial, ...clientErrors }).map((k) => [k, true])));
    setFormError(null);
    if (Object.values(clientErrors).some(Boolean)) {
      // Move focus to the first invalid control.
      requestAnimationFrame(() => e?.target?.querySelector?.('[aria-invalid="true"]')?.focus());
      return;
    }
    setSubmitting(true);
    try {
      await onValid(values);
    } catch (error) {
      setServerErrors(getFieldErrors(error));
      setFormError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = (next = initial) => {
    setValues(next);
    setTouched({});
    setServerErrors({});
    setFormError(null);
  };

  return { values, setValues, errors, field, handleSubmit, submitting, formError, reset };
};

export const validators = {
  required: (v, label = 'This field') => (!String(v ?? '').trim() ? `${label} is required` : undefined),
  email: (v) => (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Enter a valid email address' : undefined),
  password: (v) =>
    !v
      ? 'Password is required'
      : v.length < 8
        ? 'Use at least 8 characters'
        : !/[A-Za-z]/.test(v) || !/[0-9]/.test(v)
          ? 'Include at least one letter and one number'
          : undefined,
};

export default useForm;
