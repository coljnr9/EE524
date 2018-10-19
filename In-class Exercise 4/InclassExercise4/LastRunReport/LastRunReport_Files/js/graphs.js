function Graph(containerElement) {

    this.containerElement = containerElement;
    if (containerElement.id != null) {
        this.id = containerElement.id;
    }
    else{
        this.id = null;
    }
    this.plot = null;
    this.options = null;
    this.legendsDiv = null;
    this.placeholder = $(containerElement);
    this.isInitiated = false;
    this.navigationDiv = null;
    //graph data:
    this.data = null;
    this.xAxisTicks = null;
    this.yAxisTicks = null;
    this.xMin = null;
    this.xMax = null;
    this.yMin = null;
    this.yMax = null;
    //settings:
    this.xAxisName = "";
    this.yAxisName = "";
    this.animate = false;
    this.hoverable = true;
    this.clickable = true;
    this.xAxis_showTicks = false;
    this.yAxis_showTicks = false;
    this.userResizable = false;
    this.navigatable = true;
    this.horizontalGridlines = true;
    this.verticalGridlines = true;
    this.autoHighlight = true;
    //tracking functions:
    this.trackable = true;
    this.trackerMode = "x";
    this.trackerDiv = '';
    this.trackerFormatFunc = null;
    this.trackerDefaultMessage = 'hover over graph';
    this.updateLegendTimeout = null;
    this.latestPosition = null;
    //tooltip:
    this.showTooltip = true;
    this.previousPoint = null;
    this.previousLabel = null;
    //togglerDiv
    this.togglable = true;
    this.togglerDiv = '';
    //selection:
    this.selectable = true;
    this.zoomOnSelection = true;
    this.selectionMode = 'x';
    this.customSelectionFunc = null;
    this.lastSelectionState = null;
    this.blockSelectionCallbacks = false;
    //markers:
    this.markers = null;
    //zooming:
    this.zooming_xAxis_zoomable = false;
    this.zooming_xAxis_minimalZoom = 2;
    this.zooming_xAxis_maximalZoom = null;
    this.zooming_onLoad_xAxis_from = 0;
    this.zooming_onLoad_xAxis_to = 1;
    this.center_xAxis_ifElementsAreLessThan = null;
    this.zooming_yAxis_zoomable = false;
    this.zooming_yAxis_minimalZoom = 2;
    this.zooming_onLoad_yAxis_from = 0;
    this.zooming_onLoad_yAxis_to = 1;
    this.center_yAxis_ifElementsAreLessThan = null;
    //design:
    this.ticksRotationXaxis = 0;
    this.ticksTransformXaxis = 0;
    this.labelPadding_xAxis = 10;
    this.backgroundColor = { colors: ["#e7e7e7", "#ffffff"] };
	//last state:
	//this. lastState = {};
}

Graph.prototype.getState = function () {
	if (this.plot == null) {
		return {};
	}
	
	//this.saveSelectionLastState();
	
    var plotAxis = this.plot.getAxes();
    var state = {
        xMin: plotAxis.xaxis.options.min,
        xMax: plotAxis.xaxis.options.max,
        yMin: plotAxis.yaxis.options.min,
        yMax: plotAxis.yaxis.options.max,
        selection: this.lastSelectionState
    }
	
	return state;
}

Graph.prototype.applyState = function (state) {
	if (this.plot == null) {
		return;
	}
	
	//get axeses:
    var axes = this.plot.getAxes();
    var xaxis = axes.xaxis;
    var yaxis = axes.yaxis;
	
	//retrieve zooming position:
    xaxis.options.min = state.xMin;
    xaxis.options.max = state.xMax;
    yaxis.options.min = state.yMin;
    yaxis.options.max = state.yMax;
	
    //redraw the plot:
    this.plot.setupGrid();
    this.plot.draw();

	//set selection:
    if (state.selection != null) {
        this.plot.setSelection({
            xaxis: {
                from: state.selection.xFrom,
                to: state.selection.xTo
            },
            yaxis: {
                from: state.selection.yFrom,
                to: state.selection.yTo
            }
        });
    }
	
}

