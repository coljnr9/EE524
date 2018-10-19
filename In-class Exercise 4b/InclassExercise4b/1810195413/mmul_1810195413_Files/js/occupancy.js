function buildKernelOccupancyReport(occupancyMainAjax, reportItem, lastState){

	//globals:
	var occupancyData;
	
	//last state initializing:
	if(!lastState){
		lastState = { 'activePage': null };
	}
	
	//read occupancy data:
	var criticalError = false;
	$.ajax({
        url: occupancyMainAjax.source,
        type: "POST",
        dataType: "json",
		async: false,
        success: function (data) {
			occupancyData = data;
        },
        error: function(jqxhr, statusText, errorThrown){
			criticalError = true;
			appendCriticalErrorMessage(reportItem , "Error: unable to retrieve \"Kernel Occupancy\":<br/> \"" + errorThrown + "\".");
        }
    });
	
	if(criticalError == true){
		return;
	}
	

    //get reportNode:
    var reportNode = $(reportItem);
    
    //add general info table:
    table = CreateKernelOccpancyMainTable(occupancyData.generalInfo.kernelOccupancyPercentages,
														   occupancyData.generalInfo.ThreadCount,
														   occupancyData.generalInfo.LongestThread,
														   occupancyData.generalInfo.ShortestThread,
														   occupancyData.generalInfo.AvgThreadDuration
														 );
    reportItem.appendChild(table);

	table.style.paddingBottom = '20px';
	
	//inner viewMode & transition list:
	var vm = new ViewMode(reportItem, 180, 'View Mode:', 'reportTitle');
	reportItem.appendChild(CreateSeperator());
	var tl = new TransitionList(reportItem, '440px', false, 'fxPressAwayFAST', '', 400, 'transitionListItemContainer', onPageLoad, onPageDispose);
	
	//ids:
	var vm1_id = 'kernelAnalysis_eus', page1_id = vm1_id+'Page';
	var vm2_id = 'kernelAnalysis_timePerThreads', page2_id = vm2_id+'Page';
	var vm3_id = 'kernelAnalysis_threadsPerTime', page3_id = vm3_id+'Page';
	
	//============ create pages ============
	if(occupancyData.eus){
		vm.add(vm1_id, 'Execution Units', function () { tl.switchTo(page1_id); });
		var page1 = tl.addReportToList(page1_id);
		page1.loadingFunc = function(){ buildEUsReport(occupancyData.eus, page1); };
		
		//last state:
		if(lastState.activePage == page1_id){
			page1.loadingFunc();
		}
	}//-------------------------------------
	
	if(occupancyData.timePerThreads){
		vm.add(vm2_id, 'Ticks Per Threads', function () { tl.switchTo(page2_id); });
		var page2 = tl.addReportToList(page2_id);
		page2.loadingFunc = function(){ buildTimePerThreadsReport(occupancyData.timePerThreads, page2); };
		
		//last state:
		if(lastState.activePage == page2_id){
			vm.setFocusOn(vm2_id);
		}
		
	}//-------------------------------------
	
	if(occupancyData.threadPerTime){
		vm.add(vm3_id, 'Threads Per Time', function () { tl.switchTo(page3_id); });
		var page3 = tl.addReportToList(page3_id);
		page3.loadingFunc = function(){ buildThreadPerTimeReport(occupancyData.threadPerTime, page3); };
		
		//last state:
		if(lastState.activePage == page3_id){
			vm.setFocusOn(vm3_id);
		}
	}//-------------------------------------
	
	
	
	//if no last-state set yet, set it to be the first:
	if(lastState.activePage == null && tl.itemsCount > 0){
		var firstPageId = tl.callLoadOnFirstItem();
		lastState.activePage = firstPageId;
	}
	
	

	
	
	/*****************************************/
	/* Help functions */
	/*****************************************/
	
	function CreateKernelOccpancyMainTable(occupancy, threadCount, longestThread, shortestThread, avgThreadDuration) {
		
		var tr, td;
		var mainTable = document.createElement('table');
		mainTable.style.width = '80%';
		//mainTable.style.fontsize = '19px';
		
		tr = mainTable.insertRow(mainTable.rows.length);
		var leftSide = tr.insertCell(tr.cells.length);
		var rightSide = tr.insertCell(tr.cells.length);
		
		//occupancyInfo table:
		var table1 = document.createElement('table');
		leftSide.appendChild(table1);
		//table.className = 'infoTable11';
		tr = table1.insertRow(table1.rows.length);
		td = tr.insertCell(tr.cells.length);
		td.style.width = '130px';
		td.innerHTML = '- Occupancy:';
		td = tr.insertCell(tr.cells.length);
		td.className = 'OccupancyReport_occupancy';
		td.innerHTML = occupancy;
		
		tr = table1.insertRow(table1.rows.length);
		td = tr.insertCell(tr.cells.length);
		td.innerHTML = '- Memory stall:';
		td = tr.insertCell(tr.cells.length);
		td.className = 'OccupancyReport_MemoryStall';
		td.innerHTML = '[N/A]';
		
		tr = table1.insertRow(table1.rows.length);
		td = tr.insertCell(tr.cells.length);
		td.innerHTML = '- Threads launched:';
		td = tr.insertCell(tr.cells.length);
		td.className = 'OccupancyReport_ThreadsLaunched';
		td.innerHTML = threadCount;
		
		
		var table2 = document.createElement('table');
		rightSide.appendChild(table2);
		tr = table2.insertRow(table2.rows.length);
		td = tr.insertCell(tr.cells.length);
		td.style.width = '200px';
		td.innerHTML = '- Avg thread time (cycles):';
		td = tr.insertCell(tr.cells.length);
		td.className = 'OccupancyReport_avgThreadTime';
		td.innerHTML = avgThreadDuration;
		
		tr = table2.insertRow(table2.rows.length);
		td = tr.insertCell(tr.cells.length);
		td.innerHTML = '- Shotest thread (cycles):';
		td = tr.insertCell(tr.cells.length);
		td.className = 'OccupancyReport_shortestThread';
		td.innerHTML = shortestThread;
		
		tr = table2.insertRow(table2.rows.length);
		td = tr.insertCell(tr.cells.length);
		td.innerHTML = '- Longest thread (cycles):';
		td = tr.insertCell(tr.cells.length);
		td.className = 'OccupancyReport_longestThread';
		td.innerHTML = longestThread;

		//reportItem.appendChild(table);

		return mainTable;
	}
	
	function buildEUsReport(EUsAjax, page){
		
		var graphData;
		page.objectsMap = {};
		
		//read EUs data:
		var criticalError = false;
		
		$.ajax({
			url: EUsAjax.source,
			type: "POST",
			dataType: "json",
			async: false,
			success: function (data) {
				graphData = data;
			},
			error: function(jqxhr, statusText, errorThrown){
				criticalError = true;
				appendCriticalErrorMessage(reportItem , "Error: unable to retrieve \"Execution Units\":<br/> \"" + errorThrown + "\".");
			}
		});
		
		if(criticalError == true){
			return;
		}
		
		
		//data was read successfully, build the report:
		var graphContainer = document.createElement('div');
        graphContainer.className = 'occupancyGraphContainer';
        page.appendChild(graphContainer);
		
		var graph = new Graph(graphContainer);
        graph.setData(graphData.datasets);
        graph.setOptions(graphData.options);
        graph.Render();
		
		//save reference:
		page.objectsMap.graph = graph;
				
		//apply last state (if there any):
		if(lastState.eus && lastState.eus.graphState != null){
			graph.applyState(lastState.eus.graphState);
		}
		
	}
	
	function buildTimePerThreadsReport(timePerThreadsAjax, page){
		
		var graphData;
		page.objectsMap = {};
		
		//read EUs data:
		var criticalError = false;
		
		$.ajax({
			url: timePerThreadsAjax.source,
			type: "POST",
			dataType: "json",
			async: false,
			success: function (data) {
				graphData = data;
			},
			error: function(jqxhr, statusText, errorThrown){
				criticalError = true;
				appendCriticalErrorMessage(reportItem , "Error: unable to retrieve \"Time Per Threads\":<br/> \"" + errorThrown + "\".");
			}
		});
		
		if(criticalError == true){
			return;
		}
		
		
		
		//data was read successfully, build the report:
		var graphContainer = document.createElement('div');
        graphContainer.className = 'occupancyGraphContainer';
        page.appendChild(graphContainer);
		
		var graph = new Graph(graphContainer);
        graph.setData(graphData.datasets);
        graph.setOptions(graphData.options);
        graph.Render();
		
		page.objectsMap.graph = graph;
		
		
		
		//append tracker:
		appendTracker(graphContainer, graph, function (trackerDiv, x, y, tooltip, seriesID) {
                if (x && y) {
                    trackerDiv.innerHTML = Math.round(x) + ' threads ran at cycle ' + Math.round(y);
                }
                else {
                    trackerDiv.innerHTML = '';
                }
        });
			
			
		//setup custom selection handlers:
		var selectionDiv = document.createElement('div');
		selectionDiv.className = 'occupancyGraphOverlayTracker1';
		selectionDiv.innerHTML = 'select a range of the graph';
		graphContainer.appendChild(selectionDiv);
	
		var onSelection = function (xFrom, yFrom, xTo, yTo, dataset) {
			if (xFrom == null || xTo == null) {
				selectionDiv.innerHTML = 'select a range of the graph';
			}
			else if (occupancyData.generalInfo.TotalCycles > 0) {
				xFrom = xFrom.toFixed(0);
				xTo = xTo.toFixed(0);
				var seriesData = dataset[0].data;
				var len = seriesData.length;
				var rangeTotalCycles = 0;
	
				for (var i = 0; i < len; i++) {
					var entry = seriesData[i];
					if (entry[0] >= xFrom) {
						if (entry[0] <= xTo) {
							rangeTotalCycles += entry[1];
						}
						else {
							break;
						}
					}
				}
	
				var executionPercentage = rangeTotalCycles / occupancyData.generalInfo.TotalCycles * 100;
				selectionDiv.innerHTML = "for " + executionPercentage.toFixed(2) + "% of the kernel's time, a range of " + xFrom + " - " + xTo +
										" out of the " + (occupancyData.platform.TotalEUs * occupancyData.platform.ThreadsPerEU) + " threads were active.";
			}
		}
	
		graph.customSelectionFunc = onSelection;
		graph.bindCustomSelectionFunc();
	
		//position selectionDiv:
		var yaxisBox = graphContainer.plotObj.getAxes().yaxis.box;
		selectionDiv.style.top = (yaxisBox.top + 10) + 'px';
		selectionDiv.style.left = (yaxisBox.left + yaxisBox.width + 300) + 'px';
			
		
		//apply last state (if there any):
		if(lastState.timePerThreads && lastState.timePerThreads.graphState != null){
			graph.applyState(lastState.timePerThreads.graphState);
		}
	}
	
	function buildThreadPerTimeReport(threadsPerTimeAjax, page){
		
		var graphData;
		var timelineData;
		page.objectsMap = {};
		
		//read threads-per-time data:
		var criticalError = false;
		
		$.ajax({
			url: threadsPerTimeAjax.source,
			type: "POST",
			dataType: "json",
			async: false,
			success: function (data) {
				graphData = data;
			},
			error: function(jqxhr, statusText, errorThrown){
				criticalError = true;
				appendCriticalErrorMessage(reportItem , "Error: unable to retrieve \"Threads Per Time\":<br/> \"" + errorThrown + "\".");
			}
		});
		
		if(criticalError == true){
			return;
		}
		
		
		
		
		
		//read timeline data:
		$.ajax({
			url:threadsPerTimeAjax.timelineSource,
			type: "POST",
			dataType: "json",
			async: false,
			success: function (data) {
				timelineData = data;
			},
			error: function(jqxhr, statusText, errorThrown){
				criticalError = true;
				appendCriticalErrorMessage(reportItem , "Error: unable to retrieve \"Threads Per Time' - Timeline\":<br/> \"" + errorThrown + "\".");
			}
		});
		
		if(criticalError == true){
			return;
		}
		
		
		
		
		
		//data was read successfully, build the report:
		var graphContainer = document.createElement('div');
        graphContainer.className = 'occupancyGraphContainer';
        page.appendChild(graphContainer);
		
		var graph = new Graph(graphContainer);
        graph.setData(graphData.datasets);
        graph.setOptions(graphData.options);
        graph.Render();
		
		page.objectsMap.graph = graph;
		
		appendTracker(graphContainer, graph, function (trackerDiv, x, y) {
                trackerDiv.innerHTML = Math.round(y) + ' threads ran at cycle ' + Math.round(x);
        });
		
		var graphXaxisRange = graph.xMax - graph.xMin;
		
		//create a timeline overview div:
       var timeLineIsLocked = false;
       var timelineContainerDiv = document.createElement('div');
       timelineContainerDiv.className = 'timelineContainerDiv';
       graphContainer.appendChild(timelineContainerDiv);
       
       var timelineGraphDiv = document.createElement('div');
       timelineContainerDiv.appendChild(timelineGraphDiv);
       
       var timelinePositionDiv = document.createElement('div');
       timelinePositionDiv.className = 'timelinePositionDiv';
       timelinePositionDiv.style.background = 'black';
       timelinePositionDiv.style.opacity = '0.4';
       timelinePositionDiv.style.height = '100%';
       timelinePositionDiv.style.width = '50px';
       
       $(timelinePositionDiv).draggable({
           containment: timelineContainerDiv,
           axis: "x",
           drag: function () { timelinePositionDivmanualReposition(); },
           stop: function () { timelinePositionDivmanualReposition(); }
       });
       
       timelineContainerDiv.appendChild(timelinePositionDiv);
       
       //bind it to the graph's redraw callback:
       $(graphContainer.plotObj).on(graphContainer.plotObj.redrawOccuredCallback,
		function () {
		    if (timeLineIsLocked == true) {
		        return;
		    }
		    timeLineIsLocked = true;
		    updateTimelineDivPosition();
		    timeLineIsLocked = false;
		});
       
       //bind user's timeline clicks to positionDiv location:
       var isUserRelocatingPositionDiv = false;
       
       //start ineraction:
       $(timelineContainerDiv).mousedown(function (e) {
           isUserRelocatingPositionDiv = true;
           updateUserPositionDivRelocation(e);
       });
       //end ineraction:
       $(timelineContainerDiv).mouseup(function (e) {
           isUserRelocatingPositionDiv = false;
           updateUserPositionDivRelocation(e);
       });
       //ineracting:
       $(timelineContainerDiv).mousemove(function (e) {
           if (!isUserRelocatingPositionDiv) {
               return;
           }
           updateUserPositionDivRelocation(e);
       });
       
       
       var updateUserPositionDivRelocation = function(e){
           var clickOffsetX = e.clientX - $(timelineContainerDiv).offset().left;
           var positionDivWidth = $(timelinePositionDiv).width();
           var targetX = clickOffsetX - (positionDivWidth / 2);
           var timelineContainerWidth = $(timelineContainerDiv).width();
       
           //stay in bounds:
           if (targetX < 0) {
               targetX = 0;
           }
       
           if (targetX + positionDivWidth > timelineContainerWidth) {
               targetX = timelineContainerWidth - positionDivWidth;
           }
       
           timelinePositionDiv.style.left = targetX + 'px';
           timelinePositionDivmanualReposition();
       }
       
       var timelinePositionDivmanualReposition = function () {
           var timelinePositionDivLeftOffset = $(timelinePositionDiv).offset().left - $(timelineContainerDiv).offset().left;
           var timelinePositionDivRightOffset = timelinePositionDivLeftOffset + $(timelinePositionDiv).width();
           var timelineContainerWidth = $(timelineContainerDiv).width();
           var xaxis = graphContainer.plotObj.getAxes().xaxis;
       
           xaxis.options.min = Math.max(timelinePositionDivLeftOffset / timelineContainerWidth * graphXaxisRange, graph.xMin);
           xaxis.options.max = Math.min(timelinePositionDivRightOffset / timelineContainerWidth * graphXaxisRange, graph.xMax);
       
           timeLineIsLocked = true;
           graphContainer.plotObj.setupGrid();
           graphContainer.plotObj.draw();
           timeLineIsLocked = false;
       }
       
       var updateTimelineDivPosition = function () {
           var xaxis = graphContainer.plotObj.getAxes().xaxis;
           var visibleFrom = xaxis.options.min;
           var visibleTo = xaxis.options.max;
           var timelineContainerWidth = $(timelineContainerDiv).width();
           var targetFromOffset = visibleFrom / graphXaxisRange * timelineContainerWidth;
           var targetToOffset = visibleTo / graphXaxisRange * timelineContainerWidth;
       
           timelinePositionDiv.style.left = targetFromOffset + 'px';
           timelinePositionDiv.style.width = (targetToOffset - targetFromOffset) + 'px';
       }
       
       var xAxisPadding = 9, timelineHeight = 25;
       
       graphContainer.style.height = ($(graphContainer).height() - timelineHeight) + 'px'; //happens only once - at initializing.
       graphContainer.style.marginTop = (timelineHeight + 5) + 'px';

       
       function resetTimelineContainerPosition() {
           var axis = graphContainer.plotObj.getAxes(),
			xaxis = axis.xaxis,
			yaxis = axis.yaxis;
       
           timelineContainerDiv.style.position = 'absolute';
           timelineContainerDiv.style.background = 'yellow';
           timelineContainerDiv.style.overflow = 'hidden';
           timelineContainerDiv.style.height = (timelineHeight + 5) + 'px';
           timelineContainerDiv.style.width = (xaxis.box.width - 2 * xAxisPadding - 5) + 'px';
           timelineContainerDiv.style.top = (-timelineHeight) + 'px';
           timelineContainerDiv.style.left = (xaxis.box.left + 2) + 'px';
           timelineContainerDiv.style.marginLeft = xAxisPadding + 'px';
       
           timelineGraphDiv.style.position = 'absolute';
           timelineGraphDiv.style.height = (timelineHeight + 20) + 'px';
           timelineGraphDiv.style.width = (xaxis.box.width - xAxisPadding) + 'px';
           timelineGraphDiv.style.top = '-7px';//(-timelineHeight) + 'px';
           timelineGraphDiv.style.left = '-7px';//xaxis.box.left + 'px';
           //timelineGraphDiv.style.marginLeft = xAxisPadding + 'px';
       
           updateTimelineDivPosition();
       }
       
       resetTimelineContainerPosition();
       
       $(graphContainer).resize(function () {
           resetTimelineContainerPosition();
       });
       
       //create timeline graph:
       var timelineGraph = new Graph(timelineGraphDiv);
       timelineGraph.setData(timelineData.datasets);
       timelineGraph.setOptions(timelineData.options);
       timelineGraph.Render();
	   
	   page.objectsMap.timelineGraph = timelineGraph;
	   
	   //apply last state (if there any):
		if(lastState.threadsPerTime && lastState.threadsPerTime.graphState != null){
			graph.applyState(lastState.threadsPerTime.graphState);
		}
		
		if(lastState.threadsPerTime && lastState.threadsPerTime.timelineGraphState != null){
			timelineGraph.applyState(lastState.threadsPerTime.timelineGraphState);
		}
		
	}
	
	function appendTracker(graphContainer, graph, trackerFunc){
		
		var trackerDiv = document.createElement('div');
        trackerDiv.className = 'occupancyGraphOverlayTracker1';
        graphContainer.appendChild(trackerDiv);
		
        trackerDiv.id = 'occupancy_trackerDiv';
        graph.trackerDiv = trackerDiv.id;
		graph.trackerFormatFunc = trackerFunc;
        graph.bindTrackerDiv();

        //position trackerDiv:
        var yaxisBox = graphContainer.plotObj.getAxes().yaxis.box;
        trackerDiv.style.top = (yaxisBox.top + 10) + 'px';
        trackerDiv.style.left = (yaxisBox.left + yaxisBox.width + 15) + 'px';
	}
	
	
	/*****************************************/
	/* Load / Dispose functions */
	/*****************************************/
	function onPageLoad(id){
		//console.log('inner load: ' + id);
		//get page element:
		var page = document.getElementById(id);
		if(page == null){
			//appendCriticalErrorMessage(parent , "Error: unable to find report!");
			alert("Error: unable to find report!");
			return;
		}
		lastState.activePage = id;
		
		//call it's loading function (if it has any):
		if (typeof page.loadingFunc == 'function') {
			page.loadingFunc();
		}
		else{
			console.log('no loading function found for ' + id);
		}
		
	}
	
	function onPageDispose(id){
		//get page element:
		var page = document.getElementById(id);
		if(page == null){
			alert("Error: unable to find report!");
			return;
		}
		
		if(id == page1_id){
			//get graph's last state:
			if(page.objectsMap && page.objectsMap.graph != null){
				var graphLastState = page.objectsMap.graph.getState();
				lastState.eus = {'graphState': graphLastState};
			}
		}
		
		if(id == page2_id){
			//get graph's last state:
			if(page.objectsMap && page.objectsMap.graph != null){
				var graphLastState = page.objectsMap.graph.getState();
				lastState.timePerThreads = {'graphState': graphLastState};
			}
		}
		
		if(id == page3_id){
			
			if(lastState.threadsPerTime == null){ lastState.threadsPerTime = {}; }
			
			//get graph's last state:
			if(page.objectsMap && page.objectsMap.graph != null){
				var graphLastState = page.objectsMap.graph.getState();
				lastState.threadsPerTime.graphState = graphLastState;
			}
			
			//get timeline graph's last state:
			if(page.objectsMap && page.objectsMap.timelineGraph != null){
				var graphLastState = page.objectsMap.timelineGraph.getState();
				lastState.threadsPerTime.timelineGraphState = graphLastState;
			}
		}
		
		$(page).empty();
	}
	
	
	reportItem.onItemDispose = function(){
		var activePage = tl.getCurrentItem();
		onPageDispose(activePage.id);
	}
	
	
}