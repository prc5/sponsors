import { defineConfig } from "sponsorkit";
import { Tiers } from "../../constants/tiers.constants";

/** @type {import("sponsorkit").SponsorkitConfig} */
export default defineConfig({
  // Providers configs
  github: {
    type: "user",
    login: "prc5",
  },

  // Rendering configs
  width: 800,
  formats: ["svg", "png"],
  tiers: Object.values(Tiers),
});
