"use server";
import { saveOwnChildren } from "./community-children";
export async function updateUserChildren(childrenData: unknown[]) { return saveOwnChildren(childrenData); }
