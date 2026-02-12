import { ForumCategory } from "@/types/forum";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";

interface CategoryCardProps {
  category: ForumCategory;
  icon: React.ReactNode;
}

export function CategoryCard({ category, icon }: CategoryCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="p-6 hover:border-primary/50 transition-all cursor-pointer group"
      onClick={() => navigate(`/forum/category/${category.slug}`)}
      style={{
        borderLeft: `4px solid ${category.color}`,
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="p-3 rounded-lg"
          style={{
            backgroundColor: `${category.color}20`,
            color: category.color,
          }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
            {category.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {category.description}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="secondary" className="gap-1">
              <MessageSquare className="h-3 w-3" />
              {category.post_count || 0} posts
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
