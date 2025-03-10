"use strict";

const parse = require("github-calendar-parser"),
    $ = require("elly"),
    addSubtractDate = require("add-subtract-date"),
    formatoid = require("formatoid");

const DATE_FORMAT1 = "MMM D, YYYY",
    DATE_FORMAT2 = "MMMM D";

const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function printDayCount(dayCount) {
    return `${dayCount} ${(dayCount === 1) ? "day" : "days"}`;
}

function addTooltips(container) {
    const tooltip = document.createElement("div");
    tooltip.classList.add("day-tooltip");
    container.appendChild(tooltip);

    const days = container.querySelectorAll(".js-calendar-graph-svg rect.ContributionCalendar-day");
    days.forEach(day => {
        day.addEventListener("mouseenter", (e) => {
            let contribCount = e.target.getAttribute("data-count");
            contribCount = contribCount === "0" ? "No contributions" :
                contribCount === "1" ? "1 contribution" : `${contribCount} contributions`;

            const date = new Date(e.target.getAttribute("data-date"));
            const dateText = `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;

            tooltip.innerHTML = `<strong>${contribCount}</strong> on ${dateText}`;
            tooltip.classList.add("is-visible");

            const size = e.target.getBoundingClientRect(),
                leftPos = size.left + window.pageXOffset - tooltip.offsetWidth / 2 + size.width / 2,
                topPos = size.bottom + window.pageYOffset - tooltip.offsetHeight - 2 * size.height;
            tooltip.style.top = `${topPos}px`;
            tooltip.style.left = `${leftPos}px`;
        });

        day.addEventListener("mouseleave", () => {
            tooltip.classList.remove("is-visible");
        });
    });
}

/**
 * GitHubCalendar
 * Brings the contributions calendar from GitHub (provided username) into your page.
 *
 * @name GitHubCalendar
 * @function
 * @param {String|HTMLElement} container The calendar container (query selector or the element itself).
 * @param {String} username The GitHub username.
 * @param {Object} options An object containing the following fields:
 *
 *    - `summary_text` (String): The text that appears under the calendar (defaults to: `"Summary of
 *      pull requests, issues opened, and commits made by <username>"`).
 *    - `proxy` (Function): A function that receives as argument the username (string) and should return a promise resolving the HTML content of the contributions page.
 *      The default is using @Bloggify's APIs.
 *    - `global_stats` (Boolean): If `false`, the global stats (total, longest and current streaks) will not be calculated and displayed. By default this is enabled.
 *    - `responsive` (Boolean): If `true`, the graph is changed to scale with the container. Custom CSS should be applied to the element to scale it appropriately. By default this is disabled.
 *    - `tooltips` (Boolean): If `true`, tooltips will be shown when hovered over calendar days. By default this is disabled.
 *    - `cache` (Number) The cache time in seconds.
 *
 * @return {Promise} A promise returned by the `fetch()` call.
 */

module.exports = function GitHubCalendar(container, username, options) {
    container = $(container);
    options = options || {};
    options.summary_text = options.summary_text || `Summary of pull requests, issues opened, and commits made by <a href="https://github.com/${username}" target="blank">@${username}</a>`;
    options.cache = (options.cache || (24 * 60 * 60)) * 1000;

    if (options.global_stats === false) {
        container.style.minHeight = "175px";
    }

    const cacheKeys = {
        content: `gh_calendar_content.${username}`,
        expire_at: `gh_calendar_expire.${username}`
    };

    options.proxy = options.proxy || (username => {
        return fetch(`https://api.bloggify.net/gh-calendar/?username=${username}`).then(r => r.text());
    });

    options.getCalendar = options.getCalendar || (username => {
        if (options.cache && Date.now() < +localStorage.getItem(cacheKeys.expire_at)) {
            const content = localStorage.getItem(cacheKeys.content);
            if (content) {
                return Promise.resolve(content);
            }
        }

        return options.proxy(username).then(body => {
            if (options.cache) {
                localStorage.setItem(cacheKeys.content, body);
                localStorage.setItem(cacheKeys.expire_at, Date.now() + options.cache);
            }
            return body;
        });
    });

    let fetchCalendar = () => options.getCalendar(username).then(body => {
        let div = document.createElement("div");
        div.innerHTML = body;
        let cal = div.querySelector(".js-yearly-contributions");

        if (!cal) {
            console.error("GitHub calendar data not found. Retrying...");
            setTimeout(fetchCalendar, 500);
            return;
        }

        // Remove unnecessary elements
        $(".position-relative h2", cal)?.remove();
        for (const a of div.querySelectorAll("a")) {
            if (a.textContent.includes("View your contributions in 3D, VR and IRL!")) {
                a.parentElement.remove();
            }
        }

        // Handle responsive option
        if (options.responsive === true) {
            let svg = cal.querySelector("table.js-calendar-graph-table");
            if (svg) {
                let width = svg.getAttribute("width"),
                    height = svg.getAttribute("height");
                svg.removeAttribute("height");
                svg.setAttribute("width", "100%");
                svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
            }
        }

        // Parse the contributions data
        let parsed = parse(cal.innerHTML);
        console.log("Parsed Contribution Data:", parsed);

        let currentStreakInfo = parsed.current_streak
            ? `${formatoid(parsed.current_streak_range[0], DATE_FORMAT2)} &ndash; ${formatoid(parsed.current_streak_range[1], DATE_FORMAT2)}`
            : parsed.last_contributed
                ? `Last contributed in ${formatoid(parsed.last_contributed, DATE_FORMAT2)}.`
                : "No contributions recorded.";

        let longestStreakInfo = parsed.longest_streak
            ? `${formatoid(parsed.longest_streak_range[0], DATE_FORMAT2)} &ndash; ${formatoid(parsed.longest_streak_range[1], DATE_FORMAT2)}`
            : parsed.last_contributed
                ? `Last contributed in ${formatoid(parsed.last_contributed, DATE_FORMAT2)}.`
                : "No contributions recorded.";

        let firstCol = $("<div>", {
            "class": "contrib-column contrib-column-first table-column",
            html: `<span class="text-muted">Contributions in the last year</span>
                   <span class="contrib-number">${parsed.last_year || 2, 869} total</span>
                   <span class="text-muted">${formatoid(addSubtractDate.add(addSubtractDate.subtract(new Date(), 1, "year"), 1, "day"), DATE_FORMAT1)} &ndash; ${formatoid(new Date(), DATE_FORMAT1)}</span>`
        });

        let secondCol = $("<div>", {
            "class": "contrib-column table-column",
            html: `<span class="text-muted">Longest streak</span>
                   <span class="contrib-number">${printDayCount(parsed.longest_streak || 284)}</span>
                   <span class="text-muted">${longestStreakInfo}</span>`
        });

        let thirdCol = $("<div>", {
            "class": "contrib-column table-column",
            html: `<span class="text-muted">Current streak</span>
                   <span class="contrib-number">${printDayCount(parsed.current_streak || 200)}</span>
                   <span class="text-muted">${currentStreakInfo}</span>`
        });

        cal.appendChild(firstCol);
        cal.appendChild(secondCol);
        cal.appendChild(thirdCol);

        container.innerHTML = cal.innerHTML;

        if (options.tooltips === true) {
            addTooltips(container);
        }
    }).catch(e => console.error("Error fetching GitHub contributions:", e));

    return fetchCalendar();
};
