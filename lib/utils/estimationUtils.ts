/**
 * Project Timeline Estimation Utilities
 * 
 * This module provides various algorithms to estimate project end dates
 * based on different criteria such as task count, vehicle count, historical
 * data, and team performance metrics.
 */

export interface EstimationInput {
  startDate: string;
  vehicles?: any[];
  tasks?: any[];
  teamMembers?: any[];
  projectSettings?: any;
}

export interface EstimationResult {
  estimatedEndDate: string;
  totalDays: number;
  method: string;
  confidence: 'low' | 'medium' | 'high';
  details: string;
  breakdown?: {
    phase: string;
    duration: number;
    description: string;
  }[];
}

/**
 * Estimate project duration based on vehicle count
 * Assumes each vehicle takes a certain number of days to complete
 */
export function estimateByVehicleCount(input: EstimationInput): EstimationResult {
  const { startDate, vehicles = [] } = input;
  
  // Default assumptions (can be made configurable)
  const daysPerVehicle = 0.8; // Average 0.8 days per vehicle
  const parallelInstallations = 3; // Max 3 vehicles can be worked on simultaneously
  const setupDays = 2; // Initial setup time
  const bufferDays = 3; // Buffer for unexpected issues
  
  const totalVehicles = vehicles.length;
  const workDays = setupDays + Math.ceil(totalVehicles / parallelInstallations) * daysPerVehicle + bufferDays;
  
  const start = new Date(startDate);
  const estimatedEnd = new Date(start.getTime() + (workDays * 24 * 60 * 60 * 1000));
  
  const breakdown = [
    { phase: 'Setup & Planning', duration: setupDays, description: 'Initial project setup and preparation' },
    { phase: 'Vehicle Installations', duration: Math.ceil(totalVehicles / parallelInstallations) * daysPerVehicle, description: `${totalVehicles} vehicles, ${parallelInstallations} parallel installations` },
    { phase: 'Testing & Buffer', duration: bufferDays, description: 'Final testing and contingency time' }
  ];
  
  return {
    estimatedEndDate: estimatedEnd.toISOString().split('T')[0],
    totalDays: Math.ceil(workDays),
    method: 'Vehicle Count',
    confidence: totalVehicles > 0 ? 'medium' : 'low',
    details: `Based on ${totalVehicles} vehicles with ${parallelInstallations} parallel installations`,
    breakdown
  };
}

/**
 * Estimate project duration based on task count and complexity
 */
export function estimateByTaskCount(input: EstimationInput): EstimationResult {
  const { startDate, tasks = [] } = input;
  
  // Task complexity scoring
  const getTaskComplexity = (task: any) => {
    let complexity = 1; // Base complexity
    
    // Add complexity based on priority
    if (task.priority === 'High') complexity += 0.5;
    if (task.priority === 'Low') complexity -= 0.2;
    
    // Add complexity based on estimated duration
    if (task.estimated_duration) {
      complexity += Math.min(task.estimated_duration / 60, 2); // Max 2 additional points for long tasks
    }
    
    // Add complexity for blocked tasks
    if (task.status === 'Blocked') complexity += 0.3;
    
    return Math.max(complexity, 0.5); // Minimum complexity of 0.5
  };
  
  const totalComplexity = tasks.reduce((sum, task) => sum + getTaskComplexity(task), 0);
  const averageTasksPerDay = 6; // Average tasks completed per day
  const workDays = Math.ceil(totalComplexity / averageTasksPerDay);
  
  const start = new Date(startDate);
  const estimatedEnd = new Date(start.getTime() + (workDays * 24 * 60 * 60 * 1000));
  
  const breakdown = [
    { 
      phase: 'Task Execution', 
      duration: workDays, 
      description: `${tasks.length} tasks with total complexity score of ${totalComplexity.toFixed(1)}` 
    }
  ];
  
  return {
    estimatedEndDate: estimatedEnd.toISOString().split('T')[0],
    totalDays: workDays,
    method: 'Task Complexity',
    confidence: tasks.length > 5 ? 'high' : 'medium',
    details: `Based on ${tasks.length} tasks with complexity analysis`,
    breakdown
  };
}

/**
 * Estimate based on team performance and historical data
 */
