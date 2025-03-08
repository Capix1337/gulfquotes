"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, TrendingUp, AlertTriangle, Loader2, MousePointerClick } from "lucide-react";
import { DataTable } from "./DataTable";
import { columns } from "./columns";

// Define analytics data structure
interface SearchAnalytics {
  totalSearches: number;
  topQueries: { query: string; count: number }[];
  topNoResultQueries: { query: string; count: number }[];
  clickThroughRate: number;
  period: {
    start: string;
    end: string;
  };
}

export function SearchAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("30");
  
  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/analytics/search?days=${timeRange}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch analytics data");
        }
        
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error("Error fetching search analytics:", error);
        setError("Failed to load analytics data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAnalytics();
  }, [timeRange]);

  // Prepare chart data
  const topQueriesChartData = analytics?.topQueries.slice(0, 10).map(item => ({
    name: item.query.length > 15 ? item.query.substring(0, 15) + "..." : item.query,
    searches: item.count,
    fullQuery: item.query
  }));

  const noResultsChartData = analytics?.topNoResultQueries.slice(0, 10).map(item => ({
    name: item.query.length > 15 ? item.query.substring(0, 15) + "..." : item.query,
    searches: item.count,
    fullQuery: item.query
  }));

  // Pie chart data for content distribution
  const contentTypesData = [
    { name: "Quotes", value: 60 },
    { name: "Authors", value: 30 },
    { name: "Users", value: 10 }
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex flex-col items-center gap-2 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <h3 className="text-xl font-semibold">Failed to load analytics</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Search Analytics Overview</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Time period:</span>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalSearches.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              In the last {timeRange} days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click-through Rate</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(analytics?.clickThroughRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Searches leading to clicks
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Popular Search</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">
              {analytics?.topQueries[0]?.query || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              Most frequent search term
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zero Results</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">
              {analytics?.topNoResultQueries[0]?.query || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              Top query with no results
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="popular">
        <TabsList>
          <TabsTrigger value="popular">Popular Searches</TabsTrigger>
          <TabsTrigger value="no-results">Failed Searches</TabsTrigger>
        </TabsList>
        
        <TabsContent value="popular" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Search Queries</CardTitle>
              <CardDescription>
                Most popular search terms used by users
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              {topQueriesChartData && topQueriesChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={topQueriesChartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={70}
                      tick={{ fontSize: 12 }} 
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name, props) => [value, "Searches"]}
                      labelFormatter={(label, props) => props[0].payload.fullQuery}
                    />
                    <Bar dataKey="searches" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-[400px]">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Popular Search Data</CardTitle>
              <CardDescription>
                Detailed view of popular searches and their frequency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} data={analytics?.topQueries || []} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="no-results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Searches With No Results</CardTitle>
              <CardDescription>
                Queries that returned no results - potential content gaps
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              {noResultsChartData && noResultsChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={noResultsChartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={70}
                      tick={{ fontSize: 12 }} 
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name, props) => [value, "Searches"]}
                      labelFormatter={(label, props) => props[0].payload.fullQuery}
                    />
                    <Bar dataKey="searches" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex justify-center items-center h-[400px]">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Failed Searches Data</CardTitle>
              <CardDescription>
                Detailed view of searches that returned no results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} data={analytics?.topNoResultQueries || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}