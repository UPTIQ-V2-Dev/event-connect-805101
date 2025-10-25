import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { authService } from '@/services/auth';
import type { LoginRequest } from '@/types/user';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    rememberMe: z.boolean().optional()
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false
        }
    });

    const rememberMe = watch('rememberMe');

    const loginMutation = useMutation({
        mutationFn: (credentials: LoginRequest) => authService.login(credentials),
        onSuccess: () => {
            toast.success('Login successful!');
            navigate('/dashboard', { replace: true });
        },
        onError: (error: any) => {
            console.error('Login error:', error);
            toast.error(error?.response?.data?.message || 'Login failed. Please try again.');
        }
    });

    const onSubmit = (data: LoginFormData) => {
        // Extract only the fields needed for login API
        const loginData = {
            email: data.email,
            password: data.password
        };
        // TODO: Implement "remember me" functionality for persistent sessions
        loginMutation.mutate(loginData);
    };

    return (
        <div className='min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4'>
            <Card className='w-full max-w-md'>
                <CardHeader className='space-y-1'>
                    <CardTitle className='text-2xl font-bold text-center'>Welcome back</CardTitle>
                    <CardDescription className='text-center'>
                        Sign in to your Event RSVP Manager account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className='space-y-4'
                    >
                        <div className='space-y-2'>
                            <Label htmlFor='email'>Email</Label>
                            <Input
                                id='email'
                                type='email'
                                placeholder='Enter your email'
                                {...register('email')}
                                className={errors.email ? 'border-destructive' : ''}
                            />
                            {errors.email && <p className='text-sm text-destructive'>{errors.email.message}</p>}
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='password'>Password</Label>
                            <div className='relative'>
                                <Input
                                    id='password'
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder='Enter your password'
                                    {...register('password')}
                                    className={errors.password ? 'border-destructive' : ''}
                                />
                                <Button
                                    type='button'
                                    variant='ghost'
                                    size='sm'
                                    className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                                </Button>
                            </div>
                            {errors.password && <p className='text-sm text-destructive'>{errors.password.message}</p>}
                        </div>

                        <div className='flex items-center space-x-2'>
                            <Checkbox
                                id='rememberMe'
                                checked={rememberMe}
                                onCheckedChange={checked => setValue('rememberMe', checked as boolean)}
                            />
                            <Label
                                htmlFor='rememberMe'
                                className='text-sm'
                            >
                                Remember me
                            </Label>
                        </div>

                        <Button
                            type='submit'
                            className='w-full'
                            disabled={loginMutation.isPending}
                        >
                            {loginMutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                            Sign in
                        </Button>
                    </form>

                    <div className='mt-6 space-y-4'>
                        <div className='text-center'>
                            <Link
                                to='/forgot-password'
                                className='text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline'
                            >
                                Forgot your password?
                            </Link>
                        </div>

                        <div className='text-center'>
                            <span className='text-sm text-muted-foreground'>Don't have an account? </span>
                            <Link
                                to='/signup'
                                className='text-sm text-primary hover:underline underline-offset-4'
                            >
                                Sign up
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
