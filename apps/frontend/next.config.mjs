/** @type {import('next').NextConfig} */
import path from "node:path";

const nextConfig = {
  turbopack: {
    root: path.resolve(process.cwd(), "../.."),
  },
  async redirects() {
    return [
      { source: "/dashboard", destination: "/landlord/properties", permanent: false },
      {
        source: "/dashboard/properties/new",
        destination: "/landlord/properties/new",
        permanent: false,
      },
      {
        source: "/dashboard/properties/:id/edit",
        destination: "/landlord/properties/:id/edit",
        permanent: false,
      },
      {
        source: "/dashboard/applications",
        destination: "/landlord/applications",
        permanent: false,
      },
      {
        source: "/dashboard/viewings",
        destination: "/landlord/viewings",
        permanent: false,
      },
      {
        source: "/dashboard/verification",
        destination: "/landlord/verification",
        permanent: false,
      },
      { source: "/applications", destination: "/tenant/applications", permanent: false },
      { source: "/viewings", destination: "/tenant/viewings", permanent: false },
      { source: "/my-profile", destination: "/profile", permanent: false },
      { source: "/tenant/profile", destination: "/profile", permanent: false },
      { source: "/landlord/profile", destination: "/profile", permanent: false },
      { source: "/admin/profile", destination: "/profile", permanent: false },
    ];
  },
};

export default nextConfig;
