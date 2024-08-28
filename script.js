// const url = "https://sojpublicdata.blob.core.windows.net/cls/queues.json";
// Bypass CORS
const url = "https://corsproxy.io/?https%3A%2F%2Fsojpublicdata.blob.core.windows.net%2Fcls%2Fqueues.json";

const categoriesElement = document.getElementById("categories");
const defaultGridElement = document.getElementById("default-grid");
const lastUpdatedElement = document.getElementById("last-updated");
const shouldGroupElement = document.getElementById("should-group");

let shouldGroup = true;

shouldGroupElement.addEventListener("change", (e) => {
    shouldGroup = e.currentTarget.checked;
    updateQueues();
});

const updateQueues = async () => {
    const response = await fetch(url);
    const data = await response.json();

    let groupedData = [];

    if (!response.ok) {
        return;
    }

    // Sort by display order and group into colour categories
    data.queues
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .forEach(queue => {
            let group = groupedData.find(data => data.name === queue.displayColourLabel);

            if (!group) {
                group = {
                    name: queue.displayColourLabel,
                    color: queue.displayColour,
                    queues: []
                };
                groupedData.push(group);
            }
            group.queues.push(queue);
        });

    // Clear the existing grid items
    defaultGridElement.innerHTML = "";

    groupedData.forEach(category => {
        const gridElement = document.getElementById(`grid-${category.name}`);

        if (gridElement) {
            gridElement.remove();
        }
    })

    // Build and insert queues
    groupedData.forEach(category => {
        if (shouldGroup) {
            categoriesElement.insertAdjacentHTML("beforeend", buildCategory(category));
        }

        const gridElement = shouldGroup ? document.getElementById(`grid-${category.name}`) : defaultGridElement;

        category.queues.forEach(queue => {
            gridElement.insertAdjacentHTML("beforeend", buildGridItem(queue));
        });
    });

    lastUpdatedElement.innerHTML = `Last updated: ${formatDateHumanReadable(data.lastUpdated)}`
}

const buildCategory = (category) => {
    return `
        <div class="category">
            <div class="queues">
                <div id="grid-${category.name}" class="grid"></div>
            </div>
        </div>
    `
}

const buildGridItem = (queue) => {
    const s = queue.waitingTimeMinutes !== 1 ? "s" : "";

    const waitingInfo = `
        <div class="waiting-info">
            <p class="count">${queue.customersWaiting} <span class="count-text">Waiting</span></p>
            <p class="count">${queue.waitingTimeMinutes} <span class="count-text">minute${s}</span></p>
        </div>
    `;
    const closedInfo = `
        <p class="closed">Closed</p>
    `;

    return `
        <div class="grid-item">
            <div class="color-strip" style="background-color: ${queue.displayColour}">
                <h3 class="name">${queue.displayName}</h3>
            </div>
            ${queue.open ? waitingInfo : closedInfo}
        </div>
    `
}

const formatDateHumanReadable = (dateInput, time = true) => {
    const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

    const dateString = date.getDate() + " " + date.toLocaleString("en-GB", { month: "short" }) + " " + date.getFullYear();
    const timeString = date.toLocaleTimeString("en-GB", { hour: "numeric", minute: "numeric", hour12: true, timeZone: "UTC" });

    return `${dateString} ${time ? `at ${timeString}` : ""}`;
}

updateQueues();

setTimeout(() => {
    updateQueues();
}, 5 * 1000);