"use strict";

// Enable tooltips everywhere
document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((tooltipTriggerEl) => {
  new bootstrap.Tooltip(tooltipTriggerEl);
});

/* Vanilla RSS - https://github.com/sdepold/vanilla-rss */
const rss = new RSS(
  document.querySelector("#rss-feeds"),
  "https://medium.com/feed/@Clinton-Otse",
  {
    limit: 10,
    ssl: true,
    layoutTemplate: "<div class='items'>{entries}</div>",
    entryTemplate:
      '<div class="item"><h3 class="title"><a href="{url}" target="_blank">{title}</a></h3>' +
      '<div><p>{shortBodyPlain}</p><a class="more-link" href="{url}" target="_blank">' +
      '<i class="fas fa-external-link-alt"></i> Read more</a></div></div>',
  }
);
rss.render();

/* GitHub Contributions Calendar */
if (document.querySelector("#github-graph")) {
  GitHubCalendar("#github-graph", "DhanteyUD", {
    responsive: true,
  }).then(() => console.log("GitHub Calendar Loaded"))
    .catch((error) => console.error("GitHub Calendar Error:", error));
}

/* GitHub Activity Feed */
if (document.querySelector("#ghfeed")) {
  GitHubActivity.feed({ username: "DhanteyUD", selector: "#ghfeed" })
    .then(() => console.log("GitHub Activity Loaded"))
    .catch((error) => console.error("GitHub Activity Error:", error));
}
