(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("es6-promise"), require("popsicle"), require("deepmerge"), require("blueimp-md5"));
	else if(typeof define === 'function' && define.amd)
		define(["es6-promise", "popsicle", "deepmerge", "blueimp-md5"], factory);
	else if(typeof exports === 'object')
		exports["Clarifai"] = factory(require("es6-promise"), require("popsicle"), require("deepmerge"), require("blueimp-md5"));
	else
		root["Clarifai"] = factory(root["es6-promise"], root["popsicle"], root["deepmerge"], root["blueimp-md5"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_70__, __WEBPACK_EXTERNAL_MODULE_71__, __WEBPACK_EXTERNAL_MODULE_72__, __WEBPACK_EXTERNAL_MODULE_73__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _createClass = __webpack_require__(1)['default'];

	var _classCallCheck = __webpack_require__(5)['default'];

	var _get = __webpack_require__(6)['default'];

	var _inherits = __webpack_require__(19)['default'];

	var _Promise = __webpack_require__(30)['default'];

	Object.defineProperty(exports, '__esModule', {
	  value: true
	});
	__webpack_require__(70).polyfill();
	var request = __webpack_require__(71);
	var merge = __webpack_require__(72);
	var md5 = __webpack_require__(73);

	// url regex from https://gist.github.com/dperini/729294
	var re_weburl = new RegExp("^" +
	// protocol identifier
	"(?:(?:https?|ftp)://)" +
	// user:pass authentication
	"(?:\\S+(?::\\S*)?@)?" + "(?:" +
	// IP address exclusion
	// private & local networks
	"(?!(?:10|127)(?:\\.\\d{1,3}){3})" + "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" + "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
	// IP address dotted notation octets
	// excludes loopback network 0.0.0.0
	// excludes reserved space >= 224.0.0.0
	// excludes network & broacast addresses
	// (first & last IP address of each class)
	"(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" + "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" + "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" + "|" +
	// host name
	'(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)' +
	// domain name
	'(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*' +
	// TLD identifier
	'(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))' + ")" +
	// port number
	"(?::\\d{2,5})?" +
	// resource path
	"(?:/\\S*)?" + "$", "i");

	function isUrl(text) {
	  return re_weburl.test(text);
	}

	function stripHeader(b64) {
	  return b64.substring(b64.indexOf(',') + 1);
	}

	function parseAnnotationSets(annotationSets) {
	  var tags = {};
	  var annotationSet, namespace, annotations, annotation, tagId;
	  for (var i = 0; i < annotationSets.length; i++) {
	    annotationSet = annotationSets[i];
	    namespace = annotationSet.namespace;
	    annotations = annotationSet.annotations;
	    for (var j = 0; j < annotations.length; j++) {
	      annotation = annotations[j];
	      if ('tag' in annotation) {
	        tagId = annotation.tag.cname;
	        if (!tags.hasOwnProperty(tagId)) {
	          // will override default properties
	          tags[tagId] = {
	            id: tagId,
	            name: tagId,
	            sources: {}
	          };
	        }
	        tags[tagId]['sources'][namespace] = {
	          score: annotation.score,
	          status: annotation.status || {}
	        };
	      }
	    }
	  }
	  return tags;
	}

	function Oauth2(argsObj) {
	  this.args = new Arg().requires('id', 'secret', 'tokenUrl').defaults({
	    grantType: 'client_credentials',
	    secretKey: 'client_secret',
	    idKey: 'client_id',
	    grantKey: 'grant_type'
	  }).parse(argsObj);
	  this.token = undefined;
	}

	Oauth2.prototype.authenticate = function authenticate(renewToken) {
	  return this.getToken(renewToken).then(this.getHeaders.bind(this));
	};

	Oauth2.prototype.getToken = function getToken(renew) {
	  if (!renew && this.token !== undefined) return _Promise.resolve(this.token);

	  var a = this.args;
	  var q = {};
	  q[a.grantKey] = a.grantType;
	  q[a.secretKey] = a.secret;
	  q[a.idKey] = a.id;

	  var _this = this;
	  return request({
	    url: a.tokenUrl,
	    method: 'POST',
	    query: q,
	    headers: { 'content-length': 0 }
	  }).then(function (response) {
	    if (response.status === 401) throw "Could not get access token";

	    _this.token = response.body.access_token;
	    return _this.token;
	  });
	};

	Oauth2.prototype.getHeaders = function getHeaders(token) {
	  return {
	    headers: {
	      'Authorization': 'Bearer ' + token
	    }
	  };
	};

	/**
	 *  ## UrlResolver
	 *
	 * @param {object} config
	 * @param {string} [config.baseUrl=""] base url
	 * @param {object} config.routes object of the form
	 * ```js
	 * {
	 *   resourceName: "path/<paramKey>",
	 *   anotherResource: "<paramKey2>/new"
	 * }
	 * ```
	 */
	function UrlResolver(config) {
	  this.baseUrl = config.baseUrl || "";
	  this.routes = config.routes;
	  this.variableRegex = /<\w+>/g;
	}

	/**
	 * ## UrlResolver.prototype.routeFor
	 * ```js
	 *   var url = resolver.routeFor('user', {userId: 'foobar'});
	 * ```
	 * @param {string} resource Name of the resource
	 * @param {object} params Map from url param key to value
	 * @returns {string}
	 *
	 */
	UrlResolver.prototype.routeFor = function routeFor(resource, params) {
	  return this.baseUrl + this.fillParams(this.routes[resource], params);
	};

	UrlResolver.prototype.fillParams = function fillParams(route, params) {
	  var _this = this;
	  return route.replace(this.variableRegex, function (variable) {
	    return _this.varToParam(variable, params);
	  });
	};

	UrlResolver.prototype.varToParam = function varToParam(variable, params) {
	  var name = variable.substring(1, variable.length - 1);
	  if (!(name in params)) throw name + " was not provided to the url resolver";
	  return params[name];
	};

	function Arg(defaults, required, argObj) {
	  this.def = defaults || {};
	  this.req = required || [];

	  if (argObj !== undefined) {
	    return this.parse(argObj);
	  }
	}

	Arg.prototype.parse = function parse(argObj) {
	  var args = merge(this.def, argObj);

	  var arg;
	  if (this.req !== undefined) {
	    for (var i = 0; i < this.req.length; i++) {
	      arg = this.req[i];
	      if (arg instanceof Array) {
	        if (!any(arg.map(function (a) {
	          return a in args && args[a] !== undefined;
	        }))) {
	          throw "At least one of the following arguments must be supplied: " + arg;
	        }
	      } else if (!(arg in args)) {
	        throw 'Required argument missing: ' + arg;
	      }
	    }
	  }

	  return args;
	};

	Arg.prototype.requires = function requires() {
	  this.req = Array.prototype.slice.call(arguments);
	  return this;
	};

	Arg.prototype.defaults = function defaults(args) {
	  this.def = args;
	  return this;
	};

	function shallowMerge() {
	  var objects = toArray(arguments);
	  var merged = {};

	  for (var i = 0; i < objects.length; i++) {
	    var obj = objects[i];
	    for (var key in obj) {
	      if (obj.hasOwnProperty(key)) {
	        merged[key] = obj[key];
	      }
	    }
	  }
	  return merged;
	}

	function whichIn(identifiers, item) {
	  var presentIds = [];
	  for (var i = 0; i < identifiers.length; i++) {
	    var identifier = identifiers[i];
	    if (identifier in item) {
	      presentIds.push(identifier);
	    }
	  }
	  return presentIds;
	}

	var setIfDefined = function setIfDefined(obj, propName, value, chainReturn) {
	  if (value !== undefined) {
	    obj[propName] = value;
	    return chainReturn || obj;
	  } else {
	    return obj[propName];
	  }
	};

	function RequestHandler(args) {
	  args = args || {};
	  if ('auth' in args) {
	    this.setAuth(args.auth);
	  }

	  this.maxAttempts = args.maxAttempts || 1;
	  this.backoffTime = args.backoffTime || 200;

	  var _this = this;
	  this.errorHandlers = {};
	  // register default error handlers
	  this.onError('default', function (error, requestObj) {
	    return new _Promise(function (resolve) {
	      setTimeout(function () {
	        resolve(requestObj);
	      }, _this.backoffTime);
	    });
	  });
	  this.onError(401, function (error, requestObj) {
	    return _this.authenticate(requestObj, true);
	  });
	}

	RequestHandler.prototype.setAuth = function setAuth(auth) {
	  this.auth = auth;
	};

	/**
	 * ## RequestHandler.prototype.request
	 * @param requestObj Fetch API compliant request object
	 */
	RequestHandler.prototype.request = function request(requestObj) {
	  if (requestObj.headers === undefined) {
	    requestObj.headers = {};
	  }
	  requestObj.headers['content-length'] = 0;

	  return this.modifyRequest(requestObj).then(this._request.bind(this));
	};

	/**
	 * Attempts to successfully perform the request by recursively retrying failed attempts
	 * @param requestObj
	 * @param numAttempts
	 * @param maxAttempts
	 * @returns {Promise|*}
	 * @private
	 */
	RequestHandler.prototype._request = function _request(requestObj, numAttempts, maxAttempts) {
	  numAttempts = numAttempts || 1;
	  maxAttempts = maxAttempts || this.maxAttempts;

	  var _this = this;
	  return this.performRequest(requestObj).then(this.verifyResponse.bind(this)) // verify response might turn it into an error
	  ['catch'](function (error) {
	    if (maxAttempts <= numAttempts) {
	      return _Promise.reject(error);
	    }

	    return _this.handleError(error, requestObj).then(function (requestObj) {
	      return _this._request(requestObj, ++numAttempts, maxAttempts);
	    });
	  });
	};

	/**
	 * Checks if a response is valid before returning it to the user.
	 * If it's not then turns it into an error.
	 * Current implementation considers responses with HTTP status codes > 299 as errors.
	 * @param response
	 * @returns {*}
	 */
	RequestHandler.prototype.verifyResponse = function verifyResponse(response) {
	  if (300 <= response.status) {
	    var error = response.error("HTTP status error: " + response.status);
	    error.status = response.status;
	    return _Promise.reject(error);
	  } else {
	    return response;
	  }
	};

	RequestHandler.prototype.performRequest = function performRequest(requestObj) {
	  return request(requestObj);
	};

	/**
	 * Attach a handler for an error identified by errorId
	 * @param errorId
	 * @param handle A function which takes in (error, requestObj) and returns a [new] requestObj to
	 *  retry the request with
	 */
	RequestHandler.prototype.onError = function onError(errorId, handle) {
	  this.errorHandlers[errorId] = handle;
	};

	/**
	 * Attempts to handle an error using one of the registered handler
	 *
	 * @param error
	 * @param requestObj
	 * @returns requestObj A potentially modified request objects to retry the request with
	 */
	RequestHandler.prototype.handleError = function handleError(error, requestObj) {
	  var handle = this.getErrorHandler(error);
	  return handle(error, requestObj);
	};

	/**
	 * Attempts to find an error handler for the given error. If none are found defaults to a timeout.
	 * @param error
	 * @returns {*}
	 */
	RequestHandler.prototype.getErrorHandler = function getErrorHandler(error) {
	  if ('name' in error && error.name in this.errorHandlers) {
	    return this.errorHandlers[error.name];
	  }

	  if ('status' in error && error.status in this.errorHandlers) {
	    return this.errorHandlers[error.status];
	  }

	  // errors returned by popsicle have flag variables to identify their type
	  var popsicleErrorTypes = ['parse', 'abort', 'timeout', 'unavailable', 'blocked', 'csp'];
	  var errorIds = whichIn(popsicleErrorTypes, error);
	  if (errorIds.length && errorIds[0] in this.errorHandlers) {
	    return this.errorHandlers[errorIds[0]];
	  }

	  return this.errorHandlers['default'];
	};

	/**
	 * Hook to allow additional processing of the request object
	 * @param requestObj
	 */
	RequestHandler.prototype.modifyRequest = function modifyRequest(requestObj) {
	  return this.authenticate(requestObj);
	};

	RequestHandler.prototype.authenticate = function authenticate(requestObj, reauthenticate) {
	  if (this.auth !== undefined) {
	    return this.auth.authenticate(reauthenticate).then(function (authParams) {
	      return merge(requestObj, authParams);
	    });
	  } else {
	    return new _Promise(function (resolve) {
	      return resolve(requestObj);
	    });
	  }
	};

	var curatorAPIResolver = new UrlResolver({
	  baseUrl: "https://api-alpha.clarifai.com/v1/curator/",
	  routes: {
	    collectionDetail: "collections/<collectionId>",
	    collectionList: "collections",
	    documentDetail: "collections/<collectionId>/documents/<documentId>",
	    documentList: "collections/<collectionId>/documents",
	    annotation: "collections/<collectionId>/documents/<documentId>/annotations",
	    concept: "concepts/<namespace>/<cname>",
	    concepts: "concepts",
	    conceptTrain: "concepts/<namespace>/<cname>/train",
	    conceptPredict: "concepts/<namespace>/<cname>/predict",
	    conceptExamples: "concepts/<namespace>/<cname>/examples",
	    model: "models/<modelId>",
	    models: "models",
	    tag: "tag"
	  }
	});

	function promoteErrors(response) {
	  if (300 <= response.status) {
	    var error = response.error("HTTP status error: " + response.status);
	    error.status = response.status;
	    return _Promise.reject(error);
	  } else if (response.body && response.body.status && response.body.status.status === 'ERROR') {
	    var error = response.error("API error: " + response.body.status.message);
	    return _Promise.reject(error);
	  } else {
	    return response;
	  }
	}

	var Document = (function () {
	  function Document(docResponse, collectionId) {
	    _classCallCheck(this, Document);

	    this.docid = docResponse.docid;
	    this.metadata = docResponse.metadata;
	    this.media_refs = docResponse.media_refs;
	    this.collection_id = collectionId;

	    if ('annotation_sets' in docResponse) {
	      this.tags = parseAnnotationSets(docResponse.annotation_sets);
	    }

	    if ('embeddings' in docResponse) {
	      this.embeddings = docResponse.embeddings;
	    }

	    if (this.media_refs.length > 0) {
	      this.type = this.media_refs[0].media_type;
	      this.url = this.media_refs[0].url;
	    }
	  }

	  _createClass(Document, [{
	    key: 'collectionId',
	    get: function get() {
	      return this.collection_id;
	    },
	    set: function set(val) {
	      this.collection_id = val;
	    }
	  }, {
	    key: 'id',
	    get: function get() {
	      return this.docid;
	    }
	  }]);

	  return Document;
	})();

	function makeDocuments(apiResponse, collectionId) {
	  if ('document' in apiResponse.body) {
	    return new Document(apiResponse.body.document, collectionId);
	  }
	  if ('documents' in apiResponse.body) {
	    return apiResponse.body.documents.map(function (docResp) {
	      return new Document(docResp, collectionId);
	    });
	  }
	  if ('results' in apiResponse.body) {
	    return apiResponse.body.results.map(function (result) {
	      var doc = new Document(result.document, collectionId);
	      doc.searchScore = result.score;
	      return doc;
	    });
	  }
	}

	function Collection(collectionResponse) {
	  this.id = collectionResponse.id;
	  this.settings = collectionResponse.settings;
	  this.properties = collectionResponse.properties;
	}
	function makeCollections(apiResponse) {
	  if ('collection' in apiResponse.body) {
	    return new Collection(apiResponse.body.collection);
	  }
	  if ('collections' in apiResponse.body) {
	    return apiResponse.body.collections.map(function (colResp) {
	      return new Collection(colResp);
	    });
	  }
	}

	var ResourceManager = (function () {
	  function ResourceManager(_ref) {
	    var urlResolver = _ref.urlResolver;
	    var requestHandler = _ref.requestHandler;

	    _classCallCheck(this, ResourceManager);

	    this.urlResolver = urlResolver;
	    this.requestHandler = requestHandler;
	  }

	  _createClass(ResourceManager, [{
	    key: 'execute',
	    value: function execute(_ref2) {
	      var method = _ref2.method;
	      var operation = _ref2.operation;
	      var urlParams = _ref2.urlParams;
	      var requestBody = _ref2.requestBody;
	      var queryString = _ref2.queryString;

	      var query = {
	        method: method,
	        url: this.routeFor(operation, urlParams),
	        headers: {
	          'Accept': 'application/json'
	        }
	      };
	      setIfDefined(query, 'body', requestBody);
	      setIfDefined(query, 'query', queryString);

	      return this.requestHandler.request(query);
	    }
	  }, {
	    key: 'routeFor',
	    value: function routeFor(operation, params) {}
	  }]);

	  return ResourceManager;
	})();

	var CollectionManager = (function (_ResourceManager) {
	  _inherits(CollectionManager, _ResourceManager);

	  function CollectionManager() {
	    _classCallCheck(this, CollectionManager);

	    _get(Object.getPrototypeOf(CollectionManager.prototype), 'constructor', this).apply(this, arguments);
	  }

	  _createClass(CollectionManager, [{
	    key: 'routeFor',
	    value: function routeFor(operation, params) {
	      var resourceName = operation === 'list' || operation === 'create' ? 'collectionList' : 'collectionDetail';
	      return this.urlResolver.routeFor(resourceName, params);
	    }
	  }, {
	    key: 'create',
	    value: function create(_ref3) {
	      var id = _ref3.id;
	      var properties = _ref3.properties;
	      var _ref3$settings = _ref3.settings;
	      var settings = _ref3$settings === undefined ? { max_num_docs: 100000 } : _ref3$settings;

	      return this.execute({
	        operation: 'create',
	        method: 'POST',
	        requestBody: {
	          collection: {
	            id: id,
	            properties: properties,
	            settings: settings
	          }
	        }
	      }).then(makeCollections);
	    }
	  }, {
	    key: 'remove',
	    value: function remove(id) {
	      return this.execute({
	        operation: 'delete',
	        method: 'DELETE',
	        urlParams: { collectionId: id }
	      });
	    }
	  }, {
	    key: 'retrieve',
	    value: function retrieve(id) {
	      return this.execute({
	        operation: 'retrieve',
	        method: 'GET',
	        urlParams: { collectionId: id }
	      }).then(makeCollections);
	    }
	  }, {
	    key: 'list',
	    value: function list() {
	      return this.execute({
	        operation: 'list',
	        method: 'GET'
	      }).then(makeCollections);
	    }
	  }]);

	  return CollectionManager;
	})(ResourceManager);

	var DocumentManager = (function (_ResourceManager2) {
	  _inherits(DocumentManager, _ResourceManager2);

	  function DocumentManager() {
	    _classCallCheck(this, DocumentManager);

	    _get(Object.getPrototypeOf(DocumentManager.prototype), 'constructor', this).apply(this, arguments);
	  }

	  _createClass(DocumentManager, [{
	    key: 'routeFor',
	    value: function routeFor(operation, params) {
	      var resourceName = operation === 'list' || operation === 'create' ? 'documentList' : 'documentDetail';
	      return this.urlResolver.routeFor(resourceName, {
	        documentId: params.documentId,
	        collectionId: params.collectionId
	      });
	    }
	  }, {
	    key: 'create',
	    value: function create(_ref4) {
	      var collectionId = _ref4.collectionId;
	      var document = _ref4.document;
	      var documents = _ref4.documents;
	      var _ref4$options = _ref4.options;
	      var options = _ref4$options === undefined ? {} : _ref4$options;

	      if (collectionId === undefined) throw Error('collectionId was not provided');
	      var body = { options: options };
	      if (documents) {
	        body.documents = documents;
	      } else {
	        body.document = document;
	      }

	      return this.execute({
	        operation: 'create',
	        method: 'POST',
	        urlParams: {
	          collectionId: collectionId
	        },
	        requestBody: body
	      }).then(function (resp) {
	        return makeDocuments(resp, collectionId);
	      });
	    }
	  }, {
	    key: 'remove',
	    value: function remove(_ref5) {
	      var id = _ref5.id;
	      var collectionId = _ref5.collectionId;

	      return this.execute({
	        operation: 'delete',
	        method: 'DELETE',
	        urlParams: {
	          documentId: id,
	          collectionId: collectionId
	        }
	      });
	    }
	  }, {
	    key: 'retrieve',
	    value: function retrieve(_ref6) {
	      var id = _ref6.id;
	      var collectionId = _ref6.collectionId;

	      return this.execute({
	        operation: 'retrieve',
	        method: 'GET',
	        urlParams: {
	          documentId: id,
	          collectionId: collectionId
	        }
	      }).then(function (resp) {
	        return makeDocuments(resp, collectionId);
	      });
	    }
	  }, {
	    key: 'list',
	    value: function list(collectionId) {
	      return this.execute({
	        operation: 'list',
	        method: 'GET',
	        urlParams: {
	          collectionId: collectionId
	        }
	      }).then(function (resp) {
	        return makeDocuments(resp, collectionId);
	      });
	    }
	  }]);

	  return DocumentManager;
	})(ResourceManager);

	var AnnotationManager = (function (_ResourceManager3) {
	  _inherits(AnnotationManager, _ResourceManager3);

	  function AnnotationManager() {
	    _classCallCheck(this, AnnotationManager);

	    _get(Object.getPrototypeOf(AnnotationManager.prototype), 'constructor', this).apply(this, arguments);
	  }

	  _createClass(AnnotationManager, [{
	    key: 'routeFor',
	    value: function routeFor(operation, params) {
	      return this.urlResolver.routeFor('annotation', {
	        documentId: params.documentId || this.documentId,
	        collectionId: params.collectionId || this.collectionId
	      });
	    }
	  }, {
	    key: 'add',
	    value: function add(_ref7) {
	      var collectionId = _ref7.collectionId;
	      var documentId = _ref7.documentId;
	      var annotations = _ref7.annotations;
	      var namespace = _ref7.namespace;
	      var annotation_set = _ref7.annotation_set;

	      return this.execute({
	        operation: 'add',
	        method: 'PUT',
	        urlParams: {
	          documentId: documentId,
	          collectionId: collectionId
	        },
	        requestBody: {
	          annotation_set: this.toAnnotationSet({ annotations: annotations, namespace: namespace, annotation_set: annotation_set })
	        }
	      });
	    }

	    /**
	     * Expects either annotations and namespace or annotation_set
	     */
	  }, {
	    key: 'remove',
	    value: function remove(_ref8) {
	      var collectionId = _ref8.collectionId;
	      var documentId = _ref8.documentId;
	      var annotations = _ref8.annotations;
	      var namespace = _ref8.namespace;
	      var annotation_set = _ref8.annotation_set;
	      var userId = _ref8.userId;
	      return (function () {
	        var annotation_set = this.toAnnotationSet({ annotations: annotations, namespace: namespace, annotation_set: annotation_set });
	        for (var i = 0; i < annotation_set.annotations.length; i++) {
	          var annotation = annotation_set.annotations[i];
	          if (!('status' in annotation)) annotation.status = {};
	          annotation.status.is_deleted = true;
	          if (userId !== undefined) annotation.status.user_id = userId;
	        }

	        return this.execute({
	          operation: 'delete',
	          method: 'DELETE',
	          urlParams: {
	            documentId: documentId,
	            collectionId: collectionId
	          },
	          requestBody: {
	            annotation_set: annotation_set
	          }
	        });
	      }).apply(this, arguments);
	    }
	  }, {
	    key: 'undoRemove',
	    value: function undoRemove(_ref9) {
	      var collectionId = _ref9.collectionId;
	      var documentId = _ref9.documentId;
	      var annotations = _ref9.annotations;
	      var namespace = _ref9.namespace;
	      var annotation_set = _ref9.annotation_set;
	      var userId = _ref9.userId;
	      return (function () {
	        var annotation_set = this.toAnnotationSet({ annotations: annotations, namespace: namespace, annotation_set: annotation_set });
	        for (var i = 0; i < annotation_set.annotations.length; i++) {
	          var annotation = annotation_set.annotations[i];
	          if (!('status' in annotation)) annotation.status = {};
	          annotation.status.is_deleted = false;
	          if (userId !== undefined) annotation.status.user_id = userId;
	        }

	        return this.execute({
	          operation: 'delete',
	          method: 'DELETE',
	          urlParams: {
	            documentId: documentId,
	            collectionId: collectionId
	          },
	          requestBody: {
	            annotation_set: annotation_set
	          }
	        });
	      }).apply(this, arguments);
	    }
	  }, {
	    key: 'toAnnotation',
	    value: function toAnnotation(argsObj) {
	      if (typeof argsObj === "string") {
	        return { tag: { cname: argsObj } };
	      } else if ('text' in argsObj) {
	        var a = { tag: { cname: argsObj.text } };
	        if ('score' in argsObj) a.score = argsObj.score;
	        if ('user' in argsObj) a.user_id = argsObj.user;
	        return a;
	      }
	    }
	  }, {
	    key: 'toAnnotationSet',
	    value: function toAnnotationSet(args) {
	      var annotation_set = {};
	      if (args.annotation_set !== undefined) {
	        annotation_set = args.annotation_set;
	      } else if ('annotations' in args && 'namespace' in args) {
	        annotation_set.namespace = args.namespace;
	        annotation_set.annotations = args.annotations.map(this.toAnnotation.bind(this));
	        if ('userId' in args) {
	          for (var i = 0; i < annotation_set.annotations.length; i++) {
	            annotation_set.annotations[i]['user_id'] = args.userId;
	          }
	        }
	      }
	      return annotation_set;
	    }
	  }]);

	  return AnnotationManager;
	})(ResourceManager);

	var Concept = (function () {
	  function Concept(_ref10) {
	    var namespace = _ref10.namespace;
	    var cname = _ref10.cname;

	    _classCallCheck(this, Concept);

	    this.namespace = namespace;
	    this.cname = cname;
	  }

	  _createClass(Concept, null, [{
	    key: 'fromResponse',
	    value: function fromResponse(response) {
	      if ('body' in response) {
	        return new Concept(response.body.concept);
	      } else if ('cname' in response) {
	        return new Concept(response);
	      }
	    }
	  }]);

	  return Concept;
	})();

	var ConceptManager = (function (_ResourceManager4) {
	  _inherits(ConceptManager, _ResourceManager4);

	  function ConceptManager() {
	    _classCallCheck(this, ConceptManager);

	    _get(Object.getPrototypeOf(ConceptManager.prototype), 'constructor', this).apply(this, arguments);
	  }

	  /**
	   * ## Clarifai
	   * Read/Write client to the Clarifai API. Supports same operations as ClarifaiSearch but also adds
	   * @param auth
	   * @param urlResolver
	   * @constructor
	   */

	  _createClass(ConceptManager, [{
	    key: 'routeFor',
	    value: function routeFor(operation, params) {
	      if (operation === "create" || operation === "list") {
	        return this.urlResolver.routeFor('concepts', {});
	      } else if (operation === "train") {
	        return this.urlResolver.routeFor('conceptTrain', {
	          cname: params.cname,
	          namespace: params.namespace
	        });
	      } else if (operation === "predict") {
	        return this.urlResolver.routeFor('conceptPredict', {
	          cname: params.cname,
	          namespace: params.namespace
	        });
	      } else if (operation === "examples") {
	        return this.urlResolver.routeFor('conceptExamples', {
	          cname: params.cname,
	          namespace: params.namespace
	        });
	      } else {
	        return this.urlResolver.routeFor('concept', {
	          cname: params.cname,
	          namespace: params.namespace
	        });
	      }
	    }
	  }, {
	    key: 'create',
	    value: function create(_ref11) {
	      var namespace = _ref11.namespace;
	      var cname = _ref11.cname;

	      return this.execute({
	        operation: 'create',
	        method: 'POST',
	        requestBody: {
	          namespace: namespace,
	          cname: cname
	        }
	      }).then(Concept.fromResponse);
	    }
	  }, {
	    key: 'retrieve',
	    value: function retrieve(_ref12) {
	      var namespace = _ref12.namespace;
	      var cname = _ref12.cname;

	      return this.execute({
	        operation: 'retrieve',
	        method: 'GET',
	        urlParams: {
	          namespace: namespace,
	          cname: cname
	        }
	      }).then(Concept.fromResponse);
	    }
	  }, {
	    key: 'list',
	    value: function list() {
	      return this.execute({
	        operation: 'list',
	        method: 'GET'
	      }).then(function (r) {
	        return r.body.concepts.map(Concept.fromResponse);
	      });
	    }
	  }, {
	    key: 'remove',
	    value: function remove(_ref13) {
	      var namespace = _ref13.namespace;
	      var cname = _ref13.cname;

	      return this.execute({
	        operation: 'delete',
	        method: 'DELETE',
	        urlParams: {
	          namespace: namespace,
	          cname: cname
	        }
	      });
	    }
	  }, {
	    key: 'train',
	    value: function train(_ref14) {
	      var namespace = _ref14.namespace;
	      var cname = _ref14.cname;

	      return this.execute({
	        operation: 'train',
	        method: 'POST',
	        urlParams: {
	          namespace: namespace,
	          cname: cname
	        }
	      });
	    }
	  }, {
	    key: 'predict',
	    value: function predict(_ref15) {
	      var namespace = _ref15.namespace;
	      var cname = _ref15.cname;
	      var urls = _ref15.urls;
	      var url = _ref15.url;

	      return this.execute({
	        operation: 'predict',
	        method: 'POST',
	        urlParams: {
	          namespace: namespace,
	          cname: cname
	        },
	        requestBody: {
	          urls: urls !== undefined ? urls : [url]
	        }
	      });
	    }
	  }]);

	  return ConceptManager;
	})(ResourceManager);

	function Clarifai(auth, urlResolver) {
	  this.requestHandler = new RequestHandler({ auth: auth });
	  this.requestHandler.verifyResponse = promoteErrors;
	  this.urlResolver = urlResolver || curatorAPIResolver;

	  var argsObj = { requestHandler: this.requestHandler, urlResolver: this.urlResolver };
	  this.collections = new CollectionManager(argsObj);
	  this.documents = new DocumentManager(argsObj);
	  this.concepts = new ConceptManager(argsObj);
	  this.annotations = new AnnotationManager(argsObj);
	}

	var ClarifaiBasic = (function () {
	  function ClarifaiBasic(_ref16) {
	    var id = _ref16.id;
	    var secret = _ref16.secret;

	    _classCallCheck(this, ClarifaiBasic);

	    this.collectionId = 'default';
	    this.namespace = 'default';
	    this.model = 'general-v1.2';
	    this.clarifai = new Clarifai(new Oauth2({ id: id, secret: secret, tokenUrl: 'https://api-alpha.clarifai.com/v1/token/' }));

	    //// try to create collection
	    this.clarifai.collections.create({ id: this.collectionId })['catch'](function (e) {
	      return undefined;
	    });
	  }

	  _createClass(ClarifaiBasic, [{
	    key: 'negative',
	    value: function negative(url, concept) {
	      var _this2 = this;

	      var doc = this.formatDoc(url, concept, -1);
	      return this.clarifai.documents.create({
	        collectionId: this.collectionId,
	        document: doc,
	        options: this.formatOptions()
	      })['catch'](function (e) {
	        return _this2.clarifai.annotations.add({
	          collectionId: _this2.collectionId,
	          documentId: doc.docid,
	          annotationSet: doc.annotation_sets[0]
	        });
	      })['catch'](function (e) {
	        throw Error('Could not add example, there might be something wrong with the url');
	      });
	    }
	  }, {
	    key: 'positive',
	    value: function positive(url, concept) {
	      var _this3 = this;

	      var doc = this.formatDoc(url, concept, 1);
	      return this.clarifai.documents.create({
	        collectionId: this.collectionId,
	        document: doc,
	        options: this.formatOptions()
	      })['catch'](function (e) {
	        return _this3.clarifai.annotations.add({
	          collectionId: _this3.collectionId,
	          documentId: doc.docid,
	          annotationSet: doc.annotation_sets[0]
	        });
	      })['catch'](function (e) {
	        throw Error('Could not add example, there might be something wrong with the url');
	      });
	    }
	  }, {
	    key: 'train',
	    value: function train(concept) {
	      return this.clarifai.concepts.train({
	        namespace: this.namespace,
	        cname: concept
	      });
	    }
	  }, {
	    key: 'predict',
	    value: function predict(url, concept) {
	      return this.clarifai.concepts.predict({
	        namespace: this.namespace,
	        cname: concept,
	        url: url
	      });
	    }
	  }, {
	    key: 'formatOptions',
	    value: function formatOptions() {
	      return {
	        want_doc_response: true,
	        recognition_options: {
	          model: this.model
	        }
	      };
	    }
	  }, {
	    key: 'formatDoc',
	    value: function formatDoc(url, concept, score) {
	      return {
	        docid: md5(url),
	        media_refs: [{
	          url: url,
	          media_type: "image"
	        }],
	        annotation_sets: [{
	          namespace: this.namespace,
	          annotations: [{
	            score: score,
	            tag: {
	              cname: concept
	            }
	          }]
	        }]
	      };
	    }
	  }, {
	    key: 'tag',
	    value: function tag(obj, classes) {
	      var body = isUrl(obj) ? { url: obj } : { encoded_data: stripHeader(obj) };
	      if (classes) {
	        this.body.select_classes = classes;
	      }
	      return this.clarifai.requestHandler.request({
	        url: 'https://api.clarifai.com/v1/tag',
	        method: 'POST',
	        body: body
	      });
	    }
	  }]);

	  return ClarifaiBasic;
	})();

	exports['default'] = ClarifaiBasic;
	module.exports = exports['default'];

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _Object$defineProperty = __webpack_require__(2)["default"];

	exports["default"] = (function () {
	  function defineProperties(target, props) {
	    for (var i = 0; i < props.length; i++) {
	      var descriptor = props[i];
	      descriptor.enumerable = descriptor.enumerable || false;
	      descriptor.configurable = true;
	      if ("value" in descriptor) descriptor.writable = true;

	      _Object$defineProperty(target, descriptor.key, descriptor);
	    }
	  }

	  return function (Constructor, protoProps, staticProps) {
	    if (protoProps) defineProperties(Constructor.prototype, protoProps);
	    if (staticProps) defineProperties(Constructor, staticProps);
	    return Constructor;
	  };
	})();

	exports.__esModule = true;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(3), __esModule: true };

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(4);
	module.exports = function defineProperty(it, key, desc){
	  return $.setDesc(it, key, desc);
	};

/***/ },
/* 4 */
/***/ function(module, exports) {

	var $Object = Object;
	module.exports = {
	  create:     $Object.create,
	  getProto:   $Object.getPrototypeOf,
	  isEnum:     {}.propertyIsEnumerable,
	  getDesc:    $Object.getOwnPropertyDescriptor,
	  setDesc:    $Object.defineProperty,
	  setDescs:   $Object.defineProperties,
	  getKeys:    $Object.keys,
	  getNames:   $Object.getOwnPropertyNames,
	  getSymbols: $Object.getOwnPropertySymbols,
	  each:       [].forEach
	};

/***/ },
/* 5 */
/***/ function(module, exports) {

	"use strict";

	exports["default"] = function (instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	};

	exports.__esModule = true;

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _Object$getOwnPropertyDescriptor = __webpack_require__(7)["default"];

	exports["default"] = function get(_x, _x2, _x3) {
	  var _again = true;

	  _function: while (_again) {
	    var object = _x,
	        property = _x2,
	        receiver = _x3;
	    desc = parent = getter = undefined;
	    _again = false;
	    if (object === null) object = Function.prototype;

	    var desc = _Object$getOwnPropertyDescriptor(object, property);

	    if (desc === undefined) {
	      var parent = Object.getPrototypeOf(object);

	      if (parent === null) {
	        return undefined;
	      } else {
	        _x = parent;
	        _x2 = property;
	        _x3 = receiver;
	        _again = true;
	        continue _function;
	      }
	    } else if ("value" in desc) {
	      return desc.value;
	    } else {
	      var getter = desc.get;

	      if (getter === undefined) {
	        return undefined;
	      }

	      return getter.call(receiver);
	    }
	  }
	};

	exports.__esModule = true;

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(8), __esModule: true };

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(4);
	__webpack_require__(9);
	module.exports = function getOwnPropertyDescriptor(it, key){
	  return $.getDesc(it, key);
	};

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
	var toIObject = __webpack_require__(10);

	__webpack_require__(14)('getOwnPropertyDescriptor', function($getOwnPropertyDescriptor){
	  return function getOwnPropertyDescriptor(it, key){
	    return $getOwnPropertyDescriptor(toIObject(it), key);
	  };
	});

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	// to indexed object, toObject with fallback for non-array-like ES3 strings
	var IObject = __webpack_require__(11)
	  , defined = __webpack_require__(13);
	module.exports = function(it){
	  return IObject(defined(it));
	};

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	// indexed object, fallback for non-array-like ES3 strings
	var cof = __webpack_require__(12);
	module.exports = 0 in Object('z') ? Object : function(it){
	  return cof(it) == 'String' ? it.split('') : Object(it);
	};

