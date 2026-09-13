import { useState, useEffect, useMemo } from 'react';
import { m as motion } from 'framer-motion';
import { Users, Eye, Clock, TrendingDown, Monitor, Smartphone, Globe, ExternalLink, BarChart3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface PageView {
  page: string;
  visitorId: string;
  device: string;
  source: string;
  timestamp: string;
  date: string;
}

const AnalyticsDashboard = () => {
  const { t, language } = useLanguage();
  const [views, setViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7');

  useEffect(() => {
    const fetchViews = async () => {
      try {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(period));
        const dateStr = daysAgo.toISOString().split('T')[0];

        const snap = await getDocs(
          query(
            collection(db, 'page_views'),
            where('date', '>=', dateStr),
            orderBy('date', 'desc')
          )
        );
        setViews(snap.docs.map(doc => doc.data() as PageView));
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchViews();
  }, [period]);

  const stats = useMemo(() => {
    const uniqueVisitors = new Set(views.map(v => v.visitorId)).size;
    const totalPageviews = views.length;
    const viewsPerVisit = uniqueVisitors > 0 ? (totalPageviews / uniqueVisitors).toFixed(2) : '0';

    // Daily data for chart
    const dailyMap: Record<string, { visitors: Set<string>; views: number }> = {};
    views.forEach(v => {
      if (!dailyMap[v.date]) dailyMap[v.date] = { visitors: new Set(), views: 0 };
      dailyMap[v.date].visitors.add(v.visitorId);
      dailyMap[v.date].views++;
    });

    const dailyData = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' }),
        [t('زوار', 'Visitors')]: data.visitors.size,
        [t('مشاهدات', 'Pageviews')]: data.views,
      }));

    // Top pages
    const pageMap: Record<string, Set<string>> = {};
    views.forEach(v => {
      if (!pageMap[v.page]) pageMap[v.page] = new Set();
      pageMap[v.page].add(v.visitorId);
    });
    const topPages = Object.entries(pageMap)
      .map(([page, visitors]) => ({ page, visitors: visitors.size }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 10);

    // Sources
    const sourceMap: Record<string, Set<string>> = {};
    views.forEach(v => {
      if (!sourceMap[v.source]) sourceMap[v.source] = new Set();
      sourceMap[v.source].add(v.visitorId);
    });
    const sources = Object.entries(sourceMap)
      .map(([source, visitors]) => ({ source, visitors: visitors.size }))
      .sort((a, b) => b.visitors - a.visitors);

    // Devices
    const deviceMap: Record<string, number> = {};
    views.forEach(v => {
      deviceMap[v.device] = (deviceMap[v.device] || 0) + 1;
    });
    const devices = Object.entries(deviceMap).map(([name, value]) => ({
      name: name === 'mobile' ? t('جوال', 'Mobile') : t('كمبيوتر', 'Desktop'),
      value,
      percent: totalPageviews > 0 ? ((value / totalPageviews) * 100).toFixed(1) : '0',
    }));

    return { uniqueVisitors, totalPageviews, viewsPerVisit, dailyData, topPages, sources, devices };
  }, [views, t, language]);

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

  const statCards = [
    { label: t('الزوار', 'Visitors'), value: stats.uniqueVisitors, icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: t('المشاهدات', 'Pageviews'), value: stats.totalPageviews, icon: Eye, color: 'from-green-500 to-green-600' },
    { label: t('مشاهدات/زيارة', 'Views/Visit'), value: stats.viewsPerVisit, icon: BarChart3, color: 'from-purple-500 to-purple-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6" />
            {t('تحليلات الموقع', 'Site Analytics')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('تتبع زوار موقعك والصفحات الأكثر زيارة', 'Track your website visitors and top pages')}
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">{t('آخر 7 أيام', 'Last 7 days')}</SelectItem>
            <SelectItem value="14">{t('آخر 14 يوم', 'Last 14 days')}</SelectItem>
            <SelectItem value="30">{t('آخر 30 يوم', 'Last 30 days')}</SelectItem>
            <SelectItem value="90">{t('آخر 90 يوم', 'Last 90 days')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stat Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
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
            </div>
            <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <motion.div
        className="bg-card rounded-2xl shadow-soft border p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-lg font-bold text-foreground mb-4">{t('الزوار والمشاهدات', 'Visitors & Pageviews')}</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Bar dataKey={t('زوار', 'Visitors')} fill="#3b82f6" radius={[6, 6, 0, 0]} />
              <Bar dataKey={t('مشاهدات', 'Pageviews')} fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Tables Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <motion.div
          className="bg-card rounded-2xl shadow-soft border overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="p-4 border-b">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              {t('أكثر الصفحات زيارة', 'Top Pages')}
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('الصفحة', 'Page')}</TableHead>
                <TableHead className="text-end">{t('زوار', 'Visitors')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.topPages.map((p, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">{p.page}</TableCell>
                  <TableCell className="text-end font-semibold">{p.visitors}</TableCell>
                </TableRow>
              ))}
              {stats.topPages.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                    {t('لا توجد بيانات بعد', 'No data yet')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </motion.div>

        {/* Sources */}
        <motion.div
          className="bg-card rounded-2xl shadow-soft border overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="p-4 border-b">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {t('مصادر الزيارات', 'Traffic Sources')}
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('المصدر', 'Source')}</TableHead>
                <TableHead className="text-end">{t('زوار', 'Visitors')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.sources.map((s, i) => (
                <TableRow key={i}>
                  <TableCell>{s.source}</TableCell>
                  <TableCell className="text-end font-semibold">{s.visitors}</TableCell>
                </TableRow>
              ))}
              {stats.sources.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                    {t('لا توجد بيانات بعد', 'No data yet')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </motion.div>

        {/* Devices */}
        <motion.div
          className="bg-card rounded-2xl shadow-soft border overflow-hidden lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="p-4 border-b">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              {t('الأجهزة', 'Devices')}
            </h2>
          </div>
          <div className="p-6 flex items-center gap-8 flex-wrap">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.devices}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.devices.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-3">
              {stats.devices.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                  <span className="text-foreground font-medium">{d.name}</span>
                  <span className="text-muted-foreground">{d.percent}%</span>
                  <span className="text-muted-foreground text-sm">({d.value})</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
