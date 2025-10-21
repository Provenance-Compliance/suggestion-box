'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Clock, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';

interface DashboardStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  inProgress: number;
  completed: number;
}

interface SuggestionDashboardProps {
  onStatusChange?: () => void;
  statusChangeTrigger?: number;
}

export default function SuggestionDashboard({ onStatusChange, statusChangeTrigger }: SuggestionDashboardProps) {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    inProgress: 0,
    completed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    if (session) {
      fetchStats();
    }
  }, [session]);

  // Update stats when parent indicates changes
  useEffect(() => {
    if (onStatusChange) {
      fetchStats();
    }
  }, [statusChangeTrigger]); // Use a trigger instead of the function

  const fetchStats = async (isBackgroundRefresh = false) => {
    try {
      if (isBackgroundRefresh) {
        setIsRefreshing(true);
      }
      
      const response = await fetch('/api/suggestions/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
      if (isBackgroundRefresh) {
        setIsRefreshing(false);
      }
    }
  };

  if (!session || isLoading) {
    return null;
  }

  const statCards = [
    {
      title: 'Total',
      value: stats.total,
      icon: TrendingUp,
      color: 'bg-[#4bdcf5]',
      textColor: 'text-[#4bdcf5]',
      bgColor: 'bg-[#4bdcf5]/10',
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Approved',
      value: stats.approved,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      icon: AlertCircle,
      color: 'bg-[#4bdcf5]',
      textColor: 'text-[#4bdcf5]',
      bgColor: 'bg-[#4bdcf5]/10',
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      color: 'bg-gray-500',
      textColor: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      title: 'Rejected',
      value: stats.rejected,
      icon: XCircle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
     

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`flex bg-white rounded-lg p-4 border border-gray-200 items-start`}
            >
              <div className="flex flex-col items-start justify-center w-full">
                <div className="flex items-center justify-start min-w-full gap-2 bg-gradient-to-br from-[#4bdcf5] to-[#472d72] p-2 rounded-md">
         
                  <Icon className="h-5 w-5 text-white" />
             
                  <p className={`text-sm font-bold text-white tracking-wide`}>
                    {stat.title}
                  </p>
           
                </div>
             
                  <p className="text-3xl font-extrabold text-gray-900 mt-4 ml-4">
                    {stat.value}
                  </p>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
