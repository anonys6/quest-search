import questions from "./speakx_questions.json" assert {type: "json"};

const uniqueTypes = new Set();
questions.forEach(question => {
    uniqueTypes.add(question.type);
})

uniqueTypes.forEach(type => {
    console.log(type);

})