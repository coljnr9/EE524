function loadFPGASystemViewerReport(reportItem, systemViewer){
	/*****************************************/
	/* Building report structure */
	/*****************************************/
	if(systemViewer == null)
	{
		appendCriticalErrorMessage(reportItem , "System Viewer data is undefined.");
		return;
	}
	
	var splitView = new SplitView(reportItem, true, true, false, true);
	var graphView = splitView.getLeftView();
	var srcView = splitView.getRightView();

	
	//get the data from file:
	var data;
	$.ajax({
		url: systemViewer.source,
		type: "POST",
		dataType: "json",
		async: false,
		success: function (recievedData) {
			data = recievedData;
		},
		error: function(jqxhr, statusText, errorThrown){
			appendCriticalErrorMessage(parent , "Error: failed to retrieve data: " + errorThrown);
		}
	});
	if(data == null)
	{
		return;
	}
	
	//create a multi-source viewer:
	var multiSrcView = SharedMultiSrcView.getInstance();
	multiSrcView.reparentInto(srcView);
	splitView.hideRightSide();
	
	//create the graph view header:
	var headerDiv = document.createElement('div');
	graphView.appendChild(headerDiv);
	
	var titleSpan = document.createElement('span');
	titleSpan.innerHTML = 'System Viewer:';
	titleSpan.style.marginRight = '10px';
	titleSpan.className = 'reportTitle';
	headerDiv.appendChild(titleSpan);
	
	graphView.appendChild(CreateSeperator('100%', null, '5px'));
	
	var graphContainer = document.createElement('div');
	graphContainer.style.margin = '0px';
	graphContainer.style.overflow = 'auto'; //scroll
	graphContainer.style.background = 'white';
	graphContainer.style.height = 'calc(100% - 40px)';
	graphContainer.id = 'SPG'; //this is needed bacause "StartGraph" appends to a specific ID.
	graphView.appendChild(graphContainer);
	
	//on line mapping click event (function pointer):
	var onLineMappingRequest = function(line, filename) {
		var lineMapping = [{
									'file': filename,
									'line': line
								 }];
		FPGACommonTools.onHighlightRequest(lineMapping, multiSrcView, splitView);
	}
	
	
	spv_graph = new StartGraph(data, "SPV", null, null, null, null, onLineMappingRequest, headerDiv);
	
}


