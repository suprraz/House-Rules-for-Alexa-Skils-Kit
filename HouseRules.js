/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
 * The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well as
 * testing instructions are located at http://amzn.to/1LzFrj6
 *
 * For additional samples, visit the Alexa Skills Kit Getting Started guide at
 * http://amzn.to/1LGWsLG
 */

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.

var AWS = require("aws-sdk");
var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});


exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */

        if (event.session.application.applicationId !== "amzn1.echo-sdk-ams.app.a030169e-8615-4672-bef2-e40ac20de322") {
            context.fail("Invalid Application ID");
        }


        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId +
        ", sessionId=" + session.sessionId);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId +
        ", sessionId=" + session.sessionId);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId +
        ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    console.log(intentName);

    // Dispatch to your skill's intent handlers
    if ("SetHouseRule" === intentName) {
        setHouseRuleInSession(intent, session, callback);
    } else if ("ListHouseRules" === intentName) {
        listHouseRulesFromSession(intent, session, callback);
    } else if ("DeleteHouseRuleNumber" === intentName) {
        deleteHouseRuleNumber(intent, session, callback);
    } else if ("DeleteHouseRuleAbout" === intentName) {
        deleteHouseRuleAbout(intent, session, callback);
    } else if ("DeleteAllHouseRules" === intentName) {
        deleteAllHouseRules(intent, session, callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        getHelp(callback);
    } else if ("AMAZON.StopIntent" === intentName || "AMAZON.CancelIntent" === intentName) {
        handleSessionEndRequest(callback);
    } else {
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId +
        ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}

// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "Welcome to House Rules. " +
        "Please tell me a house rule by saying, new rule no monkeys jumping on the bed";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "Please tell me a house rule by saying, " +
        "new rule no monkeys jumping on the bed";
    var shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function getHelp(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var sessionAttributes = {};
    var cardTitle = "Help";
    var speechOutput = "Have Alexa recite your house rules! " +
        "  Simply set your rules and the next time there is an argument to be settled, ask Alexa. ";
    var repromptText = "Please tell me a house rule by saying, " +
        "new rule no monkeys jumping on the bed";
    var shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    var cardTitle = "Session Ended";
    var speechOutput = "Have a nice day!";
    // Setting this to true ends the session and exits the skill.
    var shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

/**
 * Sets the house rules in the session and prepares the speech to reply to the user.
 */
function setHouseRuleInSession(intent, session, callback) {
    var cardTitle = intent.name;
    var newHouseRuleSlot = intent.slots.HouseRule;
    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    if (newHouseRuleSlot && newHouseRuleSlot.value !== 'nonexistent' && newHouseRuleSlot.value !== 'nonexistent ') {
        var newHouseRule = newHouseRuleSlot.value.replace('house rule ', '');

        loadUserData(session, function(userData) {
            var houseRules = userData.houseRules || [];


            houseRules.unshift(newHouseRule);

            sessionAttributes = createHouseRulesAttribute(houseRules);

            saveUserData(session.user.userId, sessionAttributes, function(err, data) {});

            speechOutput = "I now added house rule " + newHouseRule + ". You can ask me " +
                "your list of rules by saying, list rules";
            repromptText = "You can ask me your list of rules by saying, list rules?";

            callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));

        });
    } else {
        speechOutput = "I didn't understand your new house rule. Please try again";
        repromptText = "I didn't understand your new house rule. You can tell me your " +
            "house rules by saying, new house rule no monkeys jumping on the bed";

        callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    }


}

function createHouseRulesAttribute(houseRules) {
    return {
        houseRules: houseRules
    };
}


