

const OWNER = "lorserker";
const REPO = "noticeboard";

const DATA = {"start": null, "result": null, "schedule": null};

export async function listGithub(owner, repo, path) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    const response = await fetch(url);
    const data = await response.json();

    const files = {};
    for (let item of data) {
        if (!item["name"].endsWith(".pdf")) {
            continue;
        }
        const underscoreIndex = item["name"].indexOf("_");
        if (underscoreIndex <= 0) {
            continue;
        }
        const category = item["name"].slice(0, underscoreIndex);
        if (!(category in files)) {
            files[category] = [];
        }
        files[category].push({
            "name": item["name"],
            "url": item["download_url"]
        });
    }

    return files;
}

function drawSelect(categories) {
    let html = '';
    html += '<option selected disabled value="">Kategorie wählen ...</option>'
    for (let category of categories) {
        html += `<option value=${category}>${category}</option>`;
    }
    document.getElementById("category-select").innerHTML = html;
}

function drawContent() {
    console.log("drawing content")
    const selected = document.getElementById("category-select").value;
    const contentDiv = document.getElementById("content");

    let html = '';
    if (selected in DATA["result"]) {
        html += '<h3>Ergebnisse</h3>';
        html += generateListHtml(DATA["result"][selected]);
    }
    if (selected in DATA["start"]) {
        html += '<h3>Startlisten</h3>';
        html += generateListHtml(DATA["start"][selected]);
    }

    contentDiv.innerHTML = html;
}

function drawSchedule() {
    console.log("drawing schedule");
    const scheduleDiv = document.getElementById("schedule");

    const html = `<h3><a type="button" class="outline" href="${DATA.schedule}">Zeitplan</a></h3>`;

    scheduleDiv.innerHTML = html;
}

function generateListHtml(files) {
    let html = '';
    html += '<ul>';
    for (let item of files) {
        html += '<li>';
        html += `<a href="${item['url']}">${item['name']}</a>`;
        html += '</li>';
    }
    html += '</ul>'
    return html;
}

function getLabel() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('w');
}

async function main() {
    console.log("in main");

    const label = getLabel();
    console.log(`label=${label}`);

    if (!label) {
        document.body.innerHTML = '<p>Wettkampf nicht gefunden.</p><p>Haben Sie den richtigen Link?</p>';
        return;
    }

    DATA["schedule"] = `https://raw.githubusercontent.com/${OWNER}/${REPO}/main/pdf/schedule/${label}.pdf`

    drawSchedule();

    const [filesStart, filesResult] = await Promise.all([
        listGithub(OWNER, REPO, `pdf/${label}/start`),
        listGithub(OWNER, REPO, `pdf/${label}/ergebnis`),
    ]);
    console.log("fetched");

    DATA["start"] = filesStart;
    DATA["result"] = filesResult;

    const categorySet = {};
    for (let key in filesStart) {
        categorySet[key] = null;
    }
    for (let key in filesResult) {
        categorySet[key] = null;
    }
    const categoryList = Object.keys(categorySet).sort();

    drawSelect(categoryList);

    document.getElementById("category-select").addEventListener("change", drawContent);
}


window.addEventListener("load", async () => {
    console.log("load event handler");
    await main();
});
