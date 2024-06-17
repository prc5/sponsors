/** @type {import("sponsorkit").SponsorkitConfig} */
export const sharedSponsorConfig = {
  github: {
    type: "user",
    login: "prc5",
  },
  width: 800,
  formats: ["svg", "png"],
  onSponsorsAllFetched(sponsors) {
    console.log(sponsors);
    return sponsors;
  },
};