Graph.prototype.setData = function (dataObject) {
    this.data = dataObject.data;
    this.xAxisTicks = dataObject.xAxisTicks;
    this.yAxisTicks = dataObject.yAxisTicks;
    this.xMin = dataObject.xMin;
    this.xMax = dataObject.xMax;
    this.yMin = dataObject.yMin;
    this.yMax = dataObject.yMax;
}

Graph.prototype.setOptions = function (optionsObject) {

    this.xAxisName = optionsObject.xAxisName;
    this.yAxisName = optionsObject.yAxisName;
    this.xAxis_showTicks = optionsObject.xAxis_showTicks;
    this.yAxis_showTicks = optionsObject.yAxis_showTicks;
    this.animate = optionsObject.animate;
    this.hoverable = optionsObject.hoverable;
    this.clickable = optionsObject.clickable;
    this.navigatable = optionsObject.navigatable;
    this.horizontalGridlines = optionsObject.horizontalGridlines;
    this.verticalGridlines = optionsObject.verticalGridlines;
    this.autoHighlight = optionsObject.autoHighlight;
    this.showTooltip = optionsObject.showTooltip;
    this.selectable = optionsObject.selectable;
    this.zoomOnSelection = optionsObject.zoomOnSelection;
    this.selectionMode = optionsObject.selectionMode;
    this.markers = optionsObject.markers;
    this.trackable = optionsObject.trackable;
    this.trackerMode = optionsObject.trackerMode;
    this.trackerDiv = optionsObject.trackerDiv;
    this.trackerDefaultMessage = optionsObject.trackerDefaultMessage;
    this.togglable = optionsObject.togglable;
    this.togglerDiv = optionsObject.togglerDiv;
    this.zooming_xAxis_zoomable = optionsObject.zooming_xAxis_zoomable;
    this.zooming_xAxis_minimalZoom = optionsObject.zooming_xAxis_minimalZoom;
    this.zooming_xAxis_maximalZoom = optionsObject.zooming_xAxis_maximalZoom;
    this.zooming_onLoad_xAxis_from = optionsObject.zooming_onLoad_xAxis_from;
    this.zooming_onLoad_xAxis_to = optionsObject.zooming_onLoad_xAxis_to;
    this.center_xAxis_ifElementsAreLessThan = optionsObject.center_xAxis_ifElementsAreLessThan;
    this.zooming_yAxis_zoomable = optionsObject.zooming_yAxis_zoomable;
    this.zooming_yAxis_minimalZoom = optionsObject.zooming_yAxis_minimalZoom;
    this.zooming_onLoad_yAxis_from = optionsObject.zooming_onLoad_yAxis_from;
    this.zooming_onLoad_yAxis_to = optionsObject.zooming_onLoad_yAxis_to;
    this.center_yAxis_ifElementsAreLessThan = optionsObject.center_yAxis_ifElementsAreLessThan;
    this.showLegends = optionsObject.showLegends;
    this.backgroundColor = optionsObject.backgroundColor

    this.ticksRotationXaxis = optionsObject.ticksRotationXaxis;
    this.ticksTransformXaxis = optionsObject.ticksTransformXaxis;
    this.labelPadding_xAxis = optionsObject.labelPadding_xAxis;
};

