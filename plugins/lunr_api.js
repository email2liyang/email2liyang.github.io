var LUNR_INDEX_JSON_KEY = "lunr_index_json";

var lunrIndex;
var lunrWorker;

function createLunrIndex(indexingRequest) {
  if (typeof (indexingRequest.gwtModuleUrl) == "undefined") {
    console.log("No 'gwtModuleUrl' specified");
    return;
  }
  var workerUrl = indexingRequest.gwtModuleUrl + "lunr_worker.js";
  if (typeof (lunrWorker) == "undefined") {
    console.log("Creating index: workerUrl=" + workerUrl);
    lunrWorker = new Worker(workerUrl);
  }
  lunrWorker.onmessage = function (event) {
    var indexJson = event.data;
    addIndexJsonToCache(indexJson);

    lunrIndex = lunr.Index.load(JSON.parse(indexJson));
    console.log("Created index.");

    lunrWorker.terminate();
    lunrWorker = undefined;
  };

  var documents = JSON.parse(indexingRequest.documentsJson);
  // The fields need to be cloned before sending to the web worker
  var fieldsJson = JSON.stringify(indexingRequest.fields);
  var fields = JSON.parse(fieldsJson);

  //console.log("Creating workerArgs - fields: " + fieldsJson);
  // Start the worker by giving it the documents to index
  var workerArgs = {
    "gwtModuleUrl": indexingRequest.gwtModuleUrl,
    "ref": indexingRequest.ref,
    "fields": fields,
    "documents": documents
  };
  //console.log("Created workerArgs: " + JSON.stringify(workerArgs));
  lunrWorker.postMessage(workerArgs);
}

function loadLunrIndex(serializedIndex) {
  lunrIndex = lunr.Index.load(JSON.parse(serializedIndex));
  console.log("Loaded index.");
}

function isLunrIndexReady() {
  if (typeof (lunrIndex) == "undefined") {
    console.log("No index created");
    return false;
  }
  return true;
}

function searchLunr(keyword) {
  var result;
  if (isLunrIndexReady()) {
    result = lunrIndex.search(keyword);
  }
  return result;
}

function addIndexJsonToCache(indexJson) {
  if (typeof (Storage) !== "undefined") {
    window.localStorage.setItem(LUNR_INDEX_JSON_KEY, indexJson);
  } else {
    console.log("Your browser doesn't support local storage");
  }
}

function getIndexJsonFromCache() {
  if (typeof (Storage) !== "undefined") {
    return window.localStorage.getItem(LUNR_INDEX_JSON_KEY);
  } else {
    console.log("Your browser doesn't support local storage");
  }
}

// Build index from local storage cache
(function () {
  var indexJson = getIndexJsonFromCache();
  if (typeof (indexJson) == "undefined" || indexJson === null) {
    console.log("No index JSON found");
    return;
  }

  loadLunrIndex(indexJson);
}());
