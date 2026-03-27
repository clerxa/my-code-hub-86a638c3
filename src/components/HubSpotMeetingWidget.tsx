import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { setBookingReferrer, setBookingReferrerWithUtm } from "@/hooks/useBookingReferrer";

interface HubSpotMeetingWidgetProps {
  primaryColor?: string;
  triggerText?: string;
  /** UTM campaign label to append to booking URLs/embeds */
  utmCampaign?: string;
}

/**
 * Unified booking button — always redirects to /expert-booking
 * with UTM tracking and contextual messaging via booking_context_messages.
 */
export const HubSpotMeetingWidget = ({
  primaryColor,
  triggerText = "Prendre rendez-vous",
  utmCampaign,
}: HubSpotMeetingWidgetProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (utmCampaign) {
      setBookingReferrerWithUtm(window.location.pathname, utmCampaign);
    } else {
      setBookingReferrer(window.location.pathname);
    }
    navigate("/expert-booking");
  };

  return (
    <Button onClick={handleClick} style={primaryColor ? { backgroundColor: primaryColor } : undefined}>
      <Calendar className="h-4 w-4 mr-2" />
      {triggerText}
    </Button>
  );
};