Graph.prototype.CreateOptions = function () {
    this.options = {
        series: {
            bars: {
                align: "center",
                fill: 0.8,
                barWidth: 0.5
            }
        },
        xaxis: {
            axisLabel: this.xAxisName,
            axisLabelUseCanvas: true,
            autoscaleMargin: 0.05,
            axisLabelFontSizePixels: 12,
            axisLabelFontFamily: 'Verdana, Arial',
            axisLabelPadding: this.labelPadding_xAxis
        },
        yaxis: {
            axisLabel: this.yAxisName,
            axisLabelUseCanvas: true,
            axisLabelFontSizePixels: 12,
            axisLabelFontFamily: 'Verdana, Arial',
            axisLabelPadding: 3,
            zoomRange: false,
            panRange: false
        },
        legend: {
            show: this.showLegends,
            noColumns: 0,
            labelBoxBorderColor: "#000000",
            position: "nw",
            backgroundColor: "Transparent"
        },
        grid: {
            borderWidth: 0.5,
            backgroundColor: this.backgroundColor,
            autoHighlight: this.autoHighlight,
            hoverable: this.hoverable,
            clickable: this.clickable,
            markings: this.markers
        }
    };

    if (!this.verticalGridlines) {
        this.options.xaxis.tickLength = 0;
    }
    if (!this.horizontalGridlines) {
        this.options.yaxis.tickLength = 0;
    }

    if (this.xAxis_showTicks) {
        this.options.xaxis.ticks = this.xAxisTicks;
    }
    if (this.yAxis_showTicks) {
        this.options.yaxis.ticks = this.yAxisTicks;
    }
    if (this.trackable) {
        this.options.crosshair = { mode: this.trackerMode }
        if (this.trackerDiv) {
            this.bindTrackerDiv();
        }
    }
    if (this.selectable) {
        this.options.selection = { mode: this.selectionMode }
    }
    if (this.animate) {
        this.options.series.grow = { active: true }
    }

}

Graph.prototype.Render = function () {
    //one-time pre-plotting:
    this.CreateOptions();
    //plotting:
    this.ReplotGraph(this.data);
    this.isInitiated = true;
    //one-time post-plotting:
    if (this.animate) {
        this.placeholder.hide();
        var graphEffect = "blind";
        this.placeholder.show(graphEffect, 500);
    }
    if (this.showTooltip) {
        this.UseTooltip();
    }
    if (this.togglable) {
        this.addSerieseToggler();
    }

}

Graph.prototype.ReplotGraph = function (datasets) {
    //pre-plotting:
    this.setZoomAndPan();
    if (this.isInitiated == false) {
        this.adjustZoomSettings();
    }
    else {

    }
    //plotting:
    this.plot = $.plot(this.containerElement, datasets, this.options);
    
    //save pointer to plot object:
    if (this.containerElement) {
        this.containerElement.plotObj = this.plot;
        this.containerElement.plotOptions = this.options;
    }

    //redefine the placeholder:
    this.placeholder = $(this.containerElement);
    //disable grow-animation after initiation:
    if (this.isInitiated == false) {
        this.options.series.grow = { active: false }
        this.isInitiated == true;
    }
    //post-plotting:
    if (this.navigatable) {
        this.addNavigationButtons();
    }

    //apply design:
    this.rotateXaxixTicks();

    //on redrawCallback:
    var graph = this;
    $(this.plot).on(this.plot.redrawOccuredCallback, function () {
        //re-set selection if it's selectable:
        if (graph.selectable == true) {
            if (graph.lastSelectionState == null) {
                graph.plot.clearSelection();
            }
            else {
                graph.blockSelectionCallbacks = true;

                graph.plot.setSelection({
                    xaxis: {
                        from: graph.lastSelectionState.xFrom,
                        to: graph.lastSelectionState.xTo
                    },
                    yaxis: {
                        from: graph.lastSelectionState.yFrom,
                        to: graph.lastSelectionState.yTo
                    }
                });

                graph.blockSelectionCallbacks = false;
            }
        }

        //rotate x-Axis ticks if demanded:
        graph.rotateXaxixTicks();

    });
    
    if (this.selectable) {
        if (this.zoomOnSelection) {
            this.setSelectionZoomBehavior();
        }
        //bind user's custom selection function callback:
        this.bindCustomSelectionFunc();
    }
}