/***/ },
/* 12 */
/***/ function(module, exports) {

	var toString = {}.toString;

	module.exports = function(it){
	  return toString.call(it).slice(8, -1);
	};

/***/ },
/* 13 */
/***/ function(module, exports) {

	// 7.2.1 RequireObjectCoercible(argument)
	module.exports = function(it){
	  if(it == undefined)throw TypeError("Can't call method on  " + it);
	  return it;
	};

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	// most Object methods by ES6 should accept primitives
	module.exports = function(KEY, exec){
	  var $def = __webpack_require__(15)
	    , fn   = (__webpack_require__(17).Object || {})[KEY] || Object[KEY]
	    , exp  = {};
	  exp[KEY] = exec(fn);
	  $def($def.S + $def.F * __webpack_require__(18)(function(){ fn(1); }), 'Object', exp);
	};

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	var global    = __webpack_require__(16)
	  , core      = __webpack_require__(17)
	  , PROTOTYPE = 'prototype';
	var ctx = function(fn, that){
	  return function(){
	    return fn.apply(that, arguments);
	  };
	};
	var $def = function(type, name, source){
	  var key, own, out, exp
	    , isGlobal = type & $def.G
	    , isProto  = type & $def.P
	    , target   = isGlobal ? global : type & $def.S
	        ? global[name] : (global[name] || {})[PROTOTYPE]
	    , exports  = isGlobal ? core : core[name] || (core[name] = {});
	  if(isGlobal)source = name;
	  for(key in source){
	    // contains in native
	    own = !(type & $def.F) && target && key in target;
	    if(own && key in exports)continue;
	    // export native or passed
	    out = own ? target[key] : source[key];
	    // prevent global pollution for namespaces
	    if(isGlobal && typeof target[key] != 'function')exp = source[key];
	    // bind timers to global for call from export context
	    else if(type & $def.B && own)exp = ctx(out, global);
	    // wrap global constructors for prevent change them in library
	    else if(type & $def.W && target[key] == out)!function(C){
	      exp = function(param){
	        return this instanceof C ? new C(param) : C(param);
	      };
	      exp[PROTOTYPE] = C[PROTOTYPE];
	    }(out);
	    else exp = isProto && typeof out == 'function' ? ctx(Function.call, out) : out;
	    // export
	    exports[key] = exp;
	    if(isProto)(exports[PROTOTYPE] || (exports[PROTOTYPE] = {}))[key] = out;
	  }
	};
	// type bitmap
	$def.F = 1;  // forced
	$def.G = 2;  // global
	$def.S = 4;  // static
	$def.P = 8;  // proto
	$def.B = 16; // bind
	$def.W = 32; // wrap
	module.exports = $def;

/***/ },
/* 16 */
/***/ function(module, exports) {

	// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
	var UNDEFINED = 'undefined';
	var global = module.exports = typeof window != UNDEFINED && window.Math == Math
	  ? window : typeof self != UNDEFINED && self.Math == Math ? self : Function('return this')();
	if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef

/***/ },
/* 17 */
/***/ function(module, exports) {

	var core = module.exports = {version: '1.2.0'};
	if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef

/***/ },
/* 18 */
/***/ function(module, exports) {

	module.exports = function(exec){
	  try {
	    return !!exec();
	  } catch(e){
	    return true;
	  }
	};

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _Object$create = __webpack_require__(20)["default"];

	var _Object$setPrototypeOf = __webpack_require__(22)["default"];

	exports["default"] = function (subClass, superClass) {
	  if (typeof superClass !== "function" && superClass !== null) {
	    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
	  }

	  subClass.prototype = _Object$create(superClass && superClass.prototype, {
	    constructor: {
	      value: subClass,
	      enumerable: false,
	      writable: true,
	      configurable: true
	    }
	  });
	  if (superClass) _Object$setPrototypeOf ? _Object$setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
	};

	exports.__esModule = true;

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(21), __esModule: true };

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	var $ = __webpack_require__(4);
	module.exports = function create(P, D){
	  return $.create(P, D);
	};

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(23), __esModule: true };

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(24);
	module.exports = __webpack_require__(17).Object.setPrototypeOf;

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.3.19 Object.setPrototypeOf(O, proto)
	var $def = __webpack_require__(15);
	$def($def.S, 'Object', {setPrototypeOf: __webpack_require__(25).set});

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	// Works with __proto__ only. Old v8 can't work with null proto objects.
	/* eslint-disable no-proto */
	var getDesc  = __webpack_require__(4).getDesc
	  , isObject = __webpack_require__(26)
	  , anObject = __webpack_require__(27);
	var check = function(O, proto){
	  anObject(O);
	  if(!isObject(proto) && proto !== null)throw TypeError(proto + ": can't set as prototype!");
	};
	module.exports = {
	  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line no-proto
	    function(test, buggy, set){
	      try {
	        set = __webpack_require__(28)(Function.call, getDesc(Object.prototype, '__proto__').set, 2);
	        set(test, []);
	        buggy = !(test instanceof Array);
	      } catch(e){ buggy = true; }
	      return function setPrototypeOf(O, proto){
	        check(O, proto);
	        if(buggy)O.__proto__ = proto;
	        else set(O, proto);
	        return O;
	      };
	    }({}, false) : undefined),
	  check: check
	};

