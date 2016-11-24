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


        var mapView = new MapView(bubbleChart, houseChart, rentChart, detailCards);
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