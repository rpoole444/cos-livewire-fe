export const slugify = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // replace spaces and symbols with hyphens
    .replace(/(^-|-$)+/g, '');   // trim hyphens
