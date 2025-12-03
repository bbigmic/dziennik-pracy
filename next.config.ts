import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  swSrc: "sw-custom.js", // Użyj własnego service workera z obsługą powiadomień push
  // Uwaga: runtimeCaching nie może być tutaj gdy używamy swSrc
  // Musi być zdefiniowane bezpośrednio w sw-custom.js
})(nextConfig);
