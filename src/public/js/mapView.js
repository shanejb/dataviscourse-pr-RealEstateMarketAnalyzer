/**
 * Constructor for the Map View
 *
 * @param bubbleChart instance of BubbleChart
 * @param houseChart instance of HouseChart
 * @param rentChart instance of RentChart
 * @param detailCards instance of DetailCards
 * @param stateData sale/rent data corresponding to state over multiple years
 */
function MapView(bubbleChart, houseChart, rentChart, detailCards, statesData) {
    var self = this;

    self.bubbleChart = bubbleChart;
    self.houseChart = houseChart;
    self.rentChart = rentChart;
    self.detailCards = detailCards;
    self.statesData = statesData;
    self.init();
};

/**
 * Initializes the svg elements required for this chart
 */
MapView.prototype.init = function(){
    var self = this;
    self.margin = {top: 10, right: 20, bottom: 30, left: 50};
    var divMapView = d3.select("#map-view");

    //Gets access to the div element created for this chart from HTML
    self.svgBounds = divMapView.node().getBoundingClientRect();
    self.svgWidth = self.svgBounds.width - self.margin.left - self.margin.right;
    self.svgHeight = 400;

    //creates svg element within the div
    self.svg = divMapView.append("svg")
        .attr("width",self.svgWidth)
        .attr("height",self.svgHeight)

    console.log("MapView.prototype.init");
};

/**
 * Creates an interactive map with housing data on each state, populates
 * the bubble chart, line charts and detail cards based on selection
 */
MapView.prototype.update = function(){
    var self = this;
};