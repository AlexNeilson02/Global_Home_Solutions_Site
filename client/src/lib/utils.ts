import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency with $ symbol and 2 decimal places
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "Custom Quote";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date in readable format
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(d);
}

// Generate a random NFC ID (simulated)
export function generateNfcId(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Get status badge color
export function getStatusColor(status: string): { bg: string, text: string } {
  switch (status.toLowerCase()) {
    case 'completed':
      return { bg: 'bg-secondary-100', text: 'text-secondary' };
    case 'in_progress':
    case 'in progress':
      return { bg: 'bg-info-100', text: 'text-info' };
    case 'pending':
      return { bg: 'bg-warning-100', text: 'text-warning' };
    case 'declined':
      return { bg: 'bg-destructive-100', text: 'text-destructive' };
    case 'converted': 
      return { bg: 'bg-secondary-100', text: 'text-secondary' };
    default:
      return { bg: 'bg-muted', text: 'text-muted-foreground' };
  }
}

// Format percentage with % symbol
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return "0%";
  return `${value.toFixed(1)}%`;
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

// Get initials from a name
export function getInitials(name: string): string {
  if (!name) return "";
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// Get formatted time ago
export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "";
  
  const now = new Date();
  const past = typeof date === 'string' ? new Date(date) : date;
  const diff = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  
  return formatDate(past);
}
