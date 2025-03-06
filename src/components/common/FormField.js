import React from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

// Reusable form field component with error handling
const FormField = ({
  field, // Formik field
  form: { touched, errors }, // Formik form
  label,
  type = 'text',
  placeholder,
  fullWidth = true,
  required = false,
  autoComplete,
  showPassword,
  setShowPassword,
  ...props
}) => {
  // Check if field has error
  const hasError = touched[field.name] && errors[field.name];
  
  // Handle password visibility toggle
  const handleClickShowPassword = () => {
    if (setShowPassword) {
      setShowPassword(!showPassword);
    }
  };

  return (
    <TextField
      {...field}
      {...props}
      label={label}
      type={type === 'password' && showPassword ? 'text' : type}
      placeholder={placeholder}
      fullWidth={fullWidth}
      required={required}
      autoComplete={autoComplete}
      error={!!hasError}
      helperText={hasError ? errors[field.name] : ''}
      margin="normal"
      InputProps={
        type === 'password'
          ? {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }
          : undefined
      }
    />
  );
};

export default FormField;