Graph.prototype.saveSelectionLastState = function(ranges){
	this.lastSelectionState = { xFrom: null, xTo: null, yFrom: null, yTo: null };

	if (ranges.xaxis) {
		this.lastSelectionState.xFrom = ranges.xaxis.from;
		this.lastSelectionState.xTo = ranges.xaxis.to;
	}
	if (ranges.yaxis) {
		this.lastSelectionState.yFrom = ranges.yaxis.from;
		this.lastSelectionState.yTo = ranges.yaxis.to;
	}
}

//zoom & pan functions:
Graph.prototype.setZoomAndPan = function () {
    this.options.zoom = {
        interactive: this.zooming_xAxis_zoomable || this.zooming_yAxis_zoomable,
        amount: 1.1
    }
    this.options.pan = {
        interactive: (!this.selectable && (this.zooming_xAxis_zoomable || this.zooming_yAxis_zoomable))
    }
}

Graph.prototype.adjustZoomSettings = function () {
    var xRange = this.xMax - this.xMin;
    var xDisplayMin = this.xMin, xDisplayMax = this.xMax;
    //if x-Axis needs centring:
    if (this.center_xAxis_ifElementsAreLessThan != null &&
		this.center_xAxis_ifElementsAreLessThan > xRange) {
        var offset = (this.center_xAxis_ifElementsAreLessThan - xRange) / 2;
        xDisplayMin = this.xMin - offset;
        xDisplayMax = this.xMax + offset;
    }
    else {
        xDisplayMin = this.zooming_onLoad_xAxis_from;
        xDisplayMax = this.zooming_onLoad_xAxis_to;
    }
    //set zoom & pan ranges:
    var xRangeMin = Math.min(this.xMin, xDisplayMin);
    var xRangeMax = Math.max(this.xMax, xDisplayMax);
    if (this.zooming_xAxis_zoomable) {
        var maxZoomout;
        if (this.zooming_xAxis_maximalZoom != null) {
            maxZoomout = this.zooming_xAxis_maximalZoom;
        }
        else {
            maxZoomout = xDisplayMax - xDisplayMin;
        }
        this.options.xaxis.zoomRange = [this.zooming_xAxis_minimalZoom, maxZoomout];
        this.options.xaxis.panRange = [xRangeMin, xRangeMax];
    }
    this.options.xaxis.min = xDisplayMin;
    this.options.xaxis.max = xDisplayMax;



    var yRange = this.yMax - this.yMin;
    var yDisplayMin = this.yMin, yDisplayMax = this.yMax;
    //if y-Axis needs centring:
    if (this.center_yAxis_ifElementsAreLessThan != null &&
		this.center_yAxis_ifElementsAreLessThan > yRange) {
        var offset = (this.center_yAxis_ifElementsAreLessThan - yRange) / 2;
        yDisplayMin = this.yMin - offset;
        yDisplayMax = this.yMax + offset;
    }
    else {
        yDisplayMin = this.zooming_onLoad_yAxis_from;
        yDisplayMax = this.zooming_onLoad_yAxis_to;
    }
    //set zoom & pan ranges:
    var yRangeMin = Math.min(this.yMin, yDisplayMin);
    var yRangeMax = Math.max(this.yMax, yDisplayMax);
    if (this.zooming_yAxis_zoomable) {
        this.options.yaxis.zoomRange = [this.zooming_yAxis_minimalZoom, yRangeMax - yRangeMin];
        this.options.yaxis.panRange = [yRangeMin, yRangeMax];
    }
    this.options.yaxis.min = yDisplayMin;
    this.options.yaxis.max = yDisplayMax;
}

