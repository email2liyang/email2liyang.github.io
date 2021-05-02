(function () {
  self.addEventListener('message', function (e) {
        var workerArgs = e.data;
        //console.log("Received message: " + JSON.stringify(workerArgs))
        self.importScripts(workerArgs.gwtModuleUrl + "lunr.min.js");

        var index = lunr(function () {
          this.ref(workerArgs.ref);

          var fieldsLength = workerArgs.fields.length;
          workerArgs.fields.forEach(function (field, fieldIndex) {
            var fieldBoost = fieldsLength * 2 - fieldIndex * 2 - 1
            this.field(field, {boost: fieldBoost});
          }, this);

          this.metadataWhitelist = ['position']

          var documents = workerArgs.documents;
          documents.forEach(function (doc) {
            this.add(doc)
          }, this);
        });
        postMessage(JSON.stringify(index.toJSON()));
      }, false
  );

}());