function deleteAllHouseRules(intent, session, callback) {
    var cardTitle = intent.name;
    var repromptText = "";
    var shouldEndSession = false;
    var speechOutput = "";

    session.attributes = {};

    saveUserData(session.user.userId, session.attributes, function(err, data) {});

    speechOutput = "Deleted all house rules. You can say, " +
        "new house rule no monkeys jumping on the bed";
    repromptText = "You can say, new house rule no monkeys jumping on the bed";

    callback(session.attributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function deleteHouseRuleNumber(intent, session, callback) {
    var cardTitle = intent.name;
    var newRuleNumberSlot = intent.slots.RuleNumber;

    var repromptText = "";
    var shouldEndSession = false;
    var speechOutput = "";

    loadUserData(session, function(userData) {
        var houseRules = userData.houseRules;

        var matchingHouseRuleIndexes = [];

        if (houseRules && houseRules.length && newRuleNumberSlot
            && newRuleNumberSlot.value && houseRules[newRuleNumberSlot.value - 1]) {

            // found one; delete it!
            console.log('found rule number:' + newRuleNumberSlot.value + ', delete it!');
            var oldRule = houseRules[newRuleNumberSlot.value - 1];

            houseRules.splice(newRuleNumberSlot.value - 1, 1);
            session.attributes.houseRules = houseRules;

            speechOutput = "Removed rule '"+ oldRule + "'. You can say, " +
                "list house rules";
            repromptText = "You can say, list house rules";

            saveUserData(session.user.userId, session.attributes, function(err, data) {});

        } else {
            console.log('slot or rules are bad');
            speechOutput = "I'm not sure which rule to delete. Please try again";
            repromptText = "I'm not sure which rule to delete. You can delete a rule by saying, " +
                "delete house rule number five";
        }

        callback(session.attributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    });
}


function deleteHouseRuleAbout(intent, session, callback) {
    var cardTitle = intent.name;
    var newRuleContentSlot = intent.slots.RuleContent;

    var repromptText = "";
    var shouldEndSession = false;
    var speechOutput = "";

    loadUserData(session, function(userData) {
        var houseRules = userData.houseRules;

        var matchingHouseRuleIndexes = [];

        if (houseRules && houseRules.length && newRuleContentSlot && newRuleContentSlot.value.length && newRuleContentSlot.value !== 'nonexistent' && newRuleContentSlot.value !== 'nonexistent ') {
            for (var i = 0; i < houseRules.length; i++ ) {
                if (houseRules[i].indexOf(newRuleContentSlot.value.trim()) > -1) {
                    matchingHouseRuleIndexes.push(i);
                }
            }

            if( matchingHouseRuleIndexes.length === 0 ) {
                // no matches
                console.log('no matches');
                speechOutput = "No rule about '"+ newRuleContentSlot.value + "'. You can say, " +
                    "delete house rule about jumping on the bed";
                repromptText = "You can say, delete house rule about jumping on the bed";
            } else if (matchingHouseRuleIndexes.length > 1 ) {
                // too many matches
                console.log('too many matches');
                speechOutput = "Too many house rules about '"+ newRuleContentSlot.value + "'. You can say, " +
                    "delete house rule about jumping on the bed";
                repromptText = "You can say, delete house rule about jumping on the bed";
            } else {
                // found one; delete it!
                console.log('found one:' + matchingHouseRuleIndexes[0] + ', delete it!');
                var oldRule = houseRules[matchingHouseRuleIndexes[0]];

                houseRules.splice(matchingHouseRuleIndexes[0], 1);
                session.attributes.houseRules = houseRules;

                speechOutput = "Removed rule '"+ oldRule + "'. You can say, " +
                    "list house rules";
                repromptText = "You can say, list house rules";
            }


            saveUserData(session.user.userId, session.attributes, function(err, data) {});

        } else {
            console.log('slot or rules are bad');
            speechOutput = "I'm not sure which rule to remove. Please try again";
            repromptText = "I'm not sure which rule to remove. You can delete a rule by saying, " +
                "delete rule about jumping on the bed";
        }

        callback(session.attributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    });
}

function listHouseRulesFromSession(intent, session, callback) {
    var repromptText = null;
    var shouldEndSession = false;
    var speechOutput = "";

    console.log('loading User Data');
    loadUserData(session, function(userData) {
        var houseRules = userData.houseRules;

        console.log(userData)
        if (houseRules && houseRules.length) {
            var houseRulesString = '';
            for (var i = 0; i < houseRules.length; i++ ) {
                houseRulesString += (i+1) + '. ' + houseRules[i] + ". ";
            }
            speechOutput = "Your house rules are: " + houseRulesString;
            shouldEndSession = true;
        } else {
            speechOutput = "You haven't set any house rules, you can say, " +
                "new rule no monkeys jumping on the bed";
        }

        // Setting repromptText to null signifies that we do not want to reprompt the user.
        // If the user does not respond or says something that is not understood, the session
        // will end.
        callback(session.attributes,
            buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
    });
}

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: "houseRules - " + title,
            content: "houseRules - " + output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}


// ------------------ DynamoDB Storage ----------------------


function saveUserData (userId, userData, callback) {
    dynamodb.putItem({
        TableName: 'HouseRulesUserData',
        Item: {
            CustomerId: {
                S: userId
            },
            Data: {
                S: JSON.stringify(userData)
            }
        }
    }, function (err, data) {
        if (err) {
            console.log(err, err.stack);
        }
        if (callback) {
            callback();
        }
    });
}


function loadUserData(session, callback) {
    if(typeof session.attributes === "undefined") {
        session.attributes = {};
    }

    if (session.attributes && session.attributes.houseRules) {
        console.log('get houseRules from session=' + session.attributes);
        callback(session.attributes);
        return;
    }
    dynamodb.getItem({
        TableName: 'HouseRulesUserData',
        Key: {
            CustomerId: {
                S: session.user.userId
            }
        }
    }, function (err, data) {
        var houseRules = [];
        if (err) {
            console.log(err, err.stack);
            session.attributes.houseRules = houseRules;
            callback(session.attributes);
        } else if (data.Item === undefined) {
            session.attributes.houseRules = houseRules;
            callback(session.attributes);
        } else {
            console.log('get houseRules from dynamodb=' + data.Item.Data.S);
            userData = JSON.parse(data.Item.Data.S);
            session.attributes = userData;
            callback(session.attributes);
        }
    });
}