Graph.prototype.addNavigationButtons = function () {

    //append a navigationDiv to the placeholder:
    this.navigationDiv = document.createElement('div');
    this.navigationDiv.className = 'graphNavigationContainer';
    this.placeholder.append(this.navigationDiv);
  //  this.placeholder.hover(function () {
  //      $(navigationDiv).fadeToggle(250);
  //  });
    
    //append controllers to the navigationDiv:
    var navigationDiv = this.navigationDiv;
    var plot = this.plot;
    var zoomable = this.zooming_xAxis_zoomable || this.zooming_yAxis_zoomable;
    
    addArrow(navigationDiv, plot, "arrow-up", 'left: -20px; top: 0px;', { top: -30 });
    addArrow(navigationDiv, plot, "arrow-down", 'left: -20px; top: 30px;', { top: 30 });
    addArrow(navigationDiv, plot, "arrow-left", 'left: -35px; top: 15px;', { left: -30 });
    addArrow(navigationDiv, plot, "arrow-right", 'left: -5px; top: 15px;', { left: 30 });

    //navigation buttons:
    function addArrow(navigationDiv, plot, img, style, offset) {
        var panInterval;

        var element = $("<img class='graphNavigationButton' src='" + filesBaseDir + "/resources/" + img + ".gif' style='" + style + "'>")
            .appendTo(navigationDiv);

        element.mousedown(function (e) {
            panInterval = setInterval(function () { panFunc(e) }, 15);
        });
        element.mouseup(function (e) {
            clearInterval(panInterval);
            panFunc(e);
        });
        element.mouseout(function (e) {
            clearInterval(panInterval);//todo: if active?
        });

        var panFunc = function (e) {
            e.preventDefault();
            plot.pan(offset);
        }
    }

    $("<img class='graphNavigationButton' src='" + filesBaseDir + "/resources/zoomin.gif' style='left: -20px; top:50px; width: 16px; height: 16px;'>")
        .appendTo(this.navigationDiv)
        .click(function (e) {
            e.preventDefault();
            if (zoomable) {
                plot.zoom();
            }
        });

    $("<img class='graphNavigationButton' src='" + filesBaseDir + "/resources/zoomout.gif' style='left: -20px; top:70px; width: 16px; height: 16px;'>")
        .appendTo(this.navigationDiv)
        .click(function (e) {
            e.preventDefault();
            if (zoomable) {
                plot.zoomOut();
            }
        });

}

//tracker functions:
Graph.prototype.bindTrackerDiv = function () {
    var graph = this;
    document.getElementById(this.trackerDiv).innerHTML = this.trackerDefaultMessage;
    this.placeholder.bind("plothover", function (event, pos, item) {
        graph.latestPosition = pos;
        if (!graph.updateLegendTimeout) {
            graph.updateLegendTimeout = setTimeout(function () { graph.updateTrackerData() }, 50);
        }
    });
}

