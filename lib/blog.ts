import glob from "fast-glob";
import React from "react";

// Определяем интерфейсы прямо здесь, чтобы не было ошибки "Cannot find name"
interface Blog {
  title: string;
  description: string;
  author: {
    name: string;
    src: string;
  };
  date: string;
  image?: string;
}

export interface BlogWithSlug extends Blog {
  slug: string;
}

async function importBlog(blogFilename: string): Promise<BlogWithSlug> {
  // Исправленный динамический импорт для i18n структуры
  const { blog } = (await import(
    `../app/[locale]/(marketing)/blog/${blogFilename}`
  )) as {
    default: React.ComponentType;
    blog: Blog;
  };

  return {
    slug: blogFilename.replace(/(\/page)?\.mdx$/, ""),
    ...blog,
  };
}

export async function getAllBlogs() {
  // Исправленный путь для поиска файлов mdx
  const blogFilenames = await glob("*/page.mdx", {
    cwd: "./app/[locale]/(marketing)/blog",
  });

  const blogs = await Promise.all(blogFilenames.map(importBlog));

  // Исправленная типизация для сортировки (убираем ошибку 'a' implicitly has 'any' type)
  return blogs.sort((a: BlogWithSlug, z: BlogWithSlug) => {
    return new Date(z.date).getTime() - new Date(a.date).getTime();
  });
}
