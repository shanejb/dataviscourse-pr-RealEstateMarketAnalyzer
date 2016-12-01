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


    d3.select("#slider_states")
        .on("input", function() {
                self.selectedYear = this.value;
                self.update();
            }
        );

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
            .attr("name",function(d){return d.properties.name})
            .classed("states", true)
            .on("click", function(d) {
                // d3.select(this).moveToFront();
                self.selectState(this);
            })
            .attr("d", path);
            // .on("mouseover", function(d) {
            //     div.transition()
            //         .duration(200)
            //         .style("opacity", .9)
            //         .text(d.properties.name)
            //         .style("left", (d3.event.pageX) + "px")
            //         .style("top", (d3.event.pageY - 28) + "px");
            // })
            // .on("mouseout", function() {
            //     div.transition()
            //         .duration(500)
            //         .style("opacity", 0);
            // });


        self.update();

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

    //  Add onclick button calls to update map
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

    //http://bl.ocks.org/d3noob/a22c42db65eb00d4e369
    // Define the div for the tooltip
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
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
            })
            .attr("value",function(d){
                var id = this.id;

                try {
                    var state = data.filter(function (d) {
                        return d.abbr == id
                    });
                    var value = state[0][self.selectedYear];
                    if(value.length < 1)
                        return "No Data";
                    else
                        return "$"+value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                }
                catch(err){return "No Data";}
            });


        //  Add ToolTip to Mouse over/out events over the map
        var div = d3.select(".tooltip");
        d3.selectAll(".states")
            .on("mouseover", function() {
                div.transition()
                    .duration(200)
                    .style("opacity", .9);

                div.html(d3.select(d3.event.target).attr("name") + "<br/>" + d3.select(d3.event.target).attr("value"))
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                    div.transition()
                        .duration(500)
                        .style("opacity", 0);
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

    //  Checks to make sure a state is not already included in the list
    if(self.selectedStates.includes(stateId) == false) {

        //  Creates smooth outline of states when selected
        d3.select(state).moveToFront();

        self.selectedStates.push(stateId);

        //  Update state attributes
        self.svg.select("#"+stateId)
            .classed("states selected_states", true);
    }
    else {
        //  State was selected and then clicked on, this will unselect the state

        //  Remove from selected states list
        var i = self.selectedStates.indexOf(stateId);
        console.log(i);
        self.selectedStates.splice(i,1);

        //  Un-highlight state outline
        self.svg.select("#"+stateId)
            .attr("class","states");

        //  Ensures smooth outline of selected states
        self.selectedStates.forEach(function(d){
            self.svg.select("#"+d).moveToFront();
        });
    }

    // Populate house chart
    self.houseChart.update(self.selectedStates);

    // TODO: populate rent chart

    // populate detail cards
    self.detailCards.update(self.selectedStates);
}


MapView.prototype.loadYearData = function()
{
    var self = this;

}