Graph.prototype.updateTrackerData = function () {

    if (this.trackerDiv == null) {
        return;
    }
    var trackerDivJS = document.getElementById(this.trackerDiv);
    if (trackerDivJS == null) {
        return;
    }

    this.updateLegendTimeout = null;

    var self = this;
    var resultX, resultY, resultToolTip, resultSeriesID;
    var pos = this.latestPosition;

    var axes = this.plot.getAxes();
    if (pos.x < axes.xaxis.min || pos.x > axes.xaxis.max || pos.y < axes.yaxis.min || pos.y > axes.yaxis.max) {
        trackerDivJS.innerHTML = this.trackerDefaultMessage;
        return;
    }

    var i, j, dataset = this.plot.getData();
    for (i = 0; i < dataset.length; ++i) {

        var series = dataset[i];

        if (series.bars && series.bars.show) {
            // Find the highlighted bar
            var found = false;
            for (j = 0; j < series.data.length; ++j) {
                var graphPointX = series.data[j][0];
                if (graphPointX >= pos.x - 0.25 && graphPointX <= pos.x + 0.25) {
                    resultX = graphPointX;
                    resultY = series.data[j][1];
                    resultSeriesID = series.id;
                    if (series.tt && series.tt.length >= graphPointX) {
                        resultToolTip = series.tt[graphPointX - 1];
                    }
                    else {
                        resultToolTip = null;
                    }

                    callCustomTrackerFunc();
                    found = true;
                    break;
                }
            }
            //if non is highlighted / found:
            if (!found) {
                resultX = null;
                resultY = null;
                resultSeriesID = null;
                resultToolTip = null;

                callCustomTrackerFunc();
            }
        }//--------------------------------------------
        else if (series.lines && series.lines.show && !series.lines.steps) {
            // Find the nearest points, x-wise
            for (j = 0; j < series.data.length; ++j) {
                if (series.data[j][0] > pos.x) {
                    break;
                }
            }

            //Interpolate:
            var y, p1 = series.data[j - 1], p2 = series.data[j];

            if (p1 == null) {
                y = p2[1];
            } else if (p2 == null) {
                y = p1[1];
            } else {
                y = p1[1] + (p2[1] - p1[1]) * (pos.x - p1[0]) / (p2[0] - p1[0]);
            }

            resultX = pos.x;
            resultY = y;
            resultSeriesID = series.id;
            resultToolTip = null;

            callCustomTrackerFunc();
        }//--------------------------------------------
        else if (series.lines && series.lines.show && series.lines.steps) {
            // Find the nearest points, x-wise
            for (j = 0; j < series.data.length; ++j) {
                if (series.data[j][0] > pos.x) {
                    break;
                }
            }

            //take the previous point y value:
            resultX = pos.x;
            if (series.data[j - 1]) {
                resultY = series.data[j - 1][1];
            }
            else {
                resultY = null;
            }
            resultSeriesID = series.id;
            resultToolTip = null;

            callCustomTrackerFunc();
        }
    }//--------------------------------------------

    //do the call back if defined:
    function callCustomTrackerFunc() {
        if (self.trackerFormatFunc != null) {
            self.trackerFormatFunc(trackerDivJS, resultX, resultY, resultToolTip, resultSeriesID);
        }
        else {
            trackerDivJS.innerHTML = "(" + resultX + "," + y + ")";
        }
    }
}

//tooltip functions:
Graph.prototype.UseTooltip = function () {
    var graph = this;
    this.placeholder.bind("plothover", function (event, pos, item) {
        if (item) {
            if ((graph.previousLabel != item.series.label) || (graph.previousPoint != item.dataIndex)) {
                graph.previousPoint = item.dataIndex;
                graph.previousLabel = item.series.label;
                $("#tooltip").remove();
                var x = item.datapoint[0];
                var y = item.datapoint[1];
                var color = item.series.color;
                var tt_text = item.series.tt[item.dataIndex];
                if (tt_text != null && tt_text != '') {
                    graph.drawTooltip(item.pageX, item.pageY, color, tt_text);
                }
            }
        } else {
            $("#tooltip").remove();
            graph.previousPoint = null;
        }
    });
};

Graph.prototype.drawTooltip = function (x, y, color, contents) {
    $('<div id="tooltip">' + contents + '</div>').css({
        position: 'absolute',
        zIndex: 16777271,
        display: 'none',
        top: y - 40,
        left: x - 40,
        border: '2px solid ' + color,
        padding: '3px',
        'font-size': '9px',
        'border-radius': '5px',
        'background-color': '#fff',
        'font-family': 'Verdana, Arial, Helvetica, Tahoma, sans-serif',
        opacity: 0.9
    }).appendTo("body").fadeIn(200);
}

//series toggle:
Graph.prototype.addSerieseToggler = function () {
    var graph = this;
    var choiceContainer = $(this.togglerDiv);
    $.each(graph.data, function (key, val) {
        choiceContainer.append("   <input type='checkbox' name='" + key +
        "' checked='checked' id='id" + key + "'></input>" +
        "<label for='id" + key + "'>" + val.label + "</label>");
    });

    choiceContainer.find("input").click(function () { graph.plotAccordingToChoices() });
}

