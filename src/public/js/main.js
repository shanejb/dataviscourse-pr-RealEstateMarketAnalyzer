/*
 * Root file that handles instances of all the charts and loads the visualization
 */
(function () {
    var instance = null;

    /**
     * Creates instances for every chart (classes created to handle each chart;
     * the classes are defined in the respective javascript files.
     */
    function init() {
        //Creating instances for each visualization

        var bubbleChart = new BubbleChart();

        var houseChart = new HouseChart();

        var rentChart = new RentChart();

        var detailCards = new DetailCards();

        //load the data corresponding to all the states on map
        //pass this data and instances of all the charts that update on year selection to yearChart's constructor

        // d3.csv("data/yearwiseWinner.csv", function (error, electionWinners) {
        //     //pass the instances of all the charts that update on selection change in YearChart
        //     var yearChart = new YearChart(electoralVoteChart, tileChart, votePercentageChart, electionWinners);
        //     yearChart.update();
        // });
        var stateData = "PLACE_HOLDER_FOR STATES_DATA_FOR_MAP";

        var mapView = new MapView(bubbleChart, houseChart, rentChart, detailCards, stateData);
        mapView.update();
    }

    /**
     *
     * @constructor
     */
    function Main() {
        if (instance !== null) {
            throw new Error("Cannot instantiate more than one Class");
        }
    }

    /**
     *
     * @returns {Main singleton class |*}
     */
    Main.getInstance = function () {
        var self = this
        if (self.instance == null) {
            self.instance = new Main();

            //called only once when the class is initialized
            init();
        }
        return instance;
    }

    Main.getInstance();
})();