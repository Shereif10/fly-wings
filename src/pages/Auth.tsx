import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { m as motion } from 'framer-motion';
import { Plane, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';

const Auth = () => {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await login(email, password);
      toast({ 
        title: t('تم تسجيل الدخول بنجاح', 'Logged in successfully'),
        description: t('مرحباً بك في لوحة التحكم', 'Welcome to the dashboard')
      });
      navigate('/admin', { replace: true });

    } catch (error: any) {
      toast({
        title: t('خطأ في تسجيل الدخول', 'Login Error'),
        description: t('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'Invalid email or password'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <div className="text-center mb-10">
            <motion.img 
              src={logo} 
              alt="Fly Wings" 
              className="h-24 mx-auto mb-6"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            />
            <h1 className="text-3xl font-bold text-gradient mb-2">
              {t('أجنحة الطيران', 'Fly Wings')}
            </h1>
            <p className="text-muted-foreground">
              {t('لوحة تحكم الإدارة', 'Admin Dashboard')}
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-card rounded-3xl p-8 shadow-card border">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">
                  {t('تسجيل الدخول', 'Sign In')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t('للمسؤولين فقط', 'Administrators only')}
                </p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t('البريد الإلكتروني', 'Email Address')}
                </Label>
                <div className="relative">
                  <Mail className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    required 
                    className="ps-12 h-12 rounded-xl"
                    placeholder="admin@dashboard.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  {t('كلمة المرور', 'Password')}
                </Label>
                <div className="relative">
                  <Lock className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="password" 
                    name="password" 
                    type={showPassword ? "text" : "password"}
                    required 
                    className="ps-12 pe-12 h-12 rounded-xl"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl text-base font-semibold btn-shine" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  t('دخول', 'Sign In')
                )}
              </Button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <a href="/" className="text-primary hover:underline text-sm font-medium">
              {t('العودة للرئيسية', 'Back to Home')}
            </a>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-hero relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-20 right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-40 left-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 10, repeat: Infinity }}
          />
        </div>

        {/* Floating plane */}
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2"
          animate={{ y: [0, -30, 0], rotate: [0, 5, 0, -5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Plane className="w-48 h-48 text-white/20" />
        </motion.div>

        {/* Content */}
        <div className="absolute bottom-16 start-16 end-16 text-white">
          <motion.h2 
            className="text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {t('لوحة تحكم أجنحة الطيران', 'Fly Wings Control Panel')}
          </motion.h2>
          <motion.p 
            className="text-xl text-white/70"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {t(
              'إدارة المحتوى والطلبات والمتدربين من مكان واحد',
              'Manage content, applications, and trainees from one place'
            )}
          </motion.p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
