/* Timothy Luciani
*  5/16/2018
*  Note: Open the script editor in your Google Sheet, then paste and run.
*        You may be prompted to grant permissions to the sheet
* */

var LIBRARIES = {
    _ : "http://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.10/lodash.js",
};

var loadJSFromUrl = function(url) {
    return eval(UrlFetchApp.fetch(url).getContentText());
};

//  Load external libraries
Object.keys(LIBRARIES).forEach(function(library) {
    newFunc = loadJSFromUrl(LIBRARIES[library]);
    eval('var ' + library + ' = ' + newFunc);
});

var linkage_map = [
//     {name:"Complete, k=2",column:3},
    {name:"Complete, k=3",column:5},
    {name:"Complete, k=4",column:8},
    {name:"Complete, k=5",column:12},
    {name:"Complete, k=6",column:17},
    {name:"Weighted, k=3",column:23},
    {name:"Weighted, k=4",column:26},
    {name:"Weighted, k=5",column:30},
    {name:"Weighted, k=6",column:35}];

var side_effect_map = [
    { name: "Aspiration-Post", index:1},
    { name: "Feeding Tube",    index:4},
    { name: "Neck Diss",       index:3},
    { name: "Neck Boost",      index:5}

];

var writeToCounts = function (group, k,totals, ys) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("per-cluster counts");
    var idx = _.find(linkage_map, ["name", group]).column;

    var totalRange = sheet.getRange("B"+(idx)+":B"+(idx+parseInt(k)-1));
    var ftRange    = sheet.getRange("C"+(idx)+":C"+(idx+parseInt(k)-1));
    var aspRange   = sheet.getRange("E"+(idx)+":E"+(idx+parseInt(k)-1));
    var boostRange = sheet.getRange("G"+(idx)+":G"+(idx+parseInt(k)-1));
    var dissRange  = sheet.getRange("I"+(idx)+":I"+(idx+parseInt(k)-1));

    // Write the values out to the columns
    totalRange.setValues(totals);
    ftRange.setValues(ys[_.find(side_effect_map, ["name", "Feeding Tube"]).index]);
    aspRange.setValues(ys[_.find(side_effect_map, ["name", "Aspiration-Post"]).index]);
    dissRange.setValues(ys[_.find(side_effect_map, ["name", "Neck Diss"]).index]);
    boostRange.setValues(ys[_.find(side_effect_map, ["name", "Neck Boost"]).index]);
};

function populatePerClusterCounts() {

    var sheets = [
        SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Complete, k=2"),
        SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Complete, k=3"),
        SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Complete, k=4"),
        SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Complete, k=5"),
        SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Complete, k=6"),
        SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Weighted, k=3"),
        SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Weighted, k=4"),
        SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Weighted, k=5"),
        SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Weighted, k=6")
    ];

    sheets.forEach(function(sheet){
        var k = sheet.getName().slice(-1);
        for(var i = 0; i < k; i++) {
            var gap = 5, idx = 3;
            var ys = [];

            var totals = sheet.getRange("E"+idx+":E"+(idx+parseInt(k)-1)).getValues();

            for(var j = 0; j < 6; j++) {
                ys.push(sheet.getRange("C"+(idx)+":C"+(idx+parseInt(k)-1)).getValues());
                // Update the next index
                idx = (idx+parseInt(k)-1) + gap;
            }

        }
        writeToCounts(sheet.getName(), k, totals, ys);
    });
}
