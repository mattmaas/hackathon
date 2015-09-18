var clarifai;

// on document ready, instantiate the Clarifai object
function init(){
    clarifai = new Clarifai(
        {
            'accessToken': 'BXFprsmurYcMyhThys79a8ITTUPK96'
        }
    );
}

// send a 'positive' url
function positive(){
    clarifai.positive('http://thephunion.com/wp-content/uploads/2013/04/Umphreys.jpg', 'phish', cb).then(
        promiseResolved,
        promiseRejected 
    );
}

// send a 'negative' url
function negative(){
    clarifai.negative('http://www.mediaspin.com/joel/grateful_dead230582_15-52.jpg', 'phish', cb).then(
        promiseResolved,
        promiseRejected 
    );
}

// explicitly train our concept
function train(){
    clarifai.train('phish', cb).then(
        promiseResolved,
        promiseRejected 
    );
}

// make a prediction on a url with our concept
function predict(){
    clarifai.predict('http://farm3.static.flickr.com/2161/2141620332_2b741028b3.jpg', 'phish', cb).then(
        promiseResolved,
        promiseRejected 
    );
}

function promiseResolved(obj){
    console.log('promiseResolved', obj);
}

function promiseRejected(obj){
    console.log('promiseRejected', obj);
}

function cb(obj){
    console.log('cb', obj);
}

$(document).ready(init);