/***/ },
/* 26 */
/***/ function(module, exports) {

	module.exports = function(it){
	  return typeof it === 'object' ? it !== null : typeof it === 'function';
	};

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(26);
	module.exports = function(it){
	  if(!isObject(it))throw TypeError(it + ' is not an object!');
	  return it;
	};

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	// optional / simple context binding
	var aFunction = __webpack_require__(29);
	module.exports = function(fn, that, length){
	  aFunction(fn);
	  if(that === undefined)return fn;
	  switch(length){
	    case 1: return function(a){
	      return fn.call(that, a);
	    };
	    case 2: return function(a, b){
	      return fn.call(that, a, b);
	    };
	    case 3: return function(a, b, c){
	      return fn.call(that, a, b, c);
	    };
	  }
	  return function(/* ...args */){
	    return fn.apply(that, arguments);
	  };
	};

/***/ },
/* 29 */
/***/ function(module, exports) {

	module.exports = function(it){
	  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
	  return it;
	};

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(31), __esModule: true };

/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(32);
	__webpack_require__(33);
	__webpack_require__(49);
	__webpack_require__(53);
	module.exports = __webpack_require__(17).Promise;

/***/ },
/* 32 */
/***/ function(module, exports) {

	

/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $at  = __webpack_require__(34)(true);

	// 21.1.3.27 String.prototype[@@iterator]()
	__webpack_require__(36)(String, 'String', function(iterated){
	  this._t = String(iterated); // target
	  this._i = 0;                // next index
	// 21.1.5.2.1 %StringIteratorPrototype%.next()
	}, function(){
	  var O     = this._t
	    , index = this._i
	    , point;
	  if(index >= O.length)return {value: undefined, done: true};
	  point = $at(O, index);
	  this._i += point.length;
	  return {value: point, done: false};
	});

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	// true  -> String#at
	// false -> String#codePointAt
	var toInteger = __webpack_require__(35)
	  , defined   = __webpack_require__(13);
	module.exports = function(TO_STRING){
	  return function(that, pos){
	    var s = String(defined(that))
	      , i = toInteger(pos)
	      , l = s.length
	      , a, b;
	    if(i < 0 || i >= l)return TO_STRING ? '' : undefined;
	    a = s.charCodeAt(i);
	    return a < 0xd800 || a > 0xdbff || i + 1 === l
	      || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
	        ? TO_STRING ? s.charAt(i) : a
	        : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
	  };
	};

/***/ },
/* 35 */
/***/ function(module, exports) {

	// 7.1.4 ToInteger
	var ceil  = Math.ceil
	  , floor = Math.floor;
	module.exports = function(it){
	  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
	};

/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var LIBRARY         = __webpack_require__(37)
	  , $def            = __webpack_require__(15)
	  , $redef          = __webpack_require__(38)
	  , hide            = __webpack_require__(39)
	  , has             = __webpack_require__(42)
	  , SYMBOL_ITERATOR = __webpack_require__(43)('iterator')
	  , Iterators       = __webpack_require__(46)
	  , BUGGY           = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
	  , FF_ITERATOR     = '@@iterator'
	  , KEYS            = 'keys'
	  , VALUES          = 'values';
	var returnThis = function(){ return this; };
	module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCE){
	  __webpack_require__(47)(Constructor, NAME, next);
	  var createMethod = function(kind){
	    switch(kind){
	      case KEYS: return function keys(){ return new Constructor(this, kind); };
	      case VALUES: return function values(){ return new Constructor(this, kind); };
	    } return function entries(){ return new Constructor(this, kind); };
	  };
	  var TAG      = NAME + ' Iterator'
	    , proto    = Base.prototype
	    , _native  = proto[SYMBOL_ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
	    , _default = _native || createMethod(DEFAULT)
	    , methods, key;
	  // Fix native
	  if(_native){
	    var IteratorPrototype = __webpack_require__(4).getProto(_default.call(new Base));
	    // Set @@toStringTag to native iterators
	    __webpack_require__(48)(IteratorPrototype, TAG, true);
	    // FF fix
	    if(!LIBRARY && has(proto, FF_ITERATOR))hide(IteratorPrototype, SYMBOL_ITERATOR, returnThis);
	  }
	  // Define iterator
	  if(!LIBRARY || FORCE)hide(proto, SYMBOL_ITERATOR, _default);
	  // Plug for library
	  Iterators[NAME] = _default;
	  Iterators[TAG]  = returnThis;
	  if(DEFAULT){
	    methods = {
	      keys:    IS_SET            ? _default : createMethod(KEYS),
	      values:  DEFAULT == VALUES ? _default : createMethod(VALUES),
	      entries: DEFAULT != VALUES ? _default : createMethod('entries')
	    };
	    if(FORCE)for(key in methods){
	      if(!(key in proto))$redef(proto, key, methods[key]);
	    } else $def($def.P + $def.F * BUGGY, NAME, methods);
	  }
	};

/***/ },
/* 37 */
/***/ function(module, exports) {

	module.exports = true;

/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(39);

/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	var $          = __webpack_require__(4)
	  , createDesc = __webpack_require__(40);
	module.exports = __webpack_require__(41) ? function(object, key, value){
	  return $.setDesc(object, key, createDesc(1, value));
	} : function(object, key, value){
	  object[key] = value;
	  return object;
	};

/***/ },
/* 40 */
/***/ function(module, exports) {

	module.exports = function(bitmap, value){
	  return {
	    enumerable  : !(bitmap & 1),
	    configurable: !(bitmap & 2),
	    writable    : !(bitmap & 4),
	    value       : value
	  };
	};

/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	// Thank's IE8 for his funny defineProperty
	module.exports = !__webpack_require__(18)(function(){
	  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
	});

/***/ },
/* 42 */
/***/ function(module, exports) {

	var hasOwnProperty = {}.hasOwnProperty;
	module.exports = function(it, key){
	  return hasOwnProperty.call(it, key);
	};

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	var store  = __webpack_require__(44)('wks')
	  , Symbol = __webpack_require__(16).Symbol;
	module.exports = function(name){
	  return store[name] || (store[name] =
	    Symbol && Symbol[name] || (Symbol || __webpack_require__(45))('Symbol.' + name));
	};

/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	var global = __webpack_require__(16)
	  , SHARED = '__core-js_shared__'
	  , store  = global[SHARED] || (global[SHARED] = {});
	module.exports = function(key){
	  return store[key] || (store[key] = {});
	};

/***/ },
/* 45 */
/***/ function(module, exports) {

	var id = 0
	  , px = Math.random();
	module.exports = function(key){
	  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
	};

/***/ },
/* 46 */
/***/ function(module, exports) {

	module.exports = {};

/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $ = __webpack_require__(4)
	  , IteratorPrototype = {};

	// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
	__webpack_require__(39)(IteratorPrototype, __webpack_require__(43)('iterator'), function(){ return this; });

	module.exports = function(Constructor, NAME, next){
	  Constructor.prototype = $.create(IteratorPrototype, {next: __webpack_require__(40)(1,next)});
	  __webpack_require__(48)(Constructor, NAME + ' Iterator');
	};

/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	var has  = __webpack_require__(42)
	  , hide = __webpack_require__(39)
	  , TAG  = __webpack_require__(43)('toStringTag');

	module.exports = function(it, tag, stat){
	  if(it && !has(it = stat ? it : it.prototype, TAG))hide(it, TAG, tag);
	};

/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(50);
	var Iterators = __webpack_require__(46);
	Iterators.NodeList = Iterators.HTMLCollection = Iterators.Array;

/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var setUnscope = __webpack_require__(51)
	  , step       = __webpack_require__(52)
	  , Iterators  = __webpack_require__(46)
	  , toIObject  = __webpack_require__(10);

	// 22.1.3.4 Array.prototype.entries()
	// 22.1.3.13 Array.prototype.keys()
	// 22.1.3.29 Array.prototype.values()
	// 22.1.3.30 Array.prototype[@@iterator]()
	__webpack_require__(36)(Array, 'Array', function(iterated, kind){
	  this._t = toIObject(iterated); // target
	  this._i = 0;                   // next index
	  this._k = kind;                // kind
	// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
	}, function(){
	  var O     = this._t
	    , kind  = this._k
	    , index = this._i++;
	  if(!O || index >= O.length){
	    this._t = undefined;
	    return step(1);
	  }
	  if(kind == 'keys'  )return step(0, index);
	  if(kind == 'values')return step(0, O[index]);
	  return step(0, [index, O[index]]);
	}, 'values');

	// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
	Iterators.Arguments = Iterators.Array;

	setUnscope('keys');
	setUnscope('values');
	setUnscope('entries');

/***/ },
/* 51 */
/***/ function(module, exports) {

	module.exports = function(){ /* empty */ };

/***/ },
/* 52 */
/***/ function(module, exports) {

	module.exports = function(done, value){
	  return {value: value, done: !!done};
	};

/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $          = __webpack_require__(4)
	  , LIBRARY    = __webpack_require__(37)
	  , global     = __webpack_require__(16)
	  , ctx        = __webpack_require__(28)
	  , classof    = __webpack_require__(54)
	  , $def       = __webpack_require__(15)
	  , isObject   = __webpack_require__(26)
	  , anObject   = __webpack_require__(27)
	  , aFunction  = __webpack_require__(29)
	  , strictNew  = __webpack_require__(55)
	  , forOf      = __webpack_require__(56)
	  , setProto   = __webpack_require__(25).set
	  , same       = __webpack_require__(61)
	  , species    = __webpack_require__(62)
	  , SPECIES    = __webpack_require__(43)('species')
	  , RECORD     = __webpack_require__(45)('record')
	  , asap       = __webpack_require__(63)
	  , PROMISE    = 'Promise'
	  , process    = global.process
	  , isNode     = classof(process) == 'process'
	  , P          = global[PROMISE]
	  , Wrapper;

	var testResolve = function(sub){
	  var test = new P(function(){});
	  if(sub)test.constructor = Object;
	  return P.resolve(test) === test;
	};

	var useNative = function(){
	  var works = false;
	  function P2(x){
	    var self = new P(x);
	    setProto(self, P2.prototype);
	    return self;
	  }
	  try {
	    works = P && P.resolve && testResolve();
	    setProto(P2, P);
	    P2.prototype = $.create(P.prototype, {constructor: {value: P2}});
	    // actual Firefox has broken subclass support, test that
	    if(!(P2.resolve(5).then(function(){}) instanceof P2)){
	      works = false;
	    }
	    // actual V8 bug, https://code.google.com/p/v8/issues/detail?id=4162
	    if(works && __webpack_require__(41)){
	      var thenableThenGotten = false;
	      P.resolve($.setDesc({}, 'then', {
	        get: function(){ thenableThenGotten = true; }
	      }));
	      works = thenableThenGotten;
	    }
	  } catch(e){ works = false; }
	  return works;
	}();

	// helpers
	var isPromise = function(it){
	  return isObject(it) && (useNative ? classof(it) == 'Promise' : RECORD in it);
	};
	var sameConstructor = function(a, b){
	  // library wrapper special case
	  if(LIBRARY && a === P && b === Wrapper)return true;
	  return same(a, b);
	};
	var getConstructor = function(C){
	  var S = anObject(C)[SPECIES];
	  return S != undefined ? S : C;
	};
	var isThenable = function(it){
	  var then;
	  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
	};
	var notify = function(record, isReject){
	  if(record.n)return;
	  record.n = true;
	  var chain = record.c;
	  asap(function(){
	    var value = record.v
	      , ok    = record.s == 1
	      , i     = 0;
	    var run = function(react){
	      var cb = ok ? react.ok : react.fail
	        , ret, then;
	      try {
	        if(cb){
	          if(!ok)record.h = true;
	          ret = cb === true ? value : cb(value);
	          if(ret === react.P){
	            react.rej(TypeError('Promise-chain cycle'));
	          } else if(then = isThenable(ret)){
	            then.call(ret, react.res, react.rej);
	          } else react.res(ret);
	        } else react.rej(value);
	      } catch(err){
	        react.rej(err);
	      }
	    };
	    while(chain.length > i)run(chain[i++]); // variable length - can't use forEach
	    chain.length = 0;
	    record.n = false;
	    if(isReject)setTimeout(function(){
	      var promise = record.p
	        , handler, console;
	      if(isUnhandled(promise)){
	        if(isNode){
	          process.emit('unhandledRejection', value, promise);
	        } else if(handler = global.onunhandledrejection){
	          handler({promise: promise, reason: value});
	        } else if((console = global.console) && console.error){
	          console.error('Unhandled promise rejection', value);
	        }
	      } record.a = undefined;
	    }, 1);
	  });
	};
	var isUnhandled = function(promise){
	  var record = promise[RECORD]
	    , chain  = record.a || record.c
	    , i      = 0
	    , react;
	  if(record.h)return false;
	  while(chain.length > i){
	    react = chain[i++];
	    if(react.fail || !isUnhandled(react.P))return false;
	  } return true;
	};
	var $reject = function(value){
	  var record = this;
	  if(record.d)return;
	  record.d = true;
	  record = record.r || record; // unwrap
	  record.v = value;
	  record.s = 2;
	  record.a = record.c.slice();
	  notify(record, true);
	};
	var $resolve = function(value){
	  var record = this
	    , then;
	  if(record.d)return;
	  record.d = true;
	  record = record.r || record; // unwrap
	  try {
	    if(then = isThenable(value)){
	      asap(function(){
	        var wrapper = {r: record, d: false}; // wrap
	        try {
	          then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
	        } catch(e){
	          $reject.call(wrapper, e);
	        }
	      });
	    } else {
	      record.v = value;
	      record.s = 1;
	      notify(record, false);
	    }
	  } catch(e){
	    $reject.call({r: record, d: false}, e); // wrap
	  }
	};

	// constructor polyfill
	if(!useNative){
	  // 25.4.3.1 Promise(executor)
	  P = function Promise(executor){
	    aFunction(executor);
	    var record = {
	      p: strictNew(this, P, PROMISE),         // <- promise
	      c: [],                                  // <- awaiting reactions
	      a: undefined,                           // <- checked in isUnhandled reactions
	      s: 0,                                   // <- state
	      d: false,                               // <- done
	      v: undefined,                           // <- value
	      h: false,                               // <- handled rejection
	      n: false                                // <- notify
	    };
	    this[RECORD] = record;
	    try {
	      executor(ctx($resolve, record, 1), ctx($reject, record, 1));
	    } catch(err){
	      $reject.call(record, err);
	    }
	  };
	  __webpack_require__(68)(P.prototype, {
	    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
	    then: function then(onFulfilled, onRejected){
	      var S = anObject(anObject(this).constructor)[SPECIES];
	      var react = {
	        ok:   typeof onFulfilled == 'function' ? onFulfilled : true,
	        fail: typeof onRejected == 'function'  ? onRejected  : false
	      };
	      var promise = react.P = new (S != undefined ? S : P)(function(res, rej){
	        react.res = res;
	        react.rej = rej;
	      });
	      aFunction(react.res);
	      aFunction(react.rej);
	      var record = this[RECORD];
	      record.c.push(react);
	      if(record.a)record.a.push(react);
	      if(record.s)notify(record, false);
	      return promise;
	    },
	    // 25.4.5.1 Promise.prototype.catch(onRejected)
	    'catch': function(onRejected){
	      return this.then(undefined, onRejected);
	    }
	  });
	}

	// export
	$def($def.G + $def.W + $def.F * !useNative, {Promise: P});
	__webpack_require__(48)(P, PROMISE);
	species(P);
	species(Wrapper = __webpack_require__(17)[PROMISE]);

	// statics
	$def($def.S + $def.F * !useNative, PROMISE, {
	  // 25.4.4.5 Promise.reject(r)
	  reject: function reject(r){
	    return new this(function(res, rej){ rej(r); });
	  }
	});
	$def($def.S + $def.F * (!useNative || testResolve(true)), PROMISE, {
	  // 25.4.4.6 Promise.resolve(x)
	  resolve: function resolve(x){
	    return isPromise(x) && sameConstructor(x.constructor, this)
	      ? x : new this(function(res){ res(x); });
	  }
	});
	$def($def.S + $def.F * !(useNative && __webpack_require__(69)(function(iter){
	  P.all(iter)['catch'](function(){});
	})), PROMISE, {
	  // 25.4.4.1 Promise.all(iterable)
	  all: function all(iterable){
	    var C      = getConstructor(this)
	      , values = [];
	    return new C(function(res, rej){
	      forOf(iterable, false, values.push, values);
	      var remaining = values.length
	        , results   = Array(remaining);
	      if(remaining)$.each.call(values, function(promise, index){
	        C.resolve(promise).then(function(value){
	          results[index] = value;
	          --remaining || res(results);
	        }, rej);
	      });
	      else res(results);
	    });
	  },
	  // 25.4.4.4 Promise.race(iterable)
	  race: function race(iterable){
	    var C = getConstructor(this);
	    return new C(function(res, rej){
	      forOf(iterable, false, function(promise){
	        C.resolve(promise).then(res, rej);
	      });
	    });
	  }
	});

/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	// getting tag from 19.1.3.6 Object.prototype.toString()
	var cof = __webpack_require__(12)
	  , TAG = __webpack_require__(43)('toStringTag')
	  // ES3 wrong here
	  , ARG = cof(function(){ return arguments; }()) == 'Arguments';

	module.exports = function(it){
	  var O, T, B;
	  return it === undefined ? 'Undefined' : it === null ? 'Null'
	    // @@toStringTag case
	    : typeof (T = (O = Object(it))[TAG]) == 'string' ? T
	    // builtinTag case
	    : ARG ? cof(O)
	    // ES3 arguments fallback
	    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
	};

/***/ },
/* 55 */
/***/ function(module, exports) {

	module.exports = function(it, Constructor, name){
	  if(!(it instanceof Constructor))throw TypeError(name + ": use the 'new' operator!");
	  return it;
	};

/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

	var ctx         = __webpack_require__(28)
	  , call        = __webpack_require__(57)
	  , isArrayIter = __webpack_require__(58)
	  , anObject    = __webpack_require__(27)
	  , toLength    = __webpack_require__(59)
	  , getIterFn   = __webpack_require__(60);
	module.exports = function(iterable, entries, fn, that){
	  var iterFn = getIterFn(iterable)
	    , f      = ctx(fn, that, entries ? 2 : 1)
	    , index  = 0
	    , length, step, iterator;
	  if(typeof iterFn != 'function')throw TypeError(iterable + ' is not iterable!');
	  // fast case for arrays with default iterator
	  if(isArrayIter(iterFn))for(length = toLength(iterable.length); length > index; index++){
	    entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
	  } else for(iterator = iterFn.call(iterable); !(step = iterator.next()).done; ){
	    call(iterator, f, step.value, entries);
	  }
	};

/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	// call something on iterator step with safe closing on error
	var anObject = __webpack_require__(27);
	module.exports = function(iterator, fn, value, entries){
	  try {
	    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
	  // 7.4.6 IteratorClose(iterator, completion)
	  } catch(e){
	    var ret = iterator['return'];
	    if(ret !== undefined)anObject(ret.call(iterator));
	    throw e;
	  }
	};

/***/ },
/* 58 */
/***/ function(module, exports, __webpack_require__) {

	// check on default Array iterator
	var Iterators = __webpack_require__(46)
	  , ITERATOR  = __webpack_require__(43)('iterator');
	module.exports = function(it){
	  return (Iterators.Array || Array.prototype[ITERATOR]) === it;
	};

/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	// 7.1.15 ToLength
	var toInteger = __webpack_require__(35)
	  , min       = Math.min;
	module.exports = function(it){
	  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
	};

/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	var classof   = __webpack_require__(54)
	  , ITERATOR  = __webpack_require__(43)('iterator')
	  , Iterators = __webpack_require__(46);
	module.exports = __webpack_require__(17).getIteratorMethod = function(it){
	  if(it != undefined)return it[ITERATOR] || it['@@iterator'] || Iterators[classof(it)];
	};

/***/ },
/* 61 */
/***/ function(module, exports) {

	module.exports = Object.is || function is(x, y){
	  return x === y ? x !== 0 || 1 / x === 1 / y : x != x && y != y;
	};

/***/ },
/* 62 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $       = __webpack_require__(4)
	  , SPECIES = __webpack_require__(43)('species');
	module.exports = function(C){
	  if(__webpack_require__(41) && !(SPECIES in C))$.setDesc(C, SPECIES, {
	    configurable: true,
	    get: function(){ return this; }
	  });
	};

/***/ },
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	var global    = __webpack_require__(16)
	  , macrotask = __webpack_require__(64).set
	  , Observer  = global.MutationObserver || global.WebKitMutationObserver
	  , process   = global.process
	  , isNode    = __webpack_require__(12)(process) == 'process'
	  , head, last, notify;

	var flush = function(){
	  var parent, domain;
	  if(isNode && (parent = process.domain)){
	    process.domain = null;
	    parent.exit();
	  }
	  while(head){
	    domain = head.domain;
	    if(domain)domain.enter();
	    head.fn.call(); // <- currently we use it only for Promise - try / catch not required
	    if(domain)domain.exit();
	    head = head.next;
	  } last = undefined;
	  if(parent)parent.enter();
	}

	// Node.js
	if(isNode){
	  notify = function(){
	    process.nextTick(flush);
	  };
	// browsers with MutationObserver
	} else if(Observer){
	  var toggle = 1
	    , node   = document.createTextNode('');
	  new Observer(flush).observe(node, {characterData: true}); // eslint-disable-line no-new
	  notify = function(){
	    node.data = toggle = -toggle;
	  };
	// for other environments - macrotask based on:
	// - setImmediate
	// - MessageChannel
	// - window.postMessag
	// - onreadystatechange
	// - setTimeout
	} else {
	  notify = function(){
	    // strange IE + webpack dev server bug - use .call(global)
	    macrotask.call(global, flush);
	  };
	}

	module.exports = function asap(fn){
	  var task = {fn: fn, next: undefined, domain: isNode && process.domain};
	  if(last)last.next = task;
	  if(!head){
	    head = task;
	    notify();
	  } last = task;
	};

