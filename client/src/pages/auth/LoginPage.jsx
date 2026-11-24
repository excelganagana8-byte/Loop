import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Input, Button, Card, CardContent } from '../../components/ui/index.js';
import { Sparkles, LogIn, Lock, Mail } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required')
});

export const LoginPage = () => {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      await login(values);
      addToast({
        type: 'success',
        title: 'Welcome Back',
        message: 'Signed in successfully.'
      });
      navigate('/inbox');
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Login Failed',
        message: err.response?.data?.error?.message || 'Invalid email or password'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoFill = () => {
    setValue('email', 'alex@acme.corp');
    setValue('password', 'demo123456');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white mx-auto shadow-md shadow-brand-500/20 mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to LOOP</h2>
        <p className="text-xs text-slate-500 mt-1">
          AI-Powered Customer-Feedback Intelligence Platform
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg border-slate-200/80">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                placeholder="name@company.com"
                icon={Mail}
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={Lock}
                error={errors.password?.message}
                {...register('password')}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  icon={LogIn}
                  isLoading={submitting}
                >
                  Sign In
                </Button>
              </div>
            </form>

            {/* Quick Demo Login Option */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Evaluating LOOP?</span>
                <button
                  type="button"
                  onClick={handleDemoFill}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                >
                  Fill Demo Credentials
                </button>
              </div>
            </div>

            <div className="mt-5 text-center text-xs text-slate-500">
              Don't have a workspace yet?{' '}
              <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
                Create one now
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
