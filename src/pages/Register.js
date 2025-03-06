import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Container,
  Box,
  Typography,
  Button,
  Link,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import FormField from '../components/common/FormField';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/common/Logo';

// Validation schema for registration form
const RegisterSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores')
    .required('Username is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  displayName: Yup.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(30, 'Display name must be less than 30 characters')
});

const Register = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Account Details', 'Personal Information'];

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting }) => {
    setRegisterError('');
    const result = await register({
      username: values.username,
      email: values.email,
      password: values.password,
      displayName: values.displayName
    });

    if (result.success) {
      navigate('/');
    } else {
      setRegisterError(result.error || 'Registration failed. Please try again.');
    }
    setSubmitting(false);
  };

  // Handle next step
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: 4
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2
          }}
        >
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Logo variant="large" sx={{ justifyContent: 'center', mb: 1 }} />
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: 700, color: 'primary.main' }}
            >
              Join Swickr
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Create your account
            </Typography>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {registerError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {registerError}
            </Alert>
          )}

          <Formik
            initialValues={{
              username: '',
              email: '',
              password: '',
              confirmPassword: '',
              displayName: ''
            }}
            validationSchema={RegisterSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, touched, values, isValid }) => (
              <Form>
                {activeStep === 0 ? (
                  <>
                    <Field
                      component={FormField}
                      name="username"
                      label="Username"
                      placeholder="Choose a username"
                      autoComplete="username"
                      required
                    />

                    <Field
                      component={FormField}
                      name="email"
                      label="Email"
                      type="email"
                      placeholder="Enter your email"
                      autoComplete="email"
                      required
                    />

                    <Field
                      component={FormField}
                      name="password"
                      label="Password"
                      type="password"
                      placeholder="Create a password"
                      autoComplete="new-password"
                      required
                      showPassword={showPassword}
                      setShowPassword={setShowPassword}
                    />

                    <Field
                      component={FormField}
                      name="confirmPassword"
                      label="Confirm Password"
                      type="password"
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      required
                      showPassword={showConfirmPassword}
                      setShowPassword={setShowConfirmPassword}
                    />

                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      size="large"
                      sx={{ mt: 2, mb: 2, py: 1.5 }}
                      onClick={handleNext}
                      disabled={
                        !values.username ||
                        !values.email ||
                        !values.password ||
                        !values.confirmPassword ||
                        !!errors.username ||
                        !!errors.email ||
                        !!errors.password ||
                        !!errors.confirmPassword
                      }
                    >
                      Next
                    </Button>
                  </>
                ) : (
                  <>
                    <Field
                      component={FormField}
                      name="displayName"
                      label="Display Name"
                      placeholder="Enter your display name"
                      autoComplete="name"
                      required
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleBack}
                        sx={{ mr: 1 }}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={isSubmitting || loading || !isValid}
                      >
                        {(isSubmitting || loading) ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          'Create Account'
                        )}
                      </Button>
                    </Box>
                  </>
                )}
              </Form>
            )}
          </Formik>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link
                component={RouterLink}
                to="/login"
                variant="body2"
                color="primary"
                fontWeight="medium"
              >
                Sign in
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