/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var ctx                = __webpack_require__(28)
	  , invoke             = __webpack_require__(65)
	  , html               = __webpack_require__(66)
	  , cel                = __webpack_require__(67)
	  , global             = __webpack_require__(16)
	  , process            = global.process
	  , setTask            = global.setImmediate
	  , clearTask          = global.clearImmediate
	  , MessageChannel     = global.MessageChannel
	  , counter            = 0
	  , queue              = {}
	  , ONREADYSTATECHANGE = 'onreadystatechange'
	  , defer, channel, port;
	var run = function(){
	  var id = +this;
	  if(queue.hasOwnProperty(id)){
	    var fn = queue[id];
	    delete queue[id];
	    fn();
	  }
	};
	var listner = function(event){
	  run.call(event.data);
	};
	// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
	if(!setTask || !clearTask){
	  setTask = function setImmediate(fn){
	    var args = [], i = 1;
	    while(arguments.length > i)args.push(arguments[i++]);
	    queue[++counter] = function(){
	      invoke(typeof fn == 'function' ? fn : Function(fn), args);
	    };
	    defer(counter);
	    return counter;
	  };
	  clearTask = function clearImmediate(id){
	    delete queue[id];
	  };
	  // Node.js 0.8-
	  if(__webpack_require__(12)(process) == 'process'){
	    defer = function(id){
	      process.nextTick(ctx(run, id, 1));
	    };
	  // Browsers with MessageChannel, includes WebWorkers
	  } else if(MessageChannel){
	    channel = new MessageChannel;
	    port    = channel.port2;
	    channel.port1.onmessage = listner;
	    defer = ctx(port.postMessage, port, 1);
	  // Browsers with postMessage, skip WebWorkers
	  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
	  } else if(global.addEventListener && typeof postMessage == 'function' && !global.importScript){
	    defer = function(id){
	      global.postMessage(id + '', '*');
	    };
	    global.addEventListener('message', listner, false);
	  // IE8-
	  } else if(ONREADYSTATECHANGE in cel('script')){
	    defer = function(id){
	      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function(){
	        html.removeChild(this);
	        run.call(id);
	      };
	    };
	  // Rest old browsers
	  } else {
	    defer = function(id){
	      setTimeout(ctx(run, id, 1), 0);
	    };
	  }
	}
	module.exports = {
	  set:   setTask,
	  clear: clearTask
	};

