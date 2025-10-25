import { Search, CalendarDays, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import type { EventFilters as EventFiltersType } from '@/types/event';

interface EventFiltersProps {
    filters: EventFiltersType;
    onFiltersChange: (filters: EventFiltersType) => void;
    onClearFilters: () => void;
}

export const EventFilters = ({ filters, onFiltersChange, onClearFilters }: EventFiltersProps) => {
    const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

    const handleSearchChange = (search: string) => {
        onFiltersChange({ ...filters, search: search || undefined });
    };

    const handleStatusChange = (status: string) => {
        onFiltersChange({
            ...filters,
            status: status === 'all' ? undefined : (status as EventFiltersType['status'])
        });
    };

    const handleVisibilityChange = (visibility: string) => {
        onFiltersChange({
            ...filters,
            visibility: visibility === 'all' ? undefined : (visibility as EventFiltersType['visibility'])
        });
    };

    const handleDateRangeChange = (dateRange: { start: Date; end: Date } | undefined) => {
        onFiltersChange({
            ...filters,
            dateRange: dateRange
                ? {
                      start: dateRange.start.toISOString(),
                      end: dateRange.end.toISOString()
                  }
                : undefined
        });
    };

    return (
        <div className='space-y-4'>
            <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                <div className='relative flex-1 max-w-md'>
                    <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                    <Input
                        placeholder='Search events...'
                        value={filters.search || ''}
                        onChange={e => handleSearchChange(e.target.value)}
                        className='pl-9'
                    />
                </div>

                <div className='flex items-center gap-2'>
                    <Select
                        value={filters.status || 'all'}
                        onValueChange={handleStatusChange}
                    >
                        <SelectTrigger className='w-[140px]'>
                            <SelectValue placeholder='Status' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='all'>All Status</SelectItem>
                            <SelectItem value='published'>Published</SelectItem>
                            <SelectItem value='draft'>Draft</SelectItem>
                            <SelectItem value='cancelled'>Cancelled</SelectItem>
                            <SelectItem value='completed'>Completed</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.visibility || 'all'}
                        onValueChange={handleVisibilityChange}
                    >
                        <SelectTrigger className='w-[130px]'>
                            <Eye className='mr-2 h-4 w-4' />
                            <SelectValue placeholder='Visibility' />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value='all'>All Events</SelectItem>
                            <SelectItem value='public'>
                                <div className='flex items-center'>
                                    <Eye className='mr-2 h-4 w-4' />
                                    Public
                                </div>
                            </SelectItem>
                            <SelectItem value='private'>
                                <div className='flex items-center'>
                                    <EyeOff className='mr-2 h-4 w-4' />
                                    Private
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant='outline'
                                className='w-[140px] justify-start'
                            >
                                <CalendarDays className='mr-2 h-4 w-4' />
                                Date Range
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className='w-auto p-0'
                            align='end'
                        >
                            <Calendar
                                mode='range'
                                selected={
                                    filters.dateRange
                                        ? {
                                              from: new Date(filters.dateRange.start),
                                              to: new Date(filters.dateRange.end)
                                          }
                                        : undefined
                                }
                                onSelect={range => {
                                    if (range?.from && range?.to) {
                                        handleDateRangeChange({ start: range.from, end: range.to });
                                    } else {
                                        handleDateRangeChange(undefined);
                                    }
                                }}
                            />
                        </PopoverContent>
                    </Popover>

                    {hasActiveFilters && (
                        <Button
                            variant='ghost'
                            onClick={onClearFilters}
                        >
                            Clear
                        </Button>
                    )}
                </div>
            </div>

            {hasActiveFilters && (
                <div className='flex flex-wrap gap-2'>
                    {filters.status && <Badge variant='secondary'>Status: {filters.status}</Badge>}
                    {filters.visibility && <Badge variant='secondary'>Visibility: {filters.visibility}</Badge>}
                    {filters.dateRange && <Badge variant='secondary'>Date Range Applied</Badge>}
                    {filters.search && <Badge variant='secondary'>Search: {filters.search}</Badge>}
                </div>
            )}
        </div>
    );
};
