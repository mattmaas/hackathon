"use strict";

require('es6-promise').polyfill();
var request = require('popsicle');
var merge = require('deepmerge');
var md5 = require('blueimp-md5');

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
        if (!(tags.hasOwnProperty(tagId))) { // will override default properties
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

function Oauth2(argsObj){
  this.args = new Arg()
    .requires('id', 'secret', 'tokenUrl')
    .defaults({
      grantType: 'client_credentials',
      secretKey: 'client_secret',
      idKey: 'client_id',
      grantKey: 'grant_type'
    }).parse(argsObj);
  this.token = undefined;
}

Oauth2.prototype.authenticate = function authenticate(renewToken){
  return this.getToken(renewToken).then(this.getHeaders.bind(this));
};

Oauth2.prototype.getToken = function getToken(renew) {
  if (!renew && this.token !== undefined) return Promise.resolve(this.token);

  var a = this.args;
  var q = {};
  q[a.grantKey] =  a.grantType;
  q[a.secretKey] = a.secret;
  q[a.idKey] = a.id;

  var _this = this;
  return request({
    url: a.tokenUrl,
    method: 'POST',
    query: q,
      headers: {'content-length': 0}
  }).then(function(response) {
    if (response.status === 401) throw "Could not get access token";

    _this.token = response.body.access_token;
    return _this.token;
  });
};

Oauth2.prototype.getHeaders = function getHeaders(token){
  return {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  }
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
function UrlResolver(config){
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


function Arg(defaults, required, argObj){
  this.def = defaults || {};
  this.req = required || [];

  if (argObj !== undefined) {
    return this.parse(argObj);
  }
}

Arg.prototype.parse = function parse(argObj){
  var args = merge(this.def, argObj);

  var arg;
  if (this.req !== undefined) {
    for (var i = 0; i < this.req.length; i++) {
      arg = this.req[i];
      if (arg instanceof Array) {
        if (!any(arg.map(function(a) {return a in args && args[a] !== undefined}))) {
          throw "At least one of the following arguments must be supplied: " + arg;
        }
      } else if (!(arg in args)) {
        throw 'Required argument missing: ' + arg;
      }
    }
  }

  return args;
};

Arg.prototype.requires = function requires(){
  this.req = Array.prototype.slice.call(arguments);
  return this;
};

Arg.prototype.defaults = function defaults(args){
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


var setIfDefined = function(obj, propName, value, chainReturn) {
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
  this.onError('default', function(error, requestObj) {
    return new Promise(function(resolve) {
      setTimeout(function(){ resolve(requestObj); }, _this.backoffTime);
    });
  });
  this.onError(401, function(error, requestObj) { return _this.authenticate(requestObj, true); });
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
    requestObj.headers = {}
  }
  requestObj.headers['content-length'] = 0

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
  return this.performRequest(requestObj)
    .then(this.verifyResponse.bind(this))  // verify response might turn it into an error
    .catch(function(error) {
      if (maxAttempts <= numAttempts) { return Promise.reject(error); }

      return _this.handleError(error, requestObj)
        .then(function(requestObj) {
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
    return Promise.reject(error);
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

  return this.errorHandlers.default;
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
    return this.auth.authenticate(reauthenticate)
      .then(function(authParams) {
        return merge(requestObj, authParams);
      });
  } else {
    return new Promise(function(resolve) { return resolve(requestObj)});
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
    return Promise.reject(error);
  } else if (response.body && response.body.status && response.body.status.status === 'ERROR') {
    var error = response.error("API error: " + response.body.status.message);
    return Promise.reject(error);
  } else {
    return response;
  }
}


class Document {
  constructor(docResponse, collectionId) {
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

  get collectionId() {
    return this.collection_id;
  }
  set collectionId(val) {
    this.collection_id = val;
  }

  get id() {
    return this.docid;
  }
}
function makeDocuments(apiResponse, collectionId) {
  if ('document' in apiResponse.body) {
    return new Document(apiResponse.body.document, collectionId);
  }
  if ('documents' in apiResponse.body) {
    return apiResponse.body.documents.map(function(docResp) {return new Document(docResp, collectionId)});
  }
  if ('results' in apiResponse.body) {
    return apiResponse.body.results.map(function(result) {
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
    return apiResponse.body.collections.map(function(colResp) {return new Collection(colResp)});
  }
}



class ResourceManager {
  constructor({ urlResolver, requestHandler }) {
    this.urlResolver = urlResolver;
    this.requestHandler = requestHandler;
  }

  execute({ method, operation, urlParams, requestBody, queryString }) {
    var query = {
      method,
      url: this.routeFor(operation, urlParams),
      headers: {
        'Accept': 'application/json'
      }
    };
    setIfDefined(query, 'body', requestBody);
    setIfDefined(query, 'query', queryString);

    return this.requestHandler.request(query);
  }

  routeFor(operation, params) {}
}


class CollectionManager extends ResourceManager {
  routeFor(operation, params){
    var resourceName = operation === 'list' || operation === 'create' ? 'collectionList' : 'collectionDetail';
    return this.urlResolver.routeFor(resourceName, params);
  }

  create({ id, properties, settings={max_num_docs: 100000} }){
    return this.execute({
      operation: 'create',
      method: 'POST',
      requestBody: {
        collection: {
          id,
          properties,
          settings
        }
      }
    }).then(makeCollections);
  }

  remove(id) {
    return this.execute({
      operation: 'delete',
      method: 'DELETE',
      urlParams: {collectionId: id}
    });
  }

  retrieve(id) {
    return this.execute({
      operation: 'retrieve',
      method: 'GET',
      urlParams: {collectionId: id}
    }).then(makeCollections);
  }

  list() {
    return this.execute({
      operation: 'list',
      method: 'GET'
    }).then(makeCollections);
  }
}


class DocumentManager extends ResourceManager {
  routeFor(operation, params){
    var resourceName = operation === 'list' || operation === 'create' ? 'documentList' : 'documentDetail';
    return this.urlResolver.routeFor(resourceName, {
      documentId: params.documentId,
      collectionId: params.collectionId
    });
  }

  create({ collectionId, document, documents, options={} }){
    if (collectionId === undefined) throw Error('collectionId was not provided');
    var body = { options };
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
    }).then(function(resp){
      return makeDocuments(resp, collectionId);
    });
  }

  remove({ id, collectionId }){
    return this.execute({
      operation: 'delete',
      method: 'DELETE',
      urlParams: {
        documentId: id,
        collectionId: collectionId
      }
    });
  }

  retrieve({ id, collectionId }){
    return this.execute({
      operation: 'retrieve',
      method: 'GET',
      urlParams: {
        documentId: id,
        collectionId
      }
    }).then(function(resp){
      return makeDocuments(resp, collectionId);
    });
  }

  list(collectionId){
    return this.execute({
      operation: 'list',
      method: 'GET',
      urlParams: {
        collectionId
      }
    }).then(function(resp){
      return makeDocuments(resp, collectionId);
    });
  }
}

class AnnotationManager extends ResourceManager {
  routeFor(operation, params) {
    return this.urlResolver.routeFor('annotation', {
      documentId: params.documentId || this.documentId,
      collectionId: params.collectionId || this.collectionId
    });
  }

  add({ collectionId, documentId, annotations, namespace, annotation_set }) {
    return this.execute({
      operation: 'add',
      method: 'PUT',
      urlParams: {
        documentId,
        collectionId
      },
      requestBody: {
        annotation_set: this.toAnnotationSet({ annotations, namespace, annotation_set })
      }
    });
  }

  /**
   * Expects either annotations and namespace or annotation_set
   */
  remove({ collectionId, documentId, annotations, namespace, annotation_set, userId }) {
    var annotation_set = this.toAnnotationSet({ annotations, namespace, annotation_set });
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
        documentId,
        collectionId
      },
      requestBody: {
        annotation_set: annotation_set
      }
    });
  }


  undoRemove({ collectionId, documentId, annotations, namespace, annotation_set, userId }) {
    var annotation_set = this.toAnnotationSet({ annotations, namespace, annotation_set });
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
        documentId,
        collectionId
      },
      requestBody: {
        annotation_set: annotation_set
      }
    });
  }

  toAnnotation(argsObj) {
    if (typeof argsObj === "string") {
      return {tag: {cname: argsObj}};
    } else if ('text' in argsObj) {
      var a = {tag: {cname: argsObj.text}};
      if ('score' in argsObj) a.score = argsObj.score;
      if ('user' in argsObj) a.user_id = argsObj.user;
      return a;
    }
  }

  toAnnotationSet(args) {
    var annotation_set = {};
    if (args.annotation_set !== undefined) {
      annotation_set = args.annotation_set
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

}


class Concept {
  constructor({ namespace, cname }) {
    this.namespace = namespace;
    this.cname = cname;
  }

  static fromResponse(response) {
    if ('body' in response) {
      return new Concept(response.body.concept);
    } else if ('cname' in response) {
      return new Concept(response);
    }
  }
}

class ConceptManager extends ResourceManager {
  routeFor(operation, params) {
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

  create({ namespace, cname }) {
    return this.execute({
      operation: 'create',
      method: 'POST',
      requestBody: {
        namespace,
        cname
      }
    }).then(Concept.fromResponse);
  }

  retrieve({ namespace, cname }) {
    return this.execute({
      operation: 'retrieve',
      method: 'GET',
      urlParams: {
        namespace,
        cname
      }
    }).then(Concept.fromResponse);
  }

  list() {
    return this.execute({
      operation: 'list',
      method: 'GET'
    }).then(function(r){
      return r.body.concepts.map(Concept.fromResponse);
    });
  }

  remove({ namespace, cname }) {
    return this.execute({
      operation: 'delete',
      method: 'DELETE',
      urlParams: {
        namespace,
        cname
      }
    });
  }

  train({ namespace, cname }) {
    return this.execute({
      operation: 'train',
      method: 'POST',
      urlParams: {
        namespace,
        cname
      }
    });
  }

  predict({ namespace, cname, urls, url }) {
    return this.execute({
      operation: 'predict',
      method: 'POST',
      urlParams: {
        namespace,
        cname
      },
      requestBody: {
        urls: urls !== undefined ? urls : [url]
      }
    });
  }
}


/**
 * ## Clarifai
 * Read/Write client to the Clarifai API. Supports same operations as ClarifaiSearch but also adds
 * @param auth
 * @param urlResolver
 * @constructor
 */
function Clarifai(auth, urlResolver) {
  this.requestHandler = new RequestHandler({auth: auth});
  this.requestHandler.verifyResponse = promoteErrors;
  this.urlResolver = urlResolver || curatorAPIResolver;

  var argsObj = {requestHandler: this.requestHandler, urlResolver: this.urlResolver};
  this.collections = new CollectionManager(argsObj);
  this.documents = new DocumentManager(argsObj);
  this.concepts = new ConceptManager(argsObj);
  this.annotations = new AnnotationManager(argsObj);
}


export default class ClarifaiBasic {
  constructor({ id, secret }) {
    this.collectionId = 'default';
    this.namespace = 'default';
    this.model = 'general-v1.2';
    this.clarifai = new Clarifai(new Oauth2({ id, secret, tokenUrl: 'https://api-alpha.clarifai.com/v1/token/' }));

    //// try to create collection
    this.clarifai.collections.create({id: this.collectionId})
      .catch(e => undefined);
  }

  negative(url, concept) {
    var doc = this.formatDoc(url, concept, -1);
    return this.clarifai.documents.create({
      collectionId: this.collectionId,
      document: doc,
      options: this.formatOptions()
    }).catch(e => this.clarifai.annotations.add({
      collectionId: this.collectionId,
      documentId: doc.docid,
      annotationSet: doc.annotation_sets[0]
    })).catch(e => {
      throw Error('Could not add example, there might be something wrong with the url')
    })
  }

  positive(url, concept) {
    var doc = this.formatDoc(url, concept, 1);
    return this.clarifai.documents.create({
      collectionId: this.collectionId,
      document: doc,
      options: this.formatOptions()
    }).catch(e => this.clarifai.annotations.add({
      collectionId: this.collectionId,
      documentId: doc.docid,
      annotationSet: doc.annotation_sets[0]
    })).catch(e => {
      throw Error('Could not add example, there might be something wrong with the url')
    })
  }

  train(concept) {
    return this.clarifai.concepts.train({
      namespace: this.namespace,
      cname: concept
    })
  }

  predict(url, concept) {
    return this.clarifai.concepts.predict({
      namespace: this.namespace,
      cname: concept,
      url
    })
  }

  formatOptions() {
    return {
      want_doc_response: true,
      recognition_options:
      {
        model: this.model
      }
    }
  }

  formatDoc(url, concept, score) {
    return {
      docid: md5(url),
      media_refs: [
        {
          url,
          media_type: "image"
        }
      ],
      annotation_sets: [
        {
          namespace: this.namespace,
          annotations: [
            {
              score,
              tag: {
                cname: concept
              }
            }
          ]
        }
      ]
    };
  }

  tag(url) {
    return this.clarifai.requestHandler.request({
      url: 'https://api.clarifai.com/v1/tag',
      method: 'POST',
      body: {
        url
      }
    })
  }
}

