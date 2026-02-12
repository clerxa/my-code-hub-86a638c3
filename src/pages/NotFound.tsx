import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface NotFoundConfig {
  title: string;
  message: string;
  button_text: string;
  button_url: string;
  image_url: string;
  video_url: string;
  use_video: boolean;
  background_color: string;
}

const defaultConfig: NotFoundConfig = {
  title: "404",
  message: "Oops! Page non trouvée",
  button_text: "Retour à l'accueil",
  button_url: "/",
  image_url: "",
  video_url: "",
  use_video: false,
  background_color: "",
};

const NotFound = () => {
  const location = useLocation();
  const [config, setConfig] = useState<NotFoundConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    fetchConfig();
  }, [location.pathname]);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "not_found_config")
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data?.value) {
        const parsed = typeof data.value === 'string' 
          ? JSON.parse(data.value) 
          : data.value;
        setConfig({ ...defaultConfig, ...parsed });
      }
    } catch (error) {
      console.error("Error fetching 404 config:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const backgroundStyle = config.background_color 
    ? { backgroundColor: `hsl(${config.background_color})` }
    : undefined;

  return (
    <div 
      className="flex min-h-screen items-center justify-center bg-muted"
      style={backgroundStyle}
    >
      <div className="text-center space-y-6 p-8">
        {/* Media */}
        {config.use_video && config.video_url ? (
          <div className="flex justify-center">
            <video
              src={config.video_url}
              className="w-64 h-64 object-cover rounded-lg"
              muted
              loop
              autoPlay
              playsInline
            />
          </div>
        ) : config.image_url ? (
          <div className="flex justify-center">
            <img
              src={config.image_url}
              alt="404"
              className="w-64 h-64 object-contain rounded-lg"
            />
          </div>
        ) : null}

        {/* Title */}
        <h1 className="text-4xl font-bold">{config.title}</h1>
        
        {/* Message */}
        <p className="text-xl text-muted-foreground">{config.message}</p>
        
        {/* Button */}
        <Button asChild>
          <Link to={config.button_url}>
            {config.button_text}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