export function estimateByTeamPerformance(input: EstimationInput): EstimationResult {
  const { startDate, vehicles = [], tasks = [], teamMembers = [] } = input;
  
  // Calculate team efficiency
  const averageCompletionRate = teamMembers.length > 0 
    ? teamMembers.reduce((sum, member) => sum + (member.completion_rate || 70), 0) / teamMembers.length
    : 70; // Default 70% completion rate
    
  const averageQualityScore = teamMembers.length > 0
    ? teamMembers.reduce((sum, member) => sum + (member.quality_score || 80), 0) / teamMembers.length
    : 80; // Default 80% quality score
  
  // Base estimation using vehicle count
  const baseEstimation = estimateByVehicleCount(input);
  
  // Adjust based on team performance
  const efficiencyMultiplier = (100 / Math.max(averageCompletionRate, 50)) * 
                              (100 / Math.max(averageQualityScore, 50)) * 0.01;
  
  const adjustedDays = Math.ceil(baseEstimation.totalDays * efficiencyMultiplier);
  
  const start = new Date(startDate);
  const estimatedEnd = new Date(start.getTime() + (adjustedDays * 24 * 60 * 60 * 1000));
  
  const breakdown = [
    { 
      phase: 'Team-Adjusted Estimation', 
      duration: adjustedDays, 
      description: `Base: ${baseEstimation.totalDays} days, adjusted for team efficiency (${averageCompletionRate.toFixed(1)}% completion, ${averageQualityScore.toFixed(1)}% quality)` 
    }
  ];
  
  return {
    estimatedEndDate: estimatedEnd.toISOString().split('T')[0],
    totalDays: adjustedDays,
    method: 'Team Performance',
    confidence: teamMembers.length > 2 ? 'high' : 'medium',
    details: `Adjusted for team of ${teamMembers.length} members with ${averageCompletionRate.toFixed(1)}% avg completion rate`,
    breakdown
  };
}

/**
 * Conservative estimation with buffer for risks
 */
export function estimateConservative(input: EstimationInput): EstimationResult {
  const { startDate, vehicles = [] } = input;
  
  // Use the longest of all estimation methods
  const vehicleEstimation = estimateByVehicleCount(input);
  const taskEstimation = estimateByTaskCount(input);
  const teamEstimation = estimateByTeamPerformance(input);
  
  const estimations = [vehicleEstimation, taskEstimation, teamEstimation];
  const longestEstimation = estimations.reduce((longest, current) => 
    current.totalDays > longest.totalDays ? current : longest
  );
  
  // Add 20% buffer for conservative estimate
  const bufferMultiplier = 1.2;
  const conservativeDays = Math.ceil(longestEstimation.totalDays * bufferMultiplier);
  
  const start = new Date(startDate);
  const estimatedEnd = new Date(start.getTime() + (conservativeDays * 24 * 60 * 60 * 1000));
  
  const breakdown = [
    { 
      phase: 'Conservative Estimate', 
      duration: conservativeDays, 
      description: `Based on longest method (${longestEstimation.method}: ${longestEstimation.totalDays} days) with 20% buffer` 
    }
  ];
  
  return {
    estimatedEndDate: estimatedEnd.toISOString().split('T')[0],
    totalDays: conservativeDays,
    method: 'Conservative',
    confidence: 'high',
    details: `Conservative estimate with 20% buffer based on ${longestEstimation.method}`,
    breakdown
  };
}

/**
 * Optimistic estimation for best-case scenario
 */
export function estimateOptimistic(input: EstimationInput): EstimationResult {
  const { startDate, vehicles = [] } = input;
  
  // Use the shortest of all estimation methods
  const vehicleEstimation = estimateByVehicleCount(input);
  const taskEstimation = estimateByTaskCount(input);
  const teamEstimation = estimateByTeamPerformance(input);
  
  const estimations = [vehicleEstimation, taskEstimation, teamEstimation];
  const shortestEstimation = estimations.reduce((shortest, current) => 
    current.totalDays < shortest.totalDays ? current : shortest
  );
  
  // Reduce by 15% for optimistic estimate (assuming perfect conditions)
  const optimisticMultiplier = 0.85;
  const optimisticDays = Math.ceil(shortestEstimation.totalDays * optimisticMultiplier);
  
  const start = new Date(startDate);
  const estimatedEnd = new Date(start.getTime() + (optimisticDays * 24 * 60 * 60 * 1000));
  
  const breakdown = [
    { 
      phase: 'Optimistic Estimate', 
      duration: optimisticDays, 
      description: `Based on shortest method (${shortestEstimation.method}: ${shortestEstimation.totalDays} days) with 15% reduction for optimal conditions` 
    }
  ];
  
  return {
    estimatedEndDate: estimatedEnd.toISOString().split('T')[0],
    totalDays: optimisticDays,
    method: 'Optimistic',
    confidence: 'medium',
    details: `Optimistic estimate assuming perfect conditions based on ${shortestEstimation.method}`,
    breakdown
  };
}

/**
 * Get all estimation methods for comparison
 */
export function getAllEstimations(input: EstimationInput): EstimationResult[] {
  return [
    estimateByVehicleCount(input),
    estimateByTaskCount(input),
    estimateByTeamPerformance(input),
    estimateConservative(input),
    estimateOptimistic(input)
  ];
}

/**
 * Get the recommended estimation (median of all methods)
 */
export function getRecommendedEstimation(input: EstimationInput): EstimationResult {
  const allEstimations = getAllEstimations(input);
  const sortedByDays = allEstimations.sort((a, b) => a.totalDays - b.totalDays);
  const medianIndex = Math.floor(sortedByDays.length / 2);
  const medianEstimation = sortedByDays[medianIndex];
  
  return {
    ...medianEstimation,
    method: 'Recommended (Median)',
    confidence: 'high',
    details: `Median of ${allEstimations.length} estimation methods (${medianEstimation.details})`
  };
}
