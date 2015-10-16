(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("http"), require("querystring"));
	else if(typeof define === 'function' && define.amd)
		define(["http", "querystring"], factory);
	else if(typeof exports === 'object')
		exports["Clarifai"] = factory(require("http"), require("querystring"));
	else
		root["Clarifai"] = factory(root["http"], root["querystring"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_77__, __WEBPACK_EXTERNAL_MODULE_81__) {
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
	var request = __webpack_require__(73);
	var merge = __webpack_require__(90);

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

	  this.maxAttempts = args.maxAttempts || 3;
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
	    if (maxAttempts < numAttempts) {
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
	    concept: "concepts/<namespace>/<cname>",
	    concepts: "concepts",
	    conceptTrain: "concepts/<namespace>/<cname>/train",
	    conceptPredict: "concepts/<namespace>/<cname>/predict",
	    conceptExamples: "concepts/<namespace>/<cname>/examples",
	    model: "models/<modelId>",
	    models: "models"
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

	var Concept = (function () {
	  function Concept(_ref7) {
	    var namespace = _ref7.namespace;
	    var cname = _ref7.cname;

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

	var ConceptManager = (function (_ResourceManager3) {
	  _inherits(ConceptManager, _ResourceManager3);

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
	    value: function create(_ref8) {
	      var namespace = _ref8.namespace;
	      var cname = _ref8.cname;

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
	    value: function retrieve(_ref9) {
	      var namespace = _ref9.namespace;
	      var cname = _ref9.cname;

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
	    value: function remove(_ref10) {
	      var namespace = _ref10.namespace;
	      var cname = _ref10.cname;

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
	    value: function train(_ref11) {
	      var namespace = _ref11.namespace;
	      var cname = _ref11.cname;

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
	    value: function predict(_ref12) {
	      var namespace = _ref12.namespace;
	      var cname = _ref12.cname;
	      var urls = _ref12.urls;
	      var url = _ref12.url;

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
	}

	function makeid() {
	  var len = arguments.length <= 0 || arguments[0] === undefined ? 32 : arguments[0];

	  var text = "";
	  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	  for (var i = 0; i < len; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
	  return text;
	}

	var ClarifaiBasic = (function () {
	  function ClarifaiBasic(_ref13) {
	    var id = _ref13.id;
	    var secret = _ref13.secret;

	    _classCallCheck(this, ClarifaiBasic);

	    this.collectionId = 'default';
	    this.namespace = 'default';
	    this.model = 'general-v1.2';
	    this.clarifai = new Clarifai(new Oauth2({ id: id, secret: secret, tokenUrl: 'https://api-alpha.clarifai.com/v1/token/' }));

	    //// try to create collection
	    this.clarifai.collections.create({ id: this.collectionId })['catch'](function (e) {
	      return console.log('collection already exists');
	    });
	  }

	  _createClass(ClarifaiBasic, [{
	    key: 'negative',
	    value: function negative(url, concept) {
	      return this.clarifai.documents.create({
	        collectionId: this.collectionId,
	        document: this.formatDoc(url, concept, -1),
	        options: this.formatOptions()
	      });
	    }
	  }, {
	    key: 'positive',
	    value: function positive(url, concept) {
	      return this.clarifai.documents.create({
	        collectionId: this.collectionId,
	        document: this.formatDoc(url, concept, 1),
	        options: this.formatOptions()
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
	        docid: makeid(),
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
/***/ function(module, exports, __webpack_require__) {

	var require;var __WEBPACK_AMD_DEFINE_RESULT__;/* WEBPACK VAR INJECTION */(function(module) {/*!
	 * @overview es6-promise - a tiny implementation of Promises/A+.
	 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
	 * @license   Licensed under MIT license
	 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
	 * @version   3.0.2
	 */

	(function() {
	    "use strict";
	    function lib$es6$promise$utils$$objectOrFunction(x) {
	      return typeof x === 'function' || (typeof x === 'object' && x !== null);
	    }

	    function lib$es6$promise$utils$$isFunction(x) {
	      return typeof x === 'function';
	    }

	    function lib$es6$promise$utils$$isMaybeThenable(x) {
	      return typeof x === 'object' && x !== null;
	    }

	    var lib$es6$promise$utils$$_isArray;
	    if (!Array.isArray) {
	      lib$es6$promise$utils$$_isArray = function (x) {
	        return Object.prototype.toString.call(x) === '[object Array]';
	      };
	    } else {
	      lib$es6$promise$utils$$_isArray = Array.isArray;
	    }

	    var lib$es6$promise$utils$$isArray = lib$es6$promise$utils$$_isArray;
	    var lib$es6$promise$asap$$len = 0;
	    var lib$es6$promise$asap$$toString = {}.toString;
	    var lib$es6$promise$asap$$vertxNext;
	    var lib$es6$promise$asap$$customSchedulerFn;

	    var lib$es6$promise$asap$$asap = function asap(callback, arg) {
	      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len] = callback;
	      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len + 1] = arg;
	      lib$es6$promise$asap$$len += 2;
	      if (lib$es6$promise$asap$$len === 2) {
	        // If len is 2, that means that we need to schedule an async flush.
	        // If additional callbacks are queued before the queue is flushed, they
	        // will be processed by this flush that we are scheduling.
	        if (lib$es6$promise$asap$$customSchedulerFn) {
	          lib$es6$promise$asap$$customSchedulerFn(lib$es6$promise$asap$$flush);
	        } else {
	          lib$es6$promise$asap$$scheduleFlush();
	        }
	      }
	    }

	    function lib$es6$promise$asap$$setScheduler(scheduleFn) {
	      lib$es6$promise$asap$$customSchedulerFn = scheduleFn;
	    }

	    function lib$es6$promise$asap$$setAsap(asapFn) {
	      lib$es6$promise$asap$$asap = asapFn;
	    }

	    var lib$es6$promise$asap$$browserWindow = (typeof window !== 'undefined') ? window : undefined;
	    var lib$es6$promise$asap$$browserGlobal = lib$es6$promise$asap$$browserWindow || {};
	    var lib$es6$promise$asap$$BrowserMutationObserver = lib$es6$promise$asap$$browserGlobal.MutationObserver || lib$es6$promise$asap$$browserGlobal.WebKitMutationObserver;
	    var lib$es6$promise$asap$$isNode = typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

	    // test for web worker but not in IE10
	    var lib$es6$promise$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
	      typeof importScripts !== 'undefined' &&
	      typeof MessageChannel !== 'undefined';

	    // node
	    function lib$es6$promise$asap$$useNextTick() {
	      // node version 0.10.x displays a deprecation warning when nextTick is used recursively
	      // see https://github.com/cujojs/when/issues/410 for details
	      return function() {
	        process.nextTick(lib$es6$promise$asap$$flush);
	      };
	    }

	    // vertx
	    function lib$es6$promise$asap$$useVertxTimer() {
	      return function() {
	        lib$es6$promise$asap$$vertxNext(lib$es6$promise$asap$$flush);
	      };
	    }

	    function lib$es6$promise$asap$$useMutationObserver() {
	      var iterations = 0;
	      var observer = new lib$es6$promise$asap$$BrowserMutationObserver(lib$es6$promise$asap$$flush);
	      var node = document.createTextNode('');
	      observer.observe(node, { characterData: true });

	      return function() {
	        node.data = (iterations = ++iterations % 2);
	      };
	    }

	    // web worker
	    function lib$es6$promise$asap$$useMessageChannel() {
	      var channel = new MessageChannel();
	      channel.port1.onmessage = lib$es6$promise$asap$$flush;
	      return function () {
	        channel.port2.postMessage(0);
	      };
	    }

	    function lib$es6$promise$asap$$useSetTimeout() {
	      return function() {
	        setTimeout(lib$es6$promise$asap$$flush, 1);
	      };
	    }

	    var lib$es6$promise$asap$$queue = new Array(1000);
	    function lib$es6$promise$asap$$flush() {
	      for (var i = 0; i < lib$es6$promise$asap$$len; i+=2) {
	        var callback = lib$es6$promise$asap$$queue[i];
	        var arg = lib$es6$promise$asap$$queue[i+1];

	        callback(arg);

	        lib$es6$promise$asap$$queue[i] = undefined;
	        lib$es6$promise$asap$$queue[i+1] = undefined;
	      }

	      lib$es6$promise$asap$$len = 0;
	    }

	    function lib$es6$promise$asap$$attemptVertx() {
	      try {
	        var r = require;
	        var vertx = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module \"vertx\""); e.code = 'MODULE_NOT_FOUND'; throw e; }()));
	        lib$es6$promise$asap$$vertxNext = vertx.runOnLoop || vertx.runOnContext;
	        return lib$es6$promise$asap$$useVertxTimer();
	      } catch(e) {
	        return lib$es6$promise$asap$$useSetTimeout();
	      }
	    }

	    var lib$es6$promise$asap$$scheduleFlush;
	    // Decide what async method to use to triggering processing of queued callbacks:
	    if (lib$es6$promise$asap$$isNode) {
	      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useNextTick();
	    } else if (lib$es6$promise$asap$$BrowserMutationObserver) {
	      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMutationObserver();
	    } else if (lib$es6$promise$asap$$isWorker) {
	      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMessageChannel();
	    } else if (lib$es6$promise$asap$$browserWindow === undefined && "function" === 'function') {
	      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$attemptVertx();
	    } else {
	      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useSetTimeout();
	    }

	    function lib$es6$promise$$internal$$noop() {}

	    var lib$es6$promise$$internal$$PENDING   = void 0;
	    var lib$es6$promise$$internal$$FULFILLED = 1;
	    var lib$es6$promise$$internal$$REJECTED  = 2;

	    var lib$es6$promise$$internal$$GET_THEN_ERROR = new lib$es6$promise$$internal$$ErrorObject();

	    function lib$es6$promise$$internal$$selfFulfillment() {
	      return new TypeError("You cannot resolve a promise with itself");
	    }

	    function lib$es6$promise$$internal$$cannotReturnOwn() {
	      return new TypeError('A promises callback cannot return that same promise.');
	    }

	    function lib$es6$promise$$internal$$getThen(promise) {
	      try {
	        return promise.then;
	      } catch(error) {
	        lib$es6$promise$$internal$$GET_THEN_ERROR.error = error;
	        return lib$es6$promise$$internal$$GET_THEN_ERROR;
	      }
	    }

	    function lib$es6$promise$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
	      try {
	        then.call(value, fulfillmentHandler, rejectionHandler);
	      } catch(e) {
	        return e;
	      }
	    }

	    function lib$es6$promise$$internal$$handleForeignThenable(promise, thenable, then) {
	       lib$es6$promise$asap$$asap(function(promise) {
	        var sealed = false;
	        var error = lib$es6$promise$$internal$$tryThen(then, thenable, function(value) {
	          if (sealed) { return; }
	          sealed = true;
	          if (thenable !== value) {
	            lib$es6$promise$$internal$$resolve(promise, value);
	          } else {
	            lib$es6$promise$$internal$$fulfill(promise, value);
	          }
	        }, function(reason) {
	          if (sealed) { return; }
	          sealed = true;

	          lib$es6$promise$$internal$$reject(promise, reason);
	        }, 'Settle: ' + (promise._label || ' unknown promise'));

	        if (!sealed && error) {
	          sealed = true;
	          lib$es6$promise$$internal$$reject(promise, error);
	        }
	      }, promise);
	    }

	    function lib$es6$promise$$internal$$handleOwnThenable(promise, thenable) {
	      if (thenable._state === lib$es6$promise$$internal$$FULFILLED) {
	        lib$es6$promise$$internal$$fulfill(promise, thenable._result);
	      } else if (thenable._state === lib$es6$promise$$internal$$REJECTED) {
	        lib$es6$promise$$internal$$reject(promise, thenable._result);
	      } else {
	        lib$es6$promise$$internal$$subscribe(thenable, undefined, function(value) {
	          lib$es6$promise$$internal$$resolve(promise, value);
	        }, function(reason) {
	          lib$es6$promise$$internal$$reject(promise, reason);
	        });
	      }
	    }

	    function lib$es6$promise$$internal$$handleMaybeThenable(promise, maybeThenable) {
	      if (maybeThenable.constructor === promise.constructor) {
	        lib$es6$promise$$internal$$handleOwnThenable(promise, maybeThenable);
	      } else {
	        var then = lib$es6$promise$$internal$$getThen(maybeThenable);

	        if (then === lib$es6$promise$$internal$$GET_THEN_ERROR) {
	          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$GET_THEN_ERROR.error);
	        } else if (then === undefined) {
	          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
	        } else if (lib$es6$promise$utils$$isFunction(then)) {
	          lib$es6$promise$$internal$$handleForeignThenable(promise, maybeThenable, then);
	        } else {
	          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
	        }
	      }
	    }

	    function lib$es6$promise$$internal$$resolve(promise, value) {
	      if (promise === value) {
	        lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$selfFulfillment());
	      } else if (lib$es6$promise$utils$$objectOrFunction(value)) {
	        lib$es6$promise$$internal$$handleMaybeThenable(promise, value);
	      } else {
	        lib$es6$promise$$internal$$fulfill(promise, value);
	      }
	    }

	    function lib$es6$promise$$internal$$publishRejection(promise) {
	      if (promise._onerror) {
	        promise._onerror(promise._result);
	      }

	      lib$es6$promise$$internal$$publish(promise);
	    }

	    function lib$es6$promise$$internal$$fulfill(promise, value) {
	      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }

	      promise._result = value;
	      promise._state = lib$es6$promise$$internal$$FULFILLED;

	      if (promise._subscribers.length !== 0) {
	        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, promise);
	      }
	    }

	    function lib$es6$promise$$internal$$reject(promise, reason) {
	      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }
	      promise._state = lib$es6$promise$$internal$$REJECTED;
	      promise._result = reason;

	      lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publishRejection, promise);
	    }

	    function lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
	      var subscribers = parent._subscribers;
	      var length = subscribers.length;

	      parent._onerror = null;

	      subscribers[length] = child;
	      subscribers[length + lib$es6$promise$$internal$$FULFILLED] = onFulfillment;
	      subscribers[length + lib$es6$promise$$internal$$REJECTED]  = onRejection;

	      if (length === 0 && parent._state) {
	        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, parent);
	      }
	    }

	    function lib$es6$promise$$internal$$publish(promise) {
	      var subscribers = promise._subscribers;
	      var settled = promise._state;

	      if (subscribers.length === 0) { return; }

	      var child, callback, detail = promise._result;

	      for (var i = 0; i < subscribers.length; i += 3) {
	        child = subscribers[i];
	        callback = subscribers[i + settled];

	        if (child) {
	          lib$es6$promise$$internal$$invokeCallback(settled, child, callback, detail);
	        } else {
	          callback(detail);
	        }
	      }

	      promise._subscribers.length = 0;
	    }

	    function lib$es6$promise$$internal$$ErrorObject() {
	      this.error = null;
	    }

	    var lib$es6$promise$$internal$$TRY_CATCH_ERROR = new lib$es6$promise$$internal$$ErrorObject();

	    function lib$es6$promise$$internal$$tryCatch(callback, detail) {
	      try {
	        return callback(detail);
	      } catch(e) {
	        lib$es6$promise$$internal$$TRY_CATCH_ERROR.error = e;
	        return lib$es6$promise$$internal$$TRY_CATCH_ERROR;
	      }
	    }

	    function lib$es6$promise$$internal$$invokeCallback(settled, promise, callback, detail) {
	      var hasCallback = lib$es6$promise$utils$$isFunction(callback),
	          value, error, succeeded, failed;

	      if (hasCallback) {
	        value = lib$es6$promise$$internal$$tryCatch(callback, detail);

	        if (value === lib$es6$promise$$internal$$TRY_CATCH_ERROR) {
	          failed = true;
	          error = value.error;
	          value = null;
	        } else {
	          succeeded = true;
	        }

	        if (promise === value) {
	          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$cannotReturnOwn());
	          return;
	        }

	      } else {
	        value = detail;
	        succeeded = true;
	      }

	      if (promise._state !== lib$es6$promise$$internal$$PENDING) {
	        // noop
	      } else if (hasCallback && succeeded) {
	        lib$es6$promise$$internal$$resolve(promise, value);
	      } else if (failed) {
	        lib$es6$promise$$internal$$reject(promise, error);
	      } else if (settled === lib$es6$promise$$internal$$FULFILLED) {
	        lib$es6$promise$$internal$$fulfill(promise, value);
	      } else if (settled === lib$es6$promise$$internal$$REJECTED) {
	        lib$es6$promise$$internal$$reject(promise, value);
	      }
	    }

	    function lib$es6$promise$$internal$$initializePromise(promise, resolver) {
	      try {
	        resolver(function resolvePromise(value){
	          lib$es6$promise$$internal$$resolve(promise, value);
	        }, function rejectPromise(reason) {
	          lib$es6$promise$$internal$$reject(promise, reason);
	        });
	      } catch(e) {
	        lib$es6$promise$$internal$$reject(promise, e);
	      }
	    }

	    function lib$es6$promise$enumerator$$Enumerator(Constructor, input) {
	      var enumerator = this;

	      enumerator._instanceConstructor = Constructor;
	      enumerator.promise = new Constructor(lib$es6$promise$$internal$$noop);

	      if (enumerator._validateInput(input)) {
	        enumerator._input     = input;
	        enumerator.length     = input.length;
	        enumerator._remaining = input.length;

	        enumerator._init();

	        if (enumerator.length === 0) {
	          lib$es6$promise$$internal$$fulfill(enumerator.promise, enumerator._result);
	        } else {
	          enumerator.length = enumerator.length || 0;
	          enumerator._enumerate();
	          if (enumerator._remaining === 0) {
	            lib$es6$promise$$internal$$fulfill(enumerator.promise, enumerator._result);
	          }
	        }
	      } else {
	        lib$es6$promise$$internal$$reject(enumerator.promise, enumerator._validationError());
	      }
	    }

	    lib$es6$promise$enumerator$$Enumerator.prototype._validateInput = function(input) {
	      return lib$es6$promise$utils$$isArray(input);
	    };

	    lib$es6$promise$enumerator$$Enumerator.prototype._validationError = function() {
	      return new Error('Array Methods must be provided an Array');
	    };

	    lib$es6$promise$enumerator$$Enumerator.prototype._init = function() {
	      this._result = new Array(this.length);
	    };

	    var lib$es6$promise$enumerator$$default = lib$es6$promise$enumerator$$Enumerator;

	    lib$es6$promise$enumerator$$Enumerator.prototype._enumerate = function() {
	      var enumerator = this;

	      var length  = enumerator.length;
	      var promise = enumerator.promise;
	      var input   = enumerator._input;

	      for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
	        enumerator._eachEntry(input[i], i);
	      }
	    };

	    lib$es6$promise$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
	      var enumerator = this;
	      var c = enumerator._instanceConstructor;

	      if (lib$es6$promise$utils$$isMaybeThenable(entry)) {
	        if (entry.constructor === c && entry._state !== lib$es6$promise$$internal$$PENDING) {
	          entry._onerror = null;
	          enumerator._settledAt(entry._state, i, entry._result);
	        } else {
	          enumerator._willSettleAt(c.resolve(entry), i);
	        }
	      } else {
	        enumerator._remaining--;
	        enumerator._result[i] = entry;
	      }
	    };

	    lib$es6$promise$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
	      var enumerator = this;
	      var promise = enumerator.promise;

	      if (promise._state === lib$es6$promise$$internal$$PENDING) {
	        enumerator._remaining--;

	        if (state === lib$es6$promise$$internal$$REJECTED) {
	          lib$es6$promise$$internal$$reject(promise, value);
	        } else {
	          enumerator._result[i] = value;
	        }
	      }

	      if (enumerator._remaining === 0) {
	        lib$es6$promise$$internal$$fulfill(promise, enumerator._result);
	      }
	    };

	    lib$es6$promise$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
	      var enumerator = this;

	      lib$es6$promise$$internal$$subscribe(promise, undefined, function(value) {
	        enumerator._settledAt(lib$es6$promise$$internal$$FULFILLED, i, value);
	      }, function(reason) {
	        enumerator._settledAt(lib$es6$promise$$internal$$REJECTED, i, reason);
	      });
	    };
	    function lib$es6$promise$promise$all$$all(entries) {
	      return new lib$es6$promise$enumerator$$default(this, entries).promise;
	    }
	    var lib$es6$promise$promise$all$$default = lib$es6$promise$promise$all$$all;
	    function lib$es6$promise$promise$race$$race(entries) {
	      /*jshint validthis:true */
	      var Constructor = this;

	      var promise = new Constructor(lib$es6$promise$$internal$$noop);

	      if (!lib$es6$promise$utils$$isArray(entries)) {
	        lib$es6$promise$$internal$$reject(promise, new TypeError('You must pass an array to race.'));
	        return promise;
	      }

	      var length = entries.length;

	      function onFulfillment(value) {
	        lib$es6$promise$$internal$$resolve(promise, value);
	      }

	      function onRejection(reason) {
	        lib$es6$promise$$internal$$reject(promise, reason);
	      }

	      for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
	        lib$es6$promise$$internal$$subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
	      }

	      return promise;
	    }
	    var lib$es6$promise$promise$race$$default = lib$es6$promise$promise$race$$race;
	    function lib$es6$promise$promise$resolve$$resolve(object) {
	      /*jshint validthis:true */
	      var Constructor = this;

	      if (object && typeof object === 'object' && object.constructor === Constructor) {
	        return object;
	      }

	      var promise = new Constructor(lib$es6$promise$$internal$$noop);
	      lib$es6$promise$$internal$$resolve(promise, object);
	      return promise;
	    }
	    var lib$es6$promise$promise$resolve$$default = lib$es6$promise$promise$resolve$$resolve;
	    function lib$es6$promise$promise$reject$$reject(reason) {
	      /*jshint validthis:true */
	      var Constructor = this;
	      var promise = new Constructor(lib$es6$promise$$internal$$noop);
	      lib$es6$promise$$internal$$reject(promise, reason);
	      return promise;
	    }
	    var lib$es6$promise$promise$reject$$default = lib$es6$promise$promise$reject$$reject;

	    var lib$es6$promise$promise$$counter = 0;

	    function lib$es6$promise$promise$$needsResolver() {
	      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
	    }

	    function lib$es6$promise$promise$$needsNew() {
	      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
	    }

	    var lib$es6$promise$promise$$default = lib$es6$promise$promise$$Promise;
	    /**
	      Promise objects represent the eventual result of an asynchronous operation. The
	      primary way of interacting with a promise is through its `then` method, which
	      registers callbacks to receive either a promise's eventual value or the reason
	      why the promise cannot be fulfilled.

	      Terminology
	      -----------

	      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
	      - `thenable` is an object or function that defines a `then` method.
	      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
	      - `exception` is a value that is thrown using the throw statement.
	      - `reason` is a value that indicates why a promise was rejected.
	      - `settled` the final resting state of a promise, fulfilled or rejected.

	      A promise can be in one of three states: pending, fulfilled, or rejected.

	      Promises that are fulfilled have a fulfillment value and are in the fulfilled
	      state.  Promises that are rejected have a rejection reason and are in the
	      rejected state.  A fulfillment value is never a thenable.

	      Promises can also be said to *resolve* a value.  If this value is also a
	      promise, then the original promise's settled state will match the value's
	      settled state.  So a promise that *resolves* a promise that rejects will
	      itself reject, and a promise that *resolves* a promise that fulfills will
	      itself fulfill.


	      Basic Usage:
	      ------------

	      ```js
	      var promise = new Promise(function(resolve, reject) {
	        // on success
	        resolve(value);

	        // on failure
	        reject(reason);
	      });

	      promise.then(function(value) {
	        // on fulfillment
	      }, function(reason) {
	        // on rejection
	      });
	      ```

	      Advanced Usage:
	      ---------------

	      Promises shine when abstracting away asynchronous interactions such as
	      `XMLHttpRequest`s.

	      ```js
	      function getJSON(url) {
	        return new Promise(function(resolve, reject){
	          var xhr = new XMLHttpRequest();

	          xhr.open('GET', url);
	          xhr.onreadystatechange = handler;
	          xhr.responseType = 'json';
	          xhr.setRequestHeader('Accept', 'application/json');
	          xhr.send();

	          function handler() {
	            if (this.readyState === this.DONE) {
	              if (this.status === 200) {
	                resolve(this.response);
	              } else {
	                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
	              }
	            }
	          };
	        });
	      }

	      getJSON('/posts.json').then(function(json) {
	        // on fulfillment
	      }, function(reason) {
	        // on rejection
	      });
	      ```

	      Unlike callbacks, promises are great composable primitives.

	      ```js
	      Promise.all([
	        getJSON('/posts'),
	        getJSON('/comments')
	      ]).then(function(values){
	        values[0] // => postsJSON
	        values[1] // => commentsJSON

	        return values;
	      });
	      ```

	      @class Promise
	      @param {function} resolver
	      Useful for tooling.
	      @constructor
	    */
	    function lib$es6$promise$promise$$Promise(resolver) {
	      this._id = lib$es6$promise$promise$$counter++;
	      this._state = undefined;
	      this._result = undefined;
	      this._subscribers = [];

	      if (lib$es6$promise$$internal$$noop !== resolver) {
	        if (!lib$es6$promise$utils$$isFunction(resolver)) {
	          lib$es6$promise$promise$$needsResolver();
	        }

	        if (!(this instanceof lib$es6$promise$promise$$Promise)) {
	          lib$es6$promise$promise$$needsNew();
	        }

	        lib$es6$promise$$internal$$initializePromise(this, resolver);
	      }
	    }

	    lib$es6$promise$promise$$Promise.all = lib$es6$promise$promise$all$$default;
	    lib$es6$promise$promise$$Promise.race = lib$es6$promise$promise$race$$default;
	    lib$es6$promise$promise$$Promise.resolve = lib$es6$promise$promise$resolve$$default;
	    lib$es6$promise$promise$$Promise.reject = lib$es6$promise$promise$reject$$default;
	    lib$es6$promise$promise$$Promise._setScheduler = lib$es6$promise$asap$$setScheduler;
	    lib$es6$promise$promise$$Promise._setAsap = lib$es6$promise$asap$$setAsap;
	    lib$es6$promise$promise$$Promise._asap = lib$es6$promise$asap$$asap;

	    lib$es6$promise$promise$$Promise.prototype = {
	      constructor: lib$es6$promise$promise$$Promise,

	    /**
	      The primary way of interacting with a promise is through its `then` method,
	      which registers callbacks to receive either a promise's eventual value or the
	      reason why the promise cannot be fulfilled.

	      ```js
	      findUser().then(function(user){
	        // user is available
	      }, function(reason){
	        // user is unavailable, and you are given the reason why
	      });
	      ```

	      Chaining
	      --------

	      The return value of `then` is itself a promise.  This second, 'downstream'
	      promise is resolved with the return value of the first promise's fulfillment
	      or rejection handler, or rejected if the handler throws an exception.

	      ```js
	      findUser().then(function (user) {
	        return user.name;
	      }, function (reason) {
	        return 'default name';
	      }).then(function (userName) {
	        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
	        // will be `'default name'`
	      });

	      findUser().then(function (user) {
	        throw new Error('Found user, but still unhappy');
	      }, function (reason) {
	        throw new Error('`findUser` rejected and we're unhappy');
	      }).then(function (value) {
	        // never reached
	      }, function (reason) {
	        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
	        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
	      });
	      ```
	      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

	      ```js
	      findUser().then(function (user) {
	        throw new PedagogicalException('Upstream error');
	      }).then(function (value) {
	        // never reached
	      }).then(function (value) {
	        // never reached
	      }, function (reason) {
	        // The `PedgagocialException` is propagated all the way down to here
	      });
	      ```

	      Assimilation
	      ------------

	      Sometimes the value you want to propagate to a downstream promise can only be
	      retrieved asynchronously. This can be achieved by returning a promise in the
	      fulfillment or rejection handler. The downstream promise will then be pending
	      until the returned promise is settled. This is called *assimilation*.

	      ```js
	      findUser().then(function (user) {
	        return findCommentsByAuthor(user);
	      }).then(function (comments) {
	        // The user's comments are now available
	      });
	      ```

	      If the assimliated promise rejects, then the downstream promise will also reject.

	      ```js
	      findUser().then(function (user) {
	        return findCommentsByAuthor(user);
	      }).then(function (comments) {
	        // If `findCommentsByAuthor` fulfills, we'll have the value here
	      }, function (reason) {
	        // If `findCommentsByAuthor` rejects, we'll have the reason here
	      });
	      ```

	      Simple Example
	      --------------

	      Synchronous Example

	      ```javascript
	      var result;

	      try {
	        result = findResult();
	        // success
	      } catch(reason) {
	        // failure
	      }
	      ```

	      Errback Example

	      ```js
	      findResult(function(result, err){
	        if (err) {
	          // failure
	        } else {
	          // success
	        }
	      });
	      ```

	      Promise Example;

	      ```javascript
	      findResult().then(function(result){
	        // success
	      }, function(reason){
	        // failure
	      });
	      ```

	      Advanced Example
	      --------------

	      Synchronous Example

	      ```javascript
	      var author, books;

	      try {
	        author = findAuthor();
	        books  = findBooksByAuthor(author);
	        // success
	      } catch(reason) {
	        // failure
	      }
	      ```

	      Errback Example

	      ```js

	      function foundBooks(books) {

	      }

	      function failure(reason) {

	      }

	      findAuthor(function(author, err){
	        if (err) {
	          failure(err);
	          // failure
	        } else {
	          try {
	            findBoooksByAuthor(author, function(books, err) {
	              if (err) {
	                failure(err);
	              } else {
	                try {
	                  foundBooks(books);
	                } catch(reason) {
	                  failure(reason);
	                }
	              }
	            });
	          } catch(error) {
	            failure(err);
	          }
	          // success
	        }
	      });
	      ```

	      Promise Example;

	      ```javascript
	      findAuthor().
	        then(findBooksByAuthor).
	        then(function(books){
	          // found books
	      }).catch(function(reason){
	        // something went wrong
	      });
	      ```

	      @method then
	      @param {Function} onFulfilled
	      @param {Function} onRejected
	      Useful for tooling.
	      @return {Promise}
	    */
	      then: function(onFulfillment, onRejection) {
	        var parent = this;
	        var state = parent._state;

	        if (state === lib$es6$promise$$internal$$FULFILLED && !onFulfillment || state === lib$es6$promise$$internal$$REJECTED && !onRejection) {
	          return this;
	        }

	        var child = new this.constructor(lib$es6$promise$$internal$$noop);
	        var result = parent._result;

	        if (state) {
	          var callback = arguments[state - 1];
	          lib$es6$promise$asap$$asap(function(){
	            lib$es6$promise$$internal$$invokeCallback(state, child, callback, result);
	          });
	        } else {
	          lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection);
	        }

	        return child;
	      },

	    /**
	      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
	      as the catch block of a try/catch statement.

	      ```js
	      function findAuthor(){
	        throw new Error('couldn't find that author');
	      }

	      // synchronous
	      try {
	        findAuthor();
	      } catch(reason) {
	        // something went wrong
	      }

	      // async with promises
	      findAuthor().catch(function(reason){
	        // something went wrong
	      });
	      ```

	      @method catch
	      @param {Function} onRejection
	      Useful for tooling.
	      @return {Promise}
	    */
	      'catch': function(onRejection) {
	        return this.then(null, onRejection);
	      }
	    };
	    function lib$es6$promise$polyfill$$polyfill() {
	      var local;

	      if (typeof global !== 'undefined') {
	          local = global;
	      } else if (typeof self !== 'undefined') {
	          local = self;
	      } else {
	          try {
	              local = Function('return this')();
	          } catch (e) {
	              throw new Error('polyfill failed because global object is unavailable in this environment');
	          }
	      }

	      var P = local.Promise;

	      if (P && Object.prototype.toString.call(P.resolve()) === '[object Promise]' && !P.cast) {
	        return;
	      }

	      local.Promise = lib$es6$promise$promise$$default;
	    }
	    var lib$es6$promise$polyfill$$default = lib$es6$promise$polyfill$$polyfill;

	    var lib$es6$promise$umd$$ES6Promise = {
	      'Promise': lib$es6$promise$promise$$default,
	      'polyfill': lib$es6$promise$polyfill$$default
	    };

	    /* global define:true module:true window: true */
	    if ("function" === 'function' && __webpack_require__(72)['amd']) {
	      !(__WEBPACK_AMD_DEFINE_RESULT__ = function() { return lib$es6$promise$umd$$ES6Promise; }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof module !== 'undefined' && module['exports']) {
	      module['exports'] = lib$es6$promise$umd$$ES6Promise;
	    } else if (typeof this !== 'undefined') {
	      this['ES6Promise'] = lib$es6$promise$umd$$ES6Promise;
	    }

	    lib$es6$promise$polyfill$$default();
	}).call(this);


	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(71)(module)))

/***/ },
/* 71 */
/***/ function(module, exports) {

	module.exports = function(module) {
		if(!module.webpackPolyfill) {
			module.deprecate = function() {};
			module.paths = [];
			// module.parent = undefined by default
			module.children = [];
			module.webpackPolyfill = 1;
		}
		return module;
	}


/***/ },
/* 72 */
/***/ function(module, exports) {

	module.exports = function() { throw new Error("define cannot be used indirect"); };


/***/ },
/* 73 */
/***/ function(module, exports, __webpack_require__) {

	var common_1 = __webpack_require__(74);
	var index_1 = __webpack_require__(83);
	var get_headers_1 = __webpack_require__(89);
	function open(request) {
	    return new Promise(function (resolve, reject) {
	        var url = request.fullUrl();
	        var method = request.method;
	        var responseType = request.options.responseType;
	        if (window.location.protocol === 'https:' && /^http\:/.test(url)) {
	            return reject(request.error("The request to \"" + url + "\" was blocked", 'EBLOCKED'));
	        }
	        var xhr = request.raw = new XMLHttpRequest();
	        xhr.onload = function () {
	            return resolve({
	                status: xhr.status === 1223 ? 204 : xhr.status,
	                headers: get_headers_1.parse(xhr.getAllResponseHeaders()),
	                body: responseType ? xhr.response : xhr.responseText,
	                url: xhr.responseURL
	            });
	        };
	        xhr.onabort = function () {
	            return reject(request.error('Request aborted', 'EABORT'));
	        };
	        xhr.onerror = function () {
	            return reject(request.error("Unable to connect to \"" + request.fullUrl() + "\"", 'EUNAVAILABLE'));
	        };
	        xhr.onprogress = function (e) {
	            if (e.lengthComputable) {
	                request.downloadLength = e.total;
	            }
	            request.downloadedBytes = e.loaded;
	        };
	        if (method === 'GET' || method === 'HEAD' || !xhr.upload) {
	            request.uploadLength = 0;
	            request.uploadedBytes = 0;
	        }
	        else {
	            xhr.upload.onprogress = function (e) {
	                if (e.lengthComputable) {
	                    request.uploadLength = e.total;
	                }
	                request.uploadedBytes = e.loaded;
	            };
	        }
	        try {
	            xhr.open(method, url);
	        }
	        catch (e) {
	            return reject(request.error("Refused to connect to \"" + url + "\"", 'ECSP', e));
	        }
	        if (request.options.withCredentials) {
	            xhr.withCredentials = true;
	        }
	        if (responseType) {
	            try {
	                xhr.responseType = responseType;
	            }
	            finally {
	                if (xhr.responseType !== responseType) {
	                    throw request.error("Unsupported response type: " + responseType, 'ERESPONSETYPE');
	                }
	            }
	        }
	        Object.keys(request.headers).forEach(function (header) {
	            xhr.setRequestHeader(request.name(header), request.get(header));
	        });
	        xhr.send(request.body);
	    });
	}
	function abort(request) {
	    request.raw.abort();
	}
	module.exports = common_1.defaults({
	    transport: { open: open, abort: abort, use: index_1.defaults }
	});
	//# sourceMappingURL=browser.js.map

/***/ },
/* 74 */
/***/ function(module, exports, __webpack_require__) {

	var extend = __webpack_require__(75);
	var methods = __webpack_require__(76);
	var request_1 = __webpack_require__(78);
	var response_1 = __webpack_require__(82);
	var plugins = __webpack_require__(83);
	var form_1 = __webpack_require__(86);
	var jar_1 = __webpack_require__(87);
	if (typeof Promise === 'undefined') {
	    var context = typeof window === 'object' ? 'window' : 'global';
	    var message = (context + ".Promise is undefined and must be polyfilled. ") +
	        "Try using https://github.com/jakearchibald/es6-promise instead.";
	    throw new TypeError(message);
	}
	function extendDefaults(defaults, options) {
	    if (typeof options === 'string') {
	        return extend(defaults, { url: options });
	    }
	    return extend(defaults, options);
	}
	function defaults(defaultsOptions) {
	    var popsicle = function popsicle(options) {
	        var opts = extendDefaults(defaultsOptions, options);
	        if (typeof opts.url !== 'string') {
	            throw new TypeError('No URL specified');
	        }
	        return new request_1.default(opts);
	    };
	    popsicle.Request = request_1.default;
	    popsicle.Response = response_1.default;
	    popsicle.plugins = plugins;
	    popsicle.form = form_1.default;
	    popsicle.jar = jar_1.default;
	    popsicle.browser = !!process.browser;
	    popsicle.defaults = function (options) {
	        return defaults(extend(defaultsOptions, options));
	    };
	    methods.forEach(function (method) {
	        ;
	        popsicle[method] = function (options) {
	            return popsicle(extendDefaults({ method: method }, options));
	        };
	    });
	    return popsicle;
	}
	exports.defaults = defaults;
	//# sourceMappingURL=common.js.map

/***/ },
/* 75 */
/***/ function(module, exports) {

	module.exports = extend

	function extend() {
	    var target = {}

	    for (var i = 0; i < arguments.length; i++) {
	        var source = arguments[i]

	        for (var key in source) {
	            if (source.hasOwnProperty(key)) {
	                target[key] = source[key]
	            }
	        }
	    }

	    return target
	}


/***/ },
/* 76 */
/***/ function(module, exports, __webpack_require__) {

	
	var http = __webpack_require__(77);

	/* istanbul ignore next: implementation differs on version */
	if (http.METHODS) {

	  module.exports = http.METHODS.map(function(method){
	    return method.toLowerCase();
	  });

	} else {

	  module.exports = [
	    'get',
	    'post',
	    'put',
	    'head',
	    'delete',
	    'options',
	    'trace',
	    'copy',
	    'lock',
	    'mkcol',
	    'move',
	    'purge',
	    'propfind',
	    'proppatch',
	    'unlock',
	    'report',
	    'mkactivity',
	    'checkout',
	    'merge',
	    'm-search',
	    'notify',
	    'subscribe',
	    'unsubscribe',
	    'patch',
	    'search',
	    'connect'
	  ];

	}


/***/ },
/* 77 */
/***/ function(module, exports) {

	module.exports = require("http");

/***/ },
/* 78 */
/***/ function(module, exports, __webpack_require__) {

	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var arrify = __webpack_require__(79);
	var extend = __webpack_require__(75);
	var base_1 = __webpack_require__(80);
	var response_1 = __webpack_require__(82);
	var Request = (function (_super) {
	    __extends(Request, _super);
	    function Request(options) {
	        var _this = this;
	        _super.call(this, options);
	        this.aborted = false;
	        this.timedout = false;
	        this.opened = false;
	        this.started = false;
	        this.uploadLength = null;
	        this.downloadLength = null;
	        this._uploadedBytes = null;
	        this._downloadedBytes = null;
	        this._before = [];
	        this._after = [];
	        this._always = [];
	        this._progress = [];
	        this.timeout = Number(options.timeout) || 0;
	        this.method = (options.method || 'GET').toUpperCase();
	        this.body = options.body;
	        this.options = extend(options.options);
	        this._promise = new Promise(function (resolve, reject) {
	            process.nextTick(function () { return start(_this).then(resolve, reject); });
	        });
	        this.transport = options.transport;
	        this.use(options.use || this.transport.use);
	        this.always(removeListeners);
	    }
	    Request.prototype.use = function (fn) {
	        var _this = this;
	        arrify(fn).forEach(function (fn) { return fn(_this); });
	        return this;
	    };
	    Request.prototype.error = function (message, type, original) {
	        var err = new Error(message);
	        err.popsicle = this;
	        err.type = type;
	        err.original = original;
	        return err;
	    };
	    Request.prototype.then = function (onFulfilled, onRejected) {
	        return this._promise.then(onFulfilled, onRejected);
	    };
	    Request.prototype.catch = function (onRejected) {
	        return this.then(null, onRejected);
	    };
	    Request.prototype.exec = function (cb) {
	        this.then(function (response) {
	            cb(null, response);
	        }).catch(cb);
	    };
	    Request.prototype.toJSON = function () {
	        return {
	            url: this.fullUrl(),
	            headers: this.get(),
	            body: this.body,
	            options: this.options,
	            timeout: this.timeout,
	            method: this.method
	        };
	    };
	    Request.prototype.progress = function (fn) {
	        return pluginFunction(this, '_progress', fn);
	    };
	    Request.prototype.before = function (fn) {
	        return pluginFunction(this, '_before', fn);
	    };
	    Request.prototype.after = function (fn) {
	        return pluginFunction(this, '_after', fn);
	    };
	    Request.prototype.always = function (fn) {
	        return pluginFunction(this, '_always', fn);
	    };
	    Request.prototype.abort = function () {
	        if (this.completed === 1 || this.aborted) {
	            return this;
	        }
	        this.aborted = true;
	        this.errored = this.errored || this.error('Request aborted', 'EABORT');
	        if (this.opened) {
	            emitProgress(this);
	            this._progress = null;
	            if (this.transport.abort) {
	                this.transport.abort(this);
	            }
	        }
	        return this;
	    };
	    Object.defineProperty(Request.prototype, "uploaded", {
	        get: function () {
	            return this.uploadLength ? this.uploadedBytes / this.uploadLength : 0;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Request.prototype, "downloaded", {
	        get: function () {
	            return this.downloadLength ? this.downloadedBytes / this.downloadLength : 0;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Request.prototype, "completed", {
	        get: function () {
	            return (this.uploaded + this.downloaded) / 2;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Request.prototype, "completedBytes", {
	        get: function () {
	            return this.uploadedBytes + this.downloadedBytes;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Request.prototype, "totalBytes", {
	        get: function () {
	            return this.uploadLength + this.downloadLength;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Request.prototype, "uploadedBytes", {
	        get: function () {
	            return this._uploadedBytes;
	        },
	        set: function (bytes) {
	            if (bytes !== this._uploadedBytes) {
	                this._uploadedBytes = bytes;
	                emitProgress(this);
	            }
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Request.prototype, "downloadedBytes", {
	        get: function () {
	            return this._downloadedBytes;
	        },
	        set: function (bytes) {
	            if (bytes !== this._downloadedBytes) {
	                this._downloadedBytes = bytes;
	                emitProgress(this);
	            }
	        },
	        enumerable: true,
	        configurable: true
	    });
	    return Request;
	})(base_1.default);
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Request;
	function pluginFunction(request, property, fn) {
	    if (request.started) {
	        throw new Error('Plugins can not be used after the request has started');
	    }
	    if (typeof fn !== 'function') {
	        throw new TypeError("Expected a function, but got " + fn + " instead");
	    }
	    request[property].push(fn);
	    return request;
	}
	function start(request) {
	    var req = request;
	    var timeout = request.timeout;
	    var url = request.fullUrl();
	    var timer;
	    request.started = true;
	    if (request.errored) {
	        return Promise.reject(request.errored);
	    }
	    if (/^https?\:\/*(?:[~#\\\?;\:]|$)/.test(url)) {
	        return Promise.reject(request.error("Refused to connect to invalid URL \"" + url + "\"", 'EINVALID'));
	    }
	    return chain(req._before, request)
	        .then(function () {
	        if (request.errored) {
	            return Promise.reject(request.errored);
	        }
	        if (timeout) {
	            timer = setTimeout(function () {
	                var error = request.error("Timeout of " + request.timeout + "ms exceeded", 'ETIMEOUT');
	                request.errored = error;
	                request.timedout = true;
	                request.abort();
	            }, timeout);
	        }
	        req.opened = true;
	        return req.transport.open(request);
	    })
	        .then(function (options) {
	        if (request.errored) {
	            return Promise.reject(request.errored);
	        }
	        var response = new response_1.default(options);
	        response.request = request;
	        request.response = response;
	        return response;
	    })
	        .then(function (response) {
	        return chain(req._after, response);
	    })
	        .then(function () {
	        return chain(req._always, request).then(function () { return request.response; });
	    }, function (error) {
	        return chain(req._always, request).then(function () { return Promise.reject(request.errored || error); });
	    })
	        .then(function (response) {
	        if (request.errored) {
	            return Promise.reject(request.errored);
	        }
	        return response;
	    });
	}
	function chain(fns, arg) {
	    return fns.reduce(function (p, fn) {
	        return p.then(function () { return fn(arg); });
	    }, Promise.resolve());
	}
	function removeListeners(request) {
	    ;
	    request._before = null;
	    request._after = null;
	    request._always = null;
	    request._progress = null;
	}
	function emitProgress(request) {
	    var fns = request._progress;
	    if (!fns || request.errored) {
	        return;
	    }
	    try {
	        for (var i = 0; i < fns.length; i++) {
	            fns[i](request);
	        }
	    }
	    catch (err) {
	        request.errored = err;
	        request.abort();
	    }
	}
	//# sourceMappingURL=request.js.map

/***/ },
/* 79 */
/***/ function(module, exports) {

	'use strict';
	module.exports = function (val) {
		if (val == null) {
			return [];
		}

		return Array.isArray(val) ? val : [val];
	};


/***/ },
/* 80 */
/***/ function(module, exports, __webpack_require__) {

	var arrify = __webpack_require__(79);
	var querystring_1 = __webpack_require__(81);
	var extend = __webpack_require__(75);
	function lowerHeader(key) {
	    var lower = key.toLowerCase();
	    if (lower === 'referrer') {
	        return 'referer';
	    }
	    return lower;
	}
	function type(str) {
	    return str == null ? null : str.split(/ *; */)[0];
	}
	var Base = (function () {
	    function Base(_a) {
	        var url = _a.url, headers = _a.headers, query = _a.query;
	        this.url = null;
	        this.headers = {};
	        this.headerNames = {};
	        this.query = {};
	        if (typeof url === 'string') {
	            var queryIndexOf = url.indexOf('?');
	            var queryObject = typeof query === 'string' ? querystring_1.parse(query) : query;
	            if (queryIndexOf > -1) {
	                this.url = url.substr(0, queryIndexOf);
	                this.query = extend(queryObject, querystring_1.parse(url.substr(queryIndexOf + 1)));
	            }
	            else {
	                this.url = url;
	                this.query = extend(queryObject);
	            }
	        }
	        this.set(headers);
	    }
	    Base.prototype.set = function (name, value) {
	        var _this = this;
	        if (typeof name !== 'string') {
	            if (name) {
	                Object.keys(name).forEach(function (key) {
	                    _this.set(key, name[key]);
	                });
	            }
	        }
	        else {
	            var lower = lowerHeader(name);
	            if (value == null) {
	                delete this.headers[lower];
	                delete this.headerNames[lower];
	            }
	            else {
	                this.headers[lower] = value;
	                this.headerNames[lower] = name;
	            }
	        }
	        return this;
	    };
	    Base.prototype.append = function (name, value) {
	        var prev = this.get(name);
	        var val = arrify(prev).concat(value);
	        return this.set(name, val);
	    };
	    Base.prototype.name = function (name) {
	        return this.headerNames[lowerHeader(name)];
	    };
	    Base.prototype.get = function (name) {
	        var _this = this;
	        if (arguments.length === 0) {
	            var headers = {};
	            Object.keys(this.headers).forEach(function (key) {
	                headers[_this.name(key)] = _this.get(key);
	            });
	            return headers;
	        }
	        else {
	            return this.headers[lowerHeader(name)];
	        }
	    };
	    Base.prototype.remove = function (name) {
	        var lower = lowerHeader(name);
	        delete this.headers[lower];
	        delete this.headerNames[lower];
	        return this;
	    };
	    Base.prototype.type = function (value) {
	        if (arguments.length === 0) {
	            return type(this.headers['content-type']);
	        }
	        return this.set('Content-Type', value);
	    };
	    Base.prototype.fullUrl = function () {
	        var url = this.url;
	        var query = querystring_1.stringify(this.query);
	        if (query) {
	            return url + (url.indexOf('?') === -1 ? '?' : '&') + query;
	        }
	        return url;
	    };
	    return Base;
	})();
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Base;
	//# sourceMappingURL=base.js.map

/***/ },
/* 81 */
/***/ function(module, exports) {

	module.exports = require("querystring");

/***/ },
/* 82 */
/***/ function(module, exports, __webpack_require__) {

	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var base_1 = __webpack_require__(80);
	var Response = (function (_super) {
	    __extends(Response, _super);
	    function Response(options) {
	        _super.call(this, options);
	        this.body = options.body;
	        this.status = options.status;
	    }
	    Response.prototype.statusType = function () {
	        return ~~(this.status / 100);
	    };
	    Response.prototype.error = function (message, type, error) {
	        return this.request.error(message, type, error);
	    };
	    Response.prototype.toJSON = function () {
	        return {
	            url: this.fullUrl(),
	            headers: this.get(),
	            body: this.body,
	            status: this.status
	        };
	    };
	    return Response;
	})(base_1.default);
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = Response;
	//# sourceMappingURL=response.js.map

/***/ },
/* 83 */
/***/ function(module, exports, __webpack_require__) {

	function __export(m) {
	    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	}
	__export(__webpack_require__(84));
	var common_2 = __webpack_require__(84);
	exports.defaults = [common_2.stringify, common_2.headers, common_2.parse];
	//# sourceMappingURL=browser.js.map

/***/ },
/* 84 */
/***/ function(module, exports, __webpack_require__) {

	var FormData = __webpack_require__(85);
	var querystring_1 = __webpack_require__(81);
	var form_1 = __webpack_require__(86);
	var JSON_MIME_REGEXP = /^application\/(?:[\w!#\$%&\*`\-\.\^~]*\+)?json$/i;
	var QUERY_MIME_REGEXP = /^application\/x-www-form-urlencoded$/i;
	var FORM_MIME_REGEXP = /^multipart\/form-data$/i;
	var isHostObject;
	if (process.browser) {
	    isHostObject = function (object) {
	        var str = Object.prototype.toString.call(object);
	        switch (str) {
	            case '[object File]':
	            case '[object Blob]':
	            case '[object FormData]':
	            case '[object ArrayBuffer]':
	                return true;
	            default:
	                return false;
	        }
	    };
	}
	else {
	    isHostObject = function (object) {
	        return typeof object.pipe === 'function' || Buffer.isBuffer(object);
	    };
	}
	function defaultHeaders(request) {
	    if (!request.get('Accept')) {
	        request.set('Accept', '*/*');
	    }
	    request.remove('Host');
	}
	function stringifyRequest(request) {
	    var body = request.body;
	    if (Object(body) !== body) {
	        request.body = body == null ? null : String(body);
	        return;
	    }
	    if (isHostObject(body)) {
	        return;
	    }
	    var type = request.type();
	    if (!type) {
	        type = 'application/json';
	        request.type(type);
	    }
	    try {
	        if (JSON_MIME_REGEXP.test(type)) {
	            request.body = JSON.stringify(body);
	        }
	        else if (FORM_MIME_REGEXP.test(type)) {
	            request.body = form_1.default(body);
	        }
	        else if (QUERY_MIME_REGEXP.test(type)) {
	            request.body = querystring_1.stringify(body);
	        }
	    }
	    catch (err) {
	        return Promise.reject(request.error('Unable to stringify request body: ' + err.message, 'ESTRINGIFY', err));
	    }
	    if (request.body instanceof FormData) {
	        request.remove('Content-Type');
	    }
	}
	function parseResponse(response) {
	    var body = response.body;
	    if (typeof body !== 'string') {
	        return;
	    }
	    if (body === '') {
	        response.body = null;
	        return;
	    }
	    var type = response.type();
	    try {
	        if (JSON_MIME_REGEXP.test(type)) {
	            response.body = body === '' ? null : JSON.parse(body);
	        }
	        else if (QUERY_MIME_REGEXP.test(type)) {
	            response.body = querystring_1.parse(body);
	        }
	    }
	    catch (err) {
	        return Promise.reject(response.error('Unable to parse response body: ' + err.message, 'EPARSE', err));
	    }
	}
	function headers(request) {
	    request.before(defaultHeaders);
	}
	exports.headers = headers;
	function stringify(request) {
	    request.before(stringifyRequest);
	}
	exports.stringify = stringify;
	function parse(request) {
	    request.after(parseResponse);
	}
	exports.parse = parse;
	//# sourceMappingURL=common.js.map

/***/ },
/* 85 */
/***/ function(module, exports) {

	module.exports = FormData;
	//# sourceMappingURL=form-data.js.map

/***/ },
/* 86 */
/***/ function(module, exports, __webpack_require__) {

	var FormData = __webpack_require__(85);
	function form(obj) {
	    var form = new FormData();
	    if (obj) {
	        Object.keys(obj).forEach(function (name) {
	            form.append(name, obj[name]);
	        });
	    }
	    return form;
	}
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = form;
	//# sourceMappingURL=form.js.map

/***/ },
/* 87 */
/***/ function(module, exports, __webpack_require__) {

	var tough_cookie_1 = __webpack_require__(88);
	function cookieJar(store) {
	    return new tough_cookie_1.CookieJar(store);
	}
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = cookieJar;
	//# sourceMappingURL=jar.js.map

/***/ },
/* 88 */
/***/ function(module, exports) {

	module.exports = function ToughCookie() {
	    throw new TypeError('Cookie jars are only available on node');
	};
	//# sourceMappingURL=tough-cookie.js.map

/***/ },
/* 89 */
/***/ function(module, exports) {

	function parse(value) {
	    var arr = [];
	    var lines = value.replace(/\r?\n$/, '').split(/\r?\n/);
	    for (var i = 0; i < lines.length; i++) {
	        var header = lines[i];
	        var indexOf = header.indexOf(':');
	        var name_1 = header.substr(0, indexOf).trim();
	        var value_1 = header.substr(indexOf + 1).trim();
	        arr.push(name_1, value_1);
	    }
	    return array(arr);
	}
	exports.parse = parse;
	function http(response) {
	    if (response.rawHeaders) {
	        return array(response.rawHeaders);
	    }
	    var headers = {};
	    Object.keys(response.headers).forEach(function (key) {
	        var value = response.headers[key];
	        if (value.length === 1) {
	            headers[key] = value[0];
	        }
	        else {
	            headers[key] = value;
	        }
	    });
	    return headers;
	}
	exports.http = http;
	function array(values) {
	    var casing = {};
	    var headers = {};
	    for (var i = 0; i < values.length; i = i + 2) {
	        var name_2 = values[i];
	        var lower = name_2.toLowerCase();
	        var oldName = casing[lower];
	        var value = values[i + 1];
	        if (!headers.hasOwnProperty(oldName)) {
	            headers[name_2] = value;
	        }
	        else {
	            if (name_2 !== oldName) {
	                headers[name_2] = headers[oldName];
	                delete headers[oldName];
	            }
	            if (typeof headers[name_2] === 'string') {
	                headers[name_2] = [headers[name_2], value];
	            }
	            else {
	                headers[name_2].push(value);
	            }
	        }
	        casing[lower] = name_2;
	    }
	    return headers;
	}
	exports.array = array;
	//# sourceMappingURL=index.js.map

/***/ },
/* 90 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (root, factory) {
	    if (true) {
	        !(__WEBPACK_AMD_DEFINE_FACTORY__ = (factory), __WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ? (__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) : __WEBPACK_AMD_DEFINE_FACTORY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	    } else if (typeof exports === 'object') {
	        module.exports = factory();
	    } else {
	        root.deepmerge = factory();
	    }
	}(this, function () {

	return function deepmerge(target, src) {
	    var array = Array.isArray(src);
	    var dst = array && [] || {};

	    if (array) {
	        target = target || [];
	        dst = dst.concat(target);
	        src.forEach(function(e, i) {
	            if (typeof dst[i] === 'undefined') {
	                dst[i] = e;
	            } else if (typeof e === 'object') {
	                dst[i] = deepmerge(target[i], e);
	            } else {
	                if (target.indexOf(e) === -1) {
	                    dst.push(e);
	                }
	            }
	        });
	    } else {
	        if (target && typeof target === 'object') {
	            Object.keys(target).forEach(function (key) {
	                dst[key] = target[key];
	            })
	        }
	        Object.keys(src).forEach(function (key) {
	            if (typeof src[key] !== 'object' || !src[key]) {
	                dst[key] = src[key];
	            }
	            else {
	                if (!target[key]) {
	                    dst[key] = src[key];
	                } else {
	                    dst[key] = deepmerge(target[key], src[key]);
	                }
	            }
	        });
	    }

	    return dst;
	}

	}));


/***/ }
/******/ ])
});
;