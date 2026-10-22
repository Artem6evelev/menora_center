import { Brain, Compass, MessageCircleQuestion, MessageSquare, Palette, Star, Sun, Users } from "lucide-react";
import { kidsPrograms } from "./programs";
export const kidsProgramIcons = { Brain, Compass, MessageCircleQuestion, MessageSquare, Palette, Star, Sun, Users };
/** Presentation adapter only; titles, ages and descriptions have one source. */
export const kidsProgramCards = kidsPrograms.map(program => ({ ...program, icon: kidsProgramIcons[program.icon] }));
