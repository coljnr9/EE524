//MultiSrcView singleton (for FPGA sharing across reports):
var SharedMultiSrcView = (function () {
    var instance;
 
    function createInstance() {
        var mutliSrcView = new MultiSrcView('fpgaSharedMultiSrcViewID');
        return mutliSrcView;
    }
 
    return {
        getInstance: function () {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        }
    };
})();



function MultiSrcView(uniqueID) {
	this.tabIndexMap = {};
	this.tabsCount = 0;
	this.uniqueID = uniqueID;
	this.parent = null;
	
	var tabsMainDiv = document.createElement('div');
	var tabsList = document.createElement('ul');
	tabsMainDiv.appendChild(tabsList);

	this.tabsMainDiv = tabsMainDiv;
	this.tabsList = tabsList;
	this.RebuildTabs();
}

MultiSrcView.prototype.addNewSource = function (name, srcCode, brush) {
	
	var tabEntry = document.createElement('li');
	var title = document.createElement('a');
	tabEntry.appendChild(title);
	var notification = document.createElement('span');
	notification.className = 'srcCodeTabTitleNotification';
	tabEntry.appendChild(notification);
	name = getFilenameFromPath(name);
	title.innerHTML = name;
	title.href= '#' + this.uniqueID + '-' + this.tabsCount;
	notification.innerHTML = '';

	
	//this.tabsList.appendChild(tabEntry);
	this.jqTabs.find(".ui-tabs-nav").append(tabEntry);
	
	
	var srcViewerWrapper = document.createElement('div');
	var srcViewer = CreateSrcViewer(srcCode, brush);
	srcViewer.id = this.uniqueID + '-' + this.tabsCount;
	srcViewerWrapper.appendChild(srcViewer);
	this.jqTabs.append(srcViewerWrapper);
    this.jqTabs.tabs( "refresh" );
	
	//add the index map:
	this.tabIndexMap[name] = {
												'tabIndex': this.tabsCount,
												'notification': notification,
												'srcViewer': srcViewerWrapper
											};
	
	this.tabsCount++;
	if(this.tabsCount == 1)
	{
		$(this.tabsMainDiv).tabs({ active: 0 });
	}
	
	SyntaxHighlighter.highlight();
}

MultiSrcView.prototype.reparentInto = function (newParent) {
	
	//remove old parent resize subscription (if exists):
	if(this.parent != null) { 
		try
		{
			$(this.parent).off("resize", onLatencyReportResize);
		}
		catch(error){}
	}
	
	//assign new parent:
	this.parent = newParent;
	newParent.appendChild(this.tabsMainDiv);
	SyntaxHighlighter.highlight();
	
	this.RebuildTabs();
	
	//resize the srcViewer on newParent resize:
	var self = this;
	$(this.parent).resize(function(){
		self.onParentResize();
	});
	
	//call the resize function:
	this.onParentResize();
	
}

MultiSrcView.prototype.RebuildTabs = function () {
	try
	{
		this.jqTabs.tabs( "destroy" );
	}
	catch(error){}
	
	var self = this;
	 this.jqTabs = $(this.tabsMainDiv).tabs({
		activate: function(event, ui){
			self.onParentResize();//needed to keep "hidden" tabs in sync.
		}
	});
	
	this.tabsList.style.background = '#ececec';
	
	for(var i=0; i<this.tabsCount; i++)
	{
		var targetID =  this.uniqueID + '-' + i;
		var target = document.getElementById(targetID);
		target.style.padding = '0px';
	}
}

MultiSrcView.prototype.onParentResize = function () {
	if(this.parent == null)
	{
		return;
	}
	
	for(var i=0; i<this.tabsCount; i++)
	{
		var targetID =  this.uniqueID + '-' + i;
		var target = $($('#' + targetID).children()[0]);
		if(target == null)
		{
			continue;
		}
		
		var topOffset = target.position().top;
		target.css({ 'height': 'calc(' + $(this.parent).height()+ 'px - ' + topOffset + 'px - 10px)' }); //( / 200)
		
	}
}

MultiSrcView.prototype.highlight = function (highlightMap) {
	
	this.unhighlightAll();
	
	var fileToFocusOn;
	var lineToFocusOn;
	
	for(var i=0; i<highlightMap.length; i++)
	{
		//does this source file exist?
		var mapKey = getFilenameFromPath(highlightMap[i].file);
		var toHighlight = this.tabIndexMap[mapKey];
		if(toHighlight == null)
		{
			continue;
		}
		
		var lineNumber = highlightMap[i].line;
		
		//focus targets:
		if(fileToFocusOn == null)
		{
			fileToFocusOn = mapKey;
		}
		
		if(lineToFocusOn == null)
		{
			lineToFocusOn = lineNumber;
		}
		
		//highlight line:
		var lineElements = $(toHighlight.srcViewer).find('.number' + lineNumber);
		lineElements.addClass('highlighted');
		
		toHighlight.notification.innerHTML = '*';
		
	}
	
	
	//focus on main file and line:
	if(fileToFocusOn != null)
	{
		this.focusOnTab(fileToFocusOn, lineToFocusOn);
	}
	
	
}

MultiSrcView.prototype.unhighlightAll = function () {
	
	var allNotifications = $(this.tabsMainDiv).find('.srcCodeTabTitleNotification');
	for(var i=0; i<allNotifications.length; i++)
	{
		allNotifications[i].innerHTML = '';
	}

	$(this.tabsMainDiv).find('.highlighted').removeClass('highlighted');
	
}

MultiSrcView.prototype.focusOnTab = function (file, lineNumber) {
	
	var tabEntry = this.tabIndexMap[getFilenameFromPath(file)];
	if(tabEntry == null)
	{
		return;
	}
	
	$(this.tabsMainDiv).tabs({ active: tabEntry.tabIndex });
	
	if(lineNumber == null)
	{
		return;
	}
	
	//calc new scrolling target:
	viewerJquery = $(tabEntry.srcViewer);
	var syntaxHighlighter = $(viewerJquery.find('.syntaxhighlighter')[0]);
	var viewerOffset = syntaxHighlighter.scrollTop();
	var targetFirstLine = tabEntry.srcViewer.getElementsByClassName('line number' + lineNumber)[0];
	var relativeTopOffsetOfTraget = $(targetFirstLine).offset().top;
	var targetOffset = relativeTopOffsetOfTraget;//15.9 * (scrollTarget - 1);
	var viewerHeight = viewerJquery.height();
	var scrollingOffset = targetOffset + viewerOffset - (viewerHeight / 2)
	var speed = 800;
	
	syntaxHighlighter.animate({ scrollTop: scrollingOffset }, speed);
	
}





var FPGACommonTools = (function () { return {
	
        onHighlightRequest: function (lineMappingArray, multiSrcView, splitView) {
			//if there is a splitVire and the rightView is hidden, display it:
			try
			{
				if(splitView != null && splitView.IsRightViewShown() == false)
				{
					splitView.showRightSide();
				}
			}
			catch(error) {}
			
			//highlight:
			//var elementData = $(elementClicked).data();
			//var lineMappingArray = elementData.linemapping;
			multiSrcView.highlight(lineMappingArray);
		},
		
		onHighlightableLineRender: function (entryName, details, lineMapping) {
			//var rowData = $(row).data();
			var span = document.createElement('span');
			span.innerHTML = entryName;//data.replace(rowData.name + ', ', '');
			span.style.marginLeft = '10px';
			
			//check if it has details field:
			if(details != null && details.length > 0)
			{
				span.title = details[0];
				span.className = 'tipsyEnabled';
			}
			
			//line mapping?
			var lineMappingSpan = null;
			if(lineMapping != null && lineMapping.length > 0 && lineMapping[0].file != '')
			{
				lineMappingSpan = document.createElement('span');
				var mappingFileName = getFilenameFromPath(lineMapping[0].file);
				lineMappingSpan.innerHTML = '(' + mappingFileName + ': ' + lineMapping[0].line + ')';
				lineMappingSpan.className = 'linkableTextIntelBlue lineMapped';
				lineMappingSpan.setAttribute('data-lineMapping', JSON.stringify(lineMapping));
				
				//to remove mapping in name (exists in Area reports):
				var mappingText = mappingFileName + ':' + lineMapping[0].line;
				if(entryName != mappingText && entryName.indexOf(mappingText) !== -1)
				{
					var result = entryName.replace('(' +mappingText + ')', '')
												   .replace(mappingText, '').trim();
					
					if(result[0] == '(' && result[result.length - 1] == ')')
					{
						result = result.slice(1, -1);
					}
					span.innerHTML = result;														   
				}
			}
			
			var ret = span.outerHTML;
			if(lineMappingSpan != null){
				ret += ' ' +lineMappingSpan.outerHTML;
			}
			
			return ret;
		},
		
		onLinkableLineRender: function (entryName, details, lineMapping) {
			//var rowData = $(row).data();
			var span = document.createElement('span');
			span.innerHTML = entryName;//data.replace(rowData.name + ', ', '');
			span.style.marginLeft = '10px';
			span.className = 'linkableTextIntelBlue linkableLineWithChildren';
			
			//check if it has details field:
			if(details != null && details.length > 0)
			{
				span.title = details[0];
				span.className = span.className + ' tipsyEnabled';
			}
			
			//line mapping?
			var lineMappingSpan = null;
			if(lineMapping != null && lineMapping.length > 0 && lineMapping[0].file != '')
			{
				lineMappingSpan = document.createElement('span');
				var mappingFileName = getFilenameFromPath(lineMapping[0].file);
				lineMappingSpan.innerHTML = '(' + mappingFileName + ': ' + lineMapping[0].line + ')';
				lineMappingSpan.className = 'lineMapped';
				lineMappingSpan.style.color = 'gray';
				lineMappingSpan.style.cursor = 'pointer';
				lineMappingSpan.setAttribute('data-lineMapping', JSON.stringify(lineMapping));
				
				//to remove mapping in name (exists in Area reports):
				var mappingText = mappingFileName + ':' + lineMapping[0].line;
				if(entryName != mappingText && entryName.indexOf(mappingText) !== -1)
				{
					var result = entryName.replace('(' +mappingText + ')', '')
												   .replace(mappingText, '').trim();
					
					if(result[0] == '(' && result[result.length - 1] == ')')
					{
						result = result.slice(1, -1);
					}
					span.innerHTML = result;														   
				}
			}
			
			var ret = span.outerHTML;
			if(lineMappingSpan != null){
				ret += ' ' + lineMappingSpan.outerHTML;
			}
			
			return ret;
		},
		
		applyTipsyOnElement: function (element) {
			if(element != null && element.title.length > 0)
			{
				$(element).tipsy({ gravity: $.fn.tipsy.autoBounds(150, 's'), opacity: 1, html: true });
			}
		}

		
}; })();