/*
  timeline-data.js — the entries on the timeline page. Edit this file to update it.

  Each entry:
    year        — e.g. 2024
    side        — "literary" (blue, drawn on the blue crayon line)
                  or "professional" (black, on the straight line)
    title       — first line of the entry
    desc        — smaller grey line under the title ("" to skip)
    items       — optional bullet list, e.g. ["first", "second"]; only the first 3
                  show until the reader clicks "+ N more" ([] to skip)
    photo       — "" for none, "photos/file.jpg" for a photo,
                  or "placeholder" for an empty crossed-out box
    annotation  — optional small handwritten-style note ("" to skip)
    extraGap    — optional; adds (or with a negative number, removes) space
                  below this entry on the phone layout only

  Order doesn't matter: entries are sorted by year automatically.
  Within the same year and side, they appear in the order listed here.
*/

const TIMELINE = [

  /* ── Literary ─────────────────────────────────────────────── */

  { year: 2020, side: "literary", title: "Mentee, The Adroit Journal Summer Mentorship Program", desc: "Studied prose under Andrew Gretes", items: [], photo: "", annotation: "" },
  { year: 2021, side: "literary", title: "Mentee, Iowa Young Writers' Studio", desc: "Studied poetry under Norah Claire Miller", items: [], photo: "", annotation: "" },
  { year: 2022, side: "literary", title: "Community Media Scholar, Alliance for Chinese Americans", desc: "Advocated for AAPI communities through media and storytelling", items: [], photo: "", annotation: "" },
  { year: 2023, side: "literary", title: "Editorial Intern, Peach Mag", desc: "Curated and edited submissions", items: [], photo: "", annotation: "" },
  { year: 2023, side: "literary", title: "Prose Editor, The Farside Review", desc: "Curated fiction and prose", items: [], photo: "", annotation: "" },
  { year: 2025, side: "literary", title: "Mentee, Levinthal Tutorial", desc: "Studied poetry under Dāshaun Washington", items: [], photo: "", annotation: "" },
  { year: 2025, side: "literary", title: "Mentor, San Diego Association of Chinese Americans Summer Journalism Program", desc: "Mentored high school students in journalism", items: [], photo: "", annotation: "" },
  { year: 2025, side: "literary", title: "Editorial Intern, East of Borneo Magazine", desc: "Edited content and publications", items: [], photo: "", annotation: "" },
  { year: 2027, side: "literary", title: "Honors in the Arts Thesis", desc: "", items: [], photo: "", annotation: "" },

  /* ── Professional ─────────────────────────────────────────── */

  { year: 2021, side: "professional", title: "Research Assistant, UCLA CRESST", desc: "Researched Asian American education and income inequality", items: [], photo: "", annotation: "", extraGap: 15 },
  { year: 2021, side: "professional", title: "Communications Intern, Office of California State Assemblymember Phillip Chen", desc: "Wrote editorials and supported community advocacy", items: [], photo: "", annotation: "" },
  { year: 2022, side: "professional", title: "Editor-in-Chief, Westview Nexus", desc: "Led the publication and its editorial direction", items: [], photo: "", annotation: "" },
  { year: 2022, side: "professional", title: "Editorial Intern, The San Diego Union-Tribune", desc: "Reported and contributed to the newsroom", items: [], photo: "", annotation: "" },
  { year: 2023, side: "professional", title: "Matriculated at Stanford University", desc: "", items: [], photo: "", annotation: "" },
  { year: 2024, side: "professional", title: "Advancement and Analytics Intern, Sierra Club", desc: "Supported fundraising operations and donor analytics", items: [], photo: "", annotation: "" },
  { year: 2025, side: "professional", title: "Intern, Pentagon Federal Credit Union", desc: "Built AI integrations and operations infrastructure", items: [], photo: "", annotation: "" },
  { year: 2026, side: "professional", title: "Research Assistant @ Stanford's Virtual Human Interaction Lab", desc: "", items: [], photo: "", annotation: "", extraGap: -70 },
  { year: 2026, side: "professional", title: "Summer Investment Banking Analyst, Barclays", desc: "West Coast Financial Sponsors team", items: [], photo: "", annotation: "" }

];
