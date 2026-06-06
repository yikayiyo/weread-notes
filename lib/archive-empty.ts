import { getBooks, getHighlights, getNotes } from "./data";

export function isArchiveEmpty(): boolean {
  return (
    getBooks().length === 0 &&
    getHighlights().length === 0 &&
    getNotes().length === 0
  );
}
