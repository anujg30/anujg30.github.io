$('#updater').click(function() {
    updateTable();
    return false;
});

var detailedTable = d3.select("body")
    .append("div")
    .append("table")
    .attr("class", "pure-table")
    .attr("id", "detailedViewTable");

var detailedHead = detailedTable.append("thead");
var detailedView = detailedTable.append("tbody");

function updateTable() {

    var comparisonViewItems = parent.treeUtilities.getComparisonItems();
    var comparisonKeys = Object.keys(comparisonViewItems);
    console.log(comparisonViewItems);

    if (comparisonKeys.length > 0) {
        detailedView.selectAll("tr").remove();
        detailedHead.selectAll("tr").remove();

        // Add name
        var row = detailedHead.append("tr").attr("id", "app-name");
        for (var index = 0; index < comparisonKeys.length; index++) {
            var app = comparisonViewItems[comparisonKeys[index]];
            row.append("th").style("width", "33%").html(app.name);
        }

        // Add image
        var row = detailedView.append("tr").attr("id", "app-image");
        for (var index = 0; index < comparisonKeys.length; index++) {
            var app = comparisonViewItems[comparisonKeys[index]];
            var splitter = String(12 / comparisonKeys.length);
            row.append("td")
                .style("width", "33%")
                .append("img")
                .attr("class", "appIcon")
                .attr("height", "50px")
                .attr("width", "50px")
                .style("display", "inline")
                .attr("src", app.dod.icon);
        }

        // Add number of versions
        var row = detailedView.append("tr").attr("class", "pure-table-odd").attr("id", "app-versions");
        for (var index = 0; index < comparisonKeys.length; index++) {
            var app = comparisonViewItems[comparisonKeys[index]];
            var splitter = String(12 / comparisonKeys.length);
            row.append("td")
                .style("width", "33%")
                .html(app.children.length + " versions released");
        }

        // Add rating
        var row = detailedView.append("tr").attr("id", "app-rating");
        for (var index = 0; index < comparisonKeys.length; index++) {
            var app = comparisonViewItems[comparisonKeys[index]];
            var splitter = String(12 / comparisonKeys.length);
            row.append("td")
                .style("width", "33%")
                .html("An average rating of " + Number(app.dod.avgRating).toFixed(2));
        }

        // Add number of reviews
        var row = detailedView.append("tr").attr("class", "pure-table-odd").attr("id", "app-reviews");
        for (var index = 0; index < comparisonKeys.length; index++) {
            var app = comparisonViewItems[comparisonKeys[index]];
            var splitter = String(12 / comparisonKeys.length);
            row.append("td")
                .style("width", "33%")
                .html(app.dod.numReviews + " reviews");
        }

        // Add sentiment score
        var row = detailedView.append("tr").attr("id", "app-sentiments");
        for (var index = 0; index < comparisonKeys.length; index++) {
            var app = comparisonViewItems[comparisonKeys[index]];
            var splitter = String(12 / comparisonKeys.length);
            row.append("td")
                .style("width", "33%")
                .html(getSentimentImage(app.dod.sentimentScore));
        }

        // Add best review head
        var row = detailedView.append("tr").attr("class", "pure-table-odd").attr("id", "app-bestReview-head");
        row.append("td")
            .attr("class", "reviewHead")
            .style("width", "100%")
            .attr("colspan", 3)
            .html("Most positive review");

        // Add best review
        var row = detailedView.append("tr").attr("class", "pure-table-odd").attr("id", "app-bestReview");
        for (var index = 0; index < comparisonKeys.length; index++) {
            var app = comparisonViewItems[comparisonKeys[index]];
            var splitter = String(12 / comparisonKeys.length);
            row.append("td")
                .style("width", "33%")
                .attr("class", "longData")
                .html(app.dod.bestReview.comment);
        }

        // Add worst review head
        var row = detailedView.append("tr").attr("id", "app-worstReview-head");
        row.append("td")
            .attr("class", "reviewHead")
            .style("width", "100%")
            .attr("colspan", 3)
            .html("Most negative review");

        // Add worst review
        var row = detailedView.append("tr").attr("id", "app-worstReview");
        for (var index = 0; index < comparisonKeys.length; index++) {
            var app = comparisonViewItems[comparisonKeys[index]];
            var splitter = String(12 / comparisonKeys.length);
            row.append("td")
                .style("width", "33%")
                .attr("class", "longData")
                .html(app.dod.worstReview.comment);
        }
    }
}

function getSentimentImage(sentimentScore) {
    var imageMap = ['angry', 'sad', 'indifferent', 'happy', 'ecstatic'];
    var type = imageMap[Math.round(sentimentEmotionScale(sentimentScore))];

    return `<img class="sentimentIcon"
            stlye="display:inline"
            src="img/` + type + `.png"
            height="25px"
            width="25px"
        />
        <p/>
        <div>Sentiment score of ` + Number(sentimentScore).toFixed(2) + `</div>`;
}

var sentimentEmotionScale = function(value) {
    if (value < -175) return 0;
    if (value >= -175 && value < 0) return 1;
    if (value >= 0 && value < 500) return 3;
    if (value >= 500 && value < 1000) return 3;
    if (value >= 1000) return 4;
}

var sentimentColorScale = function(value) {
    if (value < -175) return "red";
    if (value >= -175 && value < 0) return "tomato";
    if (value >= 0 && value < 500) return "teal";
    if (value >= 500 && value < 1000) return "cobalt";
    if (value >= 1000) return "indigo";
}