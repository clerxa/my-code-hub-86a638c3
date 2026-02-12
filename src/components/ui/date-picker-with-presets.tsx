/**
 * DatePicker amélioré avec sélection rapide année/mois
 * Permet de naviguer facilement dans des dates très anciennes ou futures
 */

import * as React from "react";
import { format, setMonth, setYear } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DatePickerWithPresetsProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  placeholder?: string;
  className?: string;
  /** Année de début pour le sélecteur (ex: 1950) */
  fromYear?: number;
  /** Année de fin pour le sélecteur (ex: 2030) */
  toYear?: number;
}

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export function DatePickerWithPresets({
  date,
  onDateChange,
  disabled,
  placeholder = "Sélectionner une date",
  className,
  fromYear = 1950,
  toYear = new Date().getFullYear() + 10,
}: DatePickerWithPresetsProps) {
  // Mois affiché dans le calendrier (indépendant de la date sélectionnée)
  const [viewDate, setViewDate] = React.useState<Date>(date || new Date());
  
  // Générer les années disponibles
  const years = React.useMemo(() => {
    const result = [];
    for (let year = toYear; year >= fromYear; year--) {
      result.push(year);
    }
    return result;
  }, [fromYear, toYear]);

  const handleMonthChange = (monthIndex: string) => {
    const newDate = setMonth(viewDate, parseInt(monthIndex));
    setViewDate(newDate);
  };

  const handleYearChange = (year: string) => {
    const newDate = setYear(viewDate, parseInt(year));
    setViewDate(newDate);
  };

  const handlePrevMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setViewDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setViewDate(newDate);
  };

  // Synchroniser viewDate quand une date est sélectionnée
  React.useEffect(() => {
    if (date) {
      setViewDate(date);
    }
  }, [date]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd MMMM yyyy", { locale: fr }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 pointer-events-auto">
          {/* Header avec sélecteurs mois/année */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex gap-2">
              {/* Sélecteur de mois */}
              <Select
                value={viewDate.getMonth().toString()}
                onValueChange={handleMonthChange}
              >
                <SelectTrigger className="w-[110px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, index) => (
                    <SelectItem key={month} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Sélecteur d'année */}
              <Select
                value={viewDate.getFullYear().toString()}
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="w-[80px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Calendrier */}
          <Calendar
            mode="single"
            selected={date}
            onSelect={onDateChange}
            month={viewDate}
            onMonthChange={setViewDate}
            disabled={disabled}
            initialFocus
            className="p-0 pointer-events-auto"
            classNames={{
              caption: "hidden", // On cache le caption par défaut car on utilise nos propres sélecteurs
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
