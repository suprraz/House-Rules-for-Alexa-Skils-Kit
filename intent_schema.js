{
  "intents": [
  {
    "intent": "SetHouseRule",
    "slots": [
      {
        "name": "HouseRule",
        "type": "AMAZON.LITERAL"
      }
    ]
  },
  {
    "intent": "ListHouseRules"
  },
  {
    "intent": "DeleteAllHouseRules"
  },
  {
    "intent": "DeleteHouseRuleAbout",
    "slots": [
      {
        "name": "RuleContent",
        "type": "AMAZON.LITERAL"
      }
    ]
  },
  {
    "intent": "DeleteHouseRuleNumber",
    "slots": [
      {
        "name": "RuleNumber",
        "type": "AMAZON.NUMBER"
      }
    ]
  },
  {
    "intent": "AMAZON.HelpIntent"
  },
  {
    "intent": "AMAZON.StopIntent"
  }
]
}