Graph.prototype.plotAccordingToChoices = function () {
    var diaplayData = [];
    var graphData = this.data;
    var choiceContainer = $(this.togglerDiv);
    choiceContainer.find("input:checked").each(function () {
        var key = $(this).attr("name");
        if (key && graphData[key]) {
            diaplayData.push(graphData[key]);
        }
    });

    //if (data.length > 0) {
    this.ReplotGraph(diaplayData);

}

//selection functions:
Graph.prototype.setSelectionZoomBehavior = function () {
    var graph = this;
    this.placeholder.bind("plotselected", function (event, ranges) {
		
		graph.saveSelectionLastState(ranges);
		
        if(this.blockSelectionCallbacks){
            return;
        }
        if (graph.zoomOnSelection) {
            $.each(graph.plot.getXAxes(), function (_, axis) {
                var opts = axis.options;
                opts.min = ranges.xaxis.from;
                opts.max = ranges.xaxis.to;
            });
            $.each(graph.plot.getYAxes(), function (_, axis) {
                var opts = axis.options;
                opts.min = ranges.yaxis.from;
                opts.max = ranges.yaxis.to;
            });
            graph.plot.setupGrid();
            graph.plot.clearSelection();
            graph.plot.draw();
            
        }
    });

}

Graph.prototype.bindCustomSelectionFunc = function () {
    if (this.customSelectionFunc == null) {
        return;
    }
    var graph = this;

    //on selection:
    this.placeholder.bind("plotselected", function (event, ranges) {
		
		graph.saveSelectionLastState(ranges);
		
        if (graph.blockSelectionCallbacks) {
            return;
        }
		
		//call the user's custom onSelection function:
		graph.customSelectionFunc(graph.lastSelectionState.xFrom,
							graph.lastSelectionState.yFrom,
							graph.lastSelectionState.xTo,
							graph.lastSelectionState.yTo,
							graph.plot.getData()
						);
		
    });

    //on de-selection:
    this.placeholder.bind("plotunselected", function (event) {
        graph.lastSelectionState = null;
        graph.customSelectionFunc(null, null, null, null, null);
    });
}


//design:
Graph.prototype.rotateXaxixTicks = function () {
    if (!this.xAxis_showTicks) {
        return;
    }

    rotationDegree = 0;
    translation = 0;

    //find all ticks:
    var ticksList = $(this.containerElement).find('.flot-x-axis div.flot-tick-label');

    if (ticksList.length > 1) {
        //find longest tick (characters count):
        var longestTick = 0;
        ticksList.each(function (index, tick) {
            if (tick.innerHTML.length > longestTick) {
                longestTick = tick.innerHTML.length;
            }
        });
        //find distance between first 2 points:
        var distance = $(ticksList[1]).offset().left - $(ticksList[0]).offset().left;
        distance = Math.abs(distance);
        //if longest tick laps over it's neighbour, find the appropriate rotation degree:
        longestTick = longestTick * 7;
        if (longestTick >= distance) {
            var redundantDist = longestTick - distance;
            var cosAlpha = (longestTick - redundantDist) / longestTick;
            rotationDegree = (Math.acos(cosAlpha) * (180 / Math.PI)) % 90;
            translation = Math.round(rotationDegree / 90 * 100);

            //for bars only:
            translation = translation;
        }
    }

    //do the rotation:
    ticksList.each(function (index, tick) {
        $(tick).css({
            "transform": "translateX(" + translation + "%) rotate(" + rotationDegree + "deg)", /* CSS3 */
            "-ms-transform": "translateX(" + translation + "%) rotate(" + rotationDegree + "deg)", /* IE */
            "-moz-transform": "translateX(" + translation + "%) rotate(" + rotationDegree + "deg)", /* Firefox */
            "-webkit-transform": "translateX(" + translation + "%) rotate(" + rotationDegree + "deg)", /* Safari and Chrome */
            "-o-transform": "translateX(" + translation + "%) rotate(" + rotationDegree + "deg)", /* Opera */
            "transform-origin": "0 0"
        });
    });
}