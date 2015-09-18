# -*- coding: utf-8 -*-
"""Simple Clarifai Custom Model Training API Wrapper

This module provides a simple wrapper around the Clarifai API in order to
make it very easy to train your first custom model and then use it for
predictions.

"""

from __future__ import absolute_import

import json
import uuid

from clarifai.client import ClarifaiApi, ApiError, ApiBadRequestError
from clarifai.client.client import API_VERSION
from request_helper import CuratorApiRequestHelper

def request(name, method='GET'):
  def decorator(get_body):
    def process_request(self, *args, **kwargs):
      argsnames = get_body.func_code.co_varnames[1:len(args)+1]
      arguments = dict(kwargs)
      arguments.update(zip(argsnames, args))
      url = self._url_for_op(name).format(**arguments)
      body = get_body(self, *args, **kwargs)
      kwargs = {'method': method}
      if body is not None:
        kwargs['data'] = body
      raw_response = self._get_raw_response(self._get_json_headers,
                                            self._get_json_response,
                                            url,
                                            kwargs)
      return self.check_status(raw_response)
    return process_request
  return decorator


def drop(dictionary, value=None):
  """drops items with given value"""
  return {k: v for k, v in dictionary.iteritems() if v != value}


class CuratorApiError(ApiError):

  def __init__(self, status):
    self.status = status

  def __str__(self):
    try:
      return '%s: %s' % (self.status['status'], self.status['message'])
    except:
      return 'Malformed API response, no status'


class CuratorApiClient(ClarifaiApi):

  def __init__(self, app_id=None, app_secret=None,
               base_url='https://api.clarifai.com', wait_on_throttle=True,
               collection_id=None, request_helper=None):
    # FIXME: this is optional now, e.g. if we want to do GET /collections.  Error check later.
    #if not collection_id:
    #  raise Exception('Missing required param: collection_id.')
    self.collection_id = collection_id
    self.request_helper = request_helper
    if self.request_helper is None:
      self.request_helper = CuratorApiRequestHelper(collection_id=collection_id)
    super(CuratorApiClient, self).__init__(app_id=app_id,
                                           app_secret=app_secret,
                                           base_url=base_url,
                                           wait_on_throttle=wait_on_throttle)

    self.add_url('collections', 'curator/collections')
    self.add_url('document', 'curator/collections/%s/documents' % self.collection_id)
    self.add_url('index', 'curator/collections')
    self.add_url('concepts', 'curator/concepts')
    self.add_url('concept', 'curator/concepts/{namespace}/{cname}')
    self.add_url('concept_predict', 'curator/concepts/{namespace}/{cname}/predict')
    self.add_url('concept_examples', 'curator/concepts/{namespace}/{cname}/examples')
    self.add_url('concept_train', 'curator/concepts/{namespace}/{cname}/train')
    self.add_url('models', 'curator/models')
    self.add_url('model', 'curator/models/{name}')
    self.add_url('model_predict', 'curator/models/{name}/predict')

  def add_url(self, op, path):
    self._urls[op] = '/'.join([self._base_url, API_VERSION, path])

  def check_status(self, raw_response):
    response = json.loads(raw_response)
    try:
      ok = (response['status']['status'] == 'OK')
    except:
      raise ApiError('Malformed API response.')
    if not ok:
      raise CuratorApiError(response['status'])
    return response

  def put_document(self, doc, options=None):
    docid = doc.get('docid')
    if not docid:
      raise ApiBadRequestError('Missing required param: doc.docid')

    url = self._url_for_op('document')
    request_data = self.request_helper.document_request_for_put(doc, options=options)
    kwargs = {
        'data': request_data,
        'method': 'POST'
        }
    raw_response = self._get_raw_response(self._get_json_headers,
                                          self._get_json_response,
                                          url,
                                          kwargs)
    return self.check_status(raw_response)

  def put_index(self, settings, properties=None):
    url = self._url_for_op('index')
    request_data = self.request_helper.index_request_for_put(settings, properties=properties)
    kwargs = {
        'data': request_data,
        'method': 'POST'
        }
    raw_response = self._get_raw_response(self._get_json_headers,
                                          self._get_json_response,
                                          url, kwargs)
    return self.check_status(raw_response)

  @request('concepts', method='POST')
  def create_concept(self, namespace, cname, description=None, example=None, **kwargs):
    """
    Create a new concept

    Args:
      namespace: namespace for the concept
      cname: name of the concept
      description (Optional): description of the concept
      example (Optional): image url with an example of the concept
    """
    return drop({
        'namespace': namespace,
        'cname': cname,
        'description': description,
        'example': example
        }, value=None)

  @request('concept_train', method='POST')
  def train_concept(self, namespace, cname, collection_ids=None):
    if collection_ids:
      return {'collection_ids': collection_ids}

  def train(self, namespace, cname, collection_ids=None):
    # TODO: add model train to train all concepts in model
    return self.train_concept(namespace, cname, collection_ids)

  def predict(self, namespace, cname=None, urls=None, documents=None):
    '''
    Return predictions for all concepts in a model/namespace, or for
    a particular cname.
    '''
    if urls is None and documents is None:
      raise ValueError('Must supply one of urls or documents to predict')
    if cname is None:
      return self.predict_model(namespace, urls=urls, documents=documents)
    return self.predict_concept(namespace, cname, urls=urls, documents=documents)

  @request('concept_predict', method='POST')
  def predict_concept(self, namespace, cname, urls=None, documents=None):
    '''
    Predict scores for a single concept, specified by namespace and cname.
    '''
    return drop({
        'urls': urls,
        'documents': documents
        }, value=None)

class ClarifaiCustomModel(CuratorApiClient):
  """The ClarifaiCustomModel class provides a simple interface
  to the Clarifai custom model training API
  """

  def __init__(self, app_id=None, app_secret=None,
               base_url='https://api-alpha.clarifai.com', wait_on_throttle=True,
               collection_id='hackmit'):

    super(ClarifaiCustomModel, self).__init__(app_id=app_id,
                                              app_secret=app_secret,
                                              base_url=base_url,
                                              wait_on_throttle=wait_on_throttle,
                                              collection_id=collection_id)

    self.namespace = 'hackathon'

  def positive(self, url, concept):
    doc = self.createDocument(url, concept, 1)
    self.addDocumentToCollection(doc)

  def negative(self, url, concept):
    doc = self.createDocument(url, concept, -1)
    self.addDocumentToCollection(doc)

  def train(self, concept):
    qualified_concept = {'namespace' : self.namespace, 'cname': concept}

    self.train_concept(**qualified_concept)

  def predict(self, url, concept):
    qualified_concept = {'namespace' : self.namespace, 'cname': concept}
    return self.predict_concept(urls=[url], **qualified_concept)

  def addDocumentToCollection(self, doc):
    """
    """
    try:
      self.put_index({'max_num_docs': 1000})
    except:
      pass

    self.put_document(doc)

  def createDocument(self, url, concept, score):
    doc = {
        "docid": str(uuid.uuid4()),
        "media_refs": [
            {
                "url": url,
                "media_type": "image"
            }
            ],
        "annotation_sets": [
            {
                "namespace": self.namespace,
                "annotations": [
                    {
                        "score": score,
                        "tag": {
                            "cname": concept
                        }
                    }
                    ]
            }
            ],
        'options': {
            'want_doc_response': True,
            'recognition_options':
                {
                    'model': 'general-v1.2'
                }
            }
        }
    return doc



