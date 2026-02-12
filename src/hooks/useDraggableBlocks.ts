import { useState, useEffect } from "react";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export const useDraggableBlocks = (pageKey: string, defaultOrder: string[]) => {
  const { user } = useAuth();
  const [blocks, setBlocks] = useState<string[]>(defaultOrder);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      const adminStatus = data?.role === "admin";
      console.log("🔐 Admin check:", { userId: user.id, role: data?.role, isAdmin: adminStatus });
      setIsAdmin(adminStatus);
    };

    checkAdmin();
  }, [user]);

  // Load saved block order from database
  useEffect(() => {
    const loadBlockOrder = async () => {
      const { data, error } = await supabase
        .from("block_orders")
        .select("block_order")
        .eq("page_name", pageKey)
        .maybeSingle();

      if (!error && data?.block_order) {
        const savedBlocks = data.block_order as string[];
        
        // Add new blocks from defaultOrder that aren't in savedBlocks
        const newBlocks = defaultOrder.filter(block => !savedBlocks.includes(block));
        
        // Remove blocks that are no longer in defaultOrder
        const validBlocks = savedBlocks.filter(block => defaultOrder.includes(block));
        
        // Return valid blocks + new blocks at the end
        setBlocks([...validBlocks, ...newBlocks]);
      } else {
        setBlocks(defaultOrder);
      }
    };

    loadBlockOrder();
  }, [pageKey, defaultOrder]);

  // Save block order to database when it changes (only for admins)
  useEffect(() => {
    const saveBlockOrder = async () => {
      if (!isAdmin || !user) {
        console.log("⏸️ Save skipped:", { isAdmin, hasUser: !!user });
        return;
      }

      console.log("💾 Saving block order:", { pageKey, blocks });

      const { error } = await supabase
        .from("block_orders")
        .upsert({
          page_name: pageKey,
          block_order: blocks,
          updated_by: user.id
        }, {
          onConflict: 'page_name'
        });

      if (error) {
        console.error("❌ Error saving block order:", error);
      } else {
        console.log("✅ Block order saved successfully");
      }
    };

    // Debounce the save to avoid too many requests
    const timeoutId = setTimeout(saveBlockOrder, 500);
    return () => clearTimeout(timeoutId);
  }, [blocks, pageKey, isAdmin, user]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    console.log("🎯 Drag end:", { active: active.id, over: over?.id, isAdmin });

    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        console.log("📋 New block order:", newOrder);
        return newOrder;
      });
    }
  };

  return { blocks, handleDragEnd, DndContext, SortableContext, verticalListSortingStrategy, closestCenter, isAdmin };
};
