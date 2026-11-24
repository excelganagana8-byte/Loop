import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Input, Button, Card, CardContent } from '../../components/ui/index.js';
import { Sparkles, ArrowRight, Lock, Mail, User, Building2 } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  workspaceName: z.string().trim().min(2, 'Workspace name must be at least 2 characters').optional().or(z.literal(''))
});

export const RegisterPage = () => {
  const { register: registerAuth } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      workspaceName: ''
    }
  });

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      await registerAuth({
        name: values.name,
        email: values.email,
        password: values.password,
        workspaceName: values.workspaceName || undefined
      });
      addToast({
        type: 'success',
        title: 'Account Created',
        message: 'Your workspace has been successfully created.'
      });
      navigate('/inbox');
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Registration Failed',
        message: err.response?.data?.error?.message || 'Failed to create account'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white mx-auto shadow-md shadow-brand-500/20 mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create your LOOP account</h2>
        <p className="text-xs text-slate-500 mt-1">
          Spin up an isolated workspace for your team in seconds
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="shadow-lg border-slate-200/80">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Full Name *"
                placeholder="e.g. Alex Mercer"
                icon={User}
                error={errors.name?.message}
                {...register('name')}
              />

              <Input
                label="Work Email *"
                type="email"
                placeholder="alex@company.com"
                icon={Mail}
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Workspace Name"
                placeholder="e.g. Acme Inc (optional)"
                icon={Building2}
                error={errors.workspaceName?.message}
                {...register('workspaceName')}
              />

              <Input
                label="Password *"
                type="password"
                placeholder="At least 6 characters"
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
                  icon={ArrowRight}
                  isLoading={submitting}
                >
                  Create Workspace
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
