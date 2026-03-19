import { Edit2, Trash2 } from "lucide-react";
import { EventItem } from "@/store/useEventStore";
import { deleteEvent } from "@/actions/event";
import { useEventStore } from "@/store/useEventStore";

interface EventCardProps {
  item: EventItem;
  onEdit: (item: EventItem) => void;
  isAdmin: boolean;
}

export default function EventCard({ item, onEdit, isAdmin }: EventCardProps) {
  const { event, category } = item;
  const eventImageUrl = event.imageUrl || "/default-event-poster.png";
  const { deleteEvent: deleteFromStore } = useEventStore();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm(`Вы уверены, что хотите удалить событие "${event.title}"?`)) {
      deleteFromStore(event.id);
      await deleteEvent(event.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onEdit(item);
  };

  return (
    <div className="group relative rounded-[28px] overflow-hidden border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-[#FFB800]/5 aspect-[3/4] bg-neutral-100 dark:bg-neutral-900 transition-all duration-500 ease-out hover:-translate-y-1 block">
      <img
        src={eventImageUrl}
        alt={event.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />

      {isAdmin && (
        <div className="absolute top-4 right-4 flex gap-2 z-30 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out">
          <button
            onClick={handleEdit}
            className="p-2.5 bg-white/20 hover:bg-white/90 backdrop-blur-md rounded-full text-white hover:text-black border border-white/20 shadow-sm transition-all active:scale-95"
            title="Редактировать"
          >
            <Edit2 size={15} strokeWidth={2.5} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2.5 bg-red-500/20 hover:bg-red-500/90 backdrop-blur-md rounded-full text-red-100 hover:text-white border border-red-500/20 shadow-sm transition-all active:scale-95"
            title="Удалить"
          >
            <Trash2 size={15} strokeWidth={2.5} />
          </button>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />

      <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col justify-end z-20 translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out pointer-events-none">
        {category && (
          <span className="text-[9px] uppercase font-black tracking-widest text-[#FFB800] mb-1.5 drop-shadow-md">
            {category.name}
          </span>
        )}
        <h3 className="text-white text-lg font-bold leading-tight line-clamp-2 drop-shadow-lg group-hover:text-[#FFB800] transition-colors duration-300">
          {event.title}
        </h3>
        {event.description && (
          <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
            <div className="overflow-hidden">
              <p className="text-neutral-300 text-xs mt-2 line-clamp-3 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                {event.description}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
