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
  FormControlLabel,
  Checkbox
} from '@mui/material';
import FormField from '../components/common/FormField';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/common/Logo';

// Validation schema for login form
const LoginSchema = Yup.object().shape({
  username: Yup.string().required('Username or email is required'),
  password: Yup.string().required('Password is required'),
  rememberMe: Yup.boolean()
});

const Login = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting }) => {
    setLoginError('');
    const result = await login({
      username: values.username,
      password: values.password
    });

    if (result.success) {
      navigate('/');
    } else {
      setLoginError(result.error || 'Login failed. Please try again.');
    }
    setSubmitting(false);
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
            <Typography variant="subtitle1" color="text.secondary">
              quick messaging
            </Typography>
          </Box>

          {(error || loginError) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error || loginError}
            </Alert>
          )}

          <Formik
            initialValues={{
              username: '',
              password: '',
              rememberMe: true
            }}
            validationSchema={LoginSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form>
                <Field
                  component={FormField}
                  name="username"
                  label="Username or Email"
                  placeholder="Enter your username or email"
                  autoComplete="username"
                  required
                />

                <Field
                  component={FormField}
                  name="password"
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Field
                    name="rememberMe"
                    type="checkbox"
                    as={FormControlLabel}
                    control={<Checkbox color="primary" />}
                    label="Remember me"
                  />

                  <Link
                    component={RouterLink}
                    to="/forgot-password"
                    variant="body2"
                    color="primary"
                  >
                    Forgot password?
                  </Link>
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={isSubmitting || loading}
                  sx={{ mt: 2, mb: 2, py: 1.5 }}
                >
                  {(isSubmitting || loading) ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Sign In'
                  )}
                </Button>
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
              Don't have an account?{' '}
              <Link
                component={RouterLink}
                to="/register"
                variant="body2"
                color="primary"
                fontWeight="medium"
              >
                Sign up now
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
