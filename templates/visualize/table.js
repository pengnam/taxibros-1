var pacInputCount = 0, datetimepickerCount = 0;

function createPacInput(cell, isCallGenLoc, innerText) {
  var input = document.createElement('input');
  input.setAttribute('id', 'pac-input' + pacInputCount);
  input.setAttribute('class', 'controls td-height');
  input.setAttribute('type', 'text');
  input.setAttribute('placeholder', 'Search Google Maps');
  cell.appendChild(input);
  if (innerText !== undefined) {
    input.value = innerText;
    input.innerText = innerText;
  }
  initAutocomplete(input, isCallGenLoc);
  pacInputCount++;
}

function createDatetimepicker(cell, innerText) {
  var input = document.createElement('input');
  input.setAttribute('type', 'text');
  input.setAttribute('class', 'form-control td-height');
  input.setAttribute('id', 'datetimepicker' + datetimepickerCount);
  input.setAttribute('placeholder', 'Pick a date');
  cell.appendChild(input);
  if (innerText !== undefined) {
    $('#datetimepicker' + datetimepickerCount).datetimepicker({
      format: 'YYYY/MM/DD HH:mm:ss',
      date: innerText
    }).on('dp.hide', function(e) {
      input.innerText = moment(e.date).format('YYYY/MM/DD HH:mm:ss');
      updateTable();
    });
    input.innerText = innerText;
  } else {
    $('#datetimepicker' + datetimepickerCount).datetimepicker({
      format: 'YYYY/MM/DD HH:mm:ss'
    }).on('dp.hide', function(e) {
      input.innerText = moment(e.date).format('YYYY/MM/DD HH:mm:ss');
      updateTable();
    });
  }
  datetimepickerCount++;
}

function createHiddenText(innerText) {
  var span = document.createElement('span');
  span.setAttribute('class', 'hide');
  if (innerText !== undefined) {
    span.innerText = innerText;
  }
  return span;
}

function createDeleteRowButton(cell) {
  var input = document.createElement('input');
  input.setAttribute('type', 'button');
  input.setAttribute('class', 'deleteRow td-height');
  input.setAttribute('value', 'Delete');
  cell.appendChild(input);
}

function addRow(pickupLocationInnerText, pickupTimeInnerText, arrivalLocationInnerText, arrivalTimeInnerText, walkpathGeomInnerText, walkpathInstructionsInnerText, pickupLatLngInnerText, pickupTaxiCoordsInnerText) {
  var row = itineraryTable.getElementsByTagName('tbody')[0].insertRow(-1);
  var pickupLocationCell = row.insertCell(0);
  var pickupTimeCell = row.insertCell(1);
  var arrivalLocationCell = row.insertCell(2);
  var arrivalTimeCell = row.insertCell(3);
  var deleteRowButtonCell = row.insertCell(4);
  var walkpathGeomCell = row.insertCell(5);
  var walkpathInstructionsCell = row.insertCell(6);
  var pickupLatLngCell = row.insertCell(7);
  var pickupTaxiCoordsCell = row.insertCell(8);

  createDeleteRowButton(deleteRowButtonCell);
  walkpathGeomCell.appendChild(createHiddenText(walkpathGeomInnerText));
  walkpathInstructionsCell.appendChild(createHiddenText(walkpathInstructionsInnerText));
  pickupLatLngCell.appendChild(createHiddenText(pickupLatLngInnerText));
  pickupTaxiCoordsCell.appendChild(createHiddenText(pickupTaxiCoordsInnerText));

  createPacInput(pickupLocationCell, true, pickupLocationInnerText);
  createDatetimepicker(pickupTimeCell, pickupTimeInnerText);
  createPacInput(arrivalLocationCell, false, arrivalLocationInnerText);
  createDatetimepicker(arrivalTimeCell, arrivalTimeInnerText);
  updateTable();
}

function deleteRow(){
  var tr = $(this).closest('tr');
  unsetPickup(tr.children('td:first').attr('id'));
  tr.remove();
  updateTable();
}

function updateTable() {
  $('#itineraryTable').trigger('update')
  $('#itineraryTable').tableExport().update({
    headings: true,
    footers: true,
    formats: ['csv'],
    filename: 'taxibros',
    bootstrap: true,
    position: "bottom",
    ignoreCols: 4,
    trimWhitespace: false
  });
}

function importFromCsvChange(e) {
  Papa.parse(e.target.files[0], {
    error: function(err, file, inputElem, reason) {
      alert('Papaparse ' + err + reason);
    },
    complete: function(e) {
      importToItineraryTable(e.data);
    }
  });
}

function importToItineraryTable(data) {
  // Clear tbody.
  $("#itineraryTable > tbody").empty();
  // Skip th.
  data.slice(1).forEach(row =>
    addRow.apply(null, row)
  );
  updateTable();
}

$(document).ready(function() {
  $('#addRow').on('click', function() {
    addRow();
  });
  $('#itineraryTable').on('click', '.deleteRow', deleteRow);
  $('#importFromCsv').on('change', importFromCsvChange);
  TableExport.prototype.formatConfig.csv.buttonContent = 'Export';

  $('#itineraryTable').tablesorter({
    widthFixed: true,
    widgets: [
      'zebra',
    ],
  }).tablesorterPager({
      container: $("#pager"),
  });

  addRow();
});