function loadFPGAKernelMemoryReport(reportItem, kernelMemoryViewer){
	/*****************************************/
	/* Building report structure */
	/*****************************************/
	if(kernelMemoryViewer == null)
	{
		appendCriticalErrorMessage(reportItem , "System Viewer data is undefined.");
		return;
	}
	
	var splitView = new SplitView(reportItem, true, true, false, true);
	var kernelMemoryWrapperView = splitView.getLeftView();
	var srcView = splitView.getRightView();

	
	//get the data from file:
	var data;
	$.ajax({
		url: kernelMemoryViewer.source,
		type: "POST",
		dataType: "json",
		async: false,
		success: function (recievedData) {
			data = recievedData;
		},
		error: function(jqxhr, statusText, errorThrown){
			appendCriticalErrorMessage(parent , "Error: failed to retrieve data: " + errorThrown);
		}
	});
	if(data == null)
	{
		return;
	}
	
	//create a multi-source viewer:
	var multiSrcView = SharedMultiSrcView.getInstance();
	multiSrcView.reparentInto(srcView);
	//splitView.hideRightSide();
	
	
	var kernelMemorySplitView = new SplitView(kernelMemoryWrapperView, true, true, false, false);
	var treeView = kernelMemorySplitView.getLeftView();
	var graphView = kernelMemorySplitView.getRightView();
	
		
	//create the graph view header:
	var headerDiv = document.createElement('div');
	graphView.appendChild(headerDiv);
	
	var titleSpan = document.createElement('span');
	titleSpan.innerHTML = 'Kernel Memory Viewer:';
	titleSpan.style.marginRight = '10px';
	titleSpan.className = 'reportTitle';
	headerDiv.appendChild(titleSpan);
	
	graphView.appendChild(CreateSeperator('100%', null, '5px'));
	
	var graphContainer = document.createElement('div');
	graphContainer.style.margin = '0px';
	graphContainer.style.overflow = 'auto'; //scroll
	graphContainer.style.background = 'white';
	graphContainer.style.height = 'calc(100% - 60px)';
	graphContainer.id = 'LMEMG'; //this is needed bacause "StartGraph" appends to a specific ID.
	graphView.appendChild(graphContainer);
	
	//on line mapping click event (function pointer):
	var onLineMappingRequest = function(line, filename) {
		var lineMapping = [{
									'file': filename,
									'line': line
								 }];
		FPGACommonTools.onHighlightRequest(lineMapping, multiSrcView, splitView);
	}
	
	
	
	//create the tree view:
	var treeHeaderDiv = document.createElement('div');
	treeView.appendChild(treeHeaderDiv);
	
	var titleSpan = document.createElement('span');
	titleSpan.innerHTML = 'Memory List:';
	titleSpan.style.marginRight = '10px';
	titleSpan.className = 'reportTitle';
	treeHeaderDiv.appendChild(titleSpan);
	
	treeView.appendChild(CreateSeperator('100%', null, '5px'));
	
	var treeContainer = document.createElement('div');
	treeContainer.style.margin = '0px';
	treeContainer.style.overflow = 'auto'; //scroll
	treeContainer.style.background = 'white';
	treeContainer.style.height = 'calc(100% - 60px)';
	treeView.appendChild(treeContainer);
	
	var hasLMem = addLMemTree(data, treeContainer);
    if (hasLMem == true) 
	{
        $(graphContainer).html("<br>&nbspClick on a memory variable to render it!");
    }
	else 
	{
        $(graphContainer).html("&nbspThere is no kernel memory variable in the design file!");
	}
	
	
	
	
	
	function startGraphForBank(element) {
		var kernelName = element.getAttribute("data-kernel");
		var lmemName = element.getAttribute("data-lmem");
		var bankName = element.getAttribute("name");

		var bankElements = document.querySelectorAll('[id^="' + kernelName + '_' + lmemName + '"]');
		var bankList = [];

		bankElements.forEach(function (elem) {
			if (elem.checked === true) bankList.push(elem.name);
		});

		$(graphContainer).html("");
		lmem_graph = new StartGraph(lmvData, "LMEM", kernelName, lmemName, bankList, bankName, onLineMappingRequest, headerDiv);
		lmem_graph.refreshGraph();
		
	}
	
	function addLMemTree(lmvData, parent) {
		// Generate the Javascript datastructure for the local memory
		var memList = [];
		var lmemList = []; // Stores list of local memories

		// If there are local memories to render, then add it to the fancytree:
		if (lmvData.nodes.length !== 0) {
			// Iterate through the mavJSON
			lmvData.nodes.forEach(function (element) {
				// Check whether it's either a kernel (OpenCL) or component (HLS)
				if (element.type == "kernel" || element.type == "component") {
					var kernelName = element.name;
					var kernelEntry = { title: kernelName, isLmem: false, expanded: true, icon: "lib/fancytree/skin-win8/kernelicon.png", children: [] };
					// Find the local memory block
					element.children.forEach(function (node) {
						if (node.type == "memtype" && node.name == "Local Memory") {
							// Add all the local memories
							node.children.forEach(function (lmemNode) {
								var memEntry = { title: lmemNode.name, kernel: kernelName, isLmem: true, expanded: true, icon: "lib/fancytree/skin-win8/memicon.png", children: [] };
								lmemNode.children.forEach(function (bankNode) {
									var bankName = "<input id='" + kernelName + "_" + lmemNode.name + "_" + bankNode.name +
										"'  type='checkbox' checked='checked' name='" + bankNode.name + "' data-kernel='" + kernelName + "' data-lmem='" + lmemNode.name +
										"' value='' >" + bankNode.name;
										
										bankName.onclick = function()
										{
											startGraphForBank(this);
										}
																				
									var bankEntry = { title: bankName, bank: bankNode.name, lmem: lmemNode.name, kernel: kernelName, isLmem: false, isBank: true, expanded: true, icon: false };
									memEntry.children.push(bankEntry);
								});
								kernelEntry.children.push(memEntry);
							});
						}
					});
					memList.push(kernelEntry);
				}
			});

			// If there are local memories to render, then add it to the fancytree:
			$(parent).fancytree({
				checkbox: false,
				source: memList,
				icon: true, // Disable the default icons
				clickFolderMode: 3, // 1:activate, 2:expand, 3:activate and expand, 4:activate (dblclick expands)
				activate: function (event, data) {
					// Check if a local memory is selected (do nothing for kernel)
					if (data.node.data.isLmem || data.node.data.isBank) {
						var lmem_name, kernel_name, bank_name;
						if (data.node.data.isLmem) {
							lmem_name = data.node.title;
						} else {
							lmem_name = data.node.data.lmem;
							bank_name = data.node.data.bank;
						}
						// Pass the name of the local memory into the rendering
						kernel_name = data.node.data.kernel;

						// Get the list of banks for that node that's selected
						var bankElements = document.querySelectorAll('[id^="' + kernel_name + '_' + lmem_name + '"]');
						var bankList = [];

						// TODO: Find a way to add the checked:true filter within the query instead of doing a for loop
						// Avoid using forEach on bankElements here because IE/Edge does not support it.
						for (var i=0; i < bankElements.length; i++) {
							if (bankElements[i].checked === true) bankList.push(bankElements[i].name);
						}

						// Start a new graph
						$(graphContainer).html("");
						lmem_graph = new StartGraph(lmvData, "LMEM", kernel_name, lmem_name, bankList, bank_name, onLineMappingRequest, headerDiv);
						lmem_graph.refreshGraph();
						
					}
				}
			});

			return true;
		} else {
			return false;
		}
	}


	
	
	
	
	
	
	
	
	
	
	
	
}



function adjustToWindowEvent() {
    return;
}



/* this is globally visible because of the design of graphD3 */
var spv_graph;