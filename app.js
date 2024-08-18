import express from 'express';
import bp from 'body-parser';
import path from 'path';
import firebaseConfig from './firebaseConfig.js';

import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
    getFirestore,
    collection,
    getDocs,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    doc,
    query,
    arrayUnion,
    where,
    orderBy,
    Timestamp,
    limit
} from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
// const analytics = getAnalytics(firebaseApp);
const db = getFirestore();

console.log(firebaseApp);

const auth = getAuth(firebaseApp);
var userin = false;
var uidMain = "null";

onAuthStateChanged(auth, (user) => {
    if (user) {
        // https://firebase.google.com/docs/reference/js/firebase.User
        const uid = user.uid;
        userin = true;
        console.log("in");
    } else {
        userin = false;
        console.log("user out");
    }
});

const colRef = collection(db, "readingfiles");
// let q = query(colRef, where("section", "==", 1), orderBy("random"), limit(2));
let q = query(colRef, where("seqNum", ">=", 4), limit(3));
var readingData = [];
getDocs(q).then((snapshot) => {
    snapshot.docs.forEach((doc) => {
        readingData.push({ ...doc.data() });
    })
    console.log(readingData);
}).catch((err) => {
    console.log(err.message);
});


const app = express();
const port = 3000;
const __dirname = path.resolve();

app.use(express.static('public'));
app.use(bp.urlencoded());
app.set("view engine", "ejs");

app.get("/", (req, res) => {
    res.render("home", { firebase_Config: firebaseConfig });
});

// app.post("/register", (req, res) => {
//     uidMain = req.body.uidStat;
//     console.log(uidMain);
//     console.log(path);
//     if (uidMain != 'null') {
//         userin = true;
//     }
//     else {
//         userin = false;
//     }
//     // res.redirect("/reading");
// });

app.get("/profile", (req, res) => {
    res.render("profile");
});

app.get("/reading", (req, res) => {

    res.render("testGuidelines", { testmodulename: "reading" });

});

var page = 0;
app.post("/reading", (req, res) => {
    // console.log(req.body);
    var checked;
    if (page == 0) {
        checked = req.body.understandcheckbox;
    } else {
        console.log(req.body);
        var ansObjs = [];
        for (let i = 1; i <= 3; i++) {
            var tempmcq = [];
            for (let j = 1; j <= 40; j++) {
                if (req.body['mcq' + i + '_' + j]) {
                    tempmcq.push(req.body['mcq' + i + '_' + j]);
                }
            }
            var ansObj = {
                trueFalse: req.body['trueFalse' + i],
                yesNo: req.body['yesNo' + i],
                complete: req.body['complete' + i],
                paragraph: req.body['paragraph' + i],
                mcq: tempmcq
            };
            ansObjs.push(ansObj);

        }
        var rAns = getAns(readingData);

        var scores = checkAns(rAns, ansObjs);
        console.log(rAns);
        console.log(ansObjs);
        setScore(req.body.uid, scores, "reading");

        // res.render("results", { scores: scores, testmodulename: "reading" });

    }
    if (checked == "on") {
        res.render("reading", { reading_data: readingData });
        page = 1;
    } else {
        res.render("testGuidelines", { testmodulename: "reading" });
        page = 0;
    }
});

function getAns(data) {
    var ans = [];

    for (let i = 0; i <= 2; i++) {
        let tAns = {
            Author: data[i].AuthorAns,
            Classify: data[i].ClassifyAns,
            Complete: data[i].CompleteAns,
            ComplpleteOne: data[i].ComplpleteOneAns,
            CompleteTwo: data[i].CompleteTwoAns,
            FourMcq: data[i].FourMcqAns,
            Match: data[i].MatchAns,
            Mcq: data[i].McqAns,
            Paragraph: data[i].ParagraphAns,
            SelectTwo: data[i].SelectTwoAns,
            TrueFalse: data[i].TrueFalseAns,
            TwoMcq: data[i].TwoMcqAns,
            YesNo: data[i].YesNoAns
        }
        ans.push(tAns);
    }
    return ans;
}

