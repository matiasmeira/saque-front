import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Turbopack detectaba C:\Users\USER como raíz (encontró un package-lock.json
  // ahí) en vez de esta carpeta, y resolvía todas las rutas anidadas a 404.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
