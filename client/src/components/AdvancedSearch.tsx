import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  X, 
  MapPin, 
  Star, 
  DollarSign,
  Calendar,
  Building,
  Users,
  SlidersHorizontal
} from 'lucide-react';

interface SearchFilters {
  query: string;
  serviceCategory: string[];
  location: string;
  priceRange: [number, number];
  rating: number;
  availability: string;
  experience: [number, number];
  verified: boolean;
  sortBy: string;
}

interface AdvancedSearchProps {
  onFiltersChange: (filters: SearchFilters) => void;
  searchType: 'contractors' | 'projects' | 'salespersons';
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ onFiltersChange, searchType }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    serviceCategory: [],
    location: '',
    priceRange: [0, 10000],
    rating: 0,
    availability: '',
    experience: [0, 20],
    verified: false,
    sortBy: 'relevance'
  });

  // Fetch service categories for filtering
  const { data: serviceCategories = [] } = useQuery({
    queryKey: ['/api/service-categories'],
    queryFn: async () => {
      const response = await fetch('/api/service-categories');
      if (!response.ok) throw new Error('Failed to fetch service categories');
      const data = await response.json();
      return data.services || [];
    }
  });

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const toggleServiceCategory = (categoryId: string) => {
    const currentCategories = filters.serviceCategory;
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(id => id !== categoryId)
      : [...currentCategories, categoryId];
    
    updateFilter('serviceCategory', newCategories);
  };

  const clearFilters = () => {
    const defaultFilters: SearchFilters = {
      query: '',
      serviceCategory: [],
      location: '',
      priceRange: [0, 10000],
      rating: 0,
      availability: '',
      experience: [0, 20],
      verified: false,
      sortBy: 'relevance'
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const hasActiveFilters = () => {
    return filters.query !== '' ||
           filters.serviceCategory.length > 0 ||
           filters.location !== '' ||
           filters.priceRange[0] > 0 || filters.priceRange[1] < 10000 ||
           filters.rating > 0 ||
           filters.availability !== '' ||
           filters.experience[0] > 0 || filters.experience[1] < 20 ||
           filters.verified ||
           filters.sortBy !== 'relevance';
  };

  const getSearchPlaceholder = () => {
    switch (searchType) {
      case 'contractors':
        return 'Search contractors by name, specialty, or service...';
      case 'projects':
        return 'Search projects by description, location, or status...';
      case 'salespersons':
        return 'Search sales representatives by name or territory...';
      default:
        return 'Search...';
    }
  };

  const getSortOptions = () => {
    const commonOptions = [
      { value: 'relevance', label: 'Relevance' },
      { value: 'rating', label: 'Highest Rated' },
      { value: 'newest', label: 'Newest First' }
    ];

    switch (searchType) {
      case 'contractors':
        return [
          ...commonOptions,
          { value: 'price_low', label: 'Lowest Price' },
          { value: 'price_high', label: 'Highest Price' },
          { value: 'experience', label: 'Most Experienced' }
        ];
      case 'projects':
        return [
          ...commonOptions,
          { value: 'budget_high', label: 'Highest Budget' },
          { value: 'deadline', label: 'Urgent Deadline' }
        ];
      case 'salespersons':
        return [
          ...commonOptions,
          { value: 'performance', label: 'Top Performers' },
          { value: 'leads', label: 'Most Leads' }
        ];
      default:
        return commonOptions;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters() && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={getSearchPlaceholder()}
            value={filters.query}
            onChange={(e) => updateFilter('query', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          {searchType === 'contractors' && (
            <>
              <Button
                variant={filters.verified ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilter('verified', !filters.verified)}
              >
                <Star className="h-3 w-3 mr-1" />
                Verified Only
              </Button>
              <Select value={filters.availability} onValueChange={(value) => updateFilter('availability', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Time</SelectItem>
                  <SelectItem value="immediate">Available Now</SelectItem>
                  <SelectItem value="week">Within a Week</SelectItem>
                  <SelectItem value="month">Within a Month</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
          
          <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {getSortOptions().map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="space-y-6 pt-4 border-t">
            {/* Location Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </label>
              <Input
                placeholder="City, State, or ZIP code"
                value={filters.location}
                onChange={(e) => updateFilter('location', e.target.value)}
              />
            </div>

            {/* Service Categories */}
            {searchType === 'contractors' && serviceCategories.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Service Categories
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {serviceCategories.map((category: any) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={filters.serviceCategory.includes(category.id.toString())}
                        onCheckedChange={() => toggleServiceCategory(category.id.toString())}
                      />
                      <label
                        htmlFor={`category-${category.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {category.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range */}
            {searchType === 'contractors' && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Hourly Rate Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
                </label>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => updateFilter('priceRange', value)}
                  max={500}
                  min={0}
                  step={25}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>$0</span>
                  <span>$500+</span>
                </div>
              </div>
            )}

            {/* Experience Range */}
            {searchType === 'contractors' && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Experience: {filters.experience[0]} - {filters.experience[1]} years
                </label>
                <Slider
                  value={filters.experience}
                  onValueChange={(value) => updateFilter('experience', value)}
                  max={30}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0 years</span>
                  <span>30+ years</span>
                </div>
              </div>
            )}

            {/* Minimum Rating */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4" />
                Minimum Rating
              </label>
              <Select value={filters.rating.toString()} onValueChange={(value) => updateFilter('rating', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Any Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any Rating</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="5">5 Stars Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters() && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Active Filters:</label>
            <div className="flex flex-wrap gap-2">
              {filters.query && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: "{filters.query}"
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter('query', '')}
                  />
                </Badge>
              )}
              {filters.location && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Location: {filters.location}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter('location', '')}
                  />
                </Badge>
              )}
              {filters.serviceCategory.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Services: {filters.serviceCategory.length} selected
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter('serviceCategory', [])}
                  />
                </Badge>
              )}
              {filters.verified && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Verified Only
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter('verified', false)}
                  />
                </Badge>
              )}
              {(filters.priceRange[0] > 0 || filters.priceRange[1] < 10000) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  ${filters.priceRange[0]} - ${filters.priceRange[1]}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter('priceRange', [0, 10000])}
                  />
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedSearch;