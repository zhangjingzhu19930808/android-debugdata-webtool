$(document).ready(function () {
	getDBList();
	$("#query").keypress(function (e) {
		if (e.which == 13) {
			queryFunction();
		}
	});
	//update currently selected database
	$(document).on("click", "#db-list .list-group-item", function () {
		$("#db-list .list-group-item").each(function () {
			$(this).removeClass('selected');
		});
		$(this).addClass('selected');
	});
	$(document).on("click", "#btnAll>div", function () {
		$("#pane_show>div").each(function () {
			$(this).hide();
		});
		$("#pane_show>div")
	});
	$(document).on("click", "#db-list .list-group-item", function () {
		$("#db-list .list-group-item").each(function () {
			$(this).removeClass('selected');
		});
		$(this).addClass('selected');
	});
	$(document).on("click", "#db-list .list-group-item", function () {
		$("#db-list .list-group-item").each(function () {
			$(this).removeClass('selected');
		});
		$(this).addClass('selected');
	});

	//update currently table database
	$(document).on("click", "#table-list .list-group-item", function () {
		$("#table-list .list-group-item").each(function () {
			$(this).removeClass('selected');
		});
		$(this).addClass('selected');
	});


});

var isDatabaseSelected = true;

function getData(datas) {
	var dataSplit=datas.split(",")
	$.ajax({
		type: "POST",
		url: "http://192.168.1.15:8088",
		crossDomain:true,
		data: JSON.stringify(
				{
					action : "getDataFromDbTable",
					database:dataSplit[0],
					tableName : dataSplit[1],
				}
				),
		contentType: "application/json; charset=utf-8",
		dataType: "json",
	 success: function (result) {
			inflateData(result);
		}
	});

}

function queryFunction() {

	var query = $('#query').val();

	$.ajax({
		url: "query?query=" + escape(query), success: function (result) {

			result = JSON.parse(result);
			inflateData(result);

		}
	});

}

function downloadDb() {
	if (isDatabaseSelected) {
		$.ajax({
			url: "downloadDb", success: function () {
				window.location = 'downloadDb';
			}
		});
	}
}


function getDBList() {

	$.ajax({
		type: "POST",
		url: "http://192.168.1.15:8088",
		crossDomain:true,
		data: JSON.stringify({action: "getDbList"}),
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function (result) {
			if (result.code == 200) {
				var dbList = result.dbList;

				$('#db-list').empty();
				var isSelectionDone = false;
				for (var count = 0; count < dbList.length; count++) {
						$("#db-list").append("<a href='#' id=" + dbList[count] + " class='list-group-item' onClick='openDatabaseAndGetTableList(\"" + dbList[count] + "\");'>" + dbList[count] + "</a>")
						;}
						if (!isSelectionDone) {
							isSelectionDone = true;
							$('#db-list').find('a').trigger('click');
						}
					}
		}
	});


}


function openDatabaseAndGetTableList(db) {

	if ("APP_SHARED_PREFERENCES" == db) {
		$('#run-query').removeClass('active');
		$('#run-query').addClass('disabled');
		$('#selected-db-info').removeClass('active');
		$('#selected-db-info').addClass('disabled');
		isDatabaseSelected = false;
		$("#selected-db-info").text("SharedPreferences");
	} else {
		$('#run-query').removeClass('disabled');
		$('#run-query').addClass('active');
		$('#selected-db-info').removeClass('disabled');
		$('#selected-db-info').addClass('active');
		isDatabaseSelected = true;
		$("#selected-db-info").text("点击数据库名称下载 : " + db);
	}
	$.ajax({
		type: "POST",
		crossDomain:true,
		url: "http://192.168.1.15:8088",
		data: JSON.stringify({
			action : "getTableList",
			database :db
		}),
		contentType: "application/json; charset=utf-8",
		dataType: "json",
	 success: function (result) {
			if (result.code == 200) {
				var tableList = result.tableList;
				var dbVersion = result.dbVersion;
				$("#selected-db-info").text("点击数据库名称下载 : " + db + " Version : " + dbVersion);
				$('#table-list').empty()
				for (var count = 0; count < tableList.length; count++) {
					var tableName = tableList[count];
					var datas = [db,tableName]
					$("#table-list").append("<a href='#' data-db-name='" + db + "' data-table-name='" + tableName + "' class='list-group-item' onClick='getData(\""+ datas+ "\");'>" + tableName + "</a>");
				}
			} else {
				showErrorInfo(result.msg);
			}

		}
	});

}

function inflateData(result) {

	if (result.code == 200) {
     if(!result.isSelectQuery){
		showSuccessInfo("查询成功");
     }
		console.info(result)
		var columnHeader = result.tableData.tableColumns;
		var columnData = result.tableData.tableDatas;

		
		// set function to return cell data for different usages like set, display, filter, search etc..
		for (var i = 0; i < columnHeader.length; i++) {
			columnHeader[i]['targets'] = i;
			columnHeader[i]['data'] = function (data, type, val, meta) {
				return data[meta.col].value;
			}
		}

		var tableId = "#db-data";
		if ($.fn.DataTable.isDataTable(tableId)) {
			$(tableId).DataTable().destroy();
		}

		$("#db-data-div").remove();
		$("#parent-data-div").append('<div id="db-data-div"><table class="display nowrap" cellpadding="0" border="0" cellspacing="0" width="100%" class="table table-striped table-bordered display" id="db-data"></table></div>');

		var availableButtons;
		if (result.editable) {
			availableButtons = [
				{
					text: '添加',
					name: 'add' // don not change name
				},
				{
					extend: 'selected', // Bind to Selected row
					text: '编辑',
					name: 'edit'        // do not change name
				},
				{
					extend: 'selected',
					text: '删除',
					name: 'delete'
				}
			];
		} else {
			availableButtons = [];
		}
		 var changecolumnData =[]
		for(var i =0;i<columnData.length;i++){
			changecolumnData[i]	=columnData[i].map(function (item,index) {
				return 	item = {value:item }
			})
		}

		$(tableId).dataTable({
			"data": changecolumnData,
			"columnDefs": columnHeader,
			'bPaginate': true,
			'searching': true,
			'bFilter': true,
			'bInfo': true,
			"bSort": true,
			"scrollX": true,
			"iDisplayLength": 10,
			"dom": "Bfrtip",
			select: 'single',
			altEditor: true,     // Enable altEditor
			buttons: availableButtons
		})

		//attach row-updated listener
		$(tableId).on('update-row.dt', function (e, updatedRowData, callback) {
			console.log(typeof updatedRowData,updatedRowData)
			var updatedRowDataArray =JSON.parse(updatedRowData);
			//add value for each column
			var data = columnHeader;

			for (var i = 0; i < data.length; i++) {
				data[i].value = updatedRowDataArray[i].value;
				data[i].dataType = data[i].dataType;
			}
			//send update table data request to server
			updateTableData(data, callback);
		});


		//attach delete-updated listener
		$(tableId).on('delete-row.dt', function (e, updatedRowData, callback) {
			var deleteRowDataArray = JSON.parse(updatedRowData);

			console.log(deleteRowDataArray);

			//add value for each column
			var data = columnHeader;
			for (var i = 0; i < data.length; i++) {
				data[i].value = deleteRowDataArray[i].value;
				data[i].dataType = deleteRowDataArray[i].dataType;
			}

			//send delete table data request to server
			deleteTableData(data, callback);
		});


		$(tableId).on('add-row.dt', function (e, updatedRowData, callback) {
			var deleteRowDataArray = JSON.parse(updatedRowData);
			console.log(deleteRowDataArray,123789);
			//add value for each column
			var data = columnHeader;
			for (var i = 0; i < data.length; i++) {
				data[i].value = deleteRowDataArray[i].value;
				data[i].dataType = deleteRowDataArray[i].dataType;
			}

			//send delete table data request to server
			console.error(data)
			addTableData(data, callback);
		});

		// hack to fix alignment issue when scrollX is enabled
		$(".dataTables_scrollHeadInner").css({"width": "100%"});
		$(".table ").css({"width": "100%"});
	} else {
//      if(!result.isSelectQuery){
//         showErrorInfo("查询失败");
//      }else {
//         showErrorInfo("发生未知错误");
//      }
		showErrorInfo(result.msg);
	}

}

//send update database request to server
function updateTableData(updatedData, callback) {
	//get currently selected element
	var selectedTableElement = $("#table-list .list-group-item.selected");

	var filteredUpdatedData = updatedData.map(function (columnData) {
		return {
			title: columnData.title,
			isPrimary: columnData.primary,
			value: columnData.value,
			dataType: columnData.dataType
		}
	});
	//build request parameters
	var requestParameters = {};
	requestParameters.action = "updateDataToDb"
	requestParameters.database = selectedTableElement.attr('data-db-name');
	requestParameters.tableName = selectedTableElement.attr('data-table-name');
	requestParameters.RowDataRequests = filteredUpdatedData
console.log(requestParameters,requestParameters.RowDataRequests)
	//execute request
	$.ajax({
		url: "http://192.168.1.15:8088",
		type: 'POST',
		data: JSON.stringify(requestParameters),
		success: function (response) {
			if (response.code == 200) {
				console.log("数据更新成功");
				callback(true);
				showSuccessInfo("数据更新成功");
				getData( requestParameters.database+","+requestParameters.tableName);


			} else {
				console.log("数据更新失败");
				showErrorInfo(response.msg)
				callback(false);
			}
		}
	})
}


function deleteTableData(deleteData, callback) {

	var selectedTableElement = $("#table-list .list-group-item.selected");
	var filteredUpdatedData = deleteData.map(function (columnData) {
		return {
			title: columnData.title,
			isPrimary: columnData.primary,
			value: columnData.value,
			dataType: columnData.dataType
		}
	});

	//build request parameters
	var requestParameters = {};
	requestParameters.action =  "deleteDataFromDb"
	requestParameters.database = selectedTableElement.attr('data-db-name');
	requestParameters.tableName = selectedTableElement.attr('data-table-name');
	requestParameters.RowDataRequests = filteredUpdatedData

	//execute request
	$.ajax({
		url: "http://192.168.1.15:8088",
		type: 'POST',
		data:JSON.stringify(requestParameters) ,
		success: function (response) {
			if (response.code == 200) {
				console.log("数据删除成功");
				callback(true);
				getData( requestParameters.database+","+requestParameters.tableName);
				showSuccessInfo("数据删除成功");
			} else {
				console.log("数据删除失败");
				showErrorInfo(response.msg)
				callback(false);
			}
		}
	})
}

function addTableData(deleteData, callback) {

	var selectedTableElement = $("#table-list .list-group-item.selected");
	var filteredUpdatedData = deleteData.map(function (columnData) {
		return {
			title: columnData.title,
			isPrimary: columnData.primary,
			value: columnData.value,
			dataType: columnData.dataType
		}
	});

	//build request parameters
	var requestParameters = {
		"action":  "addDataToDb",
		"database":   "",
		"tableName":  "",};
	requestParameters.database = selectedTableElement.attr('data-db-name');
	requestParameters.tableName = selectedTableElement.attr('data-table-name');
	;
	requestParameters.RowDataRequests =filteredUpdatedData

	console.log(requestParameters);

	//execute request
	$.ajax({
		url: "http://192.168.1.15:8088",
		type: 'POST',
		data:JSON.stringify(requestParameters),
		success: function (response) {
			if (response.code == 200) {
				console.log("数据添加成功");
				callback(true);
				getData( requestParameters.database+","+requestParameters.tableName);
				showSuccessInfo("数据添加成功");
			} else {
				console.log("数据添加失败");
				showErrorInfo(response.msg)

				callback(false);
			}
		}
	});
}

function showSuccessInfo(message) {
	var snackbarId = "snackbar";
	var snackbarElement = $("#" + snackbarId);
	snackbarElement.addClass("show");
	snackbarElement.css({"backgroundColor": "#5cb85c"});
	snackbarElement.html(message)
	setTimeout(function () {
		snackbarElement.removeClass("show");
	}, 3000);
}

function showErrorInfo(message) {
	var snackbarId = "snackbar";
	var snackbarElement = $("#" + snackbarId);
	snackbarElement.addClass("show");
	snackbarElement.css({"backgroundColor": "#d9534f"});
	snackbarElement.html('')
	snackbarElement.html(message)
	setTimeout(function () {
		snackbarElement.removeClass("show");
	}, 3000);
}
