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
MapView.prototype.init = function() {
    var self = this;
    self.margin = {top: 10, right: 20, bottom: 30, left: 50};
    var divMapView = d3.select("#map-view");

    //Gets access to the div element created for this chart from HTML
    self.svgBounds = divMapView.node().getBoundingClientRect();
    self.svgWidth = self.svgBounds.width - self.margin.left - self.margin.right;
    self.svgHeight = 400;

    //creates svg element within the div
    self.svg = divMapView.append("svg")
        .attr("width", self.svgWidth)
        .attr("height", self.svgHeight);

    var projection = d3.geoAlbersUsa()
        .translate([self.svgWidth/2, self.svgHeight/2])    // translate to center of screen
        .scale([800]);          // scale things down so see entire US

    // Define path generator
    var path = d3.geoPath()               // path generator that will convert GeoJSON to SVG paths
        .projection(projection);  // tell path generator to use albersUsa projection

    // Load GeoJSON data and merge with states data
    d3.json("data/us_states.json", function(json) {

    // Bind the data to the SVG and create one path per GeoJSON feature
        self.svg.selectAll("path")
            .data(json.features)
            .enter()
            .append("path")
            .attr("id", function (d) {
                return d.properties.abbr;
            })
            .attr("d", path)
            .classed("states", true)
            .on("click", function(d) {
                //console.log("Clicked - " + d.properties.abbr);
                self.selectedState(d.properties.abbr);
            });

    });

};

/**
 * Creates an interactive map with housing data on each state, populates
 * the bubble chart, line charts and detail cards based on selection
 */
MapView.prototype.update = function(){
    var self = this;
};


/**
 * Updates based on a selected state
 * @param stateId
 */
MapView.prototype.selectedState = function(stateId) {
    var self = this;
    self.svg.select("#"+stateId)
        .classed("states selected_states", true);
}