function checkAns(rightAnswers, checkAnswers) {
    var score = 0;
    console.log(rightAnswers, checkAnswers);
    for (let i = 0; i <= 2; i++) {

        try {
            for (let j = 0; j < rightAnswers[i].Author.length; j++) {
                if (rightAnswers[i].Author[j].toLowerCase() == checkAnswers[i].author[j].toLowerCase()) {
                    score += 1;
                }
            }
        } catch (error) {
            console.log(error.message);
        }

        try {
            for (let j = 0; j < rightAnswers[i].Classify.length; j++) {
                if (rightAnswers[i].Classify[j].toLowerCase() == checkAnswers[i].classify[j].toLowerCase()) {
                    score += 1;
                }
            }
        } catch (error) {
            console.log(error.message);
        }

        try {
            for (let j = 0; j < rightAnswers[i].TrueFalse.length; j++) {
                if (rightAnswers[i].TrueFalse[j].toLowerCase() == checkAnswers[i].trueFalse[j].toLowerCase()) {
                    score += 1;
                }
            }
        } catch (error) {
            console.log(error.message);
        }

        try {
            for (let j = 0; j < rightAnswers[i].YesNo.length; j++) {
                if (rightAnswers[i].YesNo[j].toLowerCase() == checkAnswers[i].yesNo[j].toLowerCase()) {
                    score += 1;
                }
            }
        } catch (error) {
            console.log(error.message);
        }

        try {
            for (let j = 0; j < rightAnswers[i].Complete.length; j++) {
                let ans = rightAnswers[i].Complete[j].toLowerCase();
                if (ans.includes("/")) {
                    let arr = ans.split("/");
                    for (let k = 0; k < arr.length; k++) {
                        if (arr[k] == checkAnswers[i].complete[j].toLowerCase()) {
                            score += 1;
                        }
                    }
                }
                if (rightAnswers[i].Complete[j].toLowerCase() == checkAnswers[i].complete[j].toLowerCase()) {
                    score += 1;
                }
            }
        } catch (error) {
            console.log(error.message);
        }

        try {
            for (let j = 0; j < rightAnswers[i].CompleteOne.length; j++) {
                let ans = rightAnswers[i].CompleteOne[j].toLowerCase();
                if (ans.includes("/")) {
                    let arr = ans.split("/");
                    for (let k = 0; k < arr.length; k++) {
                        if (arr[k] == checkAnswers[i].completeOne[j].toLowerCase()) {
                            score += 1;
                        }
                    }
                }
                if (rightAnswers[i].CompleteOne[j].toLowerCase() == checkAnswers[i].completeOne[j].toLowerCase()) {
                    score += 1;
                }
            }
        } catch (error) {
            console.log(error.message);
        }

        try {
            for (let j = 0; j < rightAnswers[i].CompleteTwo.length; j++) {
                let ans = rightAnswers[i].CompleteTwo[j].toLowerCase();
                if (ans.includes("/")) {
                    let arr = ans.split("/");
                    for (let k = 0; k < arr.length; k++) {
                        if (arr[k] == checkAnswers[i].completeTwo[j].toLowerCase()) {
                            score += 1;
                        }
                    }

                }
                if (rightAnswers[i].CompleteTwo[j].toLowerCase() == checkAnswers[i].completeTwo[j].toLowerCase()) {
                    score += 1;
                }
            }
        } catch (error) {
            console.log(error.message);
        }

        try {
            for (let j = 0; j < rightAnswers[i].Paragraph.length; j++) {
                if (rightAnswers[i].Paragraph[j].toLowerCase() == checkAnswers[i].paragraph[j].toLowerCase()) {
                    score += 1;
                }
            }
        } catch (error) {
            console.log(error.message);
        }
    }
    console.log("score = " + score);
    return score;
}

async function setScore(uid, score, module) {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        await updateDoc(docRef, {
            Scores: arrayUnion({ score: score, timestamp: Timestamp.now(), sequence: 1, module: module })
        });
    } else {
        console.log("user does not exist");
    }
}

app.get("/writing", (re, res) => {
    res.render("testGuidelines", { testmodulename: "writing" });
});

app.post("/writing", (req, res) => {
    const checked = req.body.understandcheckbox;
    if (checked == "on") {
        res.render("writing");
    } else {
        res.render("testGuidelines", { testmodulename: "writing" });
    }
});
app.get("/speaking", (req, res) => {
    res.render("testGuidelines", { testmodulename: "speaking" });
});
app.post("/speaking", (req, res) => {
    let checked;
    if (page == 0) {
        checked = req.body.understandcheckbox;
    }
    if (checked == "on") {
        res.render("speaking");

    } else {
        res.render("testGuidelines", { testmodulename: "reading" });
        page = 0;
    }

});

app.listen(process.env.PORT || port, () => {
    console.log("live at " + (process.env.PORT || port));
});