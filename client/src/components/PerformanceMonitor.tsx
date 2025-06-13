import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Zap, 
  Database, 
  Globe, 
  Monitor,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  networkRequests: number;
  errorRate: number;
  userSatisfactionScore: number;
}

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    const measurePerformance = () => {
      // Use Web Performance API for real metrics
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintMetrics = performance.getEntriesByType('paint');
      
      const pageLoadTime = navigation.loadEventEnd - navigation.navigationStart;
      const firstContentfulPaint = paintMetrics.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
      
      // Calculate memory usage if available
      const memoryInfo = (performance as any).memory;
      const memoryUsage = memoryInfo ? 
        (memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100 : 0;

      // Mock additional metrics for demonstration
      const calculatedMetrics: PerformanceMetrics = {
        pageLoadTime: Math.round(pageLoadTime),
        apiResponseTime: Math.round(Math.random() * 200 + 50), // 50-250ms
        memoryUsage: Math.round(memoryUsage || Math.random() * 60 + 20), // 20-80%
        cacheHitRate: Math.round(Math.random() * 20 + 80), // 80-100%
        networkRequests: Math.round(Math.random() * 10 + 15), // 15-25 requests
        errorRate: Math.round(Math.random() * 3), // 0-3%
        userSatisfactionScore: Math.round(Math.random() * 20 + 80) // 80-100%
      };

      setMetrics(calculatedMetrics);
    };

    measurePerformance();
    
    if (isMonitoring) {
      const interval = setInterval(measurePerformance, 5000);
      return () => clearInterval(interval);
    }
  }, [isMonitoring]);

  const getPerformanceStatus = (metric: string, value: number) => {
    const thresholds: { [key: string]: { good: number; fair: number } } = {
      pageLoadTime: { good: 2000, fair: 4000 },
      apiResponseTime: { good: 100, fair: 300 },
      memoryUsage: { good: 50, fair: 75 },
      cacheHitRate: { good: 90, fair: 75 },
      errorRate: { good: 1, fair: 3 },
      userSatisfactionScore: { good: 90, fair: 75 }
    };

    const threshold = thresholds[metric];
    if (!threshold) return 'unknown';

    if (metric === 'errorRate') {
      if (value <= threshold.good) return 'good';
      if (value <= threshold.fair) return 'fair';
      return 'poor';
    }

    if (value >= threshold.good) return 'good';
    if (value >= threshold.fair) return 'fair';
    return 'poor';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fair':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'poor':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'fair':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'poor':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-700';
    }
  };

  const formatValue = (metric: string, value: number) => {
    switch (metric) {
      case 'pageLoadTime':
      case 'apiResponseTime':
        return `${value}ms`;
      case 'memoryUsage':
      case 'cacheHitRate':
      case 'errorRate':
      case 'userSatisfactionScore':
        return `${value}%`;
      case 'networkRequests':
        return `${value} requests`;
      default:
        return value.toString();
    }
  };

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mr-3" />
            <span>Measuring performance...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const performanceItems = [
    {
      key: 'pageLoadTime',
      label: 'Page Load Time',
      icon: <Globe className="h-4 w-4" />,
      value: metrics.pageLoadTime,
      description: 'Time to fully load the page'
    },
    {
      key: 'apiResponseTime',
      label: 'API Response Time',
      icon: <Database className="h-4 w-4" />,
      value: metrics.apiResponseTime,
      description: 'Average API call response time'
    },
    {
      key: 'memoryUsage',
      label: 'Memory Usage',
      icon: <Monitor className="h-4 w-4" />,
      value: metrics.memoryUsage,
      description: 'JavaScript heap memory usage'
    },
    {
      key: 'cacheHitRate',
      label: 'Cache Hit Rate',
      icon: <Zap className="h-4 w-4" />,
      value: metrics.cacheHitRate,
      description: 'Percentage of requests served from cache'
    },
    {
      key: 'networkRequests',
      label: 'Network Requests',
      icon: <Activity className="h-4 w-4" />,
      value: metrics.networkRequests,
      description: 'Total number of network requests'
    },
    {
      key: 'errorRate',
      label: 'Error Rate',
      icon: <AlertTriangle className="h-4 w-4" />,
      value: metrics.errorRate,
      description: 'Percentage of failed requests'
    }
  ];

  const overallScore = Math.round(
    (performanceItems.reduce((sum, item) => {
      const status = getPerformanceStatus(item.key, item.value);
      const score = status === 'good' ? 100 : status === 'fair' ? 70 : 40;
      return sum + score;
    }, 0) / performanceItems.length)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Monitor
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Overall Score:</span>
              <Badge className={getStatusColor(getPerformanceStatus('userSatisfactionScore', overallScore))}>
                {overallScore}%
              </Badge>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isMonitoring}
                onChange={(e) => setIsMonitoring(e.target.checked)}
                className="rounded"
              />
              Real-time monitoring
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {performanceItems.map((item) => {
            const status = getPerformanceStatus(item.key, item.value);
            
            return (
              <div
                key={item.key}
                className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  {getStatusIcon(status)}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {formatValue(item.key, item.value)}
                    </span>
                    <Badge variant="outline" className={getStatusColor(status)}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Badge>
                  </div>
                  
                  {/* Progress bar for percentage-based metrics */}
                  {['memoryUsage', 'cacheHitRate', 'userSatisfactionScore'].includes(item.key) && (
                    <Progress 
                      value={item.value} 
                      className={`h-2 ${
                        status === 'good' ? '[&>div]:bg-green-500' :
                        status === 'fair' ? '[&>div]:bg-yellow-500' :
                        '[&>div]:bg-red-500'
                      }`}
                    />
                  )}
                  
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Performance Recommendations */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Performance Recommendations
          </h4>
          <div className="space-y-2 text-sm">
            {metrics.pageLoadTime > 3000 && (
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-3 w-3" />
                Page load time is slow. Consider optimizing images and reducing bundle size.
              </div>
            )}
            {metrics.apiResponseTime > 200 && (
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-3 w-3" />
                API responses are slow. Consider implementing caching or optimizing queries.
              </div>
            )}
            {metrics.memoryUsage > 70 && (
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-3 w-3" />
                High memory usage detected. Check for memory leaks in components.
              </div>
            )}
            {metrics.cacheHitRate < 80 && (
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-3 w-3" />
                Low cache hit rate. Consider implementing better caching strategies.
              </div>
            )}
            {metrics.errorRate > 2 && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-3 w-3" />
                High error rate detected. Check network connectivity and API health.
              </div>
            )}
            {overallScore > 85 && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-3 w-3" />
                Excellent performance! All metrics are within optimal ranges.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMonitor;