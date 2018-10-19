function loadOCLObjectsReport(reportItem, oclObjects){
	
	//basics:
	var objectsInfo = [];
	var objectsTree = [];
	var treeElementsMap = [];
	
	//read oclObjects data:
	if(readOclObjectsInfo() == false){
		return; //stop on failure.
	}
	
	//read oclObjectsTree data:
	if(readOclObjectsTreeData() == false){
		return; //stop on failure.
	}
	
	//filters:
	if(oclObjects.tree.filtersState == null){
		oclObjects.tree.filtersState = {};
	}
	var filtersState = oclObjects.tree.filtersState;
	
	//buildTreeReport:
	var header = document.createElement('table');
	reportItem.appendChild(header);
	var tr = header.insertRow(header.rows.length);
	
	//insert tite cell:
	var td = tr.insertCell(tr.cells.length);
	td.className = 'reportTitle';
	td.innerHTML = 'OpenCL Objects Filters:';
	
	//insert filters-wrapping cell:
	var filtersContainer = tr.insertCell(tr.cells.length);
	filtersContainer.className = 'viewModeContainer';
	filtersContainer.style.width = '350px';
	
	buildHeaderFilters(filtersContainer);
	reportItem.appendChild(CreateSeperator());
	buildObjectsTree(reportItem, objectsTree);
	
	
	//redraw arrows on window size:
	//console.log('REGISTERED == redrawing oclObjectsTree arrows');
	$(window).resize(onTreeResize);
	
	function onTreeResize(){
		//console.log('redrawing oclObjectsTree arrows');
		ClearTreeConnections();
		buildTreeConnections();
	}
	
	//make the tree container height stretches to fill the page:
	$(window).resize(onTreeContainerResize);
	
	
	function onTreeContainerResize(){
		var containers = $(reportItem).find('.oclObjectsTreeContainer');
		if(containers.length != 1){
			return;
		}
		
		var container = containers[0];
		var topOffset = Math.abs($(container).offset().top - $(reportItem).offset().top);
		$(container).css('height', 'calc(100% - ' + topOffset + 'px)');
		
	}
	
	onTreeContainerResize();
	
	//addNewTip();
	
	
	//==============================================
	// report dispose:
	//==============================================
	reportItem.onItemDispose = function(){
		//console.log('UNREGISTERING == redrawing oclObjectsTree arrows');
		$(window).off("resize", onTreeResize);
		$(window).off("resize", onTreeContainerResize);
	}
	
	
	
	//==============================================
	// help functions:
	//==============================================
	function buildHeaderFilters(filtersContainer){
	
		//empty container's content (for tips state-forcing):
		$(filtersContainer).empty();

		var nav = document.createElement('nav');
		nav.className = 'tabs-style-bar';
		filtersContainer.appendChild(nav);

		var filtersList = document.createElement('ul');
		nav.appendChild(filtersList);
		
		var filterItem, a;
		
		//filter 1: platforms:
		filterItem = document.createElement('li'); a = document.createElement('a');
		a.innerHTML = 'platforms'; a.className = 'oclObjectsTreeFilterCategory';
		filterItem.appendChild(a); filtersList.appendChild(filterItem);
		a.filters = [];
		var platformFilters = a.filters;
		
		
		//filter 2: context:
		filterItem = document.createElement('li'); a = document.createElement('a');
		a.innerHTML = 'contexts'; a.className = 'oclObjectsTreeFilterCategory';
		filterItem.appendChild(a); filtersList.appendChild(filterItem);
		a.filters = [];
		var contextFilters = a.filters;
		
		
		//filter 3: device type:
		filterItem = document.createElement('li'); a = document.createElement('a');
		a.innerHTML = "devices"; a.className = 'oclObjectsTreeFilterCategory';
		filterItem.appendChild(a); filtersList.appendChild(filterItem);
		a.filters = [];
		var devicesFilters = a.filters;


		//get filters:
		fillFiltersListsContent(objectsTree);
		

		//build filtersMenu:
		var filtersList = $(filtersContainer).find('.oclObjectsTreeFilterCategory');
		for(var i = 0; i<filtersList.length; i++)(function(i){
			var currentFilter = filtersList[i];
			
			//remove empty categories:
			if(currentFilter.filters.length == 0){
				$(currentFilter.parentNode).remove();
			}
			
			//on click menu:
			else{
				currentFilter.onclick = function(){
					
					parentFilter = this;					
					var filterMenu = document.createElement('div');
					filterMenu.className = 'oclObjectsFilterMenu';
					filterMenu.style.position = 'absolute';
					filterMenu.style.top = ($(currentFilter).offset().top - $(reportItem).offset().top + 2*$(currentFilter).height() )+ 'px';
					filterMenu.style.left =($(currentFilter).offset().left  - $(reportItem).offset().left )+ 'px';
					
					filterMenu.style.zIndex = '500';
					//filterMenu.style.width = '200px';
					//filterMenu.style.height = '200px';
					reportItem.appendChild(filterMenu);
					
					var filterMenuRelative = document.createElement('div');
					filterMenuRelative.style.position = 'relative';
					filterMenuRelative.style.background = 'white';
					filterMenuRelative.style.width = '100%';
					filterMenuRelative.style.height = '100%';
					filterMenuRelative.style.padding = '20px';
					filterMenu.appendChild(filterMenuRelative);
										
					var closeListener = function(ev){
						console.log('listening!');
						var target = ev.target;
						if( target !== filterMenu && target != parentFilter ) {
							reportItem.removeEventListener( 'click', closeListener );
							$(filterMenu).remove();
						}
					}
					
					//close the tips menu if the target isn't the menu element or one of its descendants..
					reportItem.addEventListener( 'click', closeListener );
					
					
					
					//fill it with the filters:
					for(var j = 0; j< currentFilter.filters.length; j++)(function(j){
						var filterName = currentFilter.filters[j];
						
						var filterElementWrapper = document.createElement('div');
						filterMenuRelative.appendChild(filterElementWrapper);
						
						var element = $('<label><input type="checkbox">' + filterName +'</label>');
						$(filterElementWrapper).append(element);
						
						var checkbox = element.find('input:checkbox')[0];
						if(filtersState[filterName] == true){
							checkbox.checked = false;
						}
						else{
							checkbox.checked = true;
						}
						
						//checkbox event:
						checkbox.onclick = function(){
							filtersState[filterName] = !checkbox.checked;
							removeObjectsTree();
							//ClearTreeConnections();
							buildObjectsTree(reportItem, objectsTree);
						};
						
					})(j);
					
				}
			}
		})(i);
		
		
		
		function fillFiltersListsContent(children){
			var childrenLen = children.length;
			for(var i=0; i<childrenLen; i++){
				var child = children[i];
				
				if(child.name.startsWith('Platform ')){
					platformFilters.push(child.name);
				}
				if(child.name.startsWith('Context ')){
					contextFilters.push(child.name);
				}
				if(child.name.startsWith('Device ')){
					devicesFilters.push(child.name);
				}

				if(child.children != null && child.children.length > 0){
					fillFiltersListsContent(child.children);
				}
			}
		}
		
		
	}
	
	
	function removeObjectsTree(){
		//ClearTreeConnections();
		$(reportItem).find('.oclObjectsTreeContainer').remove();
	}
	
	
	function buildObjectsTree(parent, children){
	
		var treeContainer = document.createElement('div');
		treeContainer.className = 'oclObjectsTreeContainer';
		parent.appendChild(treeContainer);
		
		//clear treeElementsMap:
		ClearTreeConnections();
		//build tree:
		buildTree(treeContainer, children);
		//build new arrows:
		buildTreeConnections();
		
		
		
		//======= help functions =======//
		function buildTree(parent, children, parentNode){
			treeElementsMap = [];
			var tableLayout = document.createElement('table');
			tableLayout.className = 'oclObjectsTreeTable';
			if(parentNode == null){ tableLayout.className += ' oclObjectsTreeTableRoot'; }
			parent.appendChild(tableLayout);		
			
			var tr = tableLayout.insertRow(tableLayout.rows.length);
			var childrenLen = children.length;
			var childrenNodes = [];
			
			for(var i=0; i<childrenLen; i++){
				var child = children[i];
				
				//filter our hidden elements:
				if(filtersState[child.name] == true){
					continue;
				}

				var td = tr.insertCell(tr.cells.length);
				var node = createTreeNode(child.name);
				td.appendChild(node);
				childrenNodes.push(node);
				
				if(child.children != null && child.children.length > 0){
					if(child.name.startsWith('Context') && child.children.length > 8){
						//alert('minimizing ' + child.name + ' children');
						//build a string of all the children names:
						var innerChildrenCount = child.children.length;
						var joinedChildrenText = '';
						for(var cIdx=0; cIdx<innerChildrenCount; cIdx++){
							joinedChildrenText += child.children[cIdx].name + '<br/>';
						}
						var joinedChildrenObj = [
															{
																"name": joinedChildrenText,
																"children": []
															}
														];
						buildTree(td, joinedChildrenObj, node);
						
					}
					else{
						buildTree(td, child.children, node);
					}
				}
			}
			
			if(parentNode != null){
				treeElementsMap.push([parentNode, childrenNodes]);
			}
		}
		
		
		function createTreeNode(name, type){//todo: pass and use type for icons.
			var node = document.createElement('div');
			var span =  document.createElement('span');
			node.className = 'oclObjectsTreeNode';
			span.innerHTML = name;
			span.className = 'oclObjectsTreeNodeSpan';
			node.appendChild(span);
			displayOclObjectInfo(name, node);
			return node;
		}
		
		
	}
	
	
	function ClearTreeConnections(){
		$(reportItem).find('.oclObjectsTreeArrowsContainer').remove();
	}
	
	
	function buildTreeConnections(){
		//find oclObjectsTreeRoot element:
		var roots = $(reportItem).find('.oclObjectsTreeContainer');
		if(roots.length < 1){
			//alert('error finding root: ' + roots.length);
			return;
		}
		var rootsLen = roots.length;
		var root;
		for(var rootIdx = 0; rootIdx < rootsLen; rootIdx++){
		
			root = $(roots[rootIdx]);
			
			//add a layer on top of main table:
			var arrowsContainer = document.createElement('div');
			arrowsContainer.className = 'oclObjectsTreeArrowsContainer';
			arrowsContainer.style.position = 'absolute';
			arrowsContainer.style.zIndex = '5';
			arrowsContainer.style.top = '0px';
			arrowsContainer.style.left = '0px';
			arrowsContainer.style.width = root.width() + 'px';
			arrowsContainer.style.height = root.height() + 'px';
			root.append(arrowsContainer);
			
			var relativeDiv = document.createElement('div');
			relativeDiv.style.position = 'relative';
			relativeDiv.style.width = '100%';
			relativeDiv.style.height = '100%';
			arrowsContainer.appendChild(relativeDiv);
			
			for(var i=0; i<treeElementsMap.length; i++){
					var pair = treeElementsMap[i];
					var node= pair[0];
					if(node == null){
						continue;
					}
					var children = pair[1];
					ConnectElements(relativeDiv, node, children, 'gray', 3);
			};
		}
		
		function ConnectElements(container, node, children, color, thickness){
			//if no children are available, nothing to connect with.
			if(children.length < 1){
				return;
			}
			
			var JQnode = $(node);
			var JQcontainer = $(container);
			
			//line 1: parent center, verically, half way through:
			var containerTop = JQcontainer.offset().top;
			var containerLeft = JQcontainer.offset().left;
			var parentBottom = JQnode.offset().top + JQnode.height() - containerTop;
			var parentCenter = JQnode.offset().left + JQnode.width()/2 - containerLeft;
			var firstChildTop = $(children[0]).offset().top - containerTop;
			
			var halfHeight = Math.abs(parentBottom - firstChildTop) / 2;

			drawLineDiv(container, parentCenter, parentBottom, halfHeight, thickness, 0, color);
			
			
			//line 2: center height, horizontally, from first child center to last child center:
			var centerHeight = parentBottom + halfHeight;
			var JQfirstChild = $(children[0])
			var firstChildCenter = JQfirstChild.offset().left + JQfirstChild.width()/2 - containerLeft;
			var JQlastChild = $(children[children.length - 1])
			var lastChildCenter = JQlastChild.offset().left + JQlastChild.width()/2 - containerLeft;
			
			var centerLineWidth =  lastChildCenter - firstChildCenter;
			
			drawLineDiv(container, firstChildCenter, centerHeight, thickness, centerLineWidth, 0, color);
			
			
			//line 3: center height, vertically, to child's top:
			for(var i=0; i<children.length; i++){
				var currentChild = $(children[i]);
				var childCenter =  currentChild.offset().left + currentChild.width()/2 - containerLeft;
				
				drawLineDiv(container, childCenter, centerHeight, halfHeight, thickness, 0, color);
			}
			
		}
		

		function drawLineDiv(container, left, top, height, width, angle, color){
			$(container).append($("<div style='" +
					"padding:0px; margin:0px;" + 
					"height:" + height + "px;" +
					"background-color:" + color + ";" + 
					"line-height:1px;" + 
					"position:absolute;" + 
					"left:" + left + "px;" +
					"top:" + top + "px;" +
					"width:" + width + "px;"+
					"-moz-transform:rotate(" + angle + "deg);"+
					"-webkit-transform:rotate(" + angle + "deg);"+
					"-o-transform:rotate(" + angle + "deg); "+
					"-ms-transform:rotate(" + angle + "deg);"+
					"transform:rotate(" + angle + "deg);" +
				"' />"));
		}
		
		
		
	}
	
	
	function displayOclObjectInfo(name, node){
		var oclObjInfo = getOclObjInfoFor(name);
		if (oclObjInfo != null) {
			//create tooltip:
			var objInfoTooltip = '';
			var len = oclObjInfo.length;
			for (var j = 0; j < len; j++) {
				if (j != 0) {
					objInfoTooltip += '\n';
				}
				objInfoTooltip += oclObjInfo[j][0] + ': ' + oclObjInfo[j][1];
			}
			node.title = objInfoTooltip;
		}
		
		
		function getOclObjInfoFor(objName) {
			var len = objectsInfo.length;
			for (var n = 0; n < len; n++) {
				if (objectsInfo[n].name == objName) {
					return objectsInfo[n].info;
				}
			}
			return null;
		}

	}
	
	
	function readOclObjectsInfo(){
	
		//basic check:
		if(oclObjects.objectsInfo == null){
			appendCriticalErrorMessage(reportItem , "Error: OpenCL objects data are not defined.");
			return false;
		}
		
		var ret = false;
		//get and parse the data:
		$.ajax({
			url: oclObjects.objectsInfo.source,
			type: "POST",
			dataType: "json",
			async: false,
			success: function (data) {
				objectsInfo = data;
				ret = true;
			},
			error: function(jqxhr, statusText, errorThrown){
				appendCriticalErrorMessage(reportItem , "Error: unable to retrieve \"OpenCL Objects\":<br/> \"" + errorThrown + "\".");
				objectsInfo = [];
			}
		});
		return ret;
	}
	
	
	function readOclObjectsTreeData(){
	
		//basic check:
		if(oclObjects.tree == null){
			appendCriticalErrorMessage(reportItem , "Error: OpenCL objects tree data are not defined.");
			return false;
		}
		
		//get and parse the data:
		var ret = false;
		//get and parse the data:
		$.ajax({
			url: oclObjects.tree.source,
			type: "POST",
			dataType: "json",
			async: false,
			success: function (data) {
				objectsTree = data;
				ret = true;
			},
			error: function(jqxhr, statusText, errorThrown){
				appendCriticalErrorMessage(reportItem , "Error: unable to retrieve \"OpenCL Objects Tree\":<br/> \"" + errorThrown + "\".");
				objectsTree = [];
			}
		});
		return ret;
	}
	
	
	
}