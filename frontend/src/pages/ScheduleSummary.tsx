import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import { 
  Box, 
  Grid, 
  Paper, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material'
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import KpiCard from '../components/KpiCard'

type ViewMode = 'day' | 'week' | 'month'

// RAG Status colors and configuration
const RAG_CONFIG = {
  'On-Track': { color: '#4CAF50', bgColor: 'rgba(76, 175, 80, 0.1)' },
  'At-Risk': { color: '#FF9800', bgColor: 'rgba(255, 152, 0, 0.1)' },
  'Off-Track': { color: '#F44336', bgColor: 'rgba(244, 67, 54, 0.1)' }
}

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num/1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num/1000).toFixed(1)}k`
  return num.toString()
}

const getPerformanceColor = (percentage: number) => {
  if (percentage >= 98) return '#4CAF50'
  if (percentage >= 95) return '#FF9800'
  return '#F44336'
}

export default function ScheduleSummary(){
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [date] = useState(new Date().toISOString().split('T')[0])
  
  const { data, isLoading, error } = useQuery({ 
    queryKey: ['daily-report', viewMode, date], 
    queryFn: async () => {
      const response = await api.get('/reports/daily', {
        params: { viewMode, date }
      })
      return response.data
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  })
  
  const overall = data?.overall || { 
    plannedUnits: 0, 
    producedUnits: 0, 
    pctToPlan: 0, 
    oee: 0, 
    projection: 0, 
    rag: 'Off-Track',
    changeoverHours: 0
  }
  const lines = data?.lines || []

  // Generate chart data for visualizations
  const chartData = lines.map((line: any) => ({
    name: line.line,
    planned: line.plannedUnits,
    actual: line.producedUnits,
    oee: line.oee,
    changeoverHours: line.changeoverHours
  }))

  const oeeDistribution = [
    { name: 'Excellent (≥98%)', value: lines.filter((l: any) => l.oee >= 98).length, color: '#4CAF50' },
    { name: 'Good (95-97%)', value: lines.filter((l: any) => l.oee >= 95 && l.oee < 98).length, color: '#FF9800' },
    { name: 'Poor (<95%)', value: lines.filter((l: any) => l.oee < 95).length, color: '#F44336' }
  ].filter(item => item.value > 0)

  const ragConfig = RAG_CONFIG[overall.rag as keyof typeof RAG_CONFIG] || RAG_CONFIG['Off-Track']

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress sx={{ color: '#01D1D1' }} />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Failed to load production data. Please check your connection and try again.
      </Alert>
    )
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header with View Mode Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
            Production Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {viewMode === 'day' && `Today - ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`}
            {viewMode === 'week' && `This Week - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to ${new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            {viewMode === 'month' && `This Month - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, value) => value && setViewMode(value)}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              color: '#01D1D1',
              borderColor: '#01D1D1',
              '&.Mui-selected': {
                backgroundColor: '#01D1D1',
                color: '#000'
              }
            }
          }}
        >
          <ToggleButton value="day">Today</ToggleButton>
          <ToggleButton value="week">This Week</ToggleButton>
          <ToggleButton value="month">This Month</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Overall Status Alert */}
      <Alert 
        severity={overall.rag === 'On-Track' ? 'success' : overall.rag === 'At-Risk' ? 'warning' : 'error'}
        sx={{ 
          mb: 3,
          backgroundColor: ragConfig.bgColor,
          color: ragConfig.color,
          '& .MuiAlert-icon': { color: ragConfig.color }
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Production Status: {overall.rag}
        </Typography>
        <Typography variant="body2">
          {overall.rag === 'On-Track' && 'All production lines are meeting targets. Keep up the excellent work!'}
          {overall.rag === 'At-Risk' && 'Some production lines are below target. Monitor closely and consider interventions.'}
          {overall.rag === 'Off-Track' && 'Critical: Multiple lines are significantly behind target. Immediate action required.'}
        </Typography>
      </Alert>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <KpiCard 
            label="Units Planned" 
            value={formatNumber(overall.plannedUnits)}
            sub={`${viewMode} target`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <KpiCard 
            label="Units Produced" 
            value={formatNumber(overall.producedUnits)}
            sub={`${((overall.producedUnits/overall.plannedUnits)*100 || 0).toFixed(1)}% of plan`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <KpiCard 
            label="Performance" 
            value={`${overall.pctToPlan}%`}
            sub={overall.pctToPlan >= 98 ? 'Excellent' : overall.pctToPlan >= 95 ? 'Good' : 'Needs Attention'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <KpiCard 
            label="Overall OEE" 
            value={`${overall.oee}%`}
            sub={`${overall.changeoverHours.toFixed(1)}h changeovers`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <KpiCard 
            label="Projection" 
            value={formatNumber(overall.projection)}
            sub={`Week forecast`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <KpiCard 
            label="Status" 
            value={overall.rag}
            sub={`${lines.length} lines active`}
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Production Performance Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Production Performance by Line
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'planned' || name === 'actual' ? formatNumber(value) : value,
                    name === 'planned' ? 'Planned' : name === 'actual' ? 'Actual' : 'OEE %'
                  ]}
                />
                <Bar dataKey="planned" fill="#01D1D1" name="planned" radius={[2, 2, 0, 0]} />
                <Bar dataKey="actual" fill="#2A9D8F" name="actual" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* OEE Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              OEE Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={oeeDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {oeeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Box sx={{ mt: 2 }}>
              {oeeDistribution.map((item, index) => (
                <Chip
                  key={index}
                  label={`${item.name}: ${item.value} lines`}
                  size="small"
                  sx={{ 
                    mr: 1, 
                    mb: 1, 
                    backgroundColor: item.color,
                    color: '#fff',
                    fontWeight: 600
                  }}
                />
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Detailed Line Performance Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid rgba(1,209,209,0.2)' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Line Performance Details
          </Typography>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(1,209,209,0.05)' }}>
              <TableCell sx={{ fontWeight: 600 }}>Line</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Performance</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Planned Units</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actual Units</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>OEE</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Changeover Time</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Schedule Variance</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Top Issues</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lines.map((line: any) => {
              const performance = line.plannedUnits > 0 ? (line.producedUnits / line.plannedUnits) * 100 : 0
              const performanceColor = getPerformanceColor(performance)
              
              return (
                <TableRow key={line.line} sx={{ '&:hover': { backgroundColor: 'rgba(1,209,209,0.02)' } }}>
                  <TableCell sx={{ fontWeight: 600 }}>{line.line}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(performance, 100)}
                        sx={{
                          width: 60,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: performanceColor,
                            borderRadius: 4
                          }
                        }}
                      />
                      <Typography variant="body2" sx={{ color: performanceColor, fontWeight: 600 }}>
                        {performance.toFixed(1)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{formatNumber(line.plannedUnits)}</TableCell>
                  <TableCell sx={{ color: performanceColor, fontWeight: 600 }}>
                    {formatNumber(line.producedUnits)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${line.oee}%`}
                      size="small"
                      sx={{
                        backgroundColor: getPerformanceColor(line.oee),
                        color: '#fff',
                        fontWeight: 600
                      }}
                    />
                  </TableCell>
                  <TableCell>{line.changeoverHours}h</TableCell>
                  <TableCell sx={{ 
                    color: line.aheadBehindH >= 0 ? '#4CAF50' : '#F44336',
                    fontWeight: 600
                  }}>
                    {line.aheadBehindH >= 0 ? '+' : ''}{line.aheadBehindH}h
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {(line.top3 || []).map((issue: string, index: number) => (
                        <Chip
                          key={index}
                          label={issue}
                          size="small"
                          variant="outlined"
                          sx={{ 
                            fontSize: '10px',
                            height: 20,
                            borderColor: '#FF9800',
                            color: '#FF9800'
                          }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}
