


$(function () {

let articles = [];
let searchIndex = [];
    let currentResults = [];
    let selectedIndex = 0;
    let debounce;

    // Load once
$.getJSON("data/articles.json", function (data) {

    articles = data;

    searchIndex = data.map(article => ({

        article,

        articleNo: String(article.article).toLowerCase(),

        title: (article.title || "").toLowerCase(),

        desc: (article.description || []).join(" ").toLowerCase()

    }));

});

    $("<style>")
        .prop("type", "text/css")
        .html(`
#searchModal{
display:none;
position:fixed;
left:0;
top:0;
width:100%;
height:100%;
background:rgba(0,0,0,.45);
z-index:99999;
}

.search-box{
width:700px;
max-width:90%;
max-height:80vh;
margin:70px auto;
background:white;
border-radius:10px;
overflow:hidden;
box-shadow:0 8px 30px rgba(0,0,0,.25);
}

#articleSearch{
width:100%;
padding:18px;
border:none;
border-bottom:1px solid #ddd;
font-size:18px;
outline:none;
box-sizing:border-box;
}

#searchResults{
max-height:65vh;
overflow-y:auto;
}

.search-item{
padding:14px 18px;
cursor:pointer;
border-bottom:1px solid #eee;
}

.search-item:hover,
.search-item.active{
background:#eaf2ff;
}

.search-item small{
display:block;
margin-top:4px;
color:#666;
}
`)
        .appendTo("head");


const SEARCH_ALIASES = {

    "right to life": ["21"],
    "life": ["21"],
    "personal liberty": ["21"],

    "freedom of speech": ["19"],
    "speech": ["19"],
    "free speech": ["19"],
    "freedom of expression": ["19"],

    "constitutional amendment": ["368"],
    "amendment": ["368"],
    "amend constitution": ["368"],

    "president": ["52"],
    "prime minister": ["75"],
    "governor": ["153"],
    "chief minister": ["164"],

    "emergency": ["352","356","360"],
    "national emergency": ["352"],
    "president rule": ["356"],
    "financial emergency": ["360"],

    "fundamental rights": ["12","13","14","15","16","17","18","19","20","21","21A","22","23","24","25","26","27","28","29","30","32"],

    "directive principles": ["36"],

    "fundamental duties": ["51A"],

    "citizenship": ["5"],

    "panchayat": ["243"],

    "municipality": ["243P"],

    "gst": ["246A","269A","279A"],

    "finance commission": ["280"],

    "election commission": ["324"],

    "supreme court": ["124"],

    "high court": ["214"],

    "writ": ["32","226"],

    "habeas corpus": ["32","226"],

    "reservation": ["15","16","330","332","338","338A","338B","342","342A"],

    "uniform civil code": ["44"]

};


function scoreArticle(item, query){

    let score = 0;

    const q = query
        .toLowerCase()
        .replace(/^(article|art|a)\s*/,"")
        .trim();

const article = item.article;

const articleNo = item.articleNo;
const title = item.title;
const desc = item.desc;

    // Split into article number + remaining words
    const match = q.match(/^(\d+[a-z]?)(?:\s+(.*))?$/);

    if(match){

        const searchedArticle = match[1];
        const remaining = (match[2] || "").trim();

        // User typed ONLY an article number
        if(remaining === ""){

            if(articleNo === searchedArticle)
                return 1000000;

            if(articleNo === searchedArticle + "a")
                return 999999;

            if(articleNo.startsWith(searchedArticle))
                return 900000 - articleNo.length;

            return 0;
        }

        // User typed article number + some words
        if(articleNo === searchedArticle)
            score += 4000;

        else if(articleNo.startsWith(searchedArticle))
            score += 2000;

        query = remaining;
    }

    // Alias search
    Object.entries(SEARCH_ALIASES).forEach(([keyword, list]) => {

        if(query.includes(keyword)){

            if(list.includes(String(article.article)))
                score += 5000;

        }

    });

    if(title.startsWith(query))
        score += 600;
    else if(title.includes(query))
        score += 400;

    if(desc.includes(query))
        score += 150;

    query.split(/\s+/).forEach(function(word){

        if(title.includes(word))
            score += 40;

        if(desc.includes(word))
            score += 15;

    });

    return score;
}


    function renderResults(query) {

        query = query.trim();

        if (!query) {

            $("#searchResults").empty();

            currentResults = [];

            return;

        }

currentResults = searchIndex
    .map(function (item) {

        return {
            article: item.article,
            score: scoreArticle(item, query)
        };

    })

            .filter(function (x) {

                return x.score > 0;

            })
            .sort(function (a, b) {

                return b.score - a.score;

            })
            .slice(0, 10);

        selectedIndex = 0;

        let html = "";

        currentResults.forEach(function (r, i) {

            let preview = "";

            if (r.article.description.length)
                preview = r.article.description[0];

            preview = preview.replace(/\s+/g, " ");

            if (preview.length > 120)
                preview = preview.substring(0, 120) + "...";

            html += `
<div class="search-item ${i==0?'active':''}" data-index="${i}">
<b>Article ${r.article.article}</b> – ${r.article.title}
<small>${preview}</small>
</div>
`;

        });

        $("#searchResults").html(html);

    }


    function openArticle(article) {

        history.replaceState(
            {},
            "",
            "?article=" + encodeURIComponent(article.article)
        );

        $("#searchModal").hide();

        $("#detail").trigger("click");

    }



    // Ctrl+Shift+F

    $(document).keydown(function (e) {

        if ((e.ctrlKey || e.metaKey) && 	e.shiftKey && e.key.toLowerCase() === "f") {

            e.preventDefault();

            $("#searchModal").show();

            $("#articleSearch")
                .val("")
                .focus();

            $("#searchResults").empty();

            currentResults = [];

        }

    });



    // Live search

    $("#articleSearch").on("input", function () {

        clearTimeout(debounce);

        let q = $(this).val();

        debounce = setTimeout(function () {

            renderResults(q);

        }, 120);

    });



    // Keyboard navigation

    $("#articleSearch").keydown(function (e) {

        if (e.key === "ArrowDown") {

            e.preventDefault();

            if (selectedIndex < currentResults.length - 1)
                selectedIndex++;

        }

        if (e.key === "ArrowUp") {

            e.preventDefault();

            if (selectedIndex > 0)
                selectedIndex--;

        }

        $(".search-item")
            .removeClass("active")
            .eq(selectedIndex)
            .addClass("active");

        if (e.key === "Enter") {

            e.preventDefault();

            if (currentResults[selectedIndex])
                openArticle(currentResults[selectedIndex].article);

        }

        if (e.key === "Escape") {

            $("#searchModal").hide();

        }

    });



    // Mouse click

    $(document).on("click", ".search-item", function () {

        let idx = $(this).data("index");

        openArticle(currentResults[idx].article);

    });


    // Click outside closes

    $("#searchModal").click(function (e) {

        if (e.target === this)
            $(this).hide();

    });
let articleBuffer = "";
let articleTimer = null;

$(document).keydown(function(e){

    if($(e.target).is("input, textarea"))
        return;

    if($("#searchModal").is(":visible"))
        return;

    // Numbers or letters
 if (/^[0-9a-zA-Z]$/.test(e.key)) {

    articleBuffer += e.key;

    updateQuickJump();

    clearTimeout(articleTimer);

    articleTimer = setTimeout(function () {
        articleBuffer = "";
        updateQuickJump();
    }, 1500);

    return;
}

    // Backspace
if (e.key === "Backspace") {

    if (articleBuffer.length) {

        e.preventDefault();

        articleBuffer = articleBuffer.slice(0, -1);

        updateQuickJump();
    }

    return;
}

    if(e.key === "Escape"){

        articleBuffer = "";

        updateQuickJump();

        return;
    }

if (e.key === "Enter") {

    if (!articleBuffer)
        return;

    // Pure number -> quick jump
    if (/^\d+$/.test(articleBuffer)) {

        const $article = $("#article_" + articleBuffer);

        if ($article.length) {

            history.replaceState(
                {},
                "",
                "?article=" + articleBuffer
            );

            $("#detail").trigger("click");

        } else {

            $("#searchModal").show();

            $("#articleSearch")
                .val(articleBuffer)
                .focus()
                .trigger("input");

        }

    } else {

        // Contains letters -> use search
        $("#searchModal").show();

        $("#articleSearch")
            .val(articleBuffer)
            .focus()
            .trigger("input");

    }

    articleBuffer = "";
    updateQuickJump();
    clearTimeout(articleTimer);

    return;
}

});

function updateQuickJump(){

    if(articleBuffer){

        $("#articleQuickJump")
            .text("Article " + articleBuffer.toUpperCase())
            .show();

    }else{

        $("#articleQuickJump").hide();

    }

}



$("body").append('<div id="articleQuickJump"></div>');

});