import { CalendarPlus, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CalendarEvent {
  title: string;
  startDate: Date;
  endDate: Date;
  description?: string;
  location?: string;
}

interface AddToCalendarButtonProps {
  event: CalendarEvent;
  className?: string;
}

export function AddToCalendarButton({ event, className }: AddToCalendarButtonProps) {
  const formatGoogleDate = (date: Date) =>
    date.toISOString().replace(/-|:|\.\d{3}/g, "").slice(0, 15) + "Z";

  const formatOutlookDate = (date: Date) =>
    date.toISOString().slice(0, 19);

  const googleUrl =
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(event.title)}` +
    `&dates=${formatGoogleDate(event.startDate)}/${formatGoogleDate(event.endDate)}` +
    `&details=${encodeURIComponent(event.description || "")}` +
    `&location=${encodeURIComponent(event.location || "")}`;

  const outlookUrl =
    `https://outlook.live.com/calendar/0/deeplink/compose?` +
    `subject=${encodeURIComponent(event.title)}` +
    `&startdt=${formatOutlookDate(event.startDate)}` +
    `&enddt=${formatOutlookDate(event.endDate)}` +
    `&body=${encodeURIComponent(event.description || "")}` +
    `&location=${encodeURIComponent(event.location || "")}`;

  const generateICS = () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//MyFinCare//FR",
      "BEGIN:VEVENT",
      `DTSTART:${formatGoogleDate(event.startDate)}`,
      `DTEND:${formatGoogleDate(event.endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${(event.description || "").replace(/\n/g, "\\n")}`,
      `LOCATION:${event.location || ""}`,
      `UID:${Date.now()}@myfincare.fr`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, "-")}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <CalendarPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          Ajouter à mon agenda
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="text-base">📅</span>
            Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={outlookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="text-base">📆</span>
            Outlook
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={generateICS}
          className="flex items-center gap-2 cursor-pointer"
        >
          <CalendarDays className="h-4 w-4" />
          Apple Calendar / Autre
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
