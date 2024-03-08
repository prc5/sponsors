import { defineConfig, presets } from "sponsorkit";

export default defineConfig({
  // Providers configs
  github: {
    type: "user",
    login: "prc5",
  },

  // Rendering configs
  width: 800,
  formats: ["svg", "png"],
  tiers: [
    {
      title: "Platinum Sponsors",
      monthlyDollars: 1600,
      preset: presets.xl,
    },
  ],
});
