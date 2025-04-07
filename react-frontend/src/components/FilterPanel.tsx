import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Filters } from '@/services/api';

interface FilterPanelProps {
  filters: Filters;
  onFilterChange: (filterType: keyof Filters, value: string) => void;
  onClearFilters: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
  onClearFilters
}) => {
  return (
    <Card className="max-h-[calc(100vh-180px)] overflow-y-auto">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Semester Filters */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-700">
              Semester
            </h3>
            <div className="space-y-2">
              {["Fall", "Spring", "Summer", "Winter"].map((semester) => (
                <div
                  key={semester}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={semester.toLowerCase()}
                    checked={filters.semester.includes(semester)}
                    onCheckedChange={() =>
                      onFilterChange("semester", semester)
                    }
                  />
                  <label
                    htmlFor={semester.toLowerCase()}
                    className="text-sm font-medium leading-none"
                  >
                    {semester}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Class Level Filters */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-700">
              Class Level
            </h3>
            <div className="space-y-2">
              {["1000", "2000", "3000", "4000", "5000+"].map((level) => (
                <div
                  key={level}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`level${level}`}
                    checked={filters.classLevel.includes(level)}
                    onCheckedChange={() =>
                      onFilterChange("classLevel", level)
                    }
                  />
                  <label
                    htmlFor={`level${level}`}
                    className="text-sm font-medium leading-none"
                  >
                    {level}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Difficulty Filters */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-700">
              Difficulty
            </h3>
            <div className="space-y-2">
              {["Easy", "Medium", "Hard"].map((difficulty) => (
                <div
                  key={difficulty}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`difficulty-${difficulty.toLowerCase()}`}
                    checked={filters.difficulty.includes(difficulty)}
                    onCheckedChange={() =>
                      onFilterChange("difficulty", difficulty)
                    }
                  />
                  <label
                    htmlFor={`difficulty-${difficulty.toLowerCase()}`}
                    className="text-sm font-medium leading-none"
                  >
                    {difficulty}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Workload Filters */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-700">
              Workload
            </h3>
            <div className="space-y-2">
              {["Light", "Moderate", "Heavy"].map((workload) => (
                <div
                  key={workload}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={`workload-${workload.toLowerCase()}`}
                    checked={filters.workload.includes(workload)}
                    onCheckedChange={() =>
                      onFilterChange("workload", workload)
                    }
                  />
                  <label
                    htmlFor={`workload-${workload.toLowerCase()}`}
                    className="text-sm font-medium leading-none"
                  >
                    {workload}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Clear Filters Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={onClearFilters}
          >
            Clear All Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterPanel;