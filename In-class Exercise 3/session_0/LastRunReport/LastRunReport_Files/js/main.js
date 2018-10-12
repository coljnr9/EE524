/*****************************************/
/* Globals */
/*****************************************/
var support, animEndEventName;
var tipsButton;
var tipsList;
var mainReportsContainerLock = false;
var browserInfo = {};

//tips & notifications stuff:
var ActiveTipInfo = {};
var activeTipHighlightedRows = [];
var activeTipNotificationInstance;
var activeTipFilteredDatatableInstance;

var pagesTitles = {
	sessionInfo: 'Session Info',
	generalInfo: 'General Info',
	hostProfiling: 'Host Profiling',
	apiCalls: 'Api Calls',
	memoryCommands: 'Memory Commands',
	oclObjects: 'OpenCL Objects',
	kernelsOverview: 'Kernels Overview',
	kernelsAnalysis: 'Kernel Analysis',
	executionAnalysis: 'Execution Analysis',
	variablesView: 'Variables View',
	FPGASummary: 'Summary Reports',
	FPGAKernelsSummary: 'Kernels Summary',
	FPGAResources: 'Estimated Resources Usage',
	FPGAAnalysis: 'FPGA Analysis',
	FPGALoops: 'FPGA Loops',
	FPGAArea: 'Area (System / Source) ',
	FPGADiagramViews: 'Diagram Views',
	FPGASystemViewer: 'System Viewer',
	FPGAKernelMemory: 'Kernel Memory Viewer',
	FPGAComplierWarnings: 'Compiler Warnings',
	clSourceCode: 'OpenCL Sources'
}
//kernels may be added dynamically
//(assuming kernel name can't container spaces, dots or special characters).
//var kernelsPagesTitles = {};
var homePageTitle = 'Home Page';
var currentlyDisplayed;
var mode = 'normal';// accepted values: "normal", "localHost" .



/*****************************************/
/* Main Template initialization */
/*****************************************/
$(document).ready(function () {

	appendLoadingMessage(document.body);
	
	identifyBrowser();
	
	//prevent caching on Ajax request:
	$.ajaxSetup({ cache: false });
	
	//append session id to the beginning of each ajax call:
	$.ajaxPrefilter(function( options, originalOptions, jqXHR ) {
		if(sessionID != ''){
			options.url = sessionID + '?' + options.url;
		}
		if(browserInfo.isSafari == true) { //JavaFX
			options.data = {},
			jqXHR.setRequestHeader("Content-Length", "0");
		}
	});

	//disable animations of JavaFX:
	if(browserInfo.isSafari == true){
		$.fx.off = true;
		//$(document.body).addClass('notransition');
	}
	
	//prevent text highlighting (except for inputs):
    document.onselectstart = function (e) {
        var target = (typeof e != "undefined") ? e.target : event.srcElement;
        if (target.tagName.toLowerCase() == "textarea" || target.tagName.toLowerCase() == "input") {
            return true;
        }
        return false;
    }

    //prevent right click (except for text areas.
    document.oncontextmenu = function (e) {
        var target = (typeof e != "undefined") ? e.target : event.srcElement;
        if (target.tagName.toLowerCase() == "textarea" || target.tagName.toLowerCase() == "input") {
            return true;
        }
		if($(target).hasClass('variableLauncherSpan')){
			//create context menu for variables:
			createKDFVariablesContextMenuFor(target, e);
			return false;
		}
        return false; //prevent browser's context menu.
    }
	
	$( window ).unload(function() {
		terminateServer();
	});
	
	//update mode:
	updateMode();
	if(mode != 'localHost') {
		sessionID = '';
	}

	//make sure the browser is supported:
    if (window.attachEvent != null && window.addEventListener == null) {
        removeLoadingMessage(document.body);
		displayBrowserNotSupportedWarning();
		return;
    }
	
	//check if ajax is supported and continue accordingly:
	if(checkLocalFilesAccessability() == false){
		removeLoadingMessage(document.body);
		displayBrowserNotSupportingLocalFilesAccessWarning();
		return;
	}

	//get animation support and events names:
	support = { animations: Modernizr.cssanimations };
    var animEndEventNames = {
        'WebkitAnimation': 'webkitAnimationEnd',
        'OAnimation': 'oAnimationEnd',
        'msAnimation': 'MSAnimationEnd',
        'animation': 'animationend'
    };
    animEndEventName = animEndEventNames[Modernizr.prefixed('animation')];
	
	
    //prevent overflow scrolling while dragging (not the perfect solution but will do for now...):
    $('#mainContainer').on('scroll', function () {
        $(document).scrollLeft(0);
        $(document).scrollTop(0);
    });
	
	identifyBrowser();
	
	//-------- ON THE FLY MODES -----------//
	//variables viewer mode:
	var variablesViewer = getUrlParameter('variablesViewer');
	if(variablesViewer != null && variablesViewer != ''){
		setPageMinDim('650px', '180px');
		LoadVariablesViewer(document.body, variablesViewer);
		removeLoadingMessage(document.body);
		return;
	}
	
	//genAsm viewer mode:
	var genAsmViewer = getUrlParameter('disasmViewer');
	if(genAsmViewer != null && genAsmViewer != ''){
		loadGenAsmViewReport(document.body, genAsmViewer, true);
		removeLoadingMessage(document.body);
		return;
	}
	
	//----------- EXISTING REPORTS MODES ------------//
	
	//load the mainMenu data:
	var mainMenuData = loadMainMenuData();
	if(mainMenuData == null){
		removeLoadingMessage(document.body);
		appendCriticalErrorMessage(document.body, "Error: can not find main menu data");
		return;
	}
	
	//OpenCL deep kernel analysis mode:
	if(mainMenuData.reportMode == 'kernel'){
		initializeMainTemplate(false, false, 'kernelReport', 'kernelReportMode');
		var mainReportsContainer = document.getElementById('mainReportsContainer');
		loadKernelReport(switchToReport(mainReportsContainer), mainMenuData.kernelData);
	}
	
	//OpenCL run report mode:
	else if(mainMenuData.reportMode == 'kdfRun'){
		initializeMainTemplate(false, false, 'hostReport', 'kernelReportMode');
		setPageMinDim('650px', '180px');
		var mainReportsContainer = document.getElementById('mainReportsContainer');
		loadKDFRunReport(switchToReport(mainReportsContainer), mainMenuData.run);
	}
	
	//OpenCL host analysis report mode:
	else if(mainMenuData.reportMode == 'host'){
		initializeMainTemplate(true, true, 'hostReport', '');
		buildReportMainMenu_HostMode(mainMenuData);
	}
	
	//OpenCL what-if analysis report mode:
	else if(mainMenuData.reportMode == 'kdf'){
		initializeMainTemplate(false, true, 'hostReport', '');
		buildReportMainMenu_KDFMode(mainMenuData);
	}
	
	//A report with no data (error / warning message report):
	else if(mainMenuData.reportMode == 'empty'){
		LoadEmptyReportPage(mainMenuData.emptyReport);
	}
	
	//Altera's FPGA static reports:
	else if(mainMenuData.reportMode == 'alteraStaticReports'){
		initializeMainTemplate(true, true, 'hostReport', '');
		buildReportMainMenu_AlteraStaticReportsMode(mainMenuData);
		fillSideBarMenuWithFPGAdocs();
	}
	
	else {
		appendCriticalErrorMessage(document.body, 'Error: report mode "' + mainMenuData.reportMode + '" is undefined.');
	}
	
    removeLoadingMessage(document.body);
	
});

function terminateServer(){
	$.ajax({
		url: "Generic?terminate",
		type: "POST",
		async: false,
		dataType: "json",
		success: function () {},
		error: function () {}
	});
}

function LoadEmptyReportPage(data){
	var messagesHTML = '';
	for(var i=0; i<data.messages.length; i++){
		messagesHTML += '<tr><td class="messageTableCell1"></td><td style="font-size: 11px;">- ' + data.messages[i] + '</td></tr>';
	}

	document.body.innerHTML += '<div id="emptyReportContainer" class="ui-widget">' +
			'<div class="ui-state-highlight ui-corner-all" style="padding: 0 .7em;">' +
				'<div id="emptyReportMessageContainer">' +
					'<span class="ui-icon ui-icon-alert" style="float: left; margin-right: .3em; font-size: 11px;"></span>' +
					'<strong>Alert:</strong> ' + data.title +
					'<br/>' +
					'<table style="margin-top: 5px;">' +
						messagesHTML +
					'</table>' +
				'</div>' +
			'</div>' +
		'</div>';	
}

function setPageMinDim(minWidth, minHeight){
	//body element:
	document.body.style.minWidth = minWidth;
	document.body.style.minHeight = minHeight;
	
	//html element:
	htmlTags = document.getElementsByTagName("html")
	for(var i=0; i < htmlTags.length; i++) {
		htmlTags[i].style.minWidth = minWidth;
		htmlTags[i].style.minHeight = minHeight;
	}
}

function identifyBrowser(){
	//find browser version:
     browserInfo.isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0; // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
     browserInfo.isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
     browserInfo.isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0; // At least Safari 3+: "[object HTMLElementConstructor]"
     browserInfo.isChrome = !!window.chrome && !browserInfo.isOpera; // Chrome 1+
     browserInfo.isIE = /*@cc_on!@*/false || !!document.documentMode; // At least IE6
}

function checkLocalFilesAccessability() {
	var supported = false;
    $.ajax({
        url: filesBaseDir + "/data/testLocalFilesAccess.ajax",
        type: "POST",
		async: false,
        dataType: "json",
        success: function () {
			supported = true;
        },
        error: function () {
            supported = false;
        }
    });
	return supported;
}

function getUrlParameter(paramName){
	try
	{
		var sPageURL;
		if(initialParams != "TAG_SESSION_PARAM"){
			sPageURL = initialParams;
		}
		else{
			sPageURL = window.location.search;
		}
		
		var sURLVariables = sPageURL.substring(1).split('&');
		for (var i = 0; i < sURLVariables.length; i++) 
		{
			var parts = sURLVariables[i].split('=');
			var tail = parts.slice(1).join('=');
			var result = parts.slice(0,1);
			result.push(tail);
			if (parts[0] == paramName) 
			{
				return parts[1];
			}
		}
	}
	catch(ex){
		alert('exception parsing input: ' + ex);
		return null;
	}
}

function updateMode(){
	$.ajax({
		url: 'modecheck',
		type: "POST",
		dataType: "text",
		async: false,
		success: function (newMode) {
			mode = newMode;
		},
		error: function(jqxhr, statusText, errorThrown){
			mode = 'normal';
		}
	});
}

function displayBrowserNotSupportedWarning(){
	// create a warning box:
    var warningWrapper = document.createElement('div');
    warningWrapper.className = 'warningWrapper';
    $(warningWrapper).appendTo("body");

    var warningContainer = document.createElement('div');
    warningContainer.className = 'warningContainer';
    $(warningWrapper).append(warningContainer);

    var title = document.createElement('h2');
    title.innerHTML = 'WARNING!';
    $(warningContainer).append(title);

    var message = document.createElement('div');
    message.style.textAlign = 'left';
    message.style.marginLeft = '20px';
    message.style.marginRight = '20px';
	
		
	var span1 = document.createElement('span');
    span1.innerHTML = "Your browser is out-dated and not supported.<br/>" +
							  "Please updata your browser and try again.<br/><br/>";
								  
	message.appendChild(span1);
	$(warningContainer).append(message);
	$(warningWrapper).hide().fadeIn(1000);
}

function displayBrowserNotSupportingLocalFilesAccessWarning(){
	// create a warning box:
    var warningWrapper = document.createElement('div');
    warningWrapper.className = 'warningWrapper';
    $(warningWrapper).appendTo("body");

    var warningContainer = document.createElement('div');
    warningContainer.className = 'warningContainer';
    $(warningWrapper).append(warningContainer);

    var title = document.createElement('h2');
    title.innerHTML = 'WARNING!';
    $(warningContainer).append(title);

    var message = document.createElement('div');
    message.style.textAlign = 'left';
    message.style.marginLeft = '10px';
    message.style.marginRight = '10px';
	
	
	var mainHTML = window.location.pathname;
	//to fix the "%20" added by the browser:
	mainHTML = mainHTML.replace(/%20/gi, " ");
	
	if(mainHTML.startsWith('file:///')){
		mainHTML = mainHTML.replace("file:///", "");
	}
	
	if (window.navigator.userAgent.indexOf("Linux")==-1){//for windows
		while(mainHTML.startsWith('/')){
			mainHTML = mainHTML.substring(1);
		}
	}
	
	var span1 = document.createElement('span');
    span1.innerHTML = "Your browser seems to be blocking access to the report's local data-files. " +
							      "to view the report correcly, you may:<br/><br/>" +
								  "1) Run the following command: <br/>";
								  
	message.appendChild(span1);
	
	var section = document.createElement('div');
	section.className = 'hostProfilingOverviewSection sectionInfoValue';
	section.style.padding = '20px 20px';
	section.style.fontSize = '12px';
	section.title = 'click to copy to clipboard';
	section.className += ' copiable';
	section.style.minHeight = '0px';
	section.style.height = '';
	section.innerHTML = "CBReport -r \"" +mainHTML +"\"";
	section.onclick = function (){ copyToClipboard(section.innerHTML); };
	message.appendChild(section);
	
	var span2 = document.createElement('div');
	span2.style.paddingTop = '20px';
	span2.innerHTML += "2) Use a browser that allows local files access.<br/><br/><br/>";
	message.appendChild(span2);			  
	
    $(warningContainer).append(message);
	
	$(warningWrapper).hide().fadeIn(1000);
	
}

function initializeMainTemplate(allowHomeButton, createMainMenuWizard, sidebarButtonClass, mainReportsContainerClass){
	
	if(sidebarButtonClass == null) {
		sidebarButtonClass = '';
	}
	if(mainReportsContainerClass == null) {
		mainReportsContainerClass = '';
	}
	
	//build main template structure:
	var mainContainer = document.createElement('div');
	mainContainer.id = 'mainContainer';
	mainContainer.className = 'mainContainer';
	document.body.appendChild(mainContainer);
	
	var sideBarPusher = document.createElement('div');
	sideBarPusher.id = 'sideBarPusher';
	sideBarPusher.className = 'sideBarPusher';
	mainContainer.appendChild(sideBarPusher);
	
	//sidebar menu:
	var pusherNav = document.createElement('nav');
	pusherNav.className = 'sidebarHelpmenu sidebarPushAnimation';
	pusherNav.innerHTML = '<h2>Help Manual<img class="helpmenu-logo" src="' + filesBaseDir + '/resources/intel_logo.png" alt="Intel logo"/></h2><ul id="helpMenuList"></ul>';
	sideBarPusher.appendChild(pusherNav);
	
	//menu button:
	sideBarPusher.innerHTML += '<img id="menuButton" class="' + sidebarButtonClass + '" title="menu" src="' + filesBaseDir + '/resources/menu.png" />';
	
	//home button:
	if(allowHomeButton == true){
		sideBarPusher.innerHTML += '<img id="homeButton" title="home page"  src="' + filesBaseDir + '/resources/home.png" />';
	}
	
	//mainMenu wizard container:
	if(createMainMenuWizard == true){
		sideBarPusher.innerHTML += '<ul id="mainMenu" class="mainMenu dotstyle-fillin">' +
											'<div class="dotNavBarWrapper">' +
												'<div class="dotNavBar"></div>' +
											'</div>' +
										'</ul>';
		
		if(browserInfo.isSafari == true){
			$(sideBarPusher).find('.dotNavBar')[0].style.top = '20px';
		}
	}
	
	//main report container:
	sideBarPusher.innerHTML += '<div id="mainReportsContainer" class="' + mainReportsContainerClass + '"></div>';
	
	//sidebar menu:
	initiateSidebarMenu();
	fillSidebarMenu();
	
	//tips:
	tipsButton = document.createElement('button');
	tipsButton.className = 'tipsButton cbutton cbutton--effect-jagoda';
	tipsButton.title = 'tips';
	sideBarPusher.appendChild(tipsButton);
	
	//toggle tips on button click:
	tipsButton.onclick = function(){
		$(tipsButton).removeClass('cbutton--click');
		toggleTips();
	}
	
	//close the tips menu if the target isn't the menu element or one of its descendants..
    sideBarPusher.addEventListener( 'click', function(ev) {
        var target = ev.target;
        if( tipsWindowOpen && target !== tipsButton ) {
            toggleTips();
        }
    });
	$(tipsButton).hide();
	
	//create tips list wrappers:
	var tailShadow = document.createElement('div');
	tailShadow.id = 'tailShadow';
	sideBarPusher.appendChild(tailShadow);
	
	var tail1 = document.createElement('div');
	tail1.id = 'tail1';
	sideBarPusher.appendChild(tail1);
	
	var tipsContainer = document.createElement('div');
	tipsContainer.id = 'tipsContainer';
	sideBarPusher.appendChild(tipsContainer);
	
	tipsList = document.createElement('ul');
	tipsList.id = 'tipsList';
	tipsContainer.appendChild(tipsList);
			
	hideTips();
}

function fillSidebarMenu() {}

function loadMainMenuData(){
	var mainMenuData;
	$.ajax({
        url: filesBaseDir + "/data/mainMenu.ajax",
        type: "POST",
        dataType: "json",
		async: false,
        success: function (data) {
			mainMenuData = data;
        },
        error: function () {
            //todo:
			mainMenuData = null;
        }
    });
	
	return mainMenuData;
}

function mainMenuOpenPage(title){
	
	//home page special handling:
	if(title == homePageTitle){
		var homeButton = document.getElementById('homeButton');
		if(homeButton != null){
		$(homeButton).click();
		}
		//todo: remove focus-class from current main menu element?
		return;
	}

	//main menu pages:
	var mainMenu = document.getElementById('mainMenu');
	var landingPage = $('#mainMenu').find('a:contains('+ title +')');
	if(landingPage.length > 0){
		landingPage[0].click();
	}
}

function buildReportMainMenu_HostMode(data){
	var mainMenu = document.getElementById('mainMenu');
	var mainReportsContainer = document.getElementById('mainReportsContainer');
	
	//home page:
	if(data.homePage){
		document.getElementById('homeButton').onclick = function(){
			if(mainReportsContainerLock == true){
				return;
			}
			if(currentlyDisplayed == homePageTitle){
				return;
			}
			currentlyDisplayed = homePageTitle;
			
			updateMainMenuSelection(null);
			appendLoadingMessage(document.body);
			setTimeout(function(){
				loadHomePage(switchToReport(mainReportsContainer), data.homePage);
				//animateCurrentReportEntrace();
				removeLoadingMessage(document.body);
			}, 1);
		};
	}
	else{
		$('#homeButton').remove();
	}
	
	//Application Info page:
	if(data.sessionInfo){
		var sessionInfo = data.sessionInfo;
		addNewMenuItem(pagesTitles.sessionInfo, function(){
			loadSessionInfoReport(switchToReport(mainReportsContainer), sessionInfo);
		});
	}
	
	//host analysis:
	if(data.hostProfiling){
		var hostProfiling = data.hostProfiling;
		var hostProfilingItem = addNewMenuItem(pagesTitles.hostProfiling);
		
		//sub menu items:
		if(hostProfiling.apiCalls){
			addSubMenuItem(hostProfilingItem, pagesTitles.apiCalls, function(){
				loadApiCallsReport(switchToReport(mainReportsContainer), hostProfiling.apiCalls);
			});
		}
		
		if(hostProfiling.memoryCommands){
			addSubMenuItem(hostProfilingItem, pagesTitles.memoryCommands, function(){
				loadMemoryCommandsReport(switchToReport(mainReportsContainer), hostProfiling.memoryCommands);
			});
		}
		
		if(hostProfiling.oclObjects){
			addSubMenuItem(hostProfilingItem, pagesTitles.oclObjects, function(){
				loadOCLObjectsReport(switchToReport(mainReportsContainer), hostProfiling.oclObjects);
			});
		}
		
	}

	//Kernels Overview page:
	if(data.kernelsOverview){
		var kernelsOverview = data.kernelsOverview;
		addNewMenuItem(pagesTitles.kernelsOverview, function(){
			loadKernelsOverviewReport(switchToReport(mainReportsContainer), kernelsOverview);
		});
	}
		
	//Kernel Analysis page:
	if(data.kernelsAnalysis && data.kernelsAnalysis.length != 0){
		var kernelsAnalysis = data.kernelsAnalysis;
		var kernelsAnalysisItem = addNewMenuItem(pagesTitles.kernelsAnalysis, null);
		
		//sub menu items:
		var kernelsCount = kernelsAnalysis.length;
		for (var i=0; i<kernelsCount; i++) (function(i){
			var kernelData = kernelsAnalysis[i];
			addSubMenuItem(kernelsAnalysisItem, kernelData.kernelUniqueName, function(){
				loadKernelReport(switchToReport(mainReportsContainer), kernelData);
			});
		})(i);
	}
	
	
	//set landing page to be the home page:
	mainMenuOpenPage(homePageTitle);
	
	//build the menu object:
	new cbpTooltipMenu(mainMenu);
	
}

function buildReportMainMenu_KDFMode(data){
	var mainMenu = document.getElementById('mainMenu');
	var mainReportsContainer = document.getElementById('mainReportsContainer');
	
	//session Info page:
	if(data.sessionInfo){
		var sessionInfo = data.sessionInfo;
		addNewMenuItem(pagesTitles.sessionInfo, function(){
			loadSessionInfoReport(switchToReport(mainReportsContainer), sessionInfo);
		});
	}
	
	//KDF execution menu:
	if(data.execution!= null && data.execution.execution){
		addNewMenuItem(pagesTitles.executionAnalysis, function(){
			loadExectionViewReport(switchToReport(mainReportsContainer),data.execution.execution);
		});
	}
		
	//Kernel Analysis page:
	if(data.kernelsAnalysis && data.kernelsAnalysis.length != 0){
		var kernelsAnalysis = data.kernelsAnalysis;
		var kernelsAnalysisItem = addNewMenuItem(pagesTitles.kernelsAnalysis, null);
		
		//sub menu items:
		var kernelsCount = kernelsAnalysis.length;
		for (var i=0; i<kernelsCount; i++) (function(i){
			var kernelData = kernelsAnalysis[i];
			addSubMenuItem(kernelsAnalysisItem, kernelData.kernelUniqueName, function(){
				loadKernelReport(switchToReport(mainReportsContainer), kernelData);
			});
		})(i);
	}
	
	
	//set landing page:
	mainMenuOpenPage(pagesTitles.executionAnalysis);
	
	//build the menu object:
	new cbpTooltipMenu(mainMenu);
	
}

function buildReportMainMenu_AlteraStaticReportsMode(data){
	var mainMenu = document.getElementById('mainMenu');
	var mainReportsContainer = document.getElementById('mainReportsContainer');
	var kernelsPaths = data.kernels;
	
	//home page:
	if(data.homePage){
		document.getElementById('homeButton').onclick = function(){
			if(mainReportsContainerLock == true){
				return;
			}
			if(currentlyDisplayed == homePageTitle){
				return;
			}
			currentlyDisplayed = homePageTitle;
			
			updateMainMenuSelection(null);
			appendLoadingMessage(document.body);
			setTimeout(function(){
				loadFPGAHomePage(switchToReport(mainReportsContainer), data);
				//animateCurrentReportEntrace();
				removeLoadingMessage(document.body);
			}, 1);
		};
	}
	else{
		$('#homeButton').remove();
	}
	
	//session info page:
	if(data.sessionInfo){
		var sessionInfo = data.sessionInfo;
		var FPGASessionInfoItem = addNewMenuItem(pagesTitles.sessionInfo, null);
		
		addSubMenuItem(FPGASessionInfoItem, pagesTitles.generalInfo, function(){
			loadFPGAGeneralInfoReport(switchToReport(mainReportsContainer), sessionInfo);
		});
		
		addSubMenuItem(FPGASessionInfoItem, pagesTitles.clSourceCode, function(){
			loadFPGAOpenCLSourcesReport(switchToReport(mainReportsContainer));
		});
	}
	
	//FPGA Summary menu:
	if(data.summary){
		var summary = data.summary;
		var FPGASummaryItem = addNewMenuItem(pagesTitles.FPGASummary, null);
		
		//kernels summary sub menu items:
		addSubMenuItem(FPGASummaryItem, pagesTitles.FPGAKernelsSummary, function(){
			loadFPGAKernelsSummaryReport(switchToReport(mainReportsContainer), summary);
		});
		
		//estimated resource usage sub menu items:
		addSubMenuItem(FPGASummaryItem, pagesTitles.FPGAResources, function(){
			loadFPGAResourcesUsageReport(switchToReport(mainReportsContainer), summary);
		});
		
		//estimated resource usage sub menu items:
		addSubMenuItem(FPGASummaryItem, pagesTitles.FPGAComplierWarnings, function(){
			loadFPGACompilerWarningsReport(switchToReport(mainReportsContainer), data.warnings);
		});
		
	}
	
	//FPGA Analysis menu:
	if(data.FPGAAnalysis){
		var FPGAAnalysis = data.FPGAAnalysis;
		var FPGAAnalysisItem = addNewMenuItem(pagesTitles.FPGAAnalysis, null);
		
		
		//Loops analysis sub menu items:
		if(data.FPGAAnalysis.loops){
			addSubMenuItem(FPGAAnalysisItem, pagesTitles.FPGALoops, function(){
				loadFPGALoopsReport(switchToReport(mainReportsContainer), data.FPGAAnalysis.loops);
			});
		}
		
		//Area of system sub menu items:
		if(data.FPGAAnalysis.area){
			addSubMenuItem(FPGAAnalysisItem, pagesTitles.FPGAArea, function(){
				loadFPGAAreaReport(switchToReport(mainReportsContainer), data.FPGAAnalysis.area);
			});
		}
		
		
		//system viewer sub menu items:
		if(data.FPGAAnalysis.systemViewer){
			addSubMenuItem(FPGAAnalysisItem, pagesTitles.FPGASystemViewer, function(){
				loadFPGASystemViewerReport(switchToReport(mainReportsContainer), data.FPGAAnalysis.systemViewer);
			});
		}
		
		//Kernel memory viewer sub menu items:
		if(data.FPGAAnalysis.kernelMemory){
			addSubMenuItem(FPGAAnalysisItem, pagesTitles.FPGAKernelMemory, function(){
				loadFPGAKernelMemoryReport(switchToReport(mainReportsContainer), data.FPGAAnalysis.kernelMemory);
			});
		}

	}
		
	
	//load CL source codes into a MutliSrcView instance:
	var multiSrcView = SharedMultiSrcView.getInstance();
	
	if(kernelsPaths != null && kernelsPaths.length != 0){
		for(var i=0; i<kernelsPaths.length; i++){
			var clPath = kernelsPaths[i];
			var clSource;
			$.ajax({
				url: clPath,
				type: "POST",
				dataType: "text",
				async: false,
				success: function (data) {
					clSource = data;
				},
				error: function(jqxhr, statusText, errorThrown){
					clSource = 'source not avaialble: ' + errorThrown;
				}
			});
			
			//var srcViewer = CreateSrcViewer(clSource, 'cpp');
			multiSrcView.addNewSource(getFilenameFromPath(clPath), clSource, 'cpp');
			
		}
	}
	
	
	
	
	//set landing page to be the home page:
	mainMenuOpenPage(homePageTitle);
	
	//build the menu object:
	new cbpTooltipMenu(mainMenu);
	
}

function fillSideBarMenuWithFPGAdocs() {
	
	/*addSideBarMenuItem('FPGA Design Tutorial', function() {
		var onClose = function(){ $(overlay).empty(); }
		var overlay = openOverlayLayout('100%', '100%', true, onClose, document.body, true, false);
		openExternalPage(overlay, 'https://www.altera.com/content/dam/altera-www/global/en_US/pdfs/literature/tt/tt_my_first_fpga.pdf');
	});*/
	
}





/*****************************************/
/* Reports toolbox & commons */
/*****************************************/
function appendLoadingMessage(parent) {
    var loadingDiv = document.createElement('div');
    loadingDiv.className = 'loadingMessageBox';
    loadingDiv.innerHTML = 'loading...';

    parent.appendChild(loadingDiv);
}

function removeLoadingMessage(parent) {
    var loadingBoxes = $(parent).children('.loadingMessageBox');
    if (loadingBoxes.length != 0) {
        $(loadingBoxes[0]).remove();
    }
}

function appendCriticalErrorMessage(parent , criticalErrorMessage) {
    var messageDiv = document.createElement('div');
    messageDiv.className = 'criticalErrorMessageBox';

    if (criticalErrorMessage != null && criticalErrorMessage != "") {
        messageDiv.innerHTML = criticalErrorMessage;
    }
    else {
        messageDiv.innerHTML = "Error: unable to retrieve report's data.";
    }
    parent.appendChild(messageDiv);
}

function CreateSeperator(width, minWidth, marginBottom) {
    var seperator = document.createElement('hr');
    seperator.className = 'reportSectionsSeperator';
    if (width) {
        seperator.style.width = width;
    }
    if (minWidth) {
        seperator.style.minWidth = minWidth;
    }
    if (marginBottom) {
        seperator.style.marginBottom = marginBottom;
    }
    return seperator;
}

function copyToClipboard(text) {
	window.prompt("Copy to clipboard: Ctrl+C, Enter", text);
}

function CreateSrcViewer(src, brush) {
	
	if(brush == null) 
	{
		brush = 'cpp';
	}

	var srcCodeContainer = document.createElement('pre');
	srcCodeContainer.className = 'brush: ' + brush + '; class-name: "highlighterLine";';
	var invisibleChar = ' ';
	srcCodeContainer.innerHTML = invisibleChar + src + invisibleChar;
	return srcCodeContainer;
}

function getFilenameFromPath(path) {
	if(path == null) 
	{
		return; 
	}
	var splitPath = path.split('/')
	return splitPath[splitPath.length - 1];
}

function openExternalPage(parent, pageLink) {
	var extrernalPageWrapper = document.createElement('div');
	extrernalPageWrapper.style.position = 'relative';
	extrernalPageWrapper.style.width = '100%';
	extrernalPageWrapper.style.height = '100%';
	extrernalPageWrapper.innerHTML = '<iframe style="width: 100%; height: 100%;" type="text/html" src="'+pageLink+'"></iframe>';
	parent.appendChild(extrernalPageWrapper);
}

function hasParentClass(e, className) {
    if(e === document) return false;
    if( $(e).hasClass(className) ) {
        return true;
    }
    return e.parentNode && hasParentClass( e.parentNode, className );
}

//private functions for building and using mainMenu:	
function addNewMenuItem(name, onclickFunc){
	//menu item:
	var menuItem = document.createElement('li');
	menuItem.className = 'mainMenuItem';
	var itemText = document.createElement('a');
	itemText.className = 'mainMenuText';
	itemText.innerHTML = name;
	
	//add hidden subMenu icon:
	var icon = document.createElement('img');
	icon.className = 'subMenuIcon';
	icon.src = filesBaseDir + '/resources/menu.png';
	icon.style.visibility = 'hidden';
	
	$(itemText).prepend(icon);
	
	
	if(onclickFunc){
		itemText.onclick = function(){
			if(mainReportsContainerLock == true){
				return;
			}
			
			if(currentlyDisplayed == name){
				return;
			}
			currentlyDisplayed = name;
			
			updateMainMenuSelection(menuItem);
			appendLoadingMessage(document.body);
			setTimeout(function(){
				onclickFunc();
				animateCurrentReportEntrace();
				removeLoadingMessage(document.body);
			}, 1);
		};
	}
	else{
		itemText.style.cursor = 'default';
	}
	
	//dot navigation:
	var dotNav = document.createElement('li');
	dotNav.className = 'mainMenuDotNav';
	dotNav.appendChild(document.createElement('a'));
	
	mainMenu.appendChild(menuItem);
	itemText.appendChild(dotNav);
	menuItem.appendChild(itemText);
	
	return menuItem;
}

function addSubMenuItem(mainMenuItem, name, onclickFunc){
	//get subMenu element:
	var subMenu = getSubMenu(mainMenuItem);

	//create a new Item subMenuItem and append it:
	var subMenuItem = document.createElement('li');
	var itemText = document.createElement('a');
	itemText.innerHTML = name;
	
	if(onclickFunc){
		itemText.onclick = function(){
			if(mainReportsContainerLock == true){
				return;
			}
			
			if(currentlyDisplayed == name){
				return;
			}
			currentlyDisplayed = name;
			
			updateMainMenuSelection(mainMenuItem);
			appendLoadingMessage(document.body);
			setTimeout(function(){
				//hide submenu:
				$(mainMenuItem).removeClass('cbp-tm-show');
				$(mainMenuItem).removeClass('cbp-tm-show-below');
				$(mainMenuItem).removeClass('cbp-tm-show-above');
				
				//build report:
				onclickFunc();
				animateCurrentReportEntrace();
				removeLoadingMessage(document.body);
			}, 1);
		};
	}
	
	subMenu.appendChild(subMenuItem);
	subMenuItem.appendChild(itemText);
	
	return subMenuItem;
}

function getSubMenu(mainMenuItem){
	var subMenusList = mainMenuItem.getElementsByClassName('mainMenuSubMenu');
	if(subMenusList.length > 0){
		return subMenusList[0];
	}
	//create a subMenu list:
	var subMenu = document.createElement('ul');
	subMenu.className = 'mainMenuSubMenu';
	mainMenuItem.appendChild(subMenu);
	
	var textItem = $(mainMenuItem).find('.mainMenuText')[0];
	$(textItem).find('.subMenuIcon')[0].style.visibility = '';
	return subMenu;
}

function updateMainMenuSelection(menuItem){
	//clear previous selection:
	$(mainMenu).find('.mainMenuItem').removeClass('activeMainMenuItem');
	//set  selection class to new selection:
	if(menuItem != null){
		$(menuItem).addClass('activeMainMenuItem');
	}
}

function switchToReport(mainReportsContainer){

	if(mainReportsContainerLock == true){
		return;
	}
	
	//get currently displayed report element:
	var previous = $(mainReportsContainer).find('.reportItem.current');
	if(previous.length == 1){
		var currentReport = previous[0];
		//call it's dispose function:
		if (typeof currentReport.onItemDispose == 'function') {
			currentReport.onItemDispose();
		}
	}
	//remove it:
	previous.remove();
	
	//clear it's tips:
	ClearTips();
	$(tipsButton).hide();
	$(tipsButton).removeClass('cbutton--click');
	
	//dismiss active tip:
	dismissActiveTip();
	
	//create a new report and append it to mainReportsContainer:
	var report = document.createElement('div');
	report.className= 'reportItem current';
	mainReportsContainer.appendChild(report);
	return report;
}

function animateCurrentReportEntrace(){
	var reportItem = $(mainReportsContainer).find('.reportItem.current')[0];
	if(reportItem){
		$(reportItem).hide();
		$(reportItem).fadeIn(600);
	}
}


//Host profiling commons:
function RowDetailsShown(detailsControlElement) {
    detailsControlElement.html('-');
	$(detailsControlElement).addClass('activeDetailsParentRow');
}

function RowDetailsHidden(detailsControlElement) {
    detailsControlElement.html('+');
	$(detailsControlElement).removeClass('activeDetailsParentRow');
}

function createGraphFromTableData(graphContainer, tableData, propertyName, forceRender) {

    if (tableData.length > 1000 && !forceRender) {
        var graphLoader = document.createElement('span');
        graphLoader.style.height = '100%';
        graphLoader.style.width = '100%';
        graphLoader.style.textAlign = 'center';
        graphLoader.innerHTML = 'Show Graph';
        graphLoader.className = 'linkableSrcCode';

        $(graphContainer).append(graphLoader);

        $(graphLoader).click(function () {
            createGraphFromTableData(graphContainer, tableData, propertyName, true);
        });
        return;
    }

    var graphData = new Array(tableData.length);
    var graphTooltips = new Array(tableData.length);
    var xMin = 0, xMax = graphData.length, yMin = Number.MAX_VALUE, yMax = 0, totalValidEntries = 0;
	var entryAvg = 0;
    for (var i = 0; i < xMax; i++) {
        entry = parseFloat(tableData[i][propertyName]);
		if(entry == null){
			continue;
		}
		entryAvg += entry;
		totalValidEntries++;
		
        graphData[i] = [i, entry];
        graphTooltips[i] = [entry];

        if (entry > yMax) {
            yMax = entry;
        }

        if (entry < yMin) {
            yMin = entry;
        }
    }
    xMax -= 1;
	entryAvg = entryAvg / totalValidEntries;
	

    var graphObj = new Graph(graphContainer);
    graphObj.setData({
        "data":
        [
            {
                "label": '',
                "id": '',
                "data": graphData,
                "color": '#0071C5',
                "bars": { show: true, horizontal: false },
                "tt": graphTooltips,
                "showLabels": false,
            }
        ],
        "xAxisTicks": [],
        "yAxisTicks": [],
        "xMin": xMin,
        "xMax": xMax,
        "yMin": yMin,
        "yMax": yMax
    });

    graphObj.setOptions({
        "xAxisName": "",
        "yAxisName": "",
        "xAxis_showTicks": true,
        "yAxis_showTicks": true,
        "animate": false,
        "hoverable": true,
        "clickable": false,
        "navigatable": false,
        "horizontalGridlines": true,
        "verticalGridlines": false,
        "autoHighlight": true,
        "showTooltip": true,
        "selectable": true,
        "zoomOnSelection": true,
        "selectionMode": "xy",
        "markers": [{ color: '#A6CE39', lineWidth: 1, yaxis: { from: entryAvg, to: entryAvg } }],
        "trackable": false,
        "trackerMode": "x",
        "trackerDiv": "",
        "trackerDefaultMessage": "",
        "togglable": false,
        "togglerDiv": "#toggler",
        "zooming_xAxis_zoomable": true,
        "zooming_xAxis_minimalZoom": 2,
        "zooming_xAxis_maximalZoom": (xMax - xMin + 2),
        "zooming_onLoad_xAxis_from": (xMin - 1),
        "zooming_onLoad_xAxis_to": (xMax + 1),
        "center_xAxis_ifElementsAreLessThan": 6,
        "zooming_yAxis_zoomable": true,
        "zooming_yAxis_minimalZoom": 2,
        "zooming_onLoad_yAxis_from": 0,
        "zooming_onLoad_yAxis_to": yMax * 1.15,
        "center_yAxis_ifElementsAreLessThan": null,
        "showLegends": false
    });
    graphObj.Render();
	
	//add title:
	var graphTitleSpan = document.createElement('span');
	graphTitleSpan.innerHTML = propertyName + ' graph:';
	graphTitleSpan.style.position = 'absolute';
	graphTitleSpan.style.top = '10px';
	graphTitleSpan.style.left = '15px';
	graphTitleSpan.style.fontSize = '12px';
	
	graphContainer.appendChild(graphTitleSpan);
	
}


//tips behaviors:
function FilterDatatable_singleColumn(tableID, columnIndex, textToExactMatch) {
    var tableObj = $('#'+tableID).DataTable();
    //step2: clear previous filtering states (without rendering table):
    tableObj.search('');
    //step3: regex search the "apiName" column for a matching result and render table:
    tableObj.column(columnIndex).search('^' + textToExactMatch + '$', true, false, true).draw();
    //step4: clear the "apiName" column filtering limitation:
    tableObj.column(columnIndex).search('');
    //step5: set filtering string in the search box:
    tableObj.search(textToExactMatch);

    activeTipFilteredDatatableInstance = tableObj;
}

function expandDetailesForFirstFilteredRowInTable(tableID) {
    myFilteredRows = $('#' + tableID + ' tbody').find('tr');	
    if (myFilteredRows.length > 0) {
        tableObj = $('#' + tableID).DataTable();
        tr = myFilteredRows[0];
        row = tableObj.row(tr);
        if (row.child.isShown()) {
            row.child.hide();
            row.child.remove();
        }
        // Open this row
        $($(tr).find("td.details-control")[0]).trigger("click");
    }
}

function setActiveTipInfo(tableID, linesToHighlightIndexes) {
    ActiveTipInfo.TableToHighlight = tableID;
    ActiveTipInfo.LinesToHighlight = linesToHighlightIndexes;
}

function getDetailesDataTableIDForFirstFilteredRow(tableID) {
    var datatables = $('#' + tableID).find('.dataTable');
    if(datatables.length == 2){
        var id = datatables[1].id;
        return id;
    }
    return "";
}

function highlightJavascriptElement(element) {
    if (element == null) {
        return;
    }
    element.style.background = '#ffff99';
}


/*****************************************/
/* Browsers support and special cases workarounds */
/*****************************************/
var BrowserSupport = (function () { return {
	//todo.
}; })();


/*****************************************/
/* Datatables plugin commons */
/*****************************************/
var DataTableCommonTools = (function () { return {
	
	bindResizeEventForDataTableContainer: function (parent, invokeEventAfterBinding) {
		$(parent).bind('resize', function(event) {
			DataTableCommonTools.resizeTableToFitScreen(parent);
		});
		
		if(invokeEventAfterBinding == true)
		{
			DataTableCommonTools.resizeTableToFitScreen(parent);
		}
	},
	
	unbindResizeEventForDataTableContainer: function (parent) {
		$(parent).off("resize");
	},
	
    resizeTableToFitScreen: function (parent) {
		var scrollBodies = $(parent).find('.dataTables_scrollBody');
		if (scrollBodies != null && scrollBodies.length > 0) 
		{
			$(scrollBodies[0]).css('height', ($(parent).height() - 51));
		}
	},
	
	setAsDatatableContainer: function (parent) {
		//special handling for bad datatable plug-in margin in IE:
		if(browserInfo.isIE == true)
		{
			$(parent).addClass('IEmode');
		}
		//special handling for bad datatable plug-in body-height in Chrome:
		if(browserInfo.isChrome == true)
		{
			parent.style.overflowY = 'hidden';
		}
	},
	
	appendDatatableColumnsFromJSONArray: function(columns, jsonArray) {
		for(var i=0 ;i<jsonArray.length; i++)
		{
			var col = 
			{
				"title": jsonArray[i],
				"data": jsonArray[i]
				//"contentPadding": "m"
			};
			columns.push(col);
		}
	},
	
	appendExpandableColumn: function(columns, childrenMemberName) {
		columns.push(
			{
				"title": "",
				"defaultContent": "+",
				"searchable": false,
				"className": 'details-control',
				"orderable": false,
				"render": function (data, type, row) {
					if(row[childrenMemberName] != null && row[childrenMemberName].length > 0){
						return '+';
					}
					return '';
				}
			});
	},
	
	bindExpandableColumnClickToFunction: function(tableID, tableJQueryObj, childrenMemberName, rowCreationDetailsCallback, designClass) {
		// Add event listener for opening and closing details:
		$('#' + tableID + ' tbody').on('click', 'td.details-control', function () {
			var tr = $(this).closest('tr');
			var row = tableJQueryObj.row(tr);
			var rowData = row.data();
			if(rowData[childrenMemberName] == null || rowData[childrenMemberName].length == 0){
				return;
			}
			
			if (row.child.isShown()) {
				// This row is already open - close it
				row.child.hide();
				row.child.remove();
				RowDetailsHidden($(this));
				return;
			}
			
			var div = document.createElement('div');
			var child = row.child(div);
			var wrapper = div;
			// Open this row:
			if(designClass == 'subTable')
			{
				div.style.height = '198px';
				div.style.minHeight = '198px';
				div.style.maxHeight = '198px';
				div.style.paddingLeft = '0px';
				div.style.overflow = 'auto';
				div.style.overflowY = 'hidden';
				
				var tableContainer = document.createElement('div');
				tableContainer.style.background = '#fcfcfc';
				tableContainer.style.marginRight = '5px';
				tableContainer.style.marginTop = '15px';
				$(div).append(tableContainer);

				var table = document.createElement('table');
				table.className = 'display apiTraceTable';
				$(tableContainer).append(table);
				table.rowData = rowData;
				wrapper = table;
			}
			
			if(rowCreationDetailsCallback != null)
			{
				rowCreationDetailsCallback(row, rowData, childrenMemberName, wrapper);
			}
			
			child.show();
			RowDetailsShown($(this));
			
		});
	}
	
}; })();

	
/*****************************************/
/* Sidebar hide / show functionality */
/*****************************************/
function initiateSidebarMenu(){
	//hide menu if we click outside it:
	var container = document.getElementById('mainContainer');
    var onClick = function(e) {
        if( !hasParentClass( e.target, 'sidebarHelpmenu' ) ) {
            hideSidebarMenu();
            document.removeEventListener('click', onClick);
        }
    };
	
	//display menu if we click on the menu button:
	var menuButton = document.getElementById('menuButton');
	menuButton.style.visibility = 'hidden';
    menuButton.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        container.className = 'mainContainer sidebarPushAnimation';
        setTimeout(function () {
            $(container).addClass('sidebarHelpmenu-open');
        }, 25);
        document.addEventListener('click', onClick);
    });
}

function hideSidebarMenu() {
    var container = document.getElementById( 'mainContainer' );
    $(container).removeClass('sidebarHelpmenu-open');
}

function showSidebarMenu(){
    $('#menuButton').trigger("click");
}

function addSideBarMenuItem(name, onClick) {
	var helpMenuList = document.getElementById('helpMenuList');
	var item = document.createElement('li');
	item.className = 'helpMenuItem';
	item.innerHTML = name;
	item.onclick = function(){
		hideSidebarMenu();
		setTimeout(onClick, 400); 
	};
	
	helpMenuList.appendChild(item);
	
	document.getElementById('menuButton').style.visibility = '';
}


/*****************************************/
/* VIEW MODE (TABS) FUNCTIONALITIES */
/*****************************************/
function ViewMode(parent, widthPerHeader, title, titleClass) {
		
	var wrapper = document.createElement('table');
	parent.appendChild(wrapper);
	
	this.widthPerHeader = widthPerHeader;
	
	var tr = wrapper.insertRow(wrapper.rows.length);
	
	//insert tite cell:
	if(title != null){
		if(titleClass == null) {
			titleClass = '';
		}
		var td = tr.insertCell(tr.cells.length);
		td.className = titleClass;
		td.innerHTML = title;
	}
	
	//insert tabs-wrapping cell:
	var vmContainer = tr.insertCell(tr.cells.length);
	vmContainer.className = 'viewModeContainer';
	vmContainer.style.width = '250px';
	


    this.nav = document.createElement('nav');
    this.nav.className = 'tabs-style-bar linkEffect_brackets';
    $(vmContainer).append(this.nav);

    this.listElement = document.createElement('ul');
    $(this.nav).append(this.listElement);

    this.current = -1;

    this.itemsList = null;
	this.vmContainer = vmContainer;

}

ViewMode.prototype.setSelection = function (index) {
    if(index == this.current){
		return false;
	}
	if (this.current >= 0) {
        this.itemsList[this.current].className = '';
    }
    if (index) {
        this.current = index;
    }
    else {
        this.current = 0;
    }
    this.itemsList[this.current].className = 'tab-current';
	return true;
}

ViewMode.prototype.add = function (id, text, onclickFunc) {

    var item = document.createElement('li');
	if(id){
		item.id = id;
	}
    var a = document.createElement('a');
    a.innerHTML = text;
    $(item).append(a);
    $(this.listElement).append(item);

    if (onclickFunc) {
        $(a).click(function () {
            onclickFunc();
        });
    }

    var self = this;

    this.itemsList = this.listElement.querySelectorAll('li');
    var itemIndex = this.itemsList.length - 1;
    if (itemIndex == 0) {
        this.current = itemIndex;
        this.itemsList[this.current].className = 'tab-current';
    }
	
	this.vmContainer.style.width = (this.itemsList.length * this.widthPerHeader) + 'px';
    item.viewModeIndex = itemIndex;

    a.addEventListener('click', function (ev) {
        ev.preventDefault();
        self.setSelection(itemIndex);
    });

}

ViewMode.prototype.setFocusOn = function (id) {
    var ret = this.setSelection(document.getElementById(id).viewModeIndex);
    $($("#" + id + " a")[0]).trigger("click");
	if(ret == true){
		return 600;
	}
	return 0;
}

ViewMode.prototype.autoSetWidth = function (widthPerItem){
	var itemsCount = this.listElement.querySelectorAll('li').length;
	this.vmContainer.style.width = (widthPerItem * itemsCount) + 'px';
}



/*****************************************/
/* MEMORY DIAGRAM FUNCTIONALITIES */
/*****************************************/
function MemoryDiagram(parent, architecture) {
	this.parent = parent;
	this.architecture = architecture;
	$(parent).empty();
	
	if(this.architecture == 'hsw' || this.architecture == 'bdw'){
		
		//build layout:
		this.parent.innerHTML =
			'<table class="" border="0" style="width: 100%; border-spacing: 0px; border-collapse: separate;">' +
				'<tr>' +
					'<td colspan="10">&nbsp;<span class="memDiagramAreaTitle">GPU</span></td>' + 
					'<td class="memoryArchitecture_Unit_DRAM" rowspan="12">DRAM</td>' + 
				'</tr>' + 
				'<tr>' + 
					'<td rowspan="2" class="leftBordered topBordered">&nbsp;</td>' + 
					'<td rowspan="2" class="topBordered">&nbsp;</td>' + 
					'<td rowspan="2" class="topBordered">&nbsp;</td>' + 
					'<td rowspan="3" class="topBordered">&nbsp;</td>' + 
					'<td class="topBordered">&nbsp;</td>' + 
					'<td rowspan="3" class="topBordered">&nbsp;</td>' + 
					'<td class="topBordered rightBordered">&nbsp;</td>' + 
					'<td rowspan="5">&nbsp;</td>' + 
					'<td class="memoryArchitecture_Unit_LLC" rowspan="10">LLC<span class="memDiagramAreaTitle" style="position: absolute; top: 0px;">GPU</span></td>' + 
					'<td rowspan="5">&nbsp;</td>' + 
				'</tr>' + 
				'<tr>' + 
					'<td>&nbsp;</td>' + 
					'<td class="memoryArchitecture_Unit_L3 rightBordered" rowspan="8">L3</td>' + 
				'</tr>' + 
				'<tr>' + 
					'<td class="memoryArchitecture_Unit_EU leftBordered" rowspan="7">EU</td>' + 
					'<td>&nbsp;</td>' + 
					'<td class="memoryArchitecture_Unit_L1" rowspan="3">L1</td>' + 
					'<td class="memoryArchitecture_Unit_L2"rowspan="4">L2</td>' + 
				'</tr>' + 
				'<tr>' + 
					'<td class="arrow_EU_to_L1">arrow_EU_L1</td>' + 
					'<td class="arrow_L1_to_L2">arrow_L1_L2</td>' + 
					'<td class="arrow_L2_to_L3">arrow_L2_L3</td>' + 
				'</tr>' + 
				'<tr>' + 
					'<td>&nbsp;</td>' + 
					'<td rowspan="3">&nbsp;</td>' + 
					'<td rowspan="3">&nbsp;</td>' + 
				'</tr>' + 
				'<tr>' + 
					'<td rowspan="2">&nbsp;</td>' + 
					'<td>&nbsp;</td>' + 
					'<td class="arrow_L3_to_LLC_up">arrow_L3_LLC_up</td>' + 
					'<td class="arrow_LLC_to_DRAM_up">arrow_LLC_DRAM_up</td>' + 
				'</tr>' + 
				'<tr>' + 
					'<td>&nbsp;</td>' + 
					'<td>&nbsp;</td>' + 
					'<td rowspan="5">&nbsp;</td>' + 
					'<td rowspan="5">&nbsp;</td>' + 
				'</tr>' + 
				'<tr>' + 
					'<td class="arrow_EU_to_L3" colspan="5">arrow_EU_L3</td>' + 
				'</tr>' + 
				'<tr>' + 
					'<td rowspan="3" class="bottomBordered">&nbsp;</td>' + 
					'<td class="">&nbsp;</td>' + 
					'<td rowspan="3" class="bottomBordered">&nbsp;</td>' + 
					'<td rowspan="3" class="bottomBordered">&nbsp;</td>' + 
					'<td rowspan="3" class="bottomBordered">&nbsp;</td>' + 
				'</tr>' + 
				'<tr>' + 
					'<td rowspan="2" class="leftBordered bottomBordered">&nbsp;</td>' + 
					'<td rowspan="2" class="bottomBordered">&nbsp;</td>' + 
					'<td class="rightBordered">&nbsp;</td>' + 
				'</tr>' + 
				'<tr>' + 
					'<td class="rightBordered bottomBordered" >&nbsp;</td>' + 
					'<td>&nbsp;</td>' + 
				'</tr>' + 
			'</table>';
			
		//create units and arrows:
		var td, unit, element;

		td = $(this.parent).find('.memoryArchitecture_Unit_EU')[0]; td.innerHTML = '';
		unit = createArchitectutreUnit(td, 'EU', 'memoryArchitecture_Unit_EU_val', '70px', '150px');

		td = $(this.parent).find('.memoryArchitecture_Unit_L1')[0]; td.innerHTML = '';
		unit = createArchitectutreUnit(td, 'Sampler L1', 'memoryArchitecture_Unit_L1_val', '70px', '55px');
		element = $(this.parent).find('.memoryArchitecture_Unit_L1_val')[0];

		td = $(this.parent).find('.memoryArchitecture_Unit_L2')[0]; td.innerHTML = '';
		unit = createArchitectutreUnit(td, 'Sampler L2', 'memoryArchitecture_Unit_L2_val', '70px', '75px');
		element = $(this.parent).find('.memoryArchitecture_Unit_L2_val')[0];

		td = $(this.parent).find('.memoryArchitecture_Unit_L3')[0]; td.innerHTML = '';
		unit = createArchitectutreUnit(td, 'L3', 'memoryArchitecture_Unit_L3_val', '70px', '165px');
		element = $(this.parent).find('.memoryArchitecture_Unit_L3_val')[0];

		td = $(this.parent).find('.memoryArchitecture_Unit_LLC')[0]; td.innerHTML = '';
		unit = createArchitectutreUnit(td, 'LLC', 'memoryArchitecture_Unit_LLC_val', '70px', '208px');
		element = $(this.parent).find('.memoryArchitecture_Unit_LLC_val')[0];

		td = $(this.parent).find('.memoryArchitecture_Unit_DRAM')[0]; td.innerHTML = '';
		unit = createArchitectutreUnit(td, 'DRAM', 'memoryArchitecture_Unit_DRAM_val', '70px', '250px');
		element = $(this.parent).find('.memoryArchitecture_Unit_DRAM_val')[0];


		//arrows:
		td = $(this.parent).find('.arrow_EU_to_L1')[0]; td.innerHTML = '';
		createInfoArrow(td, 'arrow_EU_to_L1_val', 'right');
		element = $(this.parent).find('.arrow_EU_to_L1_val')[0];

		td = $(this.parent).find('.arrow_L1_to_L2')[0]; td.innerHTML = '';
		createInfoArrow(td, 'arrow_L1_to_L2_val', 'right');
		element = $(this.parent).find('.arrow_L1_to_L2_val')[0];

		td = $(this.parent).find('.arrow_L2_to_L3')[0]; td.innerHTML = '';
		createInfoArrow(td, 'arrow_L2_to_L3_val', 'right');
		element = $(this.parent).find('.arrow_L2_to_L3_val')[0];

		td = $(this.parent).find('.arrow_L3_to_LLC_up')[0]; td.innerHTML = '';
		createInfoArrow(td, 'arrow_L3_to_LLC_up_val', 'right');
		element = $(this.parent).find('.arrow_L3_to_LLC_up_val')[0];

		td = $(this.parent).find('.arrow_LLC_to_DRAM_up')[0]; td.innerHTML = '';
		createInfoArrow(td, 'arrow_LLC_to_DRAM_up_val', 'right');
		element = $(this.parent).find('.arrow_LLC_to_DRAM_up_val')[0];

		td = $(this.parent).find('.arrow_EU_to_L3')[0]; td.innerHTML = '';
		createInfoArrow(td, 'arrow_EU_to_L3_val', 'right');
		element = $(this.parent).find('.arrow_EU_to_L3_val')[0];
		
		
		//arrows:
		td = $(this.parent).find('.arrow_EU_to_L1')[0]; td.innerHTML = '';
		createInfoArrow(td, 'arrow_EU_to_L1_val', 'right');
		element = $(this.parent).find('.arrow_EU_to_L1_val')[0];

		td = $(this.parent).find('.arrow_L1_to_L2')[0]; td.innerHTML = '';
		createInfoArrow(td, 'arrow_L1_to_L2_val', 'right');
		element = $(this.parent).find('.arrow_L1_to_L2_val')[0];

		td = $(this.parent).find('.arrow_L2_to_L3')[0]; td.innerHTML = '';
		createInfoArrow(td, 'arrow_L2_to_L3_val', 'right');
		element = $(this.parent).find('.arrow_L2_to_L3_val')[0];

		td = $(this.parent).find('.arrow_L3_to_LLC_up')[0]; td.innerHTML = '';
		createInfoArrow(td, 'arrow_L3_to_LLC_up_val', 'right');
		element = $(this.parent).find('.arrow_L3_to_LLC_up_val')[0];

		td = $(this.parent).find('.arrow_LLC_to_DRAM_up')[0]; td.innerHTML = '';
		createInfoArrow(td, 'arrow_LLC_to_DRAM_up_val', 'right');
		element = $(this.parent).find('.arrow_LLC_to_DRAM_up_val')[0];

		td = $(this.parent).find('.arrow_EU_to_L3')[0]; td.innerHTML = '';
		createInfoArrow(td, 'arrow_EU_to_L3_val', 'right');
		element = $(this.parent).find('.arrow_EU_to_L3_val')[0];
		
	}
	
	
	/****************/
	/* HELP FUNCTIONS */
	/****************/
	function createArchitectutreUnit(parent, name, id, width, height) {

		var unitDiv = document.createElement('div');
		unitDiv.className = 'unitDiv'
		$(unitDiv).addClass(id);
		unitDiv.style.width = width;
		unitDiv.style.height = height;
		
		
		unitDiv.name = name;
		$(unitDiv).addClass(id);
		
		unitDiv.innerHTML = name;
		
		parent.appendChild(unitDiv);
		parent.style.width = width;

		return unitDiv;
	}

	function createInfoArrow(parent, spanId, direction) {
		//container:
		var infoArrowDiv = document.createElement('div');
		infoArrowDiv.className = 'infoArrowContainer';

		var lineDiv = document.createElement('div');
		lineDiv.className = 'horizontalArrowContainer';
		$(infoArrowDiv).append(lineDiv);

		var arrowHead = document.createElement('div');
		arrowHead.className = 'arrowHead_' + direction;
		$(infoArrowDiv).append(arrowHead);

		var infoSpan = document.createElement('div');
		infoSpan.className = 'infoArrowSpan';
		$(infoSpan).addClass(spanId);
		$(infoArrowDiv).append(infoSpan);

		parent.appendChild(infoArrowDiv);
	}

}

MemoryDiagram.prototype.setValues = function (unit_EU, unit_L1, unit_L2, unit_L3, unit_LLC, unit_DRAM, arrow_EU_L1,
											arrow_L1_L2, arrow_L2_L3, arrow_L3_LLC_up, arrow_LLC_DRAM_up, arrow_EU_L3) {
    
	if(this.architecture == 'hsw' || this.architecture == 'bdw'){

		//unit:
		//console.log(this.parent.innerHTML);
		var element;
		element = $(this.parent).find('.memoryArchitecture_Unit_EU_val')[0];
		element.innerHTML = element.name + '<br/>' + unit_EU;
		
		element = $(this.parent).find('.memoryArchitecture_Unit_L1_val')[0];
		element.innerHTML = element.name + '<br/>' + unit_L1;
		
		element = $(this.parent).find('.memoryArchitecture_Unit_L2_val')[0];
		element.innerHTML = element.name + '<br/>' + unit_L2;
		
		element = $(this.parent).find('.memoryArchitecture_Unit_L3_val')[0];
		element.innerHTML = element.name + '<br/>' + unit_L3;
		
		element = $(this.parent).find('.memoryArchitecture_Unit_LLC_val')[0];
		element.innerHTML = element.name + '<br/>' + unit_LLC;
		
		element = $(this.parent).find('.memoryArchitecture_Unit_DRAM_val')[0];
		element.innerHTML = element.name + '<br/>' + unit_DRAM;
		
        //arrows:
		element = $(this.parent).find('.arrow_EU_to_L1_val')[0];
		element.innerHTML = arrow_EU_L1;
		
		element = $(this.parent).find('.arrow_L1_to_L2_val')[0];
		element.innerHTML = arrow_L1_L2;
		
		element = $(this.parent).find('.arrow_L2_to_L3_val')[0];
		element.innerHTML = arrow_L2_L3;
		
		element = $(this.parent).find('.arrow_L3_to_LLC_up_val')[0];
		element.innerHTML = arrow_L3_LLC_up;
		
		element = $(this.parent).find('.arrow_LLC_to_DRAM_up_val')[0];
		element.innerHTML = arrow_LLC_DRAM_up;
		
		element = $(this.parent).find('.arrow_EU_to_L3_val')[0];
		element.innerHTML = arrow_EU_L3;
		
	}
	
	
	
	
	
	
}



/*****************************************/
/* TRANSITION LIST */
/*****************************************/
function TransitionList(container, componentHeight, navControls, navEffect, listClass, navSpeed, reportsDefaultClass, onReportLoadFunc, onReportDisposeFunc, additionalFixedHeight) {

    this.container = container;
    this.navSpeed = navSpeed;
    this.reportsDefaultClass = reportsDefaultClass;
    this.lastLoaded = null;
    this.toDisposeNext = null;
    this.onReportLoadFunc = onReportLoadFunc;
    this.onReportDisposeFunc = onReportDisposeFunc;
	this.componentHeight = componentHeight;
	this.blockAnimation = false;
	this.additionalFixedHeight = additionalFixedHeight;
	if(this.additionalFixedHeight == null || this.additionalFixedHeight == ''){
		this.additionalFixedHeight = 0;
	}

    //elements:
    this.component = document.createElement('div');
	this.component.style.position = 'relative';
	//this.component.style.background = 'red';
	this.component.style.overflow = 'hidden';
	this.component.style.overflowY = 'auto';//todo: test.
	this.component.style.width = '100%';
	this.component.style.height = '300px';
	//]]this.component.style.background = 'yellow';
	
	if (container) {
        container.appendChild(this.component);
    }
	
	if(componentHeight != '100%'){
		this.component.style.height = componentHeight;
	}
	else{ //do a 100% height completion:
		window.addEventListener('resize', function (event) {
			resizeToFillContainerHeight();
		});
		
		var self = this;
		function resizeToFillContainerHeight() {
			var containerObj = $(self.container);
			var containerTopOffset = containerObj.offset().top;
			var componentTopOffset = $(self.component).offset().top;
			var newHeight = containerObj.height() - Math.abs(componentTopOffset - containerTopOffset) - 5;//todo: need the -5?
			$(self.component).css({ 'height': (newHeight + self.additionalFixedHeight) + 'px' });
			//console.log('resizing component to ' + newHeight + ',    containerObj.topOffset=' + containerTopOffset +  ',    my.topOffset=' + componentTopOffset + '   containerObj.height() =' + containerObj.height() );
			//todo: unregister this.
		}
		resizeToFillContainerHeight();
	}

	
    this.itemsList = document.createElement('ul');
    this.itemsList.className = listClass;
    $(this.component).append(this.itemsList);
    this.items = this.itemsList.children; //component.querySelector( 'ul.itemwrap' ).children,

    this.current = 0;
    this.itemsCount = this.items.length;

    if (navControls) {
        this.nav = this.component.querySelector('nav');
        this.navNext = this.nav.querySelector('.next');
        this.navPrev = this.nav.querySelector('.prev');
        var self = this;
        this.navNext.addEventListener('click', function (ev) { ev.preventDefault(); self.navigate('next'); });
        this.navPrev.addEventListener('click', function (ev) { ev.preventDefault(); self.navigate('prev'); });
        this.showNav();
    }
  //  else {
  //      this.hideNav();
  //  }

    this.isAnimating = false;
    this.changeEffect(navEffect); //fxPressAwayFAST

}

TransitionList.prototype.addReportToList = function (id) {

    var listItem = document.createElement('li');
    listItem.id = id;

    this.updateItemsCount();
    if (this.itemsCount == 0) {
        $(listItem).addClass('transitionListItemContainerActive');
    }
	else{
		listItem.style.display = 'none';
	}
    $(listItem).addClass(this.reportsDefaultClass);

    $(this.itemsList).append(listItem);
    this.updateItemsCount();

    return listItem;
}

TransitionList.prototype.updateItemsCount = function () {
    this.itemsCount = this.items.length;
}

TransitionList.prototype.hideNav = function () {
    if (this.nav) {
        this.nav.style.display = 'none';
    }
}

TransitionList.prototype.showNav = function () {
    if (this.nav) {
        this.nav.style.display = 'block';
    }
}

TransitionList.prototype.changeEffect = function (effectName) {
    this.component.className = this.component.className.replace(/\bfx.*?\b/g, '');
    $(this.component).addClass(effectName);
    this.navEffect = effectName;
}

TransitionList.prototype.navigate = function (dir) {

    if (!dir) {
        dir = 'prev';
    }
    if (this.isAnimating || this.itemsCount == 0) return false;
    this.isAnimating = true;
    this.cntAnims = 0;

    var currentItem = this.items[this.current];

    if (dir === 'next') {
        this.current = this.current < this.itemsCount - 1 ? this.current + 1 : 0;
    }
    else if (dir === 'prev') {
        this.current = this.current > 0 ? this.current - 1 : this.itemsCount - 1;
    }

    var nextItem = this.items[this.current];
    this.setTransitionAnimation(this, currentItem, nextItem, dir);
}

TransitionList.prototype.switchTo = function (id, direction) {
    if (this.isAnimating || this.itemsCount == 0) return false;

    this.cntAnims = 0;
    var dir = 'next';
    if(direction){
        dir = direction;
    }

    var currentItem = this.items[this.current];
    var nextItem = document.getElementById(id);
    this.current = $('#' + id).index();

    if (currentItem == nextItem) {
        return;
    }
    this.isAnimating = true;
    this.setTransitionAnimation(this, currentItem, nextItem, dir);
	
	
	//console.log('currentCount = ' + $(this.component).find('.transitionListItemContainer.current').length);
	
}

TransitionList.prototype.raiseDisposeEvent = function (id) {
    if (!id) {
        id = this.items[this.current].id;
    }
    if (typeof this.onReportDisposeFunc == 'function') {
        this.onReportDisposeFunc(id);
    }
}

TransitionList.prototype.setTransitionAnimation = function (thisObj, currentItem, nextItem, dir) {
    var onEndAnimationCurrentItem = function () {
        currentItem.removeEventListener(currentItem.animEndEventName, onEndAnimationCurrentItem);
		$(currentItem).removeClass('transitionListItemContainerActive');
        $(currentItem).addClass('transitionListItemContainer');
        $(currentItem).removeClass(dir != 'next' ? 'navOutNext' : 'navOutPrev');
        ++thisObj.cntAnims;
        if (thisObj.cntAnims === 2) {
            thisObj.isAnimating = false;

			document.getElementById(thisObj.toDisposeNext).style.display = 'none';
			
            if (typeof thisObj.onReportDisposeFunc == 'function') {
                thisObj.onReportDisposeFunc(thisObj.toDisposeNext);
            }
			
        }
    }

    var onEndAnimationNextItem = function () {
        nextItem.removeEventListener(nextItem.animEndEventName, onEndAnimationNextItem);
        $(nextItem).addClass( 'transitionListItemContainerActive');
        $(nextItem).removeClass(dir != 'next' ? 'navInNext' : 'navInPrev');
        ++thisObj.cntAnims;
        if (thisObj.cntAnims === 2) {
            thisObj.isAnimating = false;

			document.getElementById(thisObj.toDisposeNext).style.display = 'none';
			
            if (typeof thisObj.onReportDisposeFunc == 'function') {
                thisObj.onReportDisposeFunc(thisObj.toDisposeNext);
            }
			
			
        }
    }

	nextItem.style.display = '';
	
    if (support.animations) {
        currentItem.addEventListener(animEndEventName, onEndAnimationCurrentItem);
        nextItem.addEventListener(animEndEventName, onEndAnimationNextItem);
    }
    else {
        onEndAnimationCurrentItem();
        onEndAnimationNextItem();
    }

    this.lastLoaded = nextItem.id;
    this.toDisposeNext = currentItem.id;
	
    if (typeof this.onReportLoadFunc == 'function') {
		appendLoadingMessage(thisObj.component);
		setTimeout(function(){
			thisObj.onReportLoadFunc(nextItem.id);
			removeLoadingMessage(thisObj.component);
			animatePageTransition();
		}, 1);
    }
	else{
		animatePageTransition();
	}

	function animatePageTransition(){
		if(thisObj.blockAnimation == true){
			onEndAnimationCurrentItem();
			onEndAnimationNextItem();
		}
		else{
			$(currentItem).addClass(dir != 'next' ? 'navOutNext' : 'navOutPrev');
			$(nextItem).addClass(dir != 'next' ? 'navInNext' : 'navInPrev');
		}
	}
}

TransitionList.prototype.callLoadOnFirstItem = function () {
	var items = this.itemsList.children;
	if(items.length <= 0){
		return null;
	}
	
	if (typeof this.onReportLoadFunc == 'function') {
		var id = items[0].id;
        this.onReportLoadFunc(id);
		return id;
    }
	
	
	
}

TransitionList.prototype.getCurrentItem = function () {
	if(this.items.length <=0){
		return null;
	}
	return this.items[this.current];
}



/*****************************************/
/* ToolTip Menu */
/*****************************************/
/**
 * cbpTooltipMenu.js v1.0.0
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2013, Codrops
 * http://www.codrops.com
 */
;( function( window ) {
	
	'use strict';

	var document = window.document,
		docElem = document.documentElement;

	function extend( a, b ) {
		for( var key in b ) { 
			if( b.hasOwnProperty( key ) ) {
				a[key] = b[key];
			}
		}
		return a;
	}

	// from https://github.com/ryanve/response.js/blob/master/response.js
	function getViewportH() {
		var client = docElem['clientHeight'],
			inner = window['innerHeight'];
		if( client < inner )
			return inner;
		else
			return client;
	}

	function getOffset( el ) {
		return el.getBoundingClientRect();
	}

	function isMouseLeaveOrEnter(e, handler) { 
		if (e.type != 'mouseout' && e.type != 'mouseover') return false; 
		var reltg = e.relatedTarget ? e.relatedTarget : 
		e.type == 'mouseout' ? e.toElement : e.fromElement; 
		while (reltg && reltg != handler) reltg = reltg.parentNode; 
		return (reltg != handler); 
	}

	function cbpTooltipMenu( el, options ) {	
		this.el = el;
		this.options = extend( this.defaults, options );
		this._init();
	}

	cbpTooltipMenu.prototype = {
		defaults : {
			// add a timeout to avoid the menu to open instantly
			delayMenu : 100
		},
		_init : function() {
			this.touch = Modernizr.touch;
			//this.menuItems = document.querySelectorAll( '#' + this.el.id + ' > .mainMenuItem' );
			this.menuItems =this.el.getElementsByClassName('mainMenuItem');
			this._initEvents();
		},
		_initEvents : function() {
			
			var self = this;

			Array.prototype.slice.call( this.menuItems ).forEach( function( el, i ) {
				var trigger = el.querySelector( 'a' );
				if( self.touch ) {
					trigger.addEventListener( 'click', function( ev ) { self._handleClick( this, ev ); } );
				}
				else {
					trigger.addEventListener( 'click', function( ev ) {
						if( this.parentNode.querySelector( 'ul.mainMenuSubMenu' ) ) {
							ev.preventDefault();
						}
					} );
					el.addEventListener( 'mouseover', function(ev) { if( isMouseLeaveOrEnter( ev, this ) ) self._openMenu( this ); } );
					el.addEventListener( 'mouseout', function(ev) { if( isMouseLeaveOrEnter( ev, this ) ) self._closeMenu( this ); } );
				}
			} );

		},
		_openMenu : function( el ) {

			var self = this;
			clearTimeout( this.omtimeout );
			this.omtimeout = setTimeout( function() {
				var submenu = el.querySelector( 'ul.mainMenuSubMenu' );

				if( submenu ) {
					el.className += ' cbp-tm-show';
					if( self._positionMenu( el ) === 'top' ) {
						el.className += ' cbp-tm-show-above';
					}
					else {
						el.className += ' cbp-tm-show-below';
					}
				}
			}, this.touch ? 0 : this.options.delayMenu );

		},
		_closeMenu : function( el ) {
			
			clearTimeout( this.omtimeout );

			var submenu = el.querySelector( 'ul.mainMenuSubMenu' );

			if( submenu ) {
				el.className = el.className.replace(new RegExp("(^|\\s+)" + "cbp-tm-show" + "(\\s+|$)"), ' ');
				el.className = el.className.replace(new RegExp("(^|\\s+)" + "cbp-tm-show-below" + "(\\s+|$)"), ' ');
				el.className = el.className.replace(new RegExp("(^|\\s+)" + "cbp-tm-show-above" + "(\\s+|$)"), ' ');
			}

		},
		_handleClick : function( el, ev ) {
			var item = el.parentNode,
				items = Array.prototype.slice.call( this.menuItems ),
				submenu = item.querySelector( 'ul.mainMenuSubMenu' )

			// first close any opened one..
			if( typeof this.current !== 'undefined' &&  items.indexOf( item ) !== this.current ) {
				this._closeMenu( this.el.children[ this.current ] );
				this.el.children[ this.current ].querySelector( 'ul.mainMenuSubMenu' ).setAttribute( 'data-open', 'false' );
			}

			if( submenu ) {
				ev.preventDefault();

				var isOpen = submenu.getAttribute( 'data-open' );

				if( isOpen === 'true' ) {
					this._closeMenu( item );
					submenu.setAttribute( 'data-open', 'false' );
				}
				else {
					this._openMenu( item );
					this.current = items.indexOf( item );
					submenu.setAttribute( 'data-open', 'true' );
				}
			}

		},
		_positionMenu : function( el ) {
			// checking where's more space left in the viewport: above or below the element
			var vH = getViewportH(),
				ot = getOffset(el),
				spaceUp = ot.top ,
				spaceDown = vH - spaceUp - el.offsetHeight;
			
			return ( spaceDown <= spaceUp ? 'top' : 'bottom' );
		}
	}

	// add to global namespace
	window.cbpTooltipMenu = cbpTooltipMenu;

} )( window );



/*****************************************/
/* TIPS & NOTIFICATION FUNCTIONALITIES */
/*****************************************/
function addNewTip(title, description, icon, onClickFunc, tipID){
	//append new tip item to tipsList:
	var li = document.createElement('li');
	li.className = 'tipItem';
	if (typeof onClickFunc == 'function') {
		li.onclick = function(){
			//dismiss active tip:
			dismissActiveTip();
			//call the tips custom onClick function:
			onClickFunc();
		}
	}
	
	//icon: todo.
	var iconSpan = document.createElement('span');
	iconSpan.className = 'ui-icon ui-icon-alert';
	li.appendChild(iconSpan);
		
	li.innerHTML += '<strong>'+title+'</strong>' + '<p>' + description + '</p>';
	
	tipsList.appendChild(li);
	//console.log(tipsList.innerHTML);
	
	//if this is the first tip, then show and animate the tips button :
	var currentTipCount = $(tipsList).find('.tipItem').length;
	//console.log(currentTipCount);
	if(currentTipCount > 0){
		$(tipsButton).addClass('cbutton--click');
		$(tipsButton).fadeIn(600);
	}
	tipsButton.innerHTML = currentTipCount;
}

function ClearTips(){
	$(tipsList).empty();
}

function showTips(){
    $('#tipsContainer').show();
    tipsWindowOpen = true;
    $('#tailShadow').show();
    $('#tail1').show(); 
}

function hideTips(){
    $('#tipsContainer').hide();
    tipsWindowOpen = false;
    $('#tailShadow').hide();
    $('#tail1').hide(); 
}   

function toggleTips(){
    $('#tipsContainer').toggle('fade', 100);
    $('#tailShadow').toggle('fade', 100);
    $('#tail1').toggle('fade', 100);
    tipsWindowOpen = !tipsWindowOpen;
}

function showNotificationCenterScreen(notificationText) {
    ShowNotification(notificationText, 300, 300, 0);
}

function ShowNotification(contentHTML, offsetTop, offsetLeft, hideAfter) {

    //build notification object:
    var notification = new PopNotification({
        message: contentHTML,
        wrapper: document.getElementById('sideBarPusher'),
        hideAfterMillisonds: hideAfter,
        onClose: function () {
            activeTipNotificationInstance = null;
            dismissActiveTip();
        }
    });

    activeTipNotificationInstance = notification;

    //display and set location:
    notification.show(true, offsetTop, offsetLeft);
	
}

function dismissActiveTip() {
    if (activeTipNotificationInstance != null) {
        activeTipNotificationInstance.remove(true);
        activeTipNotificationInstance = null;
    }
    if (activeTipHighlightedRows != null && activeTipHighlightedRows.length != 0) {
        var len = activeTipHighlightedRows.length;
        for (var i = 0; i < len; i++) {
            if (activeTipHighlightedRows[i] != null) {
                activeTipHighlightedRows[i].style.background = '';
            }
        }
        activeTipHighlightedRows.length = 0; //clear list.
    }

    if (activeTipFilteredDatatableInstance != null) {
        //step5: clear the search box and redraw the page:
        activeTipFilteredDatatableInstance.search('').draw();
        activeTipFilteredDatatableInstance = null;
    }
}



/*****************************************/
/* TIPS & NOTIFICATION FUNCTIONALITIES */
/*****************************************/
function openOverlayLayout(width, height, closable, onCloseFunction, mainParent, disableBackground, addBackButtonForClosing){
	var backgroundDisabler = document.createElement('div');
	backgroundDisabler.className = 'backgroundDisabler';
	//$(backgroundDisabler);//.hide().fadeIn(60);
	
	if(mainParent == null){
		mainParent = document.body;
	}
	
	if(disableBackground != false){
		mainParent.appendChild(backgroundDisabler);
	}
	
	var overlayDiv = document.createElement('div');
	overlayDiv.className = 'overlayDiv';
	overlayDiv.style.width = width;
	overlayDiv.style.height = height;
	overlayDiv.backgroundDisabler = backgroundDisabler;
	
	if(height == '100%' && width == '100%'){
		overlayDiv.className += ' fullscreen-overlayDiv';
		overlayDiv.style.minWidth = $(mainParent).css('min-width');
		overlayDiv.style.minHeight = $(mainParent).css('min-height');
	}
	$(overlayDiv).hide().fadeIn(100);
	//document.body.appendChild(overlayDiv);
	backgroundDisabler.appendChild(overlayDiv);
	
	var closeButton;
	if(addBackButtonForClosing == true){
		closeButton = document.createElement('img');
		closeButton.className = 'overlayDivCloseButton backButton_image';
		//closeButton.innerHTML = 'x';
		closeButton.src = filesBaseDir + "/resources/back_with_text.png";
		closeButton.style.width = '58px';
		closeButton.style.height = '16px';
	}
	else{
		closeButton = document.createElement('div');
		closeButton.className = 'overlayDivCloseButton';
		closeButton.innerHTML = 'x';
	}
	
	closeButton.style.zIndex = '1000';
	closeButton.onclick = function(){
		if (typeof onCloseFunction == 'function') {
                onCloseFunction();
            }
		closeOverlayLayout(overlayDiv);
	};
	
	if(closable != null && closable == true){
		overlayDiv.appendChild(closeButton);
		overlayDiv.closeButton = closeButton;
	}
	
	return overlayDiv;
}

function closeOverlayLayout(element){
	if(element != null){
		if(element.backgroundDisabler != null){
			$(element.backgroundDisabler).remove();
		}
		$(element).remove();
	}
}



/*****************************************/
/* notification component functionality */
/*****************************************/
function PopNotification(options) {
	
	var self = this;
	this.options = options;
		
    //create notificaiton:
    var notification = document.createElement('div');
	this.notification = notification;
	
    notification.className = 'popNotification';
    notification.innerHTML = '<div>' + this.options.message + '</div>' + '<span class="notificationCloser">x</span>';

	// on close event:
    notification.querySelector('.notificationCloser').addEventListener('click', function () { self.remove(); });
	
    // append as first child:
    options.wrapper.insertBefore(notification, options.wrapper.firstChild);

    //auto hide after milliseconds?
    if (options.hideAfterMillisonds > 0) {
        this.timeoutFunc = setTimeout(function () { 
			if (self.isDisplayed) { 
				self.remove();
			}
		}, options.hideAfterMillisonds);
    }

}

PopNotification.prototype.show = function (draggable, offsetTop, offsetLeft) {
    this.isDisplayed = true;
    $(this.notification).removeClass('hidden');
    $(this.notification).addClass('shown');
	
	if(offsetTop != null) {
		$(this.notification).css('top', offsetTop);
	}
	if(offsetLeft != null) {
		$(this.notification).css('left', offsetLeft);
	}

	//make it draggable:
	if(draggable == true){
		$(this.notification).draggable({
			containment: "#mainReportsContainer",
			stack: ".drag",
			axis: "xy",
			//drag: function () {}
		});
	}
}

PopNotification.prototype.remove = function (noCallBack) {
	this.isDisplayed = false;
    
    clearTimeout(this.timeoutFunc);
    $(this.notification).removeClass('shown');
	
	var self = this;
    setTimeout(function () {
        $(self.notification).addClass('hidden');
        if (!noCallBack) { self.options.onClose(); }
    }, 25);

    // remove element after the close animation ends:
    var onEndAnimation = function (e) {
        if (support.animations && e.target == self.notification) {
            this.removeEventListener(animEndEventName, onEndAnimation);
        }
        self.options.wrapper.removeChild(this);
    };

    if (support.animations) {
        this.notification.addEventListener(animEndEventName, onEndAnimation);
    }
    else {
        onEndAnimation();
    }
}



/*****************************************/
/* Split View */
/*****************************************/
function SplitView(parent, showLeftSide, showRightSide, isLeftSideHidable, isRightSideHideable){
	var self = this;
	this.isLeftHidden = false;
	this.isRightHidden = false;
	this.leftHideButton = null;
	this.rightHideButton = null;
	
	//create the left view:
	var leftView = document.createElement('div');
	//leftView.className = 'srcCodeView';
	leftView.style.height = 'calc(100% - 0px)';
	//leftView.style.width = '50%';
	leftView.style.position = 'absolute';
	leftView.style.top = '0px';
	leftView.style.left = '0px';
	$(parent).append(leftView);
	this.leftView = leftView;
	
	//a "relative possitioned" content wrapper for the left view:
	var leftWrapper = document.createElement('div');
	leftWrapper.style.position = 'relative';
	leftWrapper.style.width = '100%';
	leftWrapper.style.height = '100%';
	leftWrapper.style.paddingLeft = '10px';
	leftWrapper.style.paddingRight = '10px';
	leftWrapper.style.paddingTop = '10px';
	leftView.appendChild(leftWrapper);
	this.leftWrapper = leftWrapper;
	
	
	//create the right view:
	var rightView = document.createElement('div');
	//rightView.className = 'srcCodeView';
	rightView.style.height = 'calc(100% - 0px)';
	//rightView.style.width = '50%';
	rightView.style.position = 'absolute';
	rightView.style.top = '0px';
	rightView.style.right = '0px';
	$(parent).append(rightView);
	this.rightView = rightView;
	
	//a "relative possitioned" content wrapper for the right view:
	var rightWrapper = document.createElement('div');
	rightWrapper.style.position = 'relative';
	rightWrapper.style.width = '100%';
	rightWrapper.style.height = '100%';
	rightWrapper.style.paddingLeft = '10px';
	rightWrapper.style.paddingRight = '10px';
	rightWrapper.style.paddingTop = '10px';
	rightView.appendChild(rightWrapper);
	this.rightWrapper = rightWrapper;
	
	
	//add a draggable seperator / resizer control in the middle:
	var divider = document.createElement('div');
	divider.style.height = '100%';
	divider.style.width = '6px';
	divider.style.background = 'gray';
	divider.style.position = 'absolute';
	//divider.style.zIndex = '9999999999';
	divider.style.top = '0px';
	//divider.style.left = 'calc(50% - 5px)';
	divider.style.cursor = 'e-resize';
	$(parent).append(divider);
	this.divider = divider;
	
	//make it draggable:
	$(divider).draggable({
		containment: parent,
		axis: "x",
		drag: function() {
			onDividerDragEvent();
		},
		stop: function() {
			onDividerDragEvent(true);
		}
	}); 
	
	//on seperator drag, apply resizing on views:
	function onDividerDragEvent(repositionDivider) {
		var dividerLeftOffset = $(divider).offset().left;
		var fullWidth = $(parent).width();
		var locationInPercentages = (dividerLeftOffset / fullWidth) * 100;
		console.log('dividerLeftOffset: ' + dividerLeftOffset + ', fullWidth:' + fullWidth + ' => locationInPercentages: ' + locationInPercentages );
		locationInPercentages = Math.round(locationInPercentages);
		self.setSplittingPercentage(locationInPercentages, repositionDivider);
	}
	
	
	//set the percentages of the views:
	if(showLeftSide == true && showRightSide == true)
	{
		this.setSplittingPercentage(50);
	}
	else
	{
		if(showLeftSide != true)
		{
			this.hideLeftSide();
		}
		if(showRightSide != true)
		{
			this.hideRightSide();
		}
	}
	
	
	//Hidables:
	if(isLeftSideHidable == true)
	{
		this.leftHideButton = createHideButton();
		this.leftHideButton.onclick = function() { self.hideLeftSide(); }
		this.getLeftView().appendChild(this.leftHideButton);
	}
	
	if(isRightSideHideable == true)
	{
		this.rightHideButton = createHideButton();
		this.rightHideButton.onclick = function() { self.hideRightSide(); }
		this.getRightView().appendChild(this.rightHideButton);
	}
	
	
	
	function createHideButton() {
		var button = document.createElement('div');
		button.className = 'splitView closeButton'
		button.innerHTML = 'X';
		return button;
	}

}

SplitView.prototype.getLeftView = function() {
	return this.leftWrapper;
}

SplitView.prototype.getRightView = function() {
	return this.rightWrapper;
}

SplitView.prototype.IsLeftViewShown = function() {
	return !this.isLeftHidden;
}

SplitView.prototype.IsRightViewShown = function() {
	return !this.isRightHidden;
}

SplitView.prototype.setSplittingPercentage = function (leftViewPercentage, repositionDivider) {
	if(repositionDivider == null)
	{
		repositionDivider = true;
	}
	
	this.leftView.style.width = leftViewPercentage + '%';
	this.rightView.style.width = (100 - leftViewPercentage) + '%';
		
	if(repositionDivider == true)
	{
		this.divider.style.left = 'calc(' + leftViewPercentage + '% - 5px)';
	}
}

SplitView.prototype.hideLeftSide = function () {
	if(this.isLeftHidden == true || this.isRightHidden == true)
	{
		return;
	}
	
	this.hideDivider();
	this.isLeftHidden = true;
	this.setSplittingPercentage(0);
	this.leftView.style.display = 'none';
}

SplitView.prototype.showLeftSide = function () {
	if(this.isLeftHidden == false)
	{
		return;
	}
	
	this.showDivider();
	this.isLeftHidden = false;
	if(this.isRightHidden == true)
	{
		this.setSplittingPercentage(100);
	}
	else
	{
		this.setSplittingPercentage(50);
	}
	this.leftView.style.display = '';
}

SplitView.prototype.hideRightSide = function () {
	if(this.isLeftHidden == true || this.isRightHidden == true)
	{
		return;
	}
	
	this.hideDivider();
	this.isRightHidden = true;
	this.setSplittingPercentage(100);
	this.rightView.style.display = 'none';
}

SplitView.prototype.showRightSide = function () {
	if(this.isRightHidden == false)
	{
		return;
	}
	
	this.showDivider();
	this.isRightHidden = false;
	if(this.isLeftHidden == true)
	{
		this.setSplittingPercentage(0);
	}
	else
	{
		this.setSplittingPercentage(50);
	}
	this.rightView.style.display = '';
}

SplitView.prototype.showDivider = function () {
	this.divider.style.display = '';
}

SplitView.prototype.hideDivider = function () {
	this.divider.style.display = 'none';
}



/*****************************************/
/* Extensions */
/*****************************************/
if (typeof String.prototype.startsWith != 'function') {
  // see below for better implementation!
  String.prototype.startsWith = function (str){
    return this.indexOf(str) === 0;
  };
}


