"""
Simple example showing Clarifai Custom Model training and prediction

This example trains a concept classifier that recognizes photos of the band Phish.
"""

from clarifai_basic import ClarifaiCustomModel


# instantiate clarifai client
clarifai = ClarifaiCustomModel()


# find some positive and negative examples
PHISH_POSITIVES = [
  'http://thephunion.com/wp-content/uploads/2013/04/Umphreys.jpg',
  'http://images2.miaminewtimes.com/imager/phish-switched-from-suck-to-blow-for-new'
  '/u/original/6471847/phish_review_photos_new_years_2015_miami_2.jpg',
  'http://phishthoughts.com/wp-content/uploads/2009/06/Phish06212009_17.jpg',
  'http://www.performanceimpressions.com/Phish_Bonnaroo_2012/content/bin/images/'
  'large/Bonnaroo_Music_Festival_Phish_opp4680.jpg',
  'https://mrminer.files.wordpress.com/2008/11/phish-lights1.jpg'
]

# add the positive example images to the model
for positive_example in PHISH_POSITIVES:
  clarifai.positive(positive_example, 'phish')


# negatives are not required but will help if you want to discriminate between similar concepts
PHISH_NEGATIVES = [
  'http://news.psu.edu/sites/default/files/styles/photo_gallery_large/public/4946277043.jpg',
  'http://www.weqx.com/wp-content/uploads/2014/03/dmb2.jpg',
  'http://extras.mnginteractive.com/live/media/site569/2013/1025/20131025__131101wlbb-kanye.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/b/bf/Grateful_Dead_at_the_Warfield-01.jpg',
  'http://www.kellitravels.com/wp-content/uploads/2010/08/8-23-11-Dave-Matthews-Band.jpg'
]

# add the negative example images to the model
for negative_example in PHISH_NEGATIVES:
  clarifai.negative(negative_example, 'phish')

# train the model
clarifai.train('phish')


PHISH_EXAMPLES = [
  'http://phishthoughts.com/wp-content/uploads/2012/07/photo-1-11-e1342391144673.jpg',
  'http://bobmarley.cdn.junip.com/wp-content/uploads/2014/10/DSC01226-e1311293061704.jpg'
]

NOT_PHISH = [
  'http://farm3.static.flickr.com/2161/2141620332_2b741028b3.jpg',
  'http://www.mediaspin.com/joel/grateful_dead230582_15-52.jpg'
]

# If everything works correctly, the confidence that true positive images are of Phish should be
# significantly greater than 0.5, which is the same as choosing at random. The confidence that true
# negative images are Phish should be significantly less than 0.5.

# use the model to predict whether the test images are Phish or not
for test in PHISH_EXAMPLES + NOT_PHISH:
  result = clarifai.predict(test, 'phish')
  print result['status']['message'], "%0.3f" % result['urls'][0]['score'], result['urls'][0]['url']

# Our output is the following. Your results will vary as there are some non-deterministic elements
# of the algorithms used.

# Success 0.797 http://phishthoughts.com/wp-content/uploads/2012/07/photo-1-11-e1342391144673.jpg
# Success 0.706 http://bobmarley.cdn.junip.com/wp-content/uploads/2014/10/DSC01226-e1311293061704.jpg
# Success 0.356 http://farm3.static.flickr.com/2161/2141620332_2b741028b3.jpg
# Success 0.273 http://www.mediaspin.com/joel/grateful_dead230582_15-52.jpg