/***/ },
/* 65 */
/***/ function(module, exports) {

	// fast apply, http://jsperf.lnkit.com/fast-apply/5
	module.exports = function(fn, args, that){
	  var un = that === undefined;
	  switch(args.length){
	    case 0: return un ? fn()
	                      : fn.call(that);
	    case 1: return un ? fn(args[0])
	                      : fn.call(that, args[0]);
	    case 2: return un ? fn(args[0], args[1])
	                      : fn.call(that, args[0], args[1]);
	    case 3: return un ? fn(args[0], args[1], args[2])
	                      : fn.call(that, args[0], args[1], args[2]);
	    case 4: return un ? fn(args[0], args[1], args[2], args[3])
	                      : fn.call(that, args[0], args[1], args[2], args[3]);
	  } return              fn.apply(that, args);
	};

/***/ },
/* 66 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(16).document && document.documentElement;

/***/ },
/* 67 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(26)
	  , document = __webpack_require__(16).document
	  // in old IE typeof document.createElement is 'object'
	  , is = isObject(document) && isObject(document.createElement);
	module.exports = function(it){
	  return is ? document.createElement(it) : {};
	};

/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

	var $redef = __webpack_require__(38);
	module.exports = function(target, src){
	  for(var key in src)$redef(target, key, src[key]);
	  return target;
	};

/***/ },
/* 69 */
/***/ function(module, exports, __webpack_require__) {

	var SYMBOL_ITERATOR = __webpack_require__(43)('iterator')
	  , SAFE_CLOSING    = false;
	try {
	  var riter = [7][SYMBOL_ITERATOR]();
	  riter['return'] = function(){ SAFE_CLOSING = true; };
	  Array.from(riter, function(){ throw 2; });
	} catch(e){ /* empty */ }
	module.exports = function(exec){
	  if(!SAFE_CLOSING)return false;
	  var safe = false;
	  try {
	    var arr  = [7]
	      , iter = arr[SYMBOL_ITERATOR]();
	    iter.next = function(){ safe = true; };
	    arr[SYMBOL_ITERATOR] = function(){ return iter; };
	    exec(arr);
	  } catch(e){ /* empty */ }
	  return safe;
	};

/***/ },
/* 70 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_70__;

/***/ },
/* 71 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_71__;

/***/ },
/* 72 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_72__;

/***/ },
/* 73 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_73__;

/***/ }
/******/ ])
});
;