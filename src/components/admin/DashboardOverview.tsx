import { useState, useEffect } from 'react';
import { m as motion } from 'framer-motion';
import { Users, MessageSquare, FileText, TrendingUp, Clock, BarChart3, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const DashboardOverview = () => {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState({
    applications: 0,
    messages: 0,
    posts: 0,
    newApplications: 0,
  });
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [applicationsOverTime, setApplicationsOverTime] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [monthlyActivity, setMonthlyActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsSnap, msgsSnap, postsSnap] = await Promise.all([
          getDocs(collection(db, 'applications')),
          getDocs(collection(db, 'contact_messages')),
          getDocs(collection(db, 'blog_posts')),
        ]);

        const newAppsSnap = await getDocs(
          query(collection(db, 'applications'), where('status', '==', 'new'))
        );

        setStats({
          applications: appsSnap.size,
          messages: msgsSnap.size,
          posts: postsSnap.size,
          newApplications: newAppsSnap.size,
        });

        // Process applications for charts
        const allApps = appsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const allMsgs = msgsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Applications over time (last 6 months)
        const monthlyData: Record<string, { apps: number; msgs: number }> = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const label = d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', year: '2-digit' });
          monthlyData[key] = { apps: 0, msgs: 0 };
        }

        allApps.forEach((app: any) => {
          if (app.createdAt) {
            const date = app.createdAt?.toDate ? app.createdAt.toDate() : new Date(app.createdAt);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyData[key]) monthlyData[key].apps++;
          }
        });

        allMsgs.forEach((msg: any) => {
          if (msg.createdAt) {
            const date = msg.createdAt?.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyData[key]) monthlyData[key].msgs++;
          }
        });

        const timeKeys = Object.keys(monthlyData);
        setApplicationsOverTime(timeKeys.map(key => {
          const d = new Date(key + '-01');
          return {
            month: d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short' }),
            [t('طلبات', 'Applications')]: monthlyData[key].apps,
            [t('رسائل', 'Messages')]: monthlyData[key].msgs,
          };
        }));

        // Status distribution
        const statusCounts: Record<string, number> = {};
        allApps.forEach((app: any) => {
          const status = app.status || 'unknown';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        const statusLabels: Record<string, { ar: string; en: string }> = {
          new: { ar: 'جديد', en: 'New' },
          contacted: { ar: 'تم التواصل', en: 'Contacted' },
          closed: { ar: 'مغلق', en: 'Closed' },
          unknown: { ar: 'غير محدد', en: 'Unknown' },
        };

        setStatusDistribution(
          Object.entries(statusCounts).map(([status, count]) => ({
            name: t(statusLabels[status]?.ar || status, statusLabels[status]?.en || status),
            value: count,
          }))
        );

        // Monthly activity summary
        setMonthlyActivity(timeKeys.map(key => {
          const d = new Date(key + '-01');
          return {
            month: d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short' }),
            [t('إجمالي النشاط', 'Total Activity')]: monthlyData[key].apps + monthlyData[key].msgs,
          };
        }));

        // Get recent applications
        const recentQuery = query(
          collection(db, 'applications'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentSnap = await getDocs(recentQuery);
        setRecentApplications(recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    { 
      label: { ar: 'إجمالي الطلبات', en: 'Total Applications' }, 
      value: stats.applications, 
      icon: Users, 
      color: 'from-blue-500 to-blue-600',
      change: '+12%'
    },
    { 
      label: { ar: 'طلبات جديدة', en: 'New Applications' }, 
      value: stats.newApplications, 
      icon: TrendingUp, 
      color: 'from-green-500 to-green-600',
      change: '+5%'
    },
    { 
      label: { ar: 'الرسائل', en: 'Messages' }, 
      value: stats.messages, 
      icon: MessageSquare, 
      color: 'from-purple-500 to-purple-600',
      change: '+8%'
    },
    { 
      label: { ar: 'المقالات', en: 'Blog Posts' }, 
      value: stats.posts, 
      icon: FileText, 
      color: 'from-orange-500 to-orange-600',
      change: '+3%'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">
          {t('مرحباً بك 👋', 'Welcome Back 👋')}
        </h1>
        <p className="text-muted-foreground">
          {t('إليك نظرة عامة على أداء الموقع', "Here's an overview of your site performance")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={index}
            className="bg-card rounded-2xl p-6 shadow-soft border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                {stat.change}
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{t(stat.label.ar, stat.label.en)}</p>
          </motion.div>
        ))}
      </div>

      {/* Analytics Charts */}
      <motion.div
        className="bg-card rounded-2xl shadow-soft border overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs defaultValue="overview" className="w-full">
          <div className="p-6 border-b flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {t('التحليلات', 'Analytics')}
            </h2>
            <TabsList>
              <TabsTrigger value="overview">{t('نظرة عامة', 'Overview')}</TabsTrigger>
              <TabsTrigger value="status">{t('حالة الطلبات', 'Status')}</TabsTrigger>
              <TabsTrigger value="activity">{t('النشاط', 'Activity')}</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={applicationsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Legend />
                  <Bar dataKey={t('طلبات', 'Applications')} fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey={t('رسائل', 'Messages')} fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="status" className="p-6">
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="p-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey={t('إجمالي النشاط', 'Total Activity')}
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Recent Applications */}
      <motion.div
        className="bg-card rounded-2xl shadow-soft border overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="p-6 border-b">
          <h2 className="text-lg font-bold text-foreground">
            {t('أحدث الطلبات', 'Recent Applications')}
          </h2>
        </div>
        <div className="divide-y">
          {recentApplications.length > 0 ? (
            recentApplications.map((app, index) => (
              <div key={app.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                      {app.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{app.fullName}</p>
                      <p className="text-sm text-muted-foreground">{app.packageName}</p>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      app.status === 'new' ? 'bg-blue-100 text-blue-700' :
                      app.status === 'contacted' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {app.status === 'new' ? t('جديد', 'New') :
                       app.status === 'contacted' ? t('تم التواصل', 'Contacted') :
                       t('مغلق', 'Closed')}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {new Date(app.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              {t('لا توجد طلبات بعد', 'No applications yet')}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardOverview;
