/**
 * Constructor for the Map View
 *
 * @param bubbleChart instance of BubbleChart
 * @param houseChart instance of HouseChart
 * @param rentChart instance of RentChart
 * @param detailCards instance of DetailCards
 * @param stateData sale/rent data corresponding to state over multiple years
 */
function MapView(bubbleChart, houseChart, rentChart, detailCards) {
    var self = this;

    self.bubbleChart = bubbleChart;
    self.houseChart = houseChart;
    self.rentChart = rentChart;
    self.detailCards = detailCards;
    self.selectedStates = [];
    self.init();
};

/**
 * Initializes the svg elements required for this chart
 */
MapView.prototype.init = function() {
    var self = this;
    self.selectedYear = 1996;
    self.selectedData = "zhvi";

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


    // //  Prototype to put clicked states in front of neighboring states
    // //  http://bl.ocks.org/eesur/4e0a69d57d3bfc8a82c2
    // d3.selection.prototype.moveToFront = function() {
    //     return this.each(function(){
    //         this.parentNode.appendChild(this);
    //     });
    // };

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
            .classed("states", true)
            .on("click", function(d) {
                // d3.select(this).moveToFront();
                self.selectState(this);
            })
            .attr("d", path);

    });

    d3.select("#slider_states")
        .on("input", function() {
                self.selectedYear = this.value;
                self.update();
            }
        );


    var legendHeight = 150;
    var legend = d3.select("#legend").classed("content",true);
    self.legendSvg = legend.append("svg")
        .attr("width",self.svgWidth)
        .attr("height",legendHeight)
        .attr("transform", "translate(" + self.margin.left + ",0)")
        .style("bgcolor","green");



    // //Domain definition for global color scale
    // var domain = [-60, -50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60];
    // //Color range for global color scale
    // var range = ["#063e78", "#08519c", "#3182bd", "#6baed6", "#9ecae1", "#c6dbef", "#fcbba1", "#fc9272", "#fb6a4a", "#de2d26", "#a50f15", "#860308"];
    // //Global colorScale be used consistently by all the charts
    // self.colorScale = d3.scaleQuantile()
    //     .domain(domain)
    //     .range(range);

    d3.select("#zhvi_map")
        .on("click", function() {
                self.selectedData = "zhvi";
                self.update();
            }
        );
    d3.select("#zri_map")
        .on("click", function() {
                self.selectedData = "zri";
                self.update();
            }
        );



    self.update();

};

/**
 * Creates an interactive map with housing data on each state, populates
 * the bubble chart, line charts and detail cards based on selection
 */
MapView.prototype.update = function(){
    var self = this;

    //  Min/Max Years
    var min_year = "1996";
    var data_file = "data/State_Zhvi_AllHomes.csv";

    //  Change variables for ZRI (Rent)
    if(self.selectedData == "zri")
    {
        data_file = "data/State_Zri_AllHomes_Simple.csv";
        min_year = "2010";
        if(self.selectedYear < min_year)
            self.selectedYear = min_year;
    }

    d3.csv(data_file, function(error, data) {

        //  Get the min and max values for the given year
        var min_value = -1;
        var max_value = -1;



        data.forEach(function(d){
            var value = Number(d[self.selectedYear]);
            if(min_value == -1 || (value < min_value && value != ""))
                min_value = value;
            if(max_value == -1 || (value > max_value && value != ""))
                max_value = value;
        });



        //  Color Legend References:
        //  http://d3-legend.susielu.com/
        //  https://github.com/dataviscourse/2016-dataviscourse-homework/tree/master/hw5

        //  Remove Old Legend
        self.legendSvg.select(".legendQuantile").remove();

        //  Add New Color Legend
        self.legendSvg.append("g")
            .attr("class", "legendQuantile")
            .attr("transform", "translate(20,50)");

        var linear = d3.scaleLinear()
            .domain([min_value,max_value])
            .range(["rgb(46, 73, 123)", "rgb(71, 187, 94)"]);

        //  Updates the slider to selected year
        d3.select("#year_states").text(self.selectedYear);
        d3.select("#slider_states")
            .property("value",self.selectedYear)
            .attr("min",min_year)
            // .attr("max",max_value);

        var legendQuantile = d3.legendColor()
            .shapeWidth((self.svgWidth-70)/5)
            //.cells(10)
            .shapePadding(10)
            .ascending(true)
            .labelFormat(d3.format("$,.0f"))
            .orient('horizontal')
            .scale(linear);

        self.legendSvg.select(".legendQuantile")
            .call(legendQuantile);

        d3.selectAll(".states")
            .style("fill",function(){
                var id = this.id;

                var state = data.filter(function (d) {
                    return d.abbr == id
                });

                try{
                    return linear(state[0][self.selectedYear])
                }
                catch(err)
                {
                    //  Does nothing in the event that the state doesn't have data for the given year
                }
            });
    });
};


/**
 * Updates based on a selected state
 * @param state
 */
MapView.prototype.selectState = function(state) {
    var self = this;
    var stateId = state.id;

    //  Clicked states are moved in front of neighboring states
    //  This fixes issues where state lines overlap
    //  http://bl.ocks.org/eesur/4e0a69d57d3bfc8a82c2
    d3.selection.prototype.moveToFront = function() {
        return this.each(function(){
            this.parentNode.appendChild(this);
        });
    };
    d3.select(state).moveToFront();

    //  Update state attributes
    self.svg.select("#"+stateId)
       .classed("states selected_states", true);


    // Populate house chart
    self.selectedStates.push(stateId);
    self.houseChart.update(self.selectedStates);

    // TODO: populate rent chart

    // TODO: populate detail cards
}


MapView.prototype.loadYearData = function()
{
    var self = this;

}