import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface MobileOptimizedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export function MobileOptimizedInput({ 
  label, 
  error, 
  className, 
  required,
  ...props 
}: MobileOptimizedInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Input
        className={cn(
          // Mobile-optimized sizing
          'h-12 text-base px-4', // Larger touch targets and font size
          // Better mobile keyboard handling
          'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          // Error styling
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

interface MobileOptimizedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export function MobileOptimizedTextarea({ 
  label, 
  error, 
  className, 
  required,
  ...props 
}: MobileOptimizedTextareaProps) {
  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Textarea
        className={cn(
          // Mobile-optimized sizing
          'min-h-[120px] text-base px-4 py-3',
          // Better mobile keyboard handling
          'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          // Error styling
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

interface MobileOptimizedFormProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
}

export function MobileOptimizedForm({ 
  children, 
  onSubmit, 
  className 
}: MobileOptimizedFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        'space-y-6 touch-manipulation',
        // Better mobile spacing
        'px-4 py-6 sm:px-6',
        className
      )}
      // Prevent zoom on iOS when focusing inputs
      style={{ fontSize: '16px' }}
    >
      {children}
    </form>
  );
}

interface StickyMobileSubmitProps {
  children: React.ReactNode;
  disabled?: boolean;
  isLoading?: boolean;
}

export function StickyMobileSubmit({ 
  children, 
  disabled = false, 
  isLoading = false 
}: StickyMobileSubmitProps) {
  return (
    <div className="sticky bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 sm:relative sm:p-0 sm:bg-transparent sm:border-t-0">
      <Button
        type="submit"
        disabled={disabled || isLoading}
        className={cn(
          'w-full h-12 text-base font-medium',
          'touch-manipulation select-none',
          'active:scale-95 transition-transform duration-150',
          isLoading && 'opacity-70 cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Loading...
          </div>
        ) : (
          children
        )}
      </Button>
    </div>
